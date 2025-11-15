// API Route: /api/flashcards/decks
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

// GET - Get all flashcard decks
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

    const result = await query(
      `SELECT 
        fd.*,
        s.name as subject_name,
        COUNT(fdi.flashcard_id) as card_count
       FROM flashcard_decks fd
       LEFT JOIN subjects s ON fd.subject_id = s.id
       LEFT JOIN flashcard_deck_items fdi ON fd.id = fdi.deck_id
       WHERE fd.user_id = $1
       GROUP BY fd.id, s.name
       ORDER BY fd.created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      decks: result.rows
    });

  } catch (error) {
    console.error('Get decks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new deck
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

    const { name, description, subjectId, isPublic } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO flashcard_decks (user_id, name, description, subject_id, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [decoded.userId, name, description || null, subjectId || null, isPublic || false]
    );

    return NextResponse.json({
      message: 'Deck created successfully',
      deck: result.rows[0]
    });

  } catch (error) {
    console.error('Create deck error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
