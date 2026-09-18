import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ── Utilidad para clases CSS condicionales ─────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── URL absoluta para SSR ─────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// ── Tiempo de lectura formateado ──────────────────────────
export function formatReadingTime(minutes: number | null | undefined): string {
  if (!minutes) return ''
  return `${minutes} min de lectura`
}

// ── Formato de fecha para noticias ────────────────────────
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(dateString))
}

export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  return formatDate(dateString)
}

// ── Truncar texto ─────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

// ── Slug desde título ─────────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remover tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── URL de imagen con fallback ────────────────────────────
export function getImageUrl(
  conversions: Record<string, { url: string } | undefined> | undefined,
  size: 'thumbnail' | 'card' | 'medium' | 'large' | 'hero' | 'og',
  fallback: string
): string {
  return conversions?.[size]?.url ?? fallback
}

