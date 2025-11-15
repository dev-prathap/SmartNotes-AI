// API Route: /api/flashcards/generate
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { documentId, count, difficulty } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document content
    const docResult = await query(
      `SELECT title, content_text, subject_id FROM documents WHERE id = $1 AND user_id = $2`,
      [documentId, decoded.userId]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = docResult.rows[0];

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Generate flashcards using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content creator specializing in creating effective flashcards for active recall learning. 

Create ${count || 10} flashcards from the provided document content. Each flashcard should:
1. Have a clear, concise question on the front
2. Have a comprehensive but focused answer on the back
3. Test understanding, not just memorization
4. Cover different aspects of the material
5. Be appropriate for ${difficulty || 'medium'} difficulty level

Return ONLY a valid JSON array with this exact structure:
[
  {
    "front": "Question or prompt",
    "back": "Answer or explanation",
    "difficulty": "easy|medium|hard",
    "tags": ["tag1", "tag2"]
  }
]

Do not include any markdown formatting, code blocks, or additional text. Return only the JSON array.`
        },
        {
          role: 'user',
          content: `Document Title: ${document.title}\n\nContent:\n${document.content_text.substring(0, 8000)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let flashcardsData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      flashcardsData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to generate flashcards. Please try again.' },
        { status: 500 }
      );
    }

    // Insert flashcards into database
    const insertedFlashcards = [];
    for (const card of flashcardsData) {
      const result = await query(
        `INSERT INTO flashcards (user_id, document_id, subject_id, front_text, back_text, difficulty, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          decoded.userId,
          documentId,
          document.subject_id,
          card.front,
          card.back,
          card.difficulty || difficulty || 'medium',
          JSON.stringify(card.tags || [])
        ]
      );
      insertedFlashcards.push(result.rows[0]);
    }

    return NextResponse.json({
      message: `Generated ${insertedFlashcards.length} flashcards successfully`,
      flashcards: insertedFlashcards
    });

  } catch (error) {
    console.error('Flashcard generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
