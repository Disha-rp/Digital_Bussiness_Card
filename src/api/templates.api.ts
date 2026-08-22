/**
 * QR Code Design Templates API Module Abstraction
 * Operations mapping directly to QRTRAC OpenAPI spec (Phase 0 Audit)
 */

import { ApiClient } from './client';
import { ApiResponse } from '../models/api';
import { QrTracTemplate } from '../types/qrtrac';

export interface ITemplatesApi {
  getTeamTemplates(): Promise<ApiResponse<QrTracTemplate[]>>;
}

export class TemplatesApi implements ITemplatesApi {
  constructor(private client: ApiClient) {}

  /**
   * Fetch QR code visual styles and templates created for the organization
   * Endpoint: GET /qr-templates-api
   */
  async getTeamTemplates(): Promise<ApiResponse<QrTracTemplate[]>> {
    return this.client.request<QrTracTemplate[]>('/qr-templates-api', {
      method: 'GET',
    });
  }
}
