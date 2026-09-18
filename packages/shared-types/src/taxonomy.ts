// ══════════════════════════════════════════════════════════
// Tipos — Categorías y Tags
// ══════════════════════════════════════════════════════════

export interface Category {
  id: number
  uuid: string
  site_id: number
  parent_id: number | null
  parent?: Category | null
  children?: Category[]

  name: string
  slug: string
  description: string | null
  cover?: import('./media').Media | null

  meta_title: string | null
  meta_description: string | null
  sort_order: number
  is_active: boolean

  posts_count?: number

  legacy_id: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  uuid: string
  site_id: number

  name: string
  slug: string
  description: string | null

  posts_count?: number

  legacy_id: string | null
  created_at: string
  updated_at: string
}

