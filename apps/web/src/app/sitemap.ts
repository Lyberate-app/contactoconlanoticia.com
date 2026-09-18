import type { MetadataRoute } from 'next'
import { getAllPostSlugs, getCategories } from '@/lib/api'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString()

  // ── Páginas estáticas ─────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${BASE_URL}/buscar`, lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
  ]

  // ── Categorías ────────────────────────────────────────
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categories = await getCategories()
    categoryPages = categories.map((cat) => ({
      url: `${BASE_URL}/categoria/${cat.slug}`,
      lastModified: cat.updated_at,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  } catch {}

  // ── Posts publicados ──────────────────────────────────
  let postPages: MetadataRoute.Sitemap = []
  try {
    const slugs = await getAllPostSlugs()
    postPages = slugs.map((item) => ({
      url: `${BASE_URL}/${item.category_slug}/${item.slug}`,
      lastModified: item.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {}

  return [...staticPages, ...categoryPages, ...postPages]
}

