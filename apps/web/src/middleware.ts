// ══════════════════════════════════════════════════════════
// Middleware Next.js — Redirecciones 301 dinámicas
// ══════════════════════════════════════════════════════════
// Este middleware consulta la API para redirecciones WP legacy
// antes de que Next.js procese la ruta.

import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

// Rutas que nunca deben procesarse por el middleware
const SKIP_PATHS = [
  '/_next/',
  '/api/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/sw.js',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip rutas internas de Next.js y assets
  if (SKIP_PATHS.some((skip) => pathname.startsWith(skip))) {
    return NextResponse.next()
  }

  // Solo buscar redirecciones para rutas que no sean del sistema
  try {
    // Fetch rápido con cache corto para no penalizar cada request
    const res = await fetch(
      `${API_URL}/redirects/check?path=${encodeURIComponent(pathname)}`,
      {
        method: 'GET',
        next: { revalidate: 300 }, // 5 minutos
      }
    )

    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data?.redirect_to) {
        const { redirect_to, http_code } = data.data
        return NextResponse.redirect(
          new URL(redirect_to, request.url),
          { status: http_code ?? 301 }
        )
      }
    }
  } catch {
    // Si la API no responde, continuar normalmente
    // No bloquear el sitio por un fallo en redirecciones
  }

  return NextResponse.next()
}

export const config = {
  // Aplicar el middleware a todas las rutas excepto las internas
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)',
  ],
}

