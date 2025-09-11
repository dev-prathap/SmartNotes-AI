// API Route: /api/quizzes/attempts
// GET - Get quiz attempts for user
// POST - Create new quiz attempt

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

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

    // Get quiz attempts for the authenticated user with quiz titles
    const result = await query(
      `SELECT 
         qa.id, 
         qa.quiz_id, 
         qa.score, 
         qa.total_questions, 
         qa.time_taken_seconds, 
         qa.completed_at,
         q.title as quiz_title,
         q.difficulty as quiz_difficulty
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.user_id = $1 
       ORDER BY qa.completed_at DESC 
       LIMIT 20`,
      [decoded.userId]
    );

    return NextResponse.json({ attempts: result.rows });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
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

    const { quizId, answers, timeTakenSeconds } = await request.json();

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
    console.error('Create quiz attempt error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
