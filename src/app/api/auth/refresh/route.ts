// API Route: /api/auth/refresh
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';
import { User } from '@/types';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      // Clear the stored auth data on the client side
      return NextResponse.json(
        { error: 'Invalid or expired refresh token. Please log in again.' },
        { status: 401 }
      );
    }

    // Check if refresh token exists in database
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const result = await query(
      'SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Refresh token not found or expired. Please log in again.' },
        { status: 401 }
      );
    }

    const userId = result.rows[0].user_id;

    // Get user data
    const userResult = await query(
      'SELECT id, email, name, role, avatar_url, created_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userResult.rows[0];
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
      createdAt: userData.created_at,
      lastLoginAt: userData.last_login_at,
    };

    // Generate new token pair
    const tokenPair = generateTokenPair(user);

    return NextResponse.json({
      user,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Refresh token has expired. Please log in again.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
