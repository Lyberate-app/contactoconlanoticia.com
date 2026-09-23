/**
 * LYBERATE — CENTRALIZED HTTP CLIENT
 *
 * Core HTTP client for all API interactions under /api/v1/
 *
 * SECURITY INVARIANT:
 * Authentication operates exclusively via secure server-side HttpOnly cookies.
 * credentials: 'include' is enforced by default.
 * NEVER store or transmit tokens via localStorage/sessionStorage.
 */

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(
    message: string,
    code: string = 'API_ERROR',
    status: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

import type { ApiResponse, ApiErrorDetail } from '../types/api';
export type { ApiResponse, ApiErrorDetail };

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

const DEFAULT_API_PREFIX = '/api/v1';

/**
 * Builds a normalized URL ensuring /api/v1 prefix and appending query parameters.
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  let path = endpoint.trim();

  // If path doesn't start with /api/v1 and is relative, prefix it
  if (!path.startsWith('/api/v1')) {
    path = path.startsWith('/') ? `${DEFAULT_API_PREFIX}${path}` : `${DEFAULT_API_PREFIX}/${path}`;
  }

  if (!params) {
    return path;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Generic request executor with standardized error handling and JSON parsing.
 */
async function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint, options.params);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isFormData) {
      requestBody = body as FormData;
      // Let browser set multipart boundary header automatically
      delete headers['Content-Type'];
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: options.credentials || 'include',
      body: requestBody,
      signal: options.signal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error de conexión de red';
    throw new ApiError(message, 'NETWORK_ERROR', 0);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { success: true, data: undefined as unknown as T };
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      `Respuesta no válida del servidor (${response.status})`,
      'INVALID_RESPONSE',
      response.status
    );
  }

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Error del servidor (${response.status})`;
    const errorCode = json.error?.code || (response.status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');
    throw new ApiError(errorMsg, errorCode, response.status, json.error?.details);
  }

  return json;
}

export const apiClient = {
  /**
   * Performs a GET request.
   */
  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('GET', endpoint, undefined, options);
  },

  /**
   * Performs a GET request and directly returns data.
   */
  async getData<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    const res = await request<T>('GET', endpoint, undefined, options);
    return res.data;
  },

  /**
   * Performs a POST request.
   */
  async post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('POST', endpoint, body, options);
  },

  /**
   * Performs a PUT request.
   */
  async put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('PUT', endpoint, body, options);
  },

  /**
   * Performs a PATCH request.
   */
  async patch<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('PATCH', endpoint, body, options);
  },

  /**
   * Performs a DELETE request.
   */
  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('DELETE', endpoint, undefined, options);
  },
};
