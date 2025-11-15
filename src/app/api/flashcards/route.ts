// API Route: /api/flashcards
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

// GET - Get all flashcards for user
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const documentId = searchParams.get('documentId');
    const difficulty = searchParams.get('difficulty');

    let queryText = `
      SELECT f.*, d.title as document_title, s.name as subject_name
      FROM flashcards f
      LEFT JOIN documents d ON f.document_id = d.id
      LEFT JOIN subjects s ON f.subject_id = s.id
      WHERE f.user_id = $1
    `;
    const queryParams: any[] = [decoded.userId];
    let paramIndex = 2;

    if (subjectId) {
      queryText += ` AND f.subject_id = $${paramIndex}`;
      queryParams.push(subjectId);
      paramIndex++;
    }

    if (documentId) {
      queryText += ` AND f.document_id = $${paramIndex}`;
      queryParams.push(documentId);
      paramIndex++;
    }

    if (difficulty) {
      queryText += ` AND f.difficulty = $${paramIndex}`;
      queryParams.push(difficulty);
      paramIndex++;
    }

    queryText += ` ORDER BY f.created_at DESC`;

    const result = await query(queryText, queryParams);

    return NextResponse.json({
      flashcards: result.rows
    });

  } catch (error) {
    console.error('Get flashcards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a manual flashcard
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

    const { frontText, backText, difficulty, subjectId, documentId, tags } = await request.json();

    if (!frontText || !backText) {
      return NextResponse.json(
        { error: 'Front and back text are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO flashcards (user_id, document_id, subject_id, front_text, back_text, difficulty, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        decoded.userId,
        documentId || null,
        subjectId || null,
        frontText,
        backText,
        difficulty || 'medium',
        JSON.stringify(tags || [])
      ]
    );

    return NextResponse.json({
      message: 'Flashcard created successfully',
      flashcard: result.rows[0]
    });

  } catch (error) {
    console.error('Create flashcard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
