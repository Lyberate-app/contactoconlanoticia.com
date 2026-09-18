// ══════════════════════════════════════════════════════════
// Tipos — Usuarios, Autores y Roles
// ══════════════════════════════════════════════════════════

export type UserRole = 'superadmin' | 'admin' | 'editor' | 'author' | 'viewer'

export interface User {
  id: number
  uuid: string
  site_id: number
  email: string
  display_name: string
  slug: string | null
  bio: string | null
  avatar: import('./media').Media | null
  role: UserRole
  is_active: boolean
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

// Vista pública de un autor (sin datos sensibles)
export interface PublicAuthor {
  uuid: string
  display_name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  posts_count: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  expires_at: string
}

