/**
 * QR Codes API Module Abstraction
 * Operations mapping directly to QRTRAC OpenAPI spec (Phase 0 Audit)
 */

import { ApiClient } from './client';
import { ApiResponse } from '../models/api';
import {
  CreateQrRequest,
  UpdateQrRequest,
  QrTracQr,
  QrTracPaginatedData,
  QrTracAvailabilityData,
} from '../types/qrtrac';

export interface IQrsApi {
  createQr(payload: CreateQrRequest): Promise<ApiResponse<QrTracQr>>;
  getQrById(id: string): Promise<ApiResponse<QrTracQr>>;
  updateQr(id: string, payload: UpdateQrRequest): Promise<ApiResponse<QrTracQr>>;
  deleteQr(id: string): Promise<ApiResponse<void>>;
  listTeamQrs(
    teamId?: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<ApiResponse<QrTracPaginatedData<QrTracQr>>>;
  checkSlugAvailability(displayId: string): Promise<ApiResponse<QrTracAvailabilityData>>;
  duplicateQr(id: string, name?: string): Promise<ApiResponse<QrTracQr>>;
}

export class QrsApi implements IQrsApi {
  constructor(private client: ApiClient) {}

  async createQr(payload: CreateQrRequest): Promise<ApiResponse<QrTracQr>> {
    return this.client.request<QrTracQr>('/qrs-api', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getQrById(id: string): Promise<ApiResponse<QrTracQr>> {
    return this.client.request<QrTracQr>(`/qrs-api/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  async updateQr(id: string, payload: UpdateQrRequest): Promise<ApiResponse<QrTracQr>> {
    return this.client.request<QrTracQr>(`/qrs-api/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteQr(id: string): Promise<ApiResponse<void>> {
    return this.client.request<void>(`/qrs-api/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async listTeamQrs(
    teamId?: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<ApiResponse<QrTracPaginatedData<QrTracQr>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.client.request<QrTracPaginatedData<QrTracQr>>(`/qrs-api/v2/teams/${query}`, {
      method: 'GET',
    });
  }

  async checkSlugAvailability(displayId: string): Promise<ApiResponse<QrTracAvailabilityData>> {
    return this.client.request<QrTracAvailabilityData>(`/qrs-api/availability/${encodeURIComponent(displayId)}`, {
      method: 'GET',
      bypassAuth: true,
    });
  }

  async duplicateQr(id: string, name?: string): Promise<ApiResponse<QrTracQr>> {
    return this.client.request<QrTracQr>(`/qrs-api/duplicate/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
}
