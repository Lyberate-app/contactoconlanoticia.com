// ══════════════════════════════════════════════════════════
// Cliente API — Frontend Público (Next.js)
// ══════════════════════════════════════════════════════════

import type {
  ApiResponse,
  Post,
  PostSummary,
  PostsQueryParams,
  Category,
  PublicAuthor,
  Tag,
  SitePublicSettings,
  Ad,
  Pagination,
} from '@portal/shared-types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

// ── Tipos internos del cliente ────────────────────────────

interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Fetcher base ──────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  // revalidate: false = no cache (on-demand), number = segundos de ISR
  revalidate: number | false = 60
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    // Next.js 15 data cache
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  })

  const json = await res.json()

  if (!json.success) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? 'Error desconocido',
      res.status
    )
  }

  return json as T
}

// ── Parámetros de query a string ──────────────────────────

function toQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => qs.append(`${key}[]`, String(v)))
      } else {
        qs.set(key, String(value))
      }
    }
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}

// ══════════════════════════════════════════════════════════
// POSTS
// ══════════════════════════════════════════════════════════

export async function getPosts(
  params: PostsQueryParams = {}
): Promise<PaginatedResponse<PostSummary>> {
  const qs = toQueryString(params as Record<string, unknown>)
  const res = await apiFetch<ApiResponse<PostSummary[]> & { meta: { pagination: Pagination } }>(
    `/posts${qs}`,
    {},
    30 // revalidar cada 30 segundos
  )
  return {
    items: res.data ?? [],
    pagination: res.meta?.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: res.data?.length ?? 0,
    },
  }
}

export async function getPost(slug: string): Promise<Post> {
  const res = await apiFetch<ApiResponse<Post>>(`/posts/${slug}`, {}, 60)
  return res.data
}

export async function getFeaturedPosts(): Promise<PostSummary[]> {
  const res = await apiFetch<ApiResponse<PostSummary[]>>('/posts/featured', {}, 60)
  return res.data
}

export async function getBreakingPosts(): Promise<PostSummary[]> {
  const res = await apiFetch<ApiResponse<PostSummary[]>>('/posts/breaking', {}, 30)
  return res.data
}

// ══════════════════════════════════════════════════════════
// CATEGORÍAS
// ══════════════════════════════════════════════════════════

export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch<ApiResponse<Category[]>>('/categories', {}, 300)
  return res.data
}

export async function getCategoryPosts(
  categorySlug: string,
  params: Pick<PostsQueryParams, 'page' | 'per_page'> = {}
): Promise<PaginatedResponse<PostSummary>> {
  const qs = toQueryString(params as Record<string, unknown>)
  const res = await apiFetch<ApiResponse<PostSummary[]> & { meta: { pagination: Pagination } }>(
    `/categories/${categorySlug}/posts${qs}`,
    {},
    30
  )
  return {
    items: res.data ?? [],
    pagination: res.meta?.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: res.data?.length ?? 0,
    },
  }
}

// ══════════════════════════════════════════════════════════
// AUTORES
// ══════════════════════════════════════════════════════════

export async function getAuthor(slug: string): Promise<PublicAuthor> {
  const res = await apiFetch<ApiResponse<PublicAuthor>>(`/authors/${slug}`, {}, 300)
  return res.data
}

export async function getAuthorPosts(
  slug: string,
  params: Pick<PostsQueryParams, 'page' | 'per_page'> = {}
): Promise<PaginatedResponse<PostSummary>> {
  const qs = toQueryString(params as Record<string, unknown>)
  const res = await apiFetch<ApiResponse<PostSummary[]> & { meta: { pagination: Pagination } }>(
    `/authors/${slug}/posts${qs}`,
    {},
    60
  )
  return {
    items: res.data ?? [],
    pagination: res.meta?.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: res.data?.length ?? 0,
    },
  }
}

// ══════════════════════════════════════════════════════════
// BÚSQUEDA
// ══════════════════════════════════════════════════════════

export async function searchPosts(
  query: string,
  params: Partial<PostsQueryParams> = {}
): Promise<PaginatedResponse<PostSummary>> {
  const qs = toQueryString({ q: query, ...params } as Record<string, unknown>)
  const res = await apiFetch<ApiResponse<PostSummary[]> & { meta: { pagination: Pagination } }>(
    `/search${qs}`,
    {},
    false // búsqueda nunca cacheada
  )
  return {
    items: res.data ?? [],
    pagination: res.meta?.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: res.data?.length ?? 0,
    },
  }
}

// ══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ══════════════════════════════════════════════════════════

export async function getSiteSettings(): Promise<SitePublicSettings> {
  const res = await apiFetch<ApiResponse<SitePublicSettings>>('/settings/public', {}, 600)
  return res.data
}

export async function getAdForSlot(slot: string): Promise<Ad | null> {
  try {
    const res = await apiFetch<ApiResponse<Ad>>(`/ads/${slot}`, {}, 300)
    return res.data
  } catch {
    return null
  }
}

// ══════════════════════════════════════════════════════════
// SITEMAP (para generación dinámica)
// ══════════════════════════════════════════════════════════

export async function getAllPostSlugs(): Promise<Array<{
  slug: string
  category_slug: string
  updated_at: string
}>> {
  const res = await apiFetch<ApiResponse<Array<{ slug: string; category_slug: string; updated_at: string }>>>(
    '/sitemap',
    {},
    false
  )
  return res.data
}

// Re-exportar error
export { ApiError }

