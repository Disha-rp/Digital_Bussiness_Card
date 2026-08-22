/**
 * User & Authentication Models
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  company?: string;
  createdAt: number;
}

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated' | 'error';

export interface SessionState {
  user: User | null;
  status: AuthStatus;
  token?: string; // App-level session identifier
  lastActiveAt?: number;
  error?: string | null;
}
