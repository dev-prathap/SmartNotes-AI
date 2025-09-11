
// Advanced Authentication Service for SmartNotes AI - PostgreSQL + JWT Implementation
// CLIENT-SIDE SAFE - Uses API routes for database operations

import { User } from '@/types';

export class AuthService {
  // Email/Password Login
  static async login(email: string, password: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } | null> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        console.error('Login failed:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  // Email/Password Registration
  static async register(email: string, password: string, name: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } | { error: string }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Registration failed' };
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Registration failed' };
    }
  }

  // Logout
  static async logout(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getStoredAccessToken()}`,
        },
      });

      if (!response.ok) {
        console.error('Logout API call failed:', response.statusText);
      }

      // Clear stored tokens regardless of API response
      localStorage.removeItem('smartnotes_auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if API call fails
      localStorage.removeItem('smartnotes_auth');
    }
  }

  // Get current user by ID
  static async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getStoredAccessToken()}`,
        },
      });

      if (!response.ok) {
        console.error('Get user API call failed:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Verify and refresh tokens
  static async refreshAccessToken(refreshToken: string): Promise<{
    user: User;
    accessToken: string;
    expiresIn: number;
  } | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh API call failed:', response.statusText);
        // If refresh token is expired (401), clear stored auth data
        if (response.status === 401) {
          localStorage.removeItem('smartnotes_auth');
        }
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Return null to allow the app to continue without crashing
      return null;
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getStoredAccessToken()}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        console.error('Update profile API call failed:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Update profile error:', error);
      return null;
    }
  }

  // Change password
  static async changePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getStoredAccessToken()}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        console.error('Change password API call failed:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }

  // Generate password reset token
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  }

  // Validate user session
  static async validateUserSession(userId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser(userId);
      return !!user;
    } catch (error) {
      console.error('Validate user session error:', error);
      return false;
    }
  }

  // Google OAuth Login (simulated for now)
  static async loginWithGoogle(): Promise<{ url?: string; error?: string }> {
    // For production, integrate with Google OAuth
    return { error: 'Google OAuth not implemented yet' };
  }

  // Helper method to get stored access token
  private static getStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedAuth = localStorage.getItem('smartnotes_auth');
      if (storedAuth) {
        const { accessToken } = JSON.parse(storedAuth);
        return accessToken;
      }
    } catch (error) {
      console.error('Error getting stored access token:', error);
    }

    return null;
  }
}
