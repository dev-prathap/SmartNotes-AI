// API Route: /api/chat/sessions
// GET - Get chat sessions for user
// POST - Save/Update chat session
// DELETE - Delete chat session

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

    // Get chat sessions for the authenticated user
    const result = await query(
      `SELECT id, conversation_id, title, messages, message_count, created_at, updated_at 
       FROM chat_sessions 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 20`,
      [decoded.userId]
    );

    return NextResponse.json({ sessions: result.rows });
  } catch (error) {
    console.error('Get chat sessions error:', error);
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

    const { conversationId, title, messages } = await request.json();

    if (!conversationId || !title || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'conversationId, title, and messages array are required' },
        { status: 400 }
      );
    }

    const messageCount = messages.length;

    // Check if session exists
    const existingSession = await query(
      'SELECT id FROM chat_sessions WHERE user_id = $1 AND conversation_id = $2',
      [decoded.userId, conversationId]
    );

    let result;
    if (existingSession.rows.length > 0) {
      // Update existing session
      result = await query(
        `UPDATE chat_sessions 
         SET title = $1, messages = $2, message_count = $3, updated_at = NOW()
         WHERE user_id = $4 AND conversation_id = $5
         RETURNING id, conversation_id, title, messages, message_count, created_at, updated_at`,
        [title, JSON.stringify(messages), messageCount, decoded.userId, conversationId]
      );
    } else {
      // Create new session
      result = await query(
        `INSERT INTO chat_sessions (user_id, conversation_id, title, messages, message_count)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, conversation_id, title, messages, message_count, created_at, updated_at`,
        [decoded.userId, conversationId, title, JSON.stringify(messages), messageCount]
      );
    }

    return NextResponse.json({
      session: result.rows[0],
      message: 'Chat session saved successfully'
    });
  } catch (error) {
    console.error('Save chat session error:', error);
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

    const { conversationId } = await request.json();

    if (conversationId) {
      // Delete specific session
      await query(
        'DELETE FROM chat_sessions WHERE user_id = $1 AND conversation_id = $2',
        [decoded.userId, conversationId]
      );
    } else {
      // Clear all sessions for user
      await query('DELETE FROM chat_sessions WHERE user_id = $1', [decoded.userId]);
    }

    return NextResponse.json({ message: 'Chat session(s) deleted successfully' });
  } catch (error) {
    console.error('Delete chat session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
