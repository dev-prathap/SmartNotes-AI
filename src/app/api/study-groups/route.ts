// API Route: /api/study-groups
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

// Generate random invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET - List all study groups (user's groups + public groups)
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
    const type = searchParams.get('type') || 'my'; // 'my', 'public', 'all'

    let queryText = `
      SELECT 
        sg.*,
        u.name as creator_name,
        COUNT(DISTINCT sgm.user_id) as member_count
      FROM study_groups sg
      LEFT JOIN users u ON sg.created_by = u.id
      LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
    `;

    const queryParams: any[] = [decoded.userId];

    if (type === 'my') {
      queryText += `
        WHERE sg.id IN (
          SELECT group_id FROM study_group_members WHERE user_id = $1
        )
      `;
    } else if (type === 'public') {
      queryText += ` WHERE sg.is_private = false `;
    }

    queryText += `
      GROUP BY sg.id, u.name
      ORDER BY sg.created_at DESC
    `;

    const result = await query(queryText, queryParams);
    
    // Map database fields to frontend format
    const mappedGroups = result.rows.map((g: any) => ({
      ...g,
      isPrivate: g.is_private, // Map snake_case to camelCase
      createdBy: g.created_by,
      subjectId: g.subject_id,
      inviteCode: g.invite_code,
      maxMembers: g.max_members,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      memberCount: parseInt(g.member_count) || 0
    }));
    
    console.log('API: Mapped groups:', mappedGroups.map((g: any) => ({
      name: g.name, 
      isPrivate: g.isPrivate,
      is_private: g.is_private
    })));

    return NextResponse.json({ groups: mappedGroups });

  } catch (error) {
    console.error('Study groups fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new study group
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

    const requestBody = await request.json();
    const { name, description, subjectId, isPrivate, maxMembers } = requestBody;
    
    console.log('API: Received request body:', requestBody);
    console.log('API: isPrivate value:', isPrivate, typeof isPrivate);

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const inviteCode = generateInviteCode();

    // Create the study group
    const groupResult = await query(
      `INSERT INTO study_groups (name, description, created_by, subject_id, is_private, invite_code, max_members)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description || null, decoded.userId, subjectId || null, !!isPrivate, inviteCode, maxMembers || 50]
    );
    
    console.log('API: Created group:', groupResult.rows[0]);

    const group = groupResult.rows[0];

    // Add creator as admin member
    await query(
      `INSERT INTO study_group_members (group_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [group.id, decoded.userId, 'admin']
    );

    // Add welcome message
    await query(
      `INSERT INTO group_chat_messages (group_id, user_id, message, message_type)
       VALUES ($1, $2, $3, $4)`,
      [group.id, decoded.userId, 'Welcome to the group! 👋', 'announcement']
    );

    // Map database fields to frontend format
    const mappedGroup = {
      ...group,
      isPrivate: group.is_private,
      createdBy: group.created_by,
      subjectId: group.subject_id,
      inviteCode: group.invite_code,
      maxMembers: group.max_members,
      createdAt: group.created_at,
      updatedAt: group.updated_at
    };

    console.log('API: Mapped created group:', {
      name: mappedGroup.name,
      isPrivate: mappedGroup.isPrivate,
      is_private: group.is_private
    });

    return NextResponse.json({ 
      message: 'Study group created successfully',
      group: mappedGroup
    });

  } catch (error) {
    console.error('Study group creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
