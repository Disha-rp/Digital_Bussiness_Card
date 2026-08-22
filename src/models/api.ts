/**
 * Generic API & Error Abstraction Models
 */

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export type ApiErrorType =
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'FORBIDDEN_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiError {
  type: ApiErrorType;
  statusCode?: number;
  message: string;
  details?: unknown;
  retryAfterSeconds?: number;
  isRetryable: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
}
