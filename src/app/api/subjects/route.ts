// API Route: /api/subjects
// GET - Get all subjects for user
// POST - Create new subject
// PUT - Update subject
// DELETE - Delete subject

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

    // Get subjects for the authenticated user
    const result = await query(
      'SELECT id, name, description, color, icon, is_active, created_at, updated_at FROM subjects WHERE user_id = $1 ORDER BY created_at DESC',
      [decoded.userId]
    );

    return NextResponse.json({ subjects: result.rows });
  } catch (error) {
    console.error('Get subjects error:', error);
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

    const { name, description, color, icon } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Subject name is required' },
        { status: 400 }
      );
    }

    // Check if subject name already exists for this user
    const existingSubject = await query(
      'SELECT id FROM subjects WHERE user_id = $1 AND name = $2',
      [decoded.userId, name.trim()]
    );

    if (existingSubject.rows.length > 0) {
      return NextResponse.json(
        { error: 'Subject name already exists' },
        { status: 409 }
      );
    }

    // Create new subject
    const result = await query(
      `INSERT INTO subjects (user_id, name, description, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, color, icon, is_active, created_at, updated_at`,
      [
        decoded.userId,
        name.trim(),
        description || null,
        color || '#3B82F6',
        icon || 'book'
      ]
    );

    return NextResponse.json({
      subject: result.rows[0],
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('Create subject error:', error);
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

    const { id, name, description, color, icon, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Check if subject exists and belongs to user
    const existingSubject = await query(
      'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
      [id, decoded.userId]
    );

    if (existingSubject.rows.length === 0) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check for name conflict if name is being updated
    if (name) {
      const nameConflict = await query(
        'SELECT id FROM subjects WHERE user_id = $1 AND name = $2 AND id != $3',
        [decoded.userId, name.trim(), id]
      );

      if (nameConflict.rows.length > 0) {
        return NextResponse.json(
          { error: 'Subject name already exists' },
          { status: 409 }
        );
      }
    }

    // Update subject
    const result = await query(
      `UPDATE subjects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, description, color, icon, is_active, created_at, updated_at`,
      [
        name ? name.trim() : null,
        description,
        color,
        icon,
        is_active,
        id,
        decoded.userId
      ]
    );

    return NextResponse.json({
      subject: result.rows[0],
      message: 'Subject updated successfully'
    });
  } catch (error) {
    console.error('Update subject error:', error);
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
    const subjectId = searchParams.get('id');

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Check if subject exists and belongs to user
    const existingSubject = await query(
      'SELECT id FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, decoded.userId]
    );

    if (existingSubject.rows.length === 0) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Delete subject
    await query('DELETE FROM subjects WHERE id = $1 AND user_id = $2', [subjectId, decoded.userId]);

    return NextResponse.json({
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
