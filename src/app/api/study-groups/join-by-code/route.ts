// API Route: /api/study-groups/join-by-code
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

// POST - Join a study group by invite code
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

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find group by invite code
    const groupResult = await query(
      `SELECT sg.*, COUNT(sgm.user_id) as member_count
       FROM study_groups sg
       LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
       WHERE sg.invite_code = $1
       GROUP BY sg.id`,
      [inviteCode.toUpperCase()]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    const group = groupResult.rows[0];

    // Check if group is full
    if (group.member_count >= group.max_members) {
      return NextResponse.json(
        { error: 'Study group is full' },
        { status: 400 }
      );
    }

    // Check if already a member
    const existingMember = await query(
      `SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [group.id, decoded.userId]
    );

    if (existingMember.rows.length > 0) {
      return NextResponse.json(
        { error: 'Already a member of this group' },
        { status: 400 }
      );
    }

    // Add user as member
    await query(
      `INSERT INTO study_group_members (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [group.id, decoded.userId, 'member']
    );

    // Add system message
    await query(
      `INSERT INTO group_chat_messages (group_id, user_id, message, message_type)
       VALUES ($1, $2, $3, $4)`,
      [group.id, decoded.userId, 'joined the group', 'announcement']
    );

    return NextResponse.json({
      message: 'Successfully joined the study group',
      group: {
        id: group.id,
        name: group.name
      }
    });

  } catch (error) {
    console.error('Join by code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
