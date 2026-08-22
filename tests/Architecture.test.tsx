/**
 * Phase 2 Application Architecture Unit Tests
 */

import { ApiClient } from '../src/api/client';
import { CARD_TEMPLATES, CARD_TEMPLATE_LIST } from '../src/theme/templates';
import { SOCIAL_PLATFORMS } from '../src/models/social';

describe('Phase 2 Architecture & Models Verification', () => {
  describe('API Client Abstraction & Error Normalizer', () => {
    const client = new ApiClient({ baseUrl: 'https://api.qrtrac.com/api', maxRetries: 2 });

    it('normalizes 401 Unauthorized errors correctly', () => {
      const error = client.normalizeError(null, 401);
      expect(error.type).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.isRetryable).toBe(false);
    });

    it('normalizes 403 Forbidden errors correctly', () => {
      const error = client.normalizeError(null, 403);
      expect(error.type).toBe('FORBIDDEN_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.isRetryable).toBe(false);
    });

    it('normalizes 429 Rate Limit errors as retryable with backoff', () => {
      const error = client.normalizeError(null, 429);
      expect(error.type).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.isRetryable).toBe(true);
      expect(error.retryAfterSeconds).toBeDefined();
    });

    it('normalizes 500 Server errors as retryable', () => {
      const error = client.normalizeError(null, 500);
      expect(error.type).toBe('SERVER_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isRetryable).toBe(true);
    });

    it('normalizes Network / Abort errors as retryable', () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      const error = client.normalizeError(abortError);
      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('Design System Templates & Social Configurations', () => {
    it('defines 3 distinct digital business card presentation templates', () => {
      expect(CARD_TEMPLATE_LIST).toHaveLength(3);
      expect(CARD_TEMPLATES.modern_minimal).toBeDefined();
      expect(CARD_TEMPLATES.corporate_executive).toBeDefined();
      expect(CARD_TEMPLATES.vibrant_glass).toBeDefined();
    });

    it('validates template style properties', () => {
      CARD_TEMPLATE_LIST.forEach((tmpl) => {
        expect(tmpl.id).toBeDefined();
        expect(tmpl.name).toBeDefined();
        expect(tmpl.style.gradientColors.length).toBeGreaterThanOrEqual(2);
        expect(tmpl.style.textColor).toBeDefined();
        expect(tmpl.style.accentColor).toBeDefined();
      });
    });

    it('defines standard supported social platforms', () => {
      const platforms = SOCIAL_PLATFORMS.map((p) => p.platform);
      expect(platforms).toContain('linkedin');
      expect(platforms).toContain('twitter');
      expect(platforms).toContain('github');
      expect(platforms).toContain('instagram');
      expect(platforms).toContain('website');
    });
  });
});
