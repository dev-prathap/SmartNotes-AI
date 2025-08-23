
// Authentication utilities for SmartNotes AI

import { User } from '@/types';
import { userStorage } from './storage';

// Mock authentication - in a real app, this would connect to a proper auth service
export class AuthService {
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation - in real app, this would validate against a backend
    if (email && password.length >= 6) {
      const user: User = {
        id: this.generateId(),
        email,
        name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'student',
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const token = `mock_token_${user.id}`;
      
      // Save user to localStorage
      userStorage.set(user);
      
      return { user, token };
    }

    return null;
  }

  static async register(email: string, password: string, name: string): Promise<{ user: User; token: string } | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation
    if (email && password.length >= 6 && name.trim()) {
      const user: User = {
        id: this.generateId(),
        email,
        name: name.trim(),
        role: 'student',
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const token = `mock_token_${user.id}`;
      
      // Save user to localStorage
      userStorage.set(user);
      
      return { user, token };
    }

    return null;
  }

  static async logout(): Promise<void> {
    // Clear user data
    userStorage.remove();
    
    // In a real app, you might also invalidate the token on the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  static getCurrentUser(): User | null {
    return userStorage.get();
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static async updateProfile(updates: Partial<User>): Promise<User | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser: User = {
      ...currentUser,
      ...updates,
      id: currentUser.id, // Ensure ID cannot be changed
      createdAt: currentUser.createdAt, // Ensure creation date cannot be changed
    };

    userStorage.set(updatedUser);
    return updatedUser;
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - in real app, this would validate current password
    if (currentPassword && newPassword.length >= 6) {
      // In a real app, you would hash and store the new password
      return true;
    }
    
    return false;
  }

  static async resetPassword(email: string): Promise<boolean> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (email && email.includes('@')) {
      // In a real app, this would send a reset email
      return true;
    }
    
    return false;
  }
}

// Auth context hook utilities
export function useAuthState() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Check for existing user on mount
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await AuthService.login(email, password);
      if (result) {
        setUser(result.user);
        return result;
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const result = await AuthService.register(email, password, name);
      if (result) {
        setUser(result.user);
        return result;
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    const updatedUser = await AuthService.updateProfile(updates);
    if (updatedUser) {
      setUser(updatedUser);
    }
    return updatedUser;
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };
}

// We need to import React for the hook
import React from 'react';
