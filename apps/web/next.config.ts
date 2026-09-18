import type { NextConfig } from 'next'

const config: NextConfig = {
  // ── Strict Mode ─────────────────────────────────────────
  reactStrictMode: true,

  // ── Imágenes ────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      // Agregar dominio de R2/S3 en producción
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 300],
  },

  // ── Headers de seguridad ─────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Cache headers para assets estáticos
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // ── Redirecciones ────────────────────────────────────────
  // Las redirecciones dinámicas se manejan en middleware.ts
  // consultando la tabla redirects de la BD via API.
  async redirects() {
    return []
  },

  // ── Experimental ─────────────────────────────────────────
  experimental: {
    // Optimizaciones de Next.js 15
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },

  // ── Output ───────────────────────────────────────────────
  // 'standalone' para deployment en Docker/servidor
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
}

export default config

