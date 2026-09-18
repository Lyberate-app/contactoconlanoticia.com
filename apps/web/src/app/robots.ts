import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/install',
          '/_next/',
          '/buscar?',  // No indexar resultados de búsqueda
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

