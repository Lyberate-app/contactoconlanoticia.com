// ══════════════════════════════════════════════════════════
// Tipos — Posts / Noticias
// ══════════════════════════════════════════════════════════

import type { Media } from './media'
import type { PublicAuthor, User } from './users'
import type { Category, Tag } from './taxonomy'

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type ContentFormat = 'html' | 'tiptap_json'
export type SchemaType = 'Article' | 'NewsArticle' | 'BlogPosting'

// ──────────────────────────────────────
// Post completo (admin + lectura interna)
// ──────────────────────────────────────
export interface Post {
  id: number
  uuid: string
  site_id: number

  author: User | PublicAuthor
  category: Category | null
  cover: Media | null
  og_image: Media | null
  tags: Tag[]

  // Contenido
  title: string
  subtitle: string | null
  slug: string
  excerpt: string | null
  content: string          // HTML o JSON serializado de Tiptap
  content_format: ContentFormat

  // Estado
  status: PostStatus
  published_at: string | null
  scheduled_at: string | null
  is_featured: boolean
  is_breaking: boolean
  allow_comments: boolean

  // SEO
  seo_title: string | null
  seo_description: string | null
  seo_canonical: string | null
  og_title: string | null
  og_description: string | null
  seo_no_index: boolean
  schema_type: SchemaType

  // Métricas
  views_count: number
  reading_time_minutes: number | null

  // Legado WordPress
  legacy_source: string | null
  legacy_id: string | null
  legacy_url: string | null

  created_at: string
  updated_at: string
}

// ──────────────────────────────────────
// Vista resumida para listados/cards
// ──────────────────────────────────────
export interface PostSummary {
  uuid: string
  title: string
  subtitle: string | null
  slug: string
  excerpt: string | null
  cover_url: string | null
  cover_alt: string | null
  category: Pick<Category, 'name' | 'slug'> | null
  author: Pick<PublicAuthor, 'display_name' | 'slug'>
  tags: Pick<Tag, 'name' | 'slug'>[]
  published_at: string
  reading_time_minutes: number | null
  is_featured: boolean
  is_breaking: boolean
}

// ──────────────────────────────────────
// Payload para crear/editar un post
// ──────────────────────────────────────
export interface PostPayload {
  title: string
  subtitle?: string | null
  slug?: string
  excerpt?: string | null
  content: string
  content_format?: ContentFormat
  author_id: number
  category_id?: number | null
  cover_media_id?: number | null
  tag_ids?: number[]
  status?: PostStatus
  published_at?: string | null
  scheduled_at?: string | null
  is_featured?: boolean
  is_breaking?: boolean
  allow_comments?: boolean

  // SEO
  seo_title?: string | null
  seo_description?: string | null
  seo_canonical?: string | null
  og_title?: string | null
  og_description?: string | null
  og_image_media_id?: number | null
  seo_no_index?: boolean
  schema_type?: SchemaType
}

// ──────────────────────────────────────
// Parámetros de búsqueda/filtrado
// ──────────────────────────────────────
export interface PostsQueryParams {
  page?: number
  per_page?: number
  status?: PostStatus | PostStatus[]
  category_slug?: string
  tag_slug?: string
  author_slug?: string
  q?: string
  is_featured?: boolean
  is_breaking?: boolean
  order_by?: 'published_at' | 'updated_at' | 'views_count'
  order?: 'asc' | 'desc'
}

