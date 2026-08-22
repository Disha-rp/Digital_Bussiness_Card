/**
 * Centralized QRTRAC API Client Abstraction
 * Handles request configuration, header injection, timeout, retry strategy,
 * rate limit handling, error normalization, and development-only logging.
 *
 * NOTE: Phase 2 defines the architecture and abstraction.
 * No live API network requests or credentials are sent in Phase 2.
 */

import { ApiError, ApiErrorType, ApiResponse } from '../models/api';
import { QrTracCredentials } from '../types/qrtrac';

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
  } = {}) {
    this.defaultBaseUrl = config.baseUrl || 'https://api.qrtrac.com/api';
    this.defaultTimeoutMs = config.timeoutMs || 10000;
    this.maxRetries = config.maxRetries || 2;
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
   * Log messages in development mode only
   */
  private log(message: string, ...args: unknown[]): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[QRTRAC API Client] ${message}`, ...args);
    }
  }

  /**
   * Log errors in development mode only
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
        if (creds.teamId) headers['x-request-team-id'] = creds.teamId.trim();
        if (creds.clientId) headers['x-request-client-id'] = creds.clientId.trim();
        if (creds.clientSecret) headers['x-request-client-secret'] = creds.clientSecret.trim();
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
   * Normalize response headers, including rate limit telemetry
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
   * Standardize and normalize API errors
   */
  public normalizeError(error: unknown, statusCode?: number, responseData?: unknown): ApiError {
    let type: ApiErrorType = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred.';
    let isRetryable = false;
    let retryAfterSeconds: number | undefined;

    if (statusCode === 401) {
      type = 'AUTHENTICATION_ERROR';
      message = 'Invalid Client ID or Client Secret. Please verify your credentials.';
    } else if (statusCode === 403) {
      type = 'FORBIDDEN_ERROR';
      message = 'Access forbidden: Business Plus plan upgrade or Admin role required.';
    } else if (statusCode === 404) {
      type = 'NOT_FOUND_ERROR';
      message = 'The requested QR or resource was not found.';
    } else if (statusCode === 429) {
      type = 'RATE_LIMIT_ERROR';
      message = 'QRTRAC API rate limit reached. Please wait before making more requests.';
      isRetryable = true;
      retryAfterSeconds = 5;
    } else if (statusCode && statusCode >= 400 && statusCode < 500) {
      type = 'VALIDATION_ERROR';
      message =
        (responseData as { message?: string })?.message ||
        `Validation error (${statusCode}). Please verify the input payload.`;
    } else if (statusCode && statusCode >= 500) {
      type = 'SERVER_ERROR';
      message = 'QRTRAC server error. Please retry shortly.';
      isRetryable = true;
    } else if (error instanceof TypeError || (error as Error)?.name === 'AbortError') {
      type = 'NETWORK_ERROR';
      message =
        (error as Error)?.name === 'AbortError'
          ? 'Request timed out. Please check your network connection.'
          : 'Network connection failed. Please check your internet.';
      isRetryable = true;
    } else if ((error as Error)?.message) {
      message = (error as Error).message;
    }

    return {
      type,
      statusCode,
      message,
      details: responseData || error,
      retryAfterSeconds,
      isRetryable,
    };
  }

  /**
   * Core request dispatcher with timeout and exponential backoff retry strategy
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
    this.log(`→ ${fetchOptions.method || 'GET'} ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
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

      if (!response.ok) {
        const normalized = this.normalizeError(null, response.status, json);
        this.logError(`← ${response.status} ${url}`, normalized.message);

        // Auto-retry if retryable and under maxRetries
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
          data: json as T,
          message: normalized.message,
          error: normalized,
        };
      }

      this.log(`← ${response.status} OK ${url}`);
      return {
        success: true,
        data: (json as { data?: T })?.data ?? (json as T),
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const normalized = this.normalizeError(err);
      this.logError(`← Network/Timeout Exception on ${url}:`, normalized.message);

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
