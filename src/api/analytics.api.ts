/**
 * Analytics API Module Abstraction
 * Operations mapping directly to QRTRAC OpenAPI spec (Phase 0 Audit)
 */

import { ApiClient } from './client';
import { ApiResponse } from '../models/api';
import { QrTracScanOverviewItem } from '../types/qrtrac';

export interface IAnalyticsApi {
  getScansOverview(qrIds: string[]): Promise<ApiResponse<QrTracScanOverviewItem[]>>;
}

export class AnalyticsApi implements IAnalyticsApi {
  constructor(private client: ApiClient) {}

  /**
   * Fetch scan and lead metrics for an array of QR IDs
   * Endpoint: POST /analytics-api/overviews
   */
  async getScansOverview(qrIds: string[]): Promise<ApiResponse<QrTracScanOverviewItem[]>> {
    return this.client.request<QrTracScanOverviewItem[]>('/analytics-api/overviews', {
      method: 'POST',
      body: JSON.stringify({ qrIds }),
    });
  }
}
