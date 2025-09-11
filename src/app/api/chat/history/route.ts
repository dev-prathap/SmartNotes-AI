// API Route: /api/chat/history
// GET - Get chat history for user
// POST - Save chat item to history
// DELETE - Clear chat history

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

    // Get chat history for the authenticated user
    const result = await query(
      'SELECT id, conversation_id, question, answer, sources, confidence, created_at FROM chat_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [decoded.userId]
    );

    return NextResponse.json({ history: result.rows });
  } catch (error) {
    console.error('Get chat history error:', error);
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

    const { conversationId, question, answer, sources, confidence } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Save chat item to database
    const result = await query(
      `INSERT INTO chat_history (user_id, conversation_id, question, answer, sources, confidence)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, conversation_id, question, answer, sources, confidence, created_at`,
      [decoded.userId, conversationId, question, answer, JSON.stringify(sources), confidence]
    );

    return NextResponse.json({
      chatItem: result.rows[0],
      message: 'Chat item saved successfully'
    });
  } catch (error) {
    console.error('Save chat item error:', error);
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

    // Clear chat history for the authenticated user
    await query('DELETE FROM chat_history WHERE user_id = $1', [decoded.userId]);

    return NextResponse.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
