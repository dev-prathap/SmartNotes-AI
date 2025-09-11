
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { AuthService } from '@/lib/auth';
// Removed verifyAccessToken import as it requires server-side environment variables

interface AuthContextType {
  user: User | null;
  loading: boolean;
  session: { user: User } | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string, name: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<{ url?: string; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ user: User } | null>(null);

  useEffect(() => {
    // Get initial user from localStorage (for client-side persistence)
    const getInitialUser = async () => {
      try {
        // Check if we have stored auth data
        const storedAuth = localStorage.getItem('smartnotes_auth');
        if (storedAuth) {
          const { accessToken, refreshToken } = JSON.parse(storedAuth);

          if (accessToken && refreshToken) {
            // Try to refresh the token to verify auth state
            const refreshResult = await AuthService.refreshAccessToken(refreshToken);
            if (refreshResult) {
              setUser(refreshResult.user);
              setSession({ user: refreshResult.user });

              // Update stored tokens
              localStorage.setItem('smartnotes_auth', JSON.stringify({
                accessToken: refreshResult.accessToken,
                refreshToken: refreshToken,
              }));
              return;
            } else {
              // Clear expired tokens
              localStorage.removeItem('smartnotes_auth');
            }
          }
        }
      } catch (error) {
        console.error('Error getting initial user:', error);
        // Clear any corrupted auth data
        localStorage.removeItem('smartnotes_auth');
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const result = await AuthService.login(email, password);
      if (result) {
        setUser(result.user);
        setSession({ user: result.user });

        // Store tokens in localStorage
        localStorage.setItem('smartnotes_auth', JSON.stringify({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }));

        return result.user;
      }
      return null;
    } catch (error) {
      console.error('Login error in context:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User | null> => {
    setLoading(true);
    try {
      const result = await AuthService.register(email, password, name);
      if ('user' in result) {
        setUser(result.user);
        setSession({ user: result.user });

        // Store tokens in localStorage
        localStorage.setItem('smartnotes_auth', JSON.stringify({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }));

        return result.user;
      } else {
        // Handle error case
        console.error('Registration error:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Register error in context:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await AuthService.loginWithGoogle();
      return result;
    } catch (error) {
      console.error('Google login error in context:', error);
      return { error: 'Google login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        await AuthService.logout(user.id);
      }
      setUser(null);
      setSession(null);
      localStorage.removeItem('smartnotes_auth');
    } catch (error) {
      console.error('Logout error in context:', error);
      // Still clear the local state even if logout fails
      setUser(null);
      setSession(null);
      localStorage.removeItem('smartnotes_auth');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await AuthService.updateProfile(user.id, updates);
      if (success) {
        // Update local user state
        setUser(prev => prev ? { ...prev, ...updates } : null);
        setSession(prev => prev ? { user: { ...prev.user, ...updates } } : null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update profile error in context:', error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const result = await AuthService.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Reset password error in context:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    session,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    resetPassword,
    isAuthenticated: !!user && !!session,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During SSR or when outside provider, return a safe default
    if (typeof window === 'undefined') {
      return {
        user: null,
        loading: false,
        session: null,
        login: async () => null,
        register: async () => null,
        loginWithGoogle: async () => ({ error: 'Not available during SSR' }),
        logout: async () => {},
        updateProfile: async () => false,
        resetPassword: async () => ({ success: false, error: 'Not available during SSR' }),
        isAuthenticated: false,
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
