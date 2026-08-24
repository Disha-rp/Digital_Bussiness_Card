/**
 * QRTRAC QR & Business Card Service Layer
 * Coordinates typed REST requests between the application and the QRTRAC API client.
 */

import { ApiClient, defaultApiClient } from '../api/client';
import { ApiResponse, PaginatedResult } from '../models/api';
import { BusinessCard, CardEditorDraft } from '../models/card';
import { CardMapper, mapToQrTracTemplateId } from './mapper';
import {
  QrTracQr,
  QrTracTemplate,
  QrTracScanOverviewItem,
  QrTracAvailabilityData,
  QrListQueryParams,
  CreateQrRequest,
  UpdateQrRequest,
} from '../types/qrtrac';

export interface IQrService {
  listCards(teamId?: string, params?: QrListQueryParams): Promise<ApiResponse<PaginatedResult<BusinessCard>>>;
  getCard(id: string): Promise<ApiResponse<BusinessCard>>;
  createCard(draft: CardEditorDraft): Promise<ApiResponse<BusinessCard>>;
  updateCard(id: string, draft: Partial<CardEditorDraft> | BusinessCard): Promise<ApiResponse<BusinessCard>>;
  deleteCard(id: string): Promise<ApiResponse<void>>;
  checkDisplayIdAvailability(displayId: string): Promise<ApiResponse<QrTracAvailabilityData>>;
  getTemplates(): Promise<ApiResponse<QrTracTemplate[]>>;
  getScansOverview(qrIds: string[]): Promise<ApiResponse<QrTracScanOverviewItem[]>>;
}

export class QrService implements IQrService {
  constructor(private client: ApiClient = defaultApiClient) {}

