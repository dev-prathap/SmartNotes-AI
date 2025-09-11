// API Route: /api/auth/login
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/database';
import { generateTokenPair } from '@/lib/jwt';
import { User } from '@/types';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const result = await query(
      'SELECT id, email, password_hash, name, role, avatar_url, created_at, last_login_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userData = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [userData.id]
    );

    // Create user object
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
      createdAt: userData.created_at,
      lastLoginAt: new Date().toISOString(),
    };

    // Generate token pair
    const tokenPair = generateTokenPair(user);

    // Store refresh token in database
    const tokenHash = crypto.createHash('sha256').update(tokenPair.refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Clean up expired tokens first
    await query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');

    // Store new refresh token
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    return NextResponse.json({
      user,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle specific database connection errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message?.includes('Connection terminated')) {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
