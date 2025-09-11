// API Route: /api/quizzes
// GET - Get all quizzes for user
// POST - Create new quiz
// PUT - Update quiz
// DELETE - Delete quiz

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';
import { Quiz } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get quizzes for the authenticated user
    const result = await query(
      `SELECT id, user_id, title, description, difficulty, is_public, created_at, updated_at 
       FROM quizzes 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({ quizzes: result.rows });
  } catch (error) {
    console.error('Get quizzes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { title, description, difficulty, isPublic, questions } = await request.json();

    // Create quiz
    const quizResult = await query(
      `INSERT INTO quizzes (user_id, title, description, difficulty, is_public) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, title, description, difficulty, is_public, created_at, updated_at`,
      [decoded.userId, title, description, difficulty, isPublic]
    );

    const quiz = quizResult.rows[0];

    // Create questions if provided
    if (questions && questions.length > 0) {
      for (const question of questions) {
        await query(
          `INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer, explanation) 
           VALUES ($1, $2, $3, $4, $5)`,
          [quiz.id, question.question, JSON.stringify(question.options), question.correctAnswer, question.explanation]
        );
      }
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id, title, description, difficulty, isPublic } = await request.json();

    // Update quiz
    const result = await query(
      `UPDATE quizzes 
       SET title = $1, description = $2, difficulty = $3, is_public = $4, updated_at = NOW() 
       WHERE id = $5 AND user_id = $6 
       RETURNING id, user_id, title, description, difficulty, is_public, created_at, updated_at`,
      [title, description, difficulty, isPublic, id, decoded.userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Quiz not found or unauthorized' },
        { status: 404 }
      );
    }

    const quiz = result.rows[0];
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('id');

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    // Delete quiz (will cascade delete questions)
    const result = await query(
      `DELETE FROM quizzes WHERE id = $1 AND user_id = $2`,
      [quizId, decoded.userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Quiz not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
