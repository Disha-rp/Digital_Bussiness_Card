/**
 * Authentication & Session State Context
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { User, SessionState, AuthStatus } from '../models/user';

export interface AuthContextValue {
  user: User | null;
  session: SessionState;
  isAuthenticated: boolean;
  status: AuthStatus;
  error: string | null;
  login: (userOverride?: Partial<User>) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearAuthError: () => void;
}

const DEFAULT_DEMO_USER: User = {
  id: 'usr_alex_morgan_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@techcorp.io',
  role: 'owner',
  company: 'TechCorp Solutions',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionState>({
    user: null,
    status: 'unauthenticated',
    token: undefined,
    lastActiveAt: undefined,
    error: null,
  });

  const login = useCallback((userOverride?: Partial<User>) => {
    const userToLogin: User = {
      ...DEFAULT_DEMO_USER,
      ...userOverride,
    };

    setSession({
      user: userToLogin,
      status: 'authenticated',
      token: 'session_token_' + Date.now(),
      lastActiveAt: Date.now(),
      error: null,
    });
  }, []);

  const logout = useCallback(() => {
    setSession({
      user: null,
      status: 'unauthenticated',
      token: undefined,
      lastActiveAt: undefined,
      error: null,
    });
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setSession((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, ...userData },
      };
    });
  }, []);

  const clearAuthError = useCallback(() => {
    setSession((prev) => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      session,
      isAuthenticated: session.status === 'authenticated' && session.user !== null,
      status: session.status,
      error: session.error || null,
      login,
      logout,
      updateUser,
      clearAuthError,
    }),
    [session, login, logout, updateUser, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
