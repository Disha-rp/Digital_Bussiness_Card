/**
 * Phase 4 Authentication & Session Management Unit Tests
 * Verifies SecureStore persistence, credential validation,
 * session models, logout, and unauthorized interception.
 */

(global as any).__DEV__ = true;

import { ApiClient } from '../src/api/client';
import { AuthService } from '../src/services/auth.service';
import { storageService } from '../src/services/storage.service';
import { QrTracCredentials } from '../src/types/qrtrac';
import * as SecureStore from 'expo-secure-store';

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    setItemAsync: jest.fn().mockImplementation(async (key: string, value: string) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn().mockImplementation(async (key: string) => {
      return store[key] || null;
    }),
    deleteItemAsync: jest.fn().mockImplementation(async (key: string) => {
      delete store[key];
    }),
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  };
});

describe('Phase 4 — Authentication & Session Management', () => {
  let client: ApiClient;
  let authService: AuthService;

  const mockCredentials: QrTracCredentials = {
    clientId: 'cli_valid_123',
    clientSecret: 'sec_valid_456',
    teamId: 'team_valid_789',
    baseUrl: 'https://api.qrtrac.com/api',
  };

  const mockFetch = jest.fn();
  (global as any).fetch = mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new ApiClient({ baseUrl: 'https://api.qrtrac.com/api', maxRetries: 0 });
    authService = new AuthService(client);
  });

  describe('1. Organization Credential Validation (AuthService)', () => {
    it('validates correct credentials and returns success with team name', async () => {
      // Mock team QRs probe response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () =>
          JSON.stringify({
            success: true,
            data: { qrs: [], totalCount: 0 },
          }),
      });

      // Mock team detail response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () =>
          JSON.stringify({
            success: true,
            data: { name: 'Acme Digital Enterprises' },
          }),
      });

      const result = await authService.validateCredentials(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.organizationName).toBe('Acme Digital Enterprises');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.qrtrac.com/api/qrs-api/v2/teams/?page=1&limit=1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-request-team-id': mockCredentials.teamId,
            'x-request-client-id': mockCredentials.clientId,
            'x-request-client-secret': mockCredentials.clientSecret,
          }),
        })
      );
    });

    it('rejects 401 unauthorized credentials with normalized message without leaking secret', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: false,
            message: 'Invalid client credentials',
          }),
      });

      const result = await authService.validateCredentials(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('AUTHENTICATION_ERROR');
      expect(result.error?.statusCode).toBe(401);
      expect(result.error?.message).toContain('Invalid API credentials');
      expect(result.error?.message).not.toContain(mockCredentials.clientSecret);
    });

    it('rejects 403 forbidden tier restrictions with user-friendly error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            success: false,
            message: 'API access requires Business Plus plan',
          }),
      });

      const result = await authService.validateCredentials(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('FORBIDDEN_ERROR');
      expect(result.error?.statusCode).toBe(403);
      expect(result.error?.message).toContain('Permission denied');
    });

    it('validates required fields before sending request', async () => {
      const invalid = { clientId: '', clientSecret: '', teamId: '' };
      const result = await authService.validateCredentials(invalid);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('VALIDATION_ERROR');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('2. Encrypted Storage (StorageService via SecureStore)', () => {
    it('saves credentials with encryption flags in SecureStore', async () => {
      await storageService.saveCredentials(mockCredentials);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'qrtrac_client_id',
        mockCredentials.clientId,
        expect.any(Object)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'qrtrac_client_secret',
        mockCredentials.clientSecret,
        expect.any(Object)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'qrtrac_team_id',
        mockCredentials.teamId,
        expect.any(Object)
      );
    });

    it('retrieves saved credentials from SecureStore', async () => {
      await storageService.saveCredentials(mockCredentials);
      const retrieved = await storageService.getCredentials();

      expect(retrieved).toEqual(mockCredentials);
    });

    it('checks credential existence via hasCredentials', async () => {
      await storageService.saveCredentials(mockCredentials);
      const exists = await storageService.hasCredentials();
      expect(exists).toBe(true);
    });

    it('purges all credentials from SecureStore upon clearCredentials', async () => {
      await storageService.saveCredentials(mockCredentials);
      await storageService.clearCredentials();

      const retrieved = await storageService.getCredentials();
      expect(retrieved).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('qrtrac_client_secret');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('qrtrac_client_id');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('qrtrac_team_id');
    });
  });

  describe('3. Session State & Client Credentials Lifecycle', () => {
    it('injects active credentials into ApiClient upon successful login', () => {
      client.setCredentials(mockCredentials);
      expect(client.getCredentials()).toEqual(mockCredentials);
    });

    it('clears active credentials from ApiClient upon logout', () => {
      client.setCredentials(mockCredentials);
      client.setCredentials(null);
      expect(client.getCredentials()).toBeNull();
    });
  });
});
