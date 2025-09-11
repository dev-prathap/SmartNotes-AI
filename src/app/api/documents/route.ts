// API Route: /api/documents
// GET - Get all documents for user
// POST - Create document (alternative to upload)
// PUT - Update document
// DELETE - Delete document

import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { verifyAccessToken } from '@/lib/jwt';
import { query } from '@/lib/database';

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

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subject');
    const status = searchParams.get('status');

    let queryText = `
      SELECT d.id, d.title, d.description, d.file_name, d.file_size,
             d.file_type, d.mime_type, d.processing_status, d.created_at,
             d.subject_id, s.name as subject_name, s.color as subject_color
      FROM documents d
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE d.user_id = $1
    `;
    const queryParams = [decoded.userId];

    if (subjectId) {
      queryText += ' AND d.subject_id = $2';
      queryParams.push(subjectId);
    }

    if (status) {
      queryText += ` AND d.processing_status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    queryText += ' ORDER BY d.created_at DESC';

    const result = await query(queryText, queryParams);

    return NextResponse.json({ documents: result.rows });
  } catch (error) {
    console.error('Get documents error:', error);
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

    const { id, title, description, subjectId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check if document exists and belongs to user
    const existingDoc = await query(
      'SELECT id, file_path FROM documents WHERE id = $1 AND user_id = $2',
      [id, decoded.userId]
    );

    if (existingDoc.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document
    const result = await query(
      `UPDATE documents
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           subject_id = $3,
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, title, description, subject_id, updated_at`,
      [title, description, subjectId, id, decoded.userId]
    );

    return NextResponse.json({
      document: result.rows[0],
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Update document error:', error);
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
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document info before deletion
    const docResult = await query(
      'SELECT file_path FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, decoded.userId]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete document from database
    await query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [documentId, decoded.userId]);

    // Delete file from filesystem
    try {
      await unlink(docResult.rows[0].file_path);
    } catch (fileError) {
      console.error('Error deleting file from filesystem:', fileError);
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
