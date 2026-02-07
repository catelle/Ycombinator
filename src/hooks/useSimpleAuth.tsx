'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@/types';

interface AuthResponse {
  user?: User;
  requiresVerification?: boolean;
  emailSent?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<AuthResponse>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAdmin: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) return;
      const data = (await response.json()) as { user?: User | null };
      setUser(data.user || null);
    } catch (error) {
      console.error('Failed to load session', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const register = useCallback(async (payload: { name: string; email: string; phone: string; password: string }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw new Error(error.error || 'Failed to create account');
    }

    return (await response.json()) as AuthResponse;
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw new Error(error.error || 'Email verification failed');
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw new Error(error.error || 'Failed to resend verification');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string; requiresVerification?: boolean };
      const message = error.error || 'Login failed';
      const authError = new Error(message) as Error & { requiresVerification?: boolean };
      if (error.requiresVerification) {
        authError.requiresVerification = true;
      }
      throw authError;
    }

    const data = (await response.json()) as { user: User };
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    register,
    verifyEmail,
    resendVerification,
    login,
    logout,
    refreshSession,
    isAdmin: user?.role === 'admin',
    isMember: user?.role === 'member'
  }), [user, loading, register, verifyEmail, resendVerification, login, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useSimpleAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within AuthProvider');
  }
  return context;
};
