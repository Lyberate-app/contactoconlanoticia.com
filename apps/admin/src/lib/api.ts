// ══════════════════════════════════════════════════════════
// Cliente API del Admin — Axios con interceptors
// ══════════════════════════════════════════════════════════
import axios, { type AxiosError } from 'axios'
import type {
  ApiResponse,
  ApiErrorResponse,
  Post,
  PostPayload,
  PostsQueryParams,
  PostSummary,
  Category,
  Tag,
  Media,
  MediaUploadPayload,
  User,
  AuthResponse,
  LoginPayload,
  SitePublicSettings,
  Redirect,
  Pagination,
} from '@portal/shared-types'

// ── Instancia Axios ───────────────────────────────────────

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // para Sanctum cookie
})

// ── Request interceptor: agregar token ───────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: manejo global de errores ───────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Token expirado — limpiar y redirigir al login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Helper para extraer error ─────────────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined
    return data?.error?.message ?? error.message ?? 'Error desconocido'
  }
  return 'Error desconocido'
}

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload)
    return data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me')
    return data.data
  },
}

// ══════════════════════════════════════════════════════════
// POSTS
// ══════════════════════════════════════════════════════════

interface PaginatedResult<T> {
  items: T[]
  pagination: Pagination
}

export const postsApi = {
  list: async (params: PostsQueryParams = {}): Promise<PaginatedResult<PostSummary>> => {
    const { data } = await apiClient.get<ApiResponse<PostSummary[]>>('/admin/posts', {
      params,
    })
    return {
      items: data.data,
      pagination: (data.meta as { pagination: Pagination }).pagination,
    }
  },

  get: async (id: number): Promise<Post> => {
    const { data } = await apiClient.get<ApiResponse<Post>>(`/admin/posts/${id}`)
    return data.data
  },

  create: async (payload: PostPayload): Promise<Post> => {
    const { data } = await apiClient.post<ApiResponse<Post>>('/admin/posts', payload)
    return data.data
  },

  update: async (id: number, payload: Partial<PostPayload>): Promise<Post> => {
    const { data } = await apiClient.put<ApiResponse<Post>>(`/admin/posts/${id}`, payload)
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/posts/${id}`)
  },

  publish: async (id: number): Promise<Post> => {
    const { data } = await apiClient.post<ApiResponse<Post>>(`/admin/posts/${id}/publish`)
    return data.data
  },

  unpublish: async (id: number): Promise<Post> => {
    const { data } = await apiClient.post<ApiResponse<Post>>(`/admin/posts/${id}/unpublish`)
    return data.data
  },

  schedule: async (id: number, scheduledAt: string): Promise<Post> => {
    const { data } = await apiClient.post<ApiResponse<Post>>(
      `/admin/posts/${id}/schedule`,
      { scheduled_at: scheduledAt }
    )
    return data.data
  },

  duplicate: async (id: number): Promise<Post> => {
    const { data } = await apiClient.post<ApiResponse<Post>>(`/admin/posts/${id}/duplicate`)
    return data.data
  },
}

// ══════════════════════════════════════════════════════════
// MEDIA
// ══════════════════════════════════════════════════════════

export const mediaApi = {
  list: async (params: { page?: number; per_page?: number; search?: string } = {}): Promise<PaginatedResult<Media>> => {
    const { data } = await apiClient.get<ApiResponse<Media[]>>('/admin/media', { params })
    return {
      items: data.data,
      pagination: (data.meta as { pagination: Pagination }).pagination,
    }
  },

  upload: async (payload: MediaUploadPayload): Promise<Media> => {
    const formData = new FormData()
    formData.append('file', payload.file)
    if (payload.alt_text) formData.append('alt_text', payload.alt_text)
    if (payload.caption) formData.append('caption', payload.caption)
    if (payload.photographer) formData.append('photographer', payload.photographer)

    const { data } = await apiClient.post<ApiResponse<Media>>('/admin/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  update: async (id: number, payload: Partial<MediaUploadPayload>): Promise<Media> => {
    const { data } = await apiClient.put<ApiResponse<Media>>(`/admin/media/${id}`, payload)
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/media/${id}`)
  },
}

