/**
 * QRTRAC API v2 Specification Models
 * Derived strictly from Phase 0 Technical Audit (docs/qrtrac-api-analysis.md)
 * and OpenAPI 3.0 specification from https://apidocs.qrtrac.com/
 */

export type QrType =
  | 'WEB'
  | 'PDF'
  | 'VCARD'
  | 'MULTI_LOCALE'
  | 'APP_DOWNLOAD'
  | 'LINK_LIST'
  | 'SHORT_LINK'
  | 'COUPON_CODE'
  | 'IMAGE_GALLERY'
  | 'SOCIAL_BIO'
  | 'VIDEO_PREVIEW'
  | 'RESTAURANT_MENU';

/**
 * QRTRAC Organization-level credentials required in request headers
 */
export interface QrTracCredentials {
  teamId: string; // Header: x-request-team-id
  clientId: string; // Header: x-request-client-id
  clientSecret: string; // Header: x-request-client-secret
  baseUrl?: string; // Production default: https://api.qrtrac.com/api
}

/**
 * VCARD fields confirmed in official QRTRAC OpenAPI createQr examples
 */
export interface QrTracVCardPayloadFields {
  firstName?: string;
  lastName?: string;
  company?: string;
  designation?: string;
  email?: string;
  mobile?: string;
  landline?: string;
  fax?: string;
  website?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bio?: string;
}

export interface QrSettings {
  passwordEnabled?: boolean;
  password?: string;
  ageGating?: boolean;
  minAge?: number;
  scheduleCampaign?: boolean;
  campaignStart?: number;
  campaignEnd?: number;
  locationEnabled?: boolean;
  [key: string]: unknown;
}

/**
 * Payload for POST /qrs-api
 */
export interface CreateQrRequest extends QrTracVCardPayloadFields {
  name: string;
  qrType: QrType;
  displayId?: string;
  qrRedirectUrl?: string;
  metadata?: Record<string, unknown>;
  settings?: QrSettings;
  tags?: string[];
  folderId?: string; // Note: Marked as "Coming Soon" in QRTRAC spec
  folderIds?: string[]; // Note: Marked as "Coming Soon" in QRTRAC spec
  templateId?: string;
  baseUrl?: string;
}

/**
 * Payload for PUT /qrs-api/{id}
 */
export type UpdateQrRequest = Partial<CreateQrRequest>;

/**
 * Qr entity returned by QRTRAC API
 */
export interface QrTracQr extends QrTracVCardPayloadFields {
  id: string;
  displayId?: string;
  name: string;
  qrType: QrType;
  teamId: string;
  orgId?: string;
  qrRedirectUrl?: string;
  qrImageUrl?: string;
  qrImageHash?: string;
  metadata?: Record<string, unknown>;
  settings?: QrSettings;
  tags?: string[];
  folderId?: string;
  folderIds?: string[];
  batchId?: string;
  deleted?: boolean;
  expiryDate?: number;
  createdAt: number;
  createdBy?: string;
  updatedAt: number;
  updatedBy?: string;
}

/**
 * Query parameters for paginated QR listing
 * Endpoint: GET /qrs-api/v2/teams/{teamId}
 */
export interface QrListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Standard QRTRAC response envelope
 */
export interface QrTracResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface QrTracPaginatedData<T> {
  qrs: T[];
  totalCount: number;
  page: number;
  limit: number;
}

export type QrTracSingleQrResponse = QrTracResponse<QrTracQr>;
export type QrTracPaginatedQrResponse = QrTracResponse<QrTracPaginatedData<QrTracQr>>;

/**
 * QR Code Design Template (GET /qr-templates-api)
 * Controls visual QR image appearance (colors, shape, frame), not business card layout.
 */
export interface QrTracTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  createdAt: number;
}

export type QrTracTemplatesResponse = QrTracResponse<QrTracTemplate[]>;

/**
 * Display ID availability check (GET /qrs-api/availability/{id})
 */
export interface QrTracAvailabilityData {
  success: boolean;
  data: string;
  message?: string;
}

/**
 * QRTRAC Scan Telemetry & Analytics Models (POST /analytics-api/overviews)
 */
export interface QrTracScanOverviewItem {
  id: string;
  totalScans: number;
  todayScans: number;
  yesterdayScans: number;
  totalLeadsCount?: number;
  leadsTodayCount?: number;
  leadsYesterdayCount?: number;
  createdAt: number;
  updatedAt: number;
  leadsUpdatedAt?: number;
  todayDate?: string;
  leadsTodayDate?: string;
}

export type QrTracOverviewAnalyticsResponse = QrTracResponse<QrTracScanOverviewItem[]>;

export interface QrTracScanEvent {
  qrId: string;
  scanTime: number;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  ipAddress?: string;
  referrer?: string;
}

export type QrTracScanEventsResponse = QrTracResponse<QrTracScanEvent[]>;

/**
 * Standard QRTRAC Error Response
 */
export interface QrTracErrorResponse {
  success: false;
  message: string;
}
