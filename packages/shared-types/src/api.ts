// ══════════════════════════════════════════════════════════
// Tipos API — Contrato de respuesta estándar
// ══════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
  success: true
  data: T
  meta?: ApiMeta
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface ApiMeta {
  pagination?: Pagination
  [key: string]: unknown
}

export interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse

