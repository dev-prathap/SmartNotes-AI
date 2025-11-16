// API Route: /api/study-groups/[groupId]
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

// GET - Get study group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
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

    // Get group details
    const groupResult = await query(
      `SELECT 
        sg.*,
        u.name as creator_name,
        u.email as creator_email,
        COUNT(DISTINCT sgm.user_id) as member_count
       FROM study_groups sg
       LEFT JOIN users u ON sg.created_by = u.id
       LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
       WHERE sg.id = $1
       GROUP BY sg.id, u.name, u.email`,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Study group not found' },
        { status: 404 }
      );
    }

    const group = groupResult.rows[0];

    // Map database fields to frontend format
    const mappedGroup = {
      ...group,
      isPrivate: group.is_private,
      createdBy: group.created_by,
      subjectId: group.subject_id,
      inviteCode: group.invite_code,
      maxMembers: group.max_members,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      memberCount: parseInt(group.member_count) || 0
    };

    // Check if user is a member
    const memberResult = await query(
      `SELECT role FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, decoded.userId]
    );

    const isMember = memberResult.rows.length > 0;
    const userRole = isMember ? memberResult.rows[0].role : null;

    // Get members
    const membersResult = await query(
      `SELECT 
        sgm.id,
        sgm.role,
        sgm.joined_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url
       FROM study_group_members sgm
       JOIN users u ON sgm.user_id = u.id
       WHERE sgm.group_id = $1
       ORDER BY sgm.joined_at ASC`,
      [groupId]
    );

    // Map members fields
    const mappedMembers = membersResult.rows.map((member: any) => ({
      id: member.id,
      groupId: groupId,
      userId: member.user_id,
      userName: member.user_name,
      userEmail: member.user_email,
      userAvatar: member.avatar_url,
      role: member.role,
      joinedAt: member.joined_at
    }));

    return NextResponse.json({
      group: mappedGroup,
      isMember,
      userRole,
      members: mappedMembers
    });

  } catch (error) {
    console.error('Study group fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update study group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
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
    const { name, description, isPrivate, maxMembers } = await request.json();

    // Check if user is admin
    const memberResult = await query(
      `SELECT role FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, decoded.userId]
    );

    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update the group' },
        { status: 403 }
      );
    }

    // Update group
    const result = await query(
      `UPDATE study_groups 
       SET name = $1, description = $2, is_private = $3, max_members = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, isPrivate, maxMembers, groupId]
    );

    return NextResponse.json({
      message: 'Study group updated successfully',
      group: result.rows[0]
    });

  } catch (error) {
    console.error('Study group update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete study group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
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

    // Check if user is admin
    const memberResult = await query(
      `SELECT role FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, decoded.userId]
    );

    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete the group' },
        { status: 403 }
      );
    }

    // Delete group (cascade will handle members, messages, etc.)
    await query(`DELETE FROM study_groups WHERE id = $1`, [groupId]);

    return NextResponse.json({
      message: 'Study group deleted successfully'
    });

  } catch (error) {
    console.error('Study group deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