// ══════════════════════════════════════════════════════════
// CATEGORÍAS, TAGS, USUARIOS, SETTINGS, REDIRECTS
// ══════════════════════════════════════════════════════════

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/admin/categories')
    return data.data
  },
  create: async (payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.post<ApiResponse<Category>>('/admin/categories', payload)
    return data.data
  },
  update: async (id: number, payload: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, payload)
    return data.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`)
  },
}

export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const { data } = await apiClient.get<ApiResponse<Tag[]>>('/admin/tags')
    return data.data
  },
  create: async (payload: Partial<Tag>): Promise<Tag> => {
    const { data } = await apiClient.post<ApiResponse<Tag>>('/admin/tags', payload)
    return data.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/tags/${id}`)
  },
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<ApiResponse<User[]>>('/admin/users')
    return data.data
  },
  create: async (payload: Partial<User> & { password: string }): Promise<User> => {
    const { data } = await apiClient.post<ApiResponse<User>>('/admin/users', payload)
    return data.data
  },
  update: async (id: number, payload: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, payload)
    return data.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`)
  },
}

export const settingsApi = {
  get: async (): Promise<SitePublicSettings> => {
    const { data } = await apiClient.get<ApiResponse<SitePublicSettings>>('/admin/settings')
    return data.data
  },
  update: async (payload: Partial<SitePublicSettings>): Promise<SitePublicSettings> => {
    const { data } = await apiClient.put<ApiResponse<SitePublicSettings>>('/admin/settings', payload)
    return data.data
  },
}

export const redirectsApi = {
  list: async (): Promise<Redirect[]> => {
    const { data } = await apiClient.get<ApiResponse<Redirect[]>>('/admin/redirects')
    return data.data
  },
  create: async (payload: Omit<Redirect, 'id' | 'site_id' | 'hits_count' | 'created_at'>): Promise<Redirect> => {
    const { data } = await apiClient.post<ApiResponse<Redirect>>('/admin/redirects', payload)
    return data.data
  },
  update: async (id: number, payload: Partial<Redirect>): Promise<Redirect> => {
    const { data } = await apiClient.put<ApiResponse<Redirect>>(`/admin/redirects/${id}`, payload)
    return data.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/redirects/${id}`)
  },
}

export const adsApi = {
  list: async (): Promise<Ad[]> => {
    const { data } = await apiClient.get<ApiResponse<Ad[]>>('/admin/ads')
    return data.data
  },
  create: async (payload: Partial<Ad>): Promise<Ad> => {
    const { data } = await apiClient.post<ApiResponse<Ad>>('/admin/ads', payload)
    return data.data
  },
  update: async (id: number, payload: Partial<Ad>): Promise<Ad> => {
    const { data } = await apiClient.put<ApiResponse<Ad>>(`/admin/ads/${id}`, payload)
    return data.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/ads/${id}`)
  },
}

export interface AnalyticsOverview {
  today_views: number
  week_views: number
  month_views: number
  total_posts: number
  top_posts: Array<{ id: number; title: string; views_count: number; slug: string }>
  views_by_day: Array<{ date: string; views: number }>
}

export const analyticsApi = {
  overview: async (): Promise<AnalyticsOverview> => {
    const { data } = await apiClient.get<ApiResponse<AnalyticsOverview>>('/admin/analytics/overview')
    return data.data
  },
  posts: async (): Promise<Array<{ id: number; title: string; views_count: number; slug: string }>> => {
    const { data } = await apiClient.get<ApiResponse<Array<{ id: number; title: string; views_count: number; slug: string }>>>('/admin/analytics/posts')
    return data.data
  },
}

export default apiClient
