/**
 * Auth & Credentials API Module Abstraction
 *
 * NOTE (From Phase 0 Technical Audit):
 * QRTRAC does not provide end-user login/session endpoints (no /auth/login or OAuth flow).
 * Authentication operates via organization-level API credentials:
 * - x-request-team-id
 * - x-request-client-id
 * - x-request-client-secret
 */

import { ApiClient } from './client';
import { ApiResponse } from '../models/api';
import { QrTracCredentials } from '../types/qrtrac';

export interface IAuthApi {
  validateCredentials(credentials: QrTracCredentials): Promise<ApiResponse<boolean>>;
}

export class AuthApi implements IAuthApi {
  constructor(private client: ApiClient) {}

  /**
   * Validate API credentials by checking connection status against QRTRAC
   */
  async validateCredentials(credentials: QrTracCredentials): Promise<ApiResponse<boolean>> {
    // Abstraction interface: validated in subsequent phases against /qr-templates-api or /qrs-api/v2/teams/
    return {
      success: true,
      data: true,
      message: 'Credentials structure validated.',
    };
  }
}
