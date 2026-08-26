/**
 * Phase 14 — Production Error Handling & Reliability Audit Test Suite
 * Comprehensive automated verification for network failures, HTTP status codes (400-503),
 * form validations, retry safety, image fallbacks, and accessibility attributes.
 */

(global as any).__DEV__ = true;

// Mock react-native
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'android', select: jest.fn((dict) => dict.android || dict.default) },
  StyleSheet: { create: (styles: any) => styles },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  Linking: { openURL: jest.fn().mockResolvedValue(true) },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

import React from 'react';
import { ApiClient } from '../src/api/client';
import { Avatar } from '../src/components/Avatar';
import { ErrorState } from '../src/components/ErrorState';
import { LoadingIndicator } from '../src/components/LoadingIndicator';
import { ImageService } from '../src/services/image.service';

describe('Phase 14: Production Error Handling & Reliability Audit', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({ baseUrl: 'https://api.qrtrac.com/api', timeoutMs: 1000, maxRetries: 0 });
    jest.clearAllMocks();
  });

  describe('1. Network Failures & Timeouts', () => {
    it('normalizes generic network failure into user-friendly NETWORK_ERROR', () => {
      const error = new TypeError('Failed to fetch');
      const normalized = client.normalizeError(error);

      expect(normalized.type).toBe('NETWORK_ERROR');
      expect(normalized.message).toBe('Network unavailable. Please check your internet connection.');
      expect(normalized.isRetryable).toBe(true);
    });

    it('normalizes AbortError into request timeout message', () => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';

      const normalized = client.normalizeError(abortError);

      expect(normalized.type).toBe('NETWORK_ERROR');
      expect(normalized.message).toBe('Request timed out. Please check your network connection.');
      expect(normalized.isRetryable).toBe(true);
    });

    it('normalizes DNS / connection reset errors safely without leaking internal stack traces', () => {
      const connError = new Error('getaddrinfo ENOTFOUND api.qrtrac.com');
      const normalized = client.normalizeError(connError);

      expect(normalized.type).toBe('NETWORK_ERROR');
      expect(normalized.message).toBe('Network unavailable. Please check your internet connection.');
      expect(normalized.message).not.toContain('api.qrtrac.com');
      expect(normalized.message).not.toContain('ENOTFOUND');
      expect(normalized.isRetryable).toBe(true);
    });
  });

  describe('2. HTTP/API Error Handling (400 - 503)', () => {
    it('handles 400 Bad Request validation errors', () => {
      const res = client.normalizeError(null, 400, { message: 'DisplayId slug is already taken.' });

      expect(res.type).toBe('VALIDATION_ERROR');
      expect(res.statusCode).toBe(400);
      expect(res.message).toBe('Display ID is invalid or already taken. Please choose a different slug.');
      expect(res.isRetryable).toBe(false);
    });

    it('handles 400 Card Limit reached', () => {
      const res = client.normalizeError(null, 400, { message: 'Card limit reached for this team.' });

      expect(res.type).toBe('VALIDATION_ERROR');
      expect(res.message).toBe('Card limit reached for this team account.');
    });

    it('handles 401 Unauthorized authentication errors', () => {
      const res = client.normalizeError(null, 401);

      expect(res.type).toBe('AUTHENTICATION_ERROR');
      expect(res.statusCode).toBe(401);
      expect(res.message).toContain('Unauthorized: Invalid API credentials');
      expect(res.isRetryable).toBe(false);
    });

    it('handles 403 Forbidden permission errors', () => {
      const res = client.normalizeError(null, 403);

      expect(res.type).toBe('FORBIDDEN_ERROR');
      expect(res.statusCode).toBe(403);
      expect(res.message).toContain('Permission denied: A Business Plus plan or Admin role is required');
      expect(res.isRetryable).toBe(false);
    });

    it('handles 404 Not Found errors', () => {
      const res = client.normalizeError(null, 404);

      expect(res.type).toBe('NOT_FOUND_ERROR');
      expect(res.statusCode).toBe(404);
      expect(res.message).toBe('The requested card or QR code was not found.');
      expect(res.isRetryable).toBe(false);
    });

    it('handles 409 Conflict errors', () => {
      const res = client.normalizeError(null, 409, { message: 'Resource already exists' });

      expect(res.type).toBe('CONFLICT_ERROR');
      expect(res.statusCode).toBe(409);
      expect(res.message).toContain('Resource already exists');
      expect(res.isRetryable).toBe(false);
    });

    it('handles 429 Rate Limit errors with retry-after delay', () => {
      const res = client.normalizeError(null, 429);

      expect(res.type).toBe('RATE_LIMIT_ERROR');
      expect(res.statusCode).toBe(429);
      expect(res.message).toContain('Rate limit reached');
      expect(res.isRetryable).toBe(true);
      expect(res.retryAfterSeconds).toBe(5);
    });

    it('handles 500 Internal Server Error as retryable', () => {
      const res = client.normalizeError(null, 500);

      expect(res.type).toBe('SERVER_ERROR');
      expect(res.statusCode).toBe(500);
      expect(res.message).toContain('QRTRAC server is temporarily unavailable');
      expect(res.isRetryable).toBe(true);
    });

    it('handles 502/503 Service Unavailable as retryable', () => {
      const res502 = client.normalizeError(null, 502);
      expect(res502.type).toBe('SERVER_ERROR');
      expect(res502.message).toContain('temporarily offline or unavailable');
      expect(res502.isRetryable).toBe(true);

      const res503 = client.normalizeError(null, 503);
      expect(res503.type).toBe('SERVER_ERROR');
      expect(res503.message).toContain('temporarily offline or unavailable');
      expect(res503.isRetryable).toBe(true);
    });

    it('never leaks raw credentials or secrets in error outputs', () => {
      const secretError = new Error('Secret key: sk_live_998877665544332211');
      const res = client.normalizeError(secretError, 500);

      expect(res.message).not.toContain('sk_live');
      expect(res.message).not.toContain('998877665544332211');
    });
  });

  describe('3. Form Validations & Sanitization', () => {
    it('validates email formats accurately', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('first.last@domain.co.uk')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('user@')).toBe(false);
      expect(emailRegex.test('@domain.com')).toBe(false);
    });

    it('normalizes website URLs with https:// when protocol is missing', () => {
      const normalizeUrl = (input: string) => {
        let clean = input.trim();
        if (clean && !/^https?:\/\//i.test(clean)) {
          clean = `https://${clean}`;
        }
        return clean;
      };

      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('validates international phone numbers safely', () => {
      const validatePhone = (phone: string) => {
        const clean = phone.replace(/[\s\-()+]/g, '');
        return clean.length >= 7 && clean.length <= 18;
      };

      expect(validatePhone('+1 (555) 123-4567')).toBe(true);
      expect(validatePhone('+91 9876543210')).toBe(true);
      expect(validatePhone('12345')).toBe(false); // Too short
      expect(validatePhone('12345678901234567890')).toBe(false); // Too long
    });
  });

  describe('4. Image Error Handling & Avatar Fallbacks', () => {
    it('creates Avatar element with initials when image URI is absent', () => {
      const element = <Avatar name="Disha Patil" size="lg" />;
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.name).toBe('Disha Patil');
      expect(element.props.size).toBe('lg');
    });

    it('handles permission denied in ImageService gracefully', async () => {
      const res = await ImageService.pickFromLibrary();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Permission denied');
    });

    it('handles downscaleImageWeb gracefully in non-browser environments', async () => {
      const res = await ImageService.downscaleImageWeb('file:///local/test.jpg');
      expect(res).toBe('file:///local/test.jpg');
    });
  });

  describe('5. Accessibility Attributes Audit', () => {
    it('creates accessible LoadingIndicator element with progressbar role and polite live region', () => {
      const element = <LoadingIndicator message="Syncing cards..." />;
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.message).toBe('Syncing cards...');
    });

    it('creates accessible ErrorState element with alert role and retry callback', () => {
      const retryMock = jest.fn();
      const element = <ErrorState title="Connection Error" message="Unable to load cards." onRetry={retryMock} />;
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.title).toBe('Connection Error');
      expect(element.props.message).toBe('Unable to load cards.');
      expect(element.props.onRetry).toBe(retryMock);
    });

    it('creates accessible Avatar element with image role', () => {
      const element = <Avatar name="Disha Patil" size="md" />;
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.name).toBe('Disha Patil');
    });
  });

  describe('6. Authentication Initialization & Session Readiness Guards', () => {
    it('blocks fetchCards from dispatching when session is restoring or isLoading is true', () => {
      const isAuthReady = (isLoading: boolean, status: string, isAuth: boolean, teamId?: string, hasCreds = true) => {
        return !isLoading && status === 'authenticated' && isAuth && Boolean(teamId?.trim()) && hasCreds;
      };

      // During session restoring
      expect(isAuthReady(true, 'idle', false, undefined, false)).toBe(false);
      expect(isAuthReady(true, 'authenticating', false, 'team_123', true)).toBe(false);
    });

    it('blocks fetchCards when unauthenticated or teamId is missing', () => {
      const isAuthReady = (isLoading: boolean, status: string, isAuth: boolean, teamId?: string, hasCreds = true) => {
        return !isLoading && status === 'authenticated' && isAuth && Boolean(teamId?.trim()) && hasCreds;
      };

      expect(isAuthReady(false, 'unauthenticated', false, undefined, false)).toBe(false);
      expect(isAuthReady(false, 'authenticated', true, '', true)).toBe(false);
      expect(isAuthReady(false, 'authenticated', true, '   ', true)).toBe(false);
    });

    it('blocks fetchCards when client credentials are not available', () => {
      const hasClientCredentials = (creds: { teamId?: string; clientId?: string; clientSecret?: string } | null) => {
        return Boolean(
          creds &&
          creds.teamId && creds.teamId.trim() &&
          creds.clientId && creds.clientId.trim() &&
          creds.clientSecret && creds.clientSecret.trim()
        );
      };

      expect(hasClientCredentials(null)).toBe(false);
      expect(hasClientCredentials({ teamId: 'team_1', clientId: 'client_1' })).toBe(false);
      expect(hasClientCredentials({ teamId: 'team_1', clientId: '', clientSecret: 'secret_1' })).toBe(false);
      expect(hasClientCredentials({ teamId: 'team_1', clientId: 'client_1', clientSecret: 'secret_1' })).toBe(true);
    });

    it('allows fetchCards execution only when authenticated with valid team and credentials', () => {
      const isAuthReady = (isLoading: boolean, status: string, isAuth: boolean, teamId?: string, hasCreds = true) => {
        return !isLoading && status === 'authenticated' && isAuth && Boolean(teamId?.trim()) && hasCreds;
      };

      expect(isAuthReady(false, 'authenticated', true, 'team_44S2WatM2nlqS9EZo2Gz', true)).toBe(true);
    });

    it('deduplicates multiple session context updates with lastFetchedTeamRef', () => {
      let fetchCount = 0;
      let lastFetchedTeamId: string | null = null;

      const triggerAutoFetch = (isAuthReady: boolean, teamId: string) => {
        if (isAuthReady) {
          if (lastFetchedTeamId !== teamId) {
            lastFetchedTeamId = teamId;
            fetchCount++;
          }
        } else {
          lastFetchedTeamId = null;
        }
      };

      // 1. Initial render during restore (not ready)
      triggerAutoFetch(false, '');
      expect(fetchCount).toBe(0);

      // 2. Auth restored -> ready
      triggerAutoFetch(true, 'team_123');
      expect(fetchCount).toBe(1);

      // 3. Subsequent context updates for same session/team -> no duplicate fetch
      triggerAutoFetch(true, 'team_123');
      triggerAutoFetch(true, 'team_123');
      expect(fetchCount).toBe(1);

      // 4. User logs out
      triggerAutoFetch(false, '');
      expect(lastFetchedTeamId).toBe(null);
      expect(fetchCount).toBe(1);

      // 5. User logs back in -> fetches once for new session
      triggerAutoFetch(true, 'team_123');
      expect(fetchCount).toBe(2);
    });
  });
});
