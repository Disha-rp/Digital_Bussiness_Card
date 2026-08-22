/**
 * QRTRAC Authentication & Credential Validation Service
 * Validates organization credentials against live QRTRAC API endpoints.
 */

import { ApiClient, defaultApiClient } from '../api/client';
import { ApiError } from '../models/api';
import { QrTracCredentials } from '../types/qrtrac';

export interface ValidationResult {
  success: boolean;
  error?: ApiError;
  organizationName?: string;
}

export class AuthService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * Validates organization credentials by issuing a lightweight authenticated request.
   * Uses GET /qrs-api/v2/teams/?page=1&limit=1 to verify team context and API keys.
   */
  async validateCredentials(credentials: QrTracCredentials): Promise<ValidationResult> {
    if (!credentials.clientId?.trim()) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Client ID is required.',
          isRetryable: false,
        },
      };
    }

    if (!credentials.clientSecret?.trim()) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Client Secret is required.',
          isRetryable: false,
        },
      };
    }

    if (!credentials.teamId?.trim()) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Team ID is required.',
          isRetryable: false,
        },
      };
    }

    // Attempt authenticated query to team QRs endpoint
    const response = await this.client.request<{
      qrs: unknown[];
      totalCount: number;
    }>('/qrs-api/v2/teams/?page=1&limit=1', {
      method: 'GET',
      credentials,
      timeoutMs: 8000,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    // Optionally retrieve team name from /teams-api/{id}
    let organizationName: string | undefined;
    try {
      const teamRes = await this.client.request<{ name?: string }>(
        `/teams-api/${encodeURIComponent(credentials.teamId)}`,
        {
          method: 'GET',
          credentials,
          timeoutMs: 5000,
        }
      );
      if (teamRes.success && teamRes.data?.name) {
        organizationName = teamRes.data.name;
      }
    } catch {
      // Non-blocking fallback
    }

    return {
      success: true,
      organizationName: organizationName || 'QRTRAC Workspace',
    };
  }
}

export const authService = new AuthService();
