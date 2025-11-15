// API Route: /api/documents/[documentId]/summary
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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

    const { documentId } = params;
    const { summaryType } = await request.json();

    // Validate summary type
    const validTypes = ['short', 'medium', 'long', 'key_points'];
    if (!summaryType || !validTypes.includes(summaryType)) {
      return NextResponse.json(
        { error: 'Invalid summary type. Must be: short, medium, long, or key_points' },
        { status: 400 }
      );
    }

    // Check if summary already exists
    const existingSummary = await query(
      `SELECT * FROM document_summaries 
       WHERE document_id = $1 AND user_id = $2 AND summary_type = $3`,
      [documentId, decoded.userId, summaryType]
    );

    if (existingSummary.rows.length > 0) {
      return NextResponse.json({
        message: 'Summary already exists',
        summary: existingSummary.rows[0]
      });
    }

    // Get document content
    const docResult = await query(
      `SELECT title, content_text, subject_id FROM documents 
       WHERE id = $1 AND user_id = $2`,
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

    // Define summary instructions based on type
    const summaryInstructions = {
      short: 'Create a brief 2-3 sentence summary capturing the main idea.',
      medium: 'Create a comprehensive paragraph (150-200 words) summarizing the key concepts and main points.',
      long: 'Create a detailed summary (300-400 words) covering all major topics, subtopics, and important details.',
      key_points: 'Extract and list the 5-10 most important key points as bullet points. Format each point clearly and concisely.'
    };

    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating educational summaries. ${summaryInstructions[summaryType as keyof typeof summaryInstructions]}

Focus on:
- Main concepts and ideas
- Important facts and details
- Logical flow and connections
- Clear, concise language
- Educational value

${summaryType === 'key_points' ? 'Format as a bulleted list with each point on a new line starting with "• "' : 'Write in clear, flowing prose.'}`
        },
        {
          role: 'user',
          content: `Document Title: ${document.title}\n\nContent:\n${document.content_text.substring(0, 10000)}`
        }
      ],
      temperature: 0.5,
      max_tokens: summaryType === 'short' ? 150 : summaryType === 'medium' ? 300 : 600,
    });

    const summaryText = completion.choices[0]?.message?.content || '';
    const wordCount = summaryText.split(/\s+/).length;

    // Save summary to database
    const result = await query(
      `INSERT INTO document_summaries (document_id, user_id, summary_type, summary_text, word_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [documentId, decoded.userId, summaryType, summaryText, wordCount]
    );

    return NextResponse.json({
      message: 'Summary generated successfully',
      summary: result.rows[0]
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get existing summaries for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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

    const { documentId } = params;

    // Get all summaries for this document
    const result = await query(
      `SELECT * FROM document_summaries 
       WHERE document_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [documentId, decoded.userId]
    );

    return NextResponse.json({
      summaries: result.rows
    });

  } catch (error) {
    console.error('Get summaries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
