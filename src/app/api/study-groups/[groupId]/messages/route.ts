// API Route: /api/study-groups/[groupId]/messages
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

// GET - Get group chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is a member
    const memberResult = await query(
      `SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, decoded.userId]
    );

    if (memberResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Get messages
    const messagesResult = await query(
      `SELECT 
        gcm.*,
        u.name as user_name,
        u.avatar_url as user_avatar
       FROM group_chat_messages gcm
       JOIN users u ON gcm.user_id = u.id
       WHERE gcm.group_id = $1
       ORDER BY gcm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    // Map database fields to frontend format
    const mappedMessages = messagesResult.rows.map((msg: any) => ({
      id: msg.id,
      groupId: msg.group_id,
      userId: msg.user_id,
      userName: msg.user_name,
      userAvatar: msg.user_avatar,
      message: msg.message,
      messageType: msg.message_type,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    }));

    return NextResponse.json({
      messages: mappedMessages.reverse() // Reverse to show oldest first
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;
    const { message, messageType, metadata } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if user is a member
    const memberResult = await query(
      `SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, decoded.userId]
    );

    if (memberResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Insert message
    const result = await query(
      `INSERT INTO group_chat_messages (group_id, user_id, message, message_type, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [groupId, decoded.userId, message, messageType || 'text', metadata ? JSON.stringify(metadata) : null]
    );

    // Get user details
    const userResult = await query(
      `SELECT name, avatar_url FROM users WHERE id = $1`,
      [decoded.userId]
    );

    const messageData = result.rows[0];
    const userData = userResult.rows[0];

    // Map database fields to frontend format
    const mappedMessage = {
      id: messageData.id,
      groupId: messageData.group_id,
      userId: messageData.user_id,
      userName: userData.name,
      userAvatar: userData.avatar_url,
      message: messageData.message,
      messageType: messageData.message_type,
      createdAt: messageData.created_at,
      updatedAt: messageData.updated_at
    };

    return NextResponse.json({
      message: 'Message sent successfully',
      data: mappedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