  /**
   * List team cards/QRs with pagination, search, and sorting.
   * Endpoint: GET /qrs-api/v2/teams/
   */
  async listCards(
    teamId?: string,
    params: QrListQueryParams = {}
  ): Promise<ApiResponse<PaginatedResult<BusinessCard>>> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const searchParams = new URLSearchParams();

    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());
    if (params.search?.trim()) searchParams.append('search', params.search.trim());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const query = `?${searchParams.toString()}`;
    const response = await this.client.request<{
      qrs: QrTracQr[];
      totalCount: number;
      page: number;
      limit: number;
    }>(`/qrs-api/v2/teams/${query}`, {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        data: {
          items: [],
          meta: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        message: response.message,
        error: response.error,
      };
    }

    const rawQrs = response.data.qrs || [];
    const totalCount = response.data.totalCount || rawQrs.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Map all QRs to BusinessCard domain model
    const businessCards = rawQrs.map((qr) => CardMapper.toBusinessCard(qr));

    return {
      success: true,
      data: {
        items: businessCards,
        meta: {
          page: response.data.page || page,
          limit: response.data.limit || limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      message: response.message,
    };
  }

  /**
   * Get single card/QR details by ID.
   * Endpoint: GET /qrs-api/teams/{id}
   */
  async getCard(id: string): Promise<ApiResponse<BusinessCard>> {
    const response = await this.client.request<QrTracQr>(
      `/qrs-api/teams/${encodeURIComponent(id)}`,
      { method: 'GET' }
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        data: null as unknown as BusinessCard,
        message: response.message,
        error: response.error,
      };
    }

    const businessCard = CardMapper.toBusinessCard(response.data);
    return {
      success: true,
      data: businessCard,
      message: response.message,
    };
  }

  /**
   * Create a new VCARD digital business card in QRTRAC.
   * Implements the dashboard-equivalent 2-step lifecycle:
   * 1. POST /qrs-api: Allocates card entity with string templateId compatible with API gateway schema.
   * 2. PUT /qrs-api/{id}: Immediately publishes complete card payload with numeric templateId (1-4),
   *    frameId: 0, and baseUrl to synchronize QRTRAC's public edge cache (refreshedAt) for instant rendering.
   */
  async createCard(draft: CardEditorDraft): Promise<ApiResponse<BusinessCard>> {
    const createPayload: CreateQrRequest = CardMapper.toCreateQrRequest(draft);

    const postResponse = await this.client.request<QrTracQr>('/qrs-api', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    });

    if (!postResponse.success || !postResponse.data) {
      return {
        success: false,
        data: null as unknown as BusinessCard,
        message: postResponse.message || 'Failed to initialize card creation.',
        error: postResponse.error,
      };
    }

    const createdId = postResponse.data.id;
    if (!createdId) {
      return {
        success: false,
        data: null as unknown as BusinessCard,
        message: 'Server returned a card without a valid ID.',
        error: {
          type: 'SERVER_ERROR',
          message: 'Server returned a card without a valid ID.',
          isRetryable: false,
        },
      };
    }

    // Step 2: Publish complete card payload via PUT with numeric templateId (1-4)
    const updatePayload: UpdateQrRequest = CardMapper.toUpdateQrRequest({
      ...draft,
      displayId: postResponse.data.displayId || draft.displayId,
    });

    const putResponse = await this.client.request<QrTracQr>(
      `/qrs-api/${encodeURIComponent(createdId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      }
    );

    if (!putResponse.success || !putResponse.data) {
      return {
        success: false,
        data: null as unknown as BusinessCard,
        message:
          putResponse.message ||
          'Card initialized on server, but failed to publish template configuration to public edge cache.',
        error: putResponse.error || {
          type: 'SERVER_ERROR',
          message: 'Failed to publish template configuration to public edge cache.',
          isRetryable: false,
        },
      };
    }

    const finalQrData: QrTracQr = {
      ...postResponse.data,
      ...putResponse.data,
      templateId: mapToQrTracTemplateId(draft.template),
    };

    const createdCard = CardMapper.toBusinessCard(finalQrData);
    return {
      success: true,
      data: createdCard,
      message: 'Card created and published successfully.',
    };
  }

  /**
   * Update an existing card in QRTRAC.
   * Endpoint: PUT /qrs-api/{id}
   */
  async updateCard(
    id: string,
    draft: Partial<CardEditorDraft> | BusinessCard
  ): Promise<ApiResponse<BusinessCard>> {
    const payload: UpdateQrRequest = CardMapper.toUpdateQrRequest(draft);

    const response = await this.client.request<QrTracQr>(
      `/qrs-api/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        data: null as unknown as BusinessCard,
        message: response.message,
        error: response.error,
      };
    }

    const updatedCard = CardMapper.toBusinessCard(response.data);
    return {
      success: true,
      data: updatedCard,
      message: response.message,
    };
  }

  /**
   * Soft-delete a QR code from QRTRAC.
   * Endpoint: DELETE /qrs-api/{id}
   */
  async deleteCard(id: string): Promise<ApiResponse<void>> {
    return this.client.request<void>(`/qrs-api/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Check displayId / custom slug availability.
   * Endpoint: GET /qrs-api/availability/{id}
   */
  async checkDisplayIdAvailability(
    displayId: string
  ): Promise<ApiResponse<QrTracAvailabilityData>> {
    return this.client.request<QrTracAvailabilityData>(
      `/qrs-api/availability/${encodeURIComponent(displayId)}`,
      {
        method: 'GET',
        bypassAuth: true,
      }
    );
  }

  /**
   * Get team QR visual styling templates.
   * Endpoint: GET /qr-templates-api
   */
  async getTemplates(): Promise<ApiResponse<QrTracTemplate[]>> {
    return this.client.request<QrTracTemplate[]>('/qr-templates-api', {
      method: 'GET',
    });
  }

  /**
   * Fetch scan and lead telemetry overview for an array of QR IDs.
   * Endpoint: POST /analytics-api/overviews
   */
  async getScansOverview(
    qrIds: string[]
  ): Promise<ApiResponse<QrTracScanOverviewItem[]>> {
    return this.client.request<QrTracScanOverviewItem[]>('/analytics-api/overviews', {
      method: 'POST',
      body: JSON.stringify({ qrIds }),
    });
  }
}

export const qrService = new QrService();
