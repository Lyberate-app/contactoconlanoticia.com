/**
 * LYBERATE — COMMON API & PAGINATION TYPES
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: ApiErrorDetail;
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
}

