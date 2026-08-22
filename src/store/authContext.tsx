/**
 * Authentication & Session State Context
 * Handles session restoration, secure credential management,
 * QRTRAC organization validation, and unauthorized interception.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, SessionState, AuthStatus, QrTracSession } from '../models/user';
import { QrTracCredentials } from '../types/qrtrac';
import { defaultApiClient } from '../api/client';
import { storageService } from '../services/storage.service';
import { authService } from '../services/auth.service';
import { getEnvCredentials } from '../constants';

export interface AuthContextValue {
  user: User | null;
  organization: QrTracSession | null;
  session: SessionState;
  isAuthenticated: boolean;
  isLoading: boolean;
  status: AuthStatus;
  error: string | null;
  loginWithCredentials: (credentials: QrTracCredentials) => Promise<{ success: boolean; error?: string }>;
  login: (userOverride?: Partial<User>) => void;
  logout: () => Promise<void>;
  handleUnauthorized: (message?: string) => void;
  updateUser: (userData: Partial<User>) => void;
  clearAuthError: () => void;
}

const DEFAULT_DEMO_USER: User = {
  id: 'usr_qrtrac_admin',
  name: 'Workspace Admin',
  email: 'admin@workspace.io',
  role: 'owner',
  company: 'QRTRAC Organization',
  createdAt: Date.now(),
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionState>({
    user: null,
    organization: null,
    status: 'idle',
    token: undefined,
    lastActiveAt: undefined,
    error: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from SecureStore or environment on app startup
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        // 1. Check encrypted SecureStore for saved credentials
        const storedCreds = await storageService.getCredentials();
        const storedMeta = await storageService.getSessionMeta();

        if (storedCreds) {
          defaultApiClient.setCredentials(storedCreds);

          if (isMounted) {
            const orgSession: QrTracSession = {
              teamId: storedCreds.teamId,
              clientId: storedCreds.clientId,
              baseUrl: storedCreds.baseUrl || 'https://api.qrtrac.com/api',
              organizationName: storedMeta?.organizationName || 'QRTRAC Workspace',
              connectedAt: storedMeta?.connectedAt || Date.now(),
            };

            setSession({
              user: {
                ...DEFAULT_DEMO_USER,
                company: orgSession.organizationName,
              },
              organization: orgSession,
              status: 'authenticated',
              token: `session_${Date.now()}`,
              lastActiveAt: Date.now(),
              error: null,
            });
            setIsLoading(false);
          }
          return;
        }

        // 2. Check environment credentials fallback in development
        const envCreds = getEnvCredentials();
        if (envCreds) {
          defaultApiClient.setCredentials(envCreds);

          if (isMounted) {
            const orgSession: QrTracSession = {
              teamId: envCreds.teamId,
              clientId: envCreds.clientId,
              baseUrl: envCreds.baseUrl || 'https://api.qrtrac.com/api',
              organizationName: 'Development Workspace',
              connectedAt: Date.now(),
            };

            setSession({
              user: {
                ...DEFAULT_DEMO_USER,
                company: orgSession.organizationName,
              },
              organization: orgSession,
              status: 'authenticated',
              token: `session_env_${Date.now()}`,
              lastActiveAt: Date.now(),
              error: null,
            });
            setIsLoading(false);
          }
          return;
        }

        // 3. No credentials stored -> unauthenticated
        if (isMounted) {
          setSession((prev) => ({ ...prev, status: 'unauthenticated' }));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setSession((prev) => ({
            ...prev,
            status: 'unauthenticated',
            error: 'Failed to restore secure session.',
          }));
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Validates and establishes a session with QRTRAC organization credentials
   */
  const loginWithCredentials = useCallback(
    async (credentials: QrTracCredentials): Promise<{ success: boolean; error?: string }> => {
      setSession((prev) => ({ ...prev, status: 'authenticating', error: null }));

      try {
        const validation = await authService.validateCredentials(credentials);

        if (!validation.success) {
          const errorMessage =
            validation.error?.message || 'Authentication failed. Please verify your credentials.';
          setSession((prev) => ({
            ...prev,
            status: 'unauthenticated',
            error: errorMessage,
          }));
          return { success: false, error: errorMessage };
        }

        // Save credentials securely to Keychain/Keystore
        await storageService.saveCredentials(credentials);
        await storageService.saveSessionMeta({
          organizationName: validation.organizationName,
          connectedAt: Date.now(),
        });

        // Set active client credentials
        defaultApiClient.setCredentials(credentials);

        const orgSession: QrTracSession = {
          teamId: credentials.teamId,
          clientId: credentials.clientId,
          baseUrl: credentials.baseUrl || 'https://api.qrtrac.com/api',
          organizationName: validation.organizationName,
          connectedAt: Date.now(),
        };

        const loggedUser: User = {
          ...DEFAULT_DEMO_USER,
          company: validation.organizationName,
        };

        setSession({
          user: loggedUser,
          organization: orgSession,
          status: 'authenticated',
          token: `session_${Date.now()}`,
          lastActiveAt: Date.now(),
          error: null,
        });

        return { success: true };
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to connect to QRTRAC API.';
        setSession((prev) => ({
          ...prev,
          status: 'unauthenticated',
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * Backward-compatible simple login method
   */
  const login = useCallback((userOverride?: Partial<User>) => {
    const userToLogin: User = {
      ...DEFAULT_DEMO_USER,
      ...userOverride,
    };

    setSession({
      user: userToLogin,
      organization: {
        teamId: 'team_demo',
        clientId: 'cli_demo',
        baseUrl: 'https://api.qrtrac.com/api',
        organizationName: userToLogin.company || 'Demo Workspace',
        connectedAt: Date.now(),
      },
      status: 'authenticated',
      token: `session_token_${Date.now()}`,
      lastActiveAt: Date.now(),
      error: null,
    });
  }, []);

  /**
   * Disconnect and clear credentials from secure storage
   */
  const logout = useCallback(async () => {
    try {
      await storageService.clearCredentials();
    } catch {
      // Ignore storage errors on logout
    }

    defaultApiClient.setCredentials(null);

    setSession({
      user: null,
      organization: null,
      status: 'unauthenticated',
      token: undefined,
      lastActiveAt: undefined,
      error: null,
    });
  }, []);

  /**
   * Handle 401 unauthorized responses from API
   */
  const handleUnauthorized = useCallback((message?: string) => {
    setSession((prev) => ({
      ...prev,
      status: 'unauthenticated',
      error:
        message ||
        'Unauthorized: Your QRTRAC credentials were rejected or revoked. Please re-authenticate.',
    }));
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
      organization: session.organization,
      session,
      isAuthenticated: session.status === 'authenticated' && session.user !== null,
      isLoading,
      status: session.status,
      error: session.error || null,
      loginWithCredentials,
      login,
      logout,
      handleUnauthorized,
      updateUser,
      clearAuthError,
    }),
    [session, isLoading, loginWithCredentials, login, logout, handleUnauthorized, updateUser, clearAuthError]
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
