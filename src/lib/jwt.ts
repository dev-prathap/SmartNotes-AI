// JWT utilities for SmartNotes AI - Production-ready implementation

import jwt from 'jsonwebtoken';
import { User } from '@/types';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this-too';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Refresh token payload interface
export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// Generate access token
export function generateAccessToken(user: User): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'smartnotes-ai',
      audience: 'smartnotes-users',
    } as jwt.SignOptions);
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

// Generate refresh token
export function generateRefreshToken(userId: string, tokenVersion: number = 1): string {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }

  const payload: RefreshTokenPayload = {
    userId,
    tokenVersion,
  };

  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'smartnotes-ai',
      audience: 'smartnotes-refresh',
    } as jwt.SignOptions);
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'smartnotes-ai',
      audience: 'smartnotes-users',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  if (!JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET environment variable is not set');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'smartnotes-ai',
      audience: 'smartnotes-refresh',
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.error('Refresh token has expired');
    } else {
      console.error('Refresh token verification failed:', error);
    }
    return null;
  }
}

// Extract token from Authorization header
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

// Generate token pair
export function generateTokenPair(user: User): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

  // Calculate expiration time in seconds
  const expiresIn = JWT_EXPIRES_IN.includes('m')
    ? parseInt(JWT_EXPIRES_IN) * 60
    : parseInt(JWT_EXPIRES_IN);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

// Decode token without verification (for debugging)
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}
