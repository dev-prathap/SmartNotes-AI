// API Route: /api/quizzes/[id]
// GET - Get specific quiz with questions
// POST - Submit quiz attempt

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const quizId = id;
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

    const quizId = id;

    // Get quiz with questions
    const quizResult = await query(
      `SELECT id, user_id, title, description, difficulty, is_public, created_at, updated_at 
       FROM quizzes 
       WHERE id = $1 AND user_id = $2`,
      [quizId, decoded.userId]
    );

    if (quizResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Quiz not found or unauthorized' },
        { status: 404 }
      );
    }

    const quiz = quizResult.rows[0];

    // Get questions for this quiz
    const questionsResult = await query(
      `SELECT id, quiz_id, question_text, options, correct_answer, explanation 
       FROM quiz_questions 
       WHERE quiz_id = $1 
       ORDER BY created_at ASC`,
      [quizId]
    );

    return NextResponse.json({ 
      quiz: {
        ...quiz,
        questions: questionsResult.rows
      }
    });
  } catch (error) {
    console.error('Get quiz details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const quizId = id;
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

    const quizId = id;
    const { answers, timeTakenSeconds } = await request.json();

    // Get quiz to verify it exists and belongs to user
    const quizResult = await query(
      `SELECT id FROM quizzes WHERE id = $1 AND user_id = $2`,
      [quizId, decoded.userId]
    );

    if (quizResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Quiz not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get questions for scoring
    const questionsResult = await query(
      `SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = $1`,
      [quizId]
    );

    const questions = questionsResult.rows;
    const totalQuestions = questions.length;
    
    // Calculate score
    let correctAnswers = 0;
    for (const question of questions) {
      const userAnswer = answers[question.id];
      if (userAnswer !== undefined && userAnswer === question.correct_answer) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Save quiz attempt
    const attemptResult = await query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_seconds) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, quiz_id, score, total_questions, time_taken_seconds, completed_at`,
      [decoded.userId, quizId, score, totalQuestions, timeTakenSeconds]
    );

    const attempt = attemptResult.rows[0];

    return NextResponse.json({ 
      attempt,
      score,
      correctAnswers,
      totalQuestions
    });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
