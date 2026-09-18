import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import './globals.css'
import { getSiteSettings } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Providers } from './providers'

// ── Fuentes ───────────────────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const merriweather = Merriweather({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
})

// ── Metadata global ───────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings()
    return {
      metadataBase: new URL(settings.url),
      title: {
        default: settings.name,
        template: `%s ${settings.seo_title_separator ?? '|'} ${settings.name}`,
      },
      description: settings.seo_default_description ?? settings.description,
      openGraph: {
        type: 'website',
        siteName: settings.name,
        images: settings.og_default_image_url
          ? [{ url: settings.og_default_image_url, width: 1200, height: 630 }]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        site: settings.social_twitter ?? undefined,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      },
    }
  } catch {
    return {
      title: {
        default: 'Portal de Noticias',
        template: '%s | Portal de Noticias',
      },
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let settings = null
  try {
    settings = await getSiteSettings()
  } catch {
    // Si la API no responde, renderizar con defaults
  }

  return (
    <html
      lang="es"
      className={`${inter.variable} ${merriweather.variable}`}
    >
      <head>
        {/* Brand colors como CSS variables */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-brand-50: #eff6ff;
              --color-brand-100: #dbeafe;
              --color-brand-500: #3b82f6;
              --color-brand-600: #2563eb;
              --color-brand-700: #1d4ed8;
              --color-brand-900: #1e3a8a;
            }
          `
        }} />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={settings?.primary_color ?? '#1e3a8a'} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header settings={settings} />
            <main className="flex-1">
              {children}
            </main>
            <Footer settings={settings} />
          </div>
        </Providers>
      </body>
    </html>
  )
}

