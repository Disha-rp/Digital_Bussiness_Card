/**
 * Centralized QRTRAC API Client
 * Production-ready HTTP client communicating with https://api.qrtrac.com/api
 *
 * Security Constraints:
 * - Never hardcodes or logs secrets (Client Secret, Client ID, Team ID).
 * - Normalizes all errors into user-friendly messages without leaking sensitive internals.
 * - Supports timeout, retries with exponential backoff, and rate-limit parsing.
 */

import { ApiError, ApiErrorType, ApiResponse } from '../models/api';
import { QrTracCredentials } from '../types/qrtrac';
import { getEnvCredentials } from '../constants';

export interface RequestOptions extends Omit<RequestInit, 'credentials'> {
  timeoutMs?: number;
  retryCount?: number;
  credentials?: QrTracCredentials;
  bypassAuth?: boolean;
}

export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  resetTime?: number;
}

export class ApiClient {
  private defaultBaseUrl: string;
  private defaultTimeoutMs: number;
  private maxRetries: number;
  private activeCredentials: QrTracCredentials | null = null;
  private latestRateLimit: RateLimitInfo = {};

  constructor(config: {
    baseUrl?: string;
    timeoutMs?: number;
    maxRetries?: number;
    initialCredentials?: QrTracCredentials | null;
  } = {}) {
    this.defaultBaseUrl = config.baseUrl || 'https://api.qrtrac.com/api';
    this.defaultTimeoutMs = config.timeoutMs !== undefined ? config.timeoutMs : 20000;
    this.maxRetries = config.maxRetries !== undefined ? config.maxRetries : 2;
    this.activeCredentials = config.initialCredentials !== undefined ? config.initialCredentials : getEnvCredentials();
  }

  public setCredentials(credentials: QrTracCredentials | null): void {
    this.activeCredentials = credentials;
  }

  public getCredentials(): QrTracCredentials | null {
    return this.activeCredentials;
  }

  public getRateLimitInfo(): RateLimitInfo {
    return { ...this.latestRateLimit };
  }

