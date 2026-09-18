// ══════════════════════════════════════════════════════════
// Tipos — Configuración del Sitio
// ══════════════════════════════════════════════════════════

export interface SitePublicSettings {
  name: string
  description: string
  url: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string

  // Redes sociales
  social_twitter: string | null
  social_facebook: string | null
  social_instagram: string | null
  social_youtube: string | null
  social_tiktok: string | null

  // SEO Global
  seo_title_separator: string  // ' | ' o ' - '
  seo_default_description: string | null
  og_default_image_url: string | null

  // Contacto
  contact_email: string | null
  contact_phone: string | null
  contact_address: string | null

  // Navegación (menú principal)
  nav_items: NavItem[]
}

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

// ──────────────────────────────────────
// Tipos — Anuncios
// ──────────────────────────────────────
export type AdType = 'image' | 'code' | 'adsense'

export interface Ad {
  id: number
  uuid: string
  slot: string     // 'header_banner', 'sidebar_top', etc.
  type: AdType
  content: string | null   // HTML embed para type='code'/'adsense'
  image_url: string | null
  link_url: string | null
  is_active: boolean
}

// ──────────────────────────────────────
// Tipos — Redirecciones
// ──────────────────────────────────────
export interface Redirect {
  id: number
  site_id: number
  from_path: string
  to_path: string
  http_code: 301 | 302
  hits_count: number
  is_active: boolean
  created_at: string
}

