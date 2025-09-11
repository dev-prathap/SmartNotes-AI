// API Route: /api/auth/logout
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';

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

    // Remove all refresh tokens for the user
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.userId]);

    return NextResponse.json({ message: 'Logged out successfully. All tokens have been invalidated.' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