  /**
   * Safe logger: logs only method and sanitized URL in development.
   * NEVER logs headers or secrets.
   */
  private log(message: string, ...args: unknown[]): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[QRTRAC API Client] ${message}`, ...args);
    }
  }

  /**
   * Safe error logger in development.
   */
  private logError(message: string, ...args: unknown[]): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(`[QRTRAC API Client Error] ${message}`, ...args);
    }
  }

  /**
   * Build authentication headers required by QRTRAC API:
   * x-request-team-id, x-request-client-id, x-request-client-secret
   */
  private buildHeaders(
    customHeaders?: HeadersInit,
    credentialsOverride?: QrTracCredentials,
    bypassAuth = false
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (!bypassAuth) {
      const creds = credentialsOverride || this.activeCredentials;
      if (creds) {
        if (creds.teamId && creds.teamId.trim()) headers['x-request-team-id'] = creds.teamId.trim();
        if (creds.clientId && creds.clientId.trim()) headers['x-request-client-id'] = creds.clientId.trim();
        if (creds.clientSecret && creds.clientSecret.trim()) headers['x-request-client-secret'] = creds.clientSecret.trim();
      }
    }

    if (customHeaders) {
      if (customHeaders instanceof Headers) {
        customHeaders.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(customHeaders)) {
        customHeaders.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, customHeaders);
      }
    }

    return headers;
  }

  /**
   * Parse rate limit response headers:
   * X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
   */
  private parseRateLimitHeaders(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit || remaining || reset) {
      this.latestRateLimit = {
        limit: limit ? parseInt(limit, 10) : undefined,
        remaining: remaining ? parseInt(remaining, 10) : undefined,
        resetTime: reset ? parseInt(reset, 10) : undefined,
      };
    }
  }

  /**
   * Standardize and normalize API errors into user-friendly messages.
   * Ensures no sensitive details (Client Secret, tokens) are exposed.
   */
  public normalizeError(error: unknown, statusCode?: number, responseData?: unknown): ApiError {
    let type: ApiErrorType = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred. Please try again.';
    let isRetryable = false;
    let retryAfterSeconds: number | undefined;

    const rawMessage = (responseData as { message?: string })?.message;

    if (statusCode === 400) {
      type = 'VALIDATION_ERROR';
      if (rawMessage?.toLowerCase().includes('displayid') || rawMessage?.toLowerCase().includes('slug')) {
        message = 'Display ID is invalid or already taken. Please choose a different slug.';
      } else if (rawMessage?.toLowerCase().includes('limit')) {
        message = 'Card limit reached for this team account.';
      } else {
        message = rawMessage || 'Invalid request. Please verify the card details.';
      }
    } else if (statusCode === 401) {
      type = 'AUTHENTICATION_ERROR';
      message = 'Unauthorized: Invalid API credentials. Please check your Client ID and Client Secret.';
    } else if (statusCode === 403) {
      type = 'FORBIDDEN_ERROR';
      message = 'Permission denied: A Business Plus plan or Admin role is required for API access.';
    } else if (statusCode === 404) {
      type = 'NOT_FOUND_ERROR';
      message = 'The requested card or QR code was not found.';
    } else if (statusCode === 429) {
      type = 'RATE_LIMIT_ERROR';
      message = 'Rate limit reached. Please wait a moment before sending more requests.';
      isRetryable = true;
      retryAfterSeconds = 5;
    } else if (statusCode && statusCode >= 500) {
      type = 'SERVER_ERROR';
      message = 'QRTRAC server is temporarily unavailable. Please try again later.';
      isRetryable = true;
    } else if (error instanceof TypeError || (error as Error)?.name === 'AbortError') {
      type = 'NETWORK_ERROR';
      message =
        (error as Error)?.name === 'AbortError'
          ? 'Request timed out. Please check your network connection.'
          : 'Network unavailable. Please check your internet connection.';
      isRetryable = true;
    } else if (rawMessage) {
      if (rawMessage === 'Better luck next time!') {
        type = 'AUTHENTICATION_ERROR';
        message = 'Unauthorized: Invalid or missing API credentials.';
      } else {
        message = rawMessage;
      }
    } else if ((error as Error)?.message) {
      message = (error as Error).message;
    }

    return {
      type,
      statusCode,
      message,
      details: responseData || null,
      retryAfterSeconds,
      isRetryable,
    };
  }

  /**
   * Core request dispatcher supporting timeout, credentials injection,
   * exponential backoff retries, envelope validation, and normalized responses.
   */
  public async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeoutMs = this.defaultTimeoutMs,
      retryCount = 0,
      credentials,
      bypassAuth = false,
      ...fetchOptions
    } = options;

    const baseUrl = credentials?.baseUrl || this.activeCredentials?.baseUrl || this.defaultBaseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers = this.buildHeaders(fetchOptions.headers, credentials, bypassAuth);
    this.log(`→ ${fetchOptions.method || 'GET'} ${cleanEndpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        mode: 'cors',
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.parseRateLimitHeaders(response.headers);

      const responseText = await response.text();
      let json: unknown;
      try {
        json = responseText ? JSON.parse(responseText) : {};
      } catch {
        json = { raw: responseText };
      }

      // Check for HTTP errors or QRTRAC envelope failures (e.g. success === false)
      const hasEnvelopeError = json && typeof json === 'object' && (json as { success?: boolean }).success === false;

      if (!response.ok || hasEnvelopeError) {
        const effectiveStatus = !response.ok ? response.status : 400;
        const normalized = this.normalizeError(null, effectiveStatus, json);
        this.logError(`← ${response.status} ${cleanEndpoint}: ${normalized.message}`);

        // Retry with exponential backoff if retryable and under maxRetries
        if (normalized.isRetryable && retryCount < this.maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500;
          this.log(`Retrying in ${Math.round(delay)}ms (Attempt ${retryCount + 1}/${this.maxRetries})...`);
          await new Promise((res) => setTimeout(res, delay));
          return this.request<T>(endpoint, {
            ...options,
            retryCount: retryCount + 1,
          });
        }

        return {
          success: false,
          data: (json as { data?: T })?.data ?? (null as unknown as T),
          message: normalized.message,
          error: normalized,
        };
      }

      this.log(`← ${response.status} OK ${cleanEndpoint}`);
      return {
        success: true,
        data: (json as { data?: T })?.data !== undefined ? (json as { data: T }).data : (json as T),
        message: (json as { message?: string })?.message,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const normalized = this.normalizeError(err);
      this.logError(`← Exception on ${cleanEndpoint}: ${normalized.message}`);

      if (normalized.isRetryable && retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500;
        this.log(`Retrying after network exception in ${Math.round(delay)}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        return this.request<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1,
        });
      }

      return {
        success: false,
        data: null as unknown as T,
        message: normalized.message,
        error: normalized,
      };
    }
  }
}

export const defaultApiClient = new ApiClient();
