import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'
import type { SitePublicSettings } from '@portal/shared-types'

interface FooterProps {
  settings: SitePublicSettings | null
}

export function Footer({ settings }: FooterProps) {
  const siteName = settings?.name ?? 'Portal de Noticias'
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      {/* Footer main */}
      <div className="container-editorial py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Columna 1 — Identidad */}
          <div className="space-y-4">
            {settings?.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={siteName}
                width={140}
                height={42}
                className="h-10 w-auto brightness-0 invert opacity-90"
              />
            ) : (
              <span className="text-xl font-serif font-bold text-white">{siteName}</span>
            )}
            {settings?.description && (
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                {settings.description}
              </p>
            )}
            {/* Redes sociales */}
            <div className="flex items-center gap-3 pt-2">
              {settings?.social_facebook && (
                <SocialLink href={settings.social_facebook} label="Facebook">
                  <Facebook className="w-4 h-4" />
                </SocialLink>
              )}
              {settings?.social_twitter && (
                <SocialLink href={settings.social_twitter} label="Twitter / X">
                  <Twitter className="w-4 h-4" />
                </SocialLink>
              )}
              {settings?.social_instagram && (
                <SocialLink href={settings.social_instagram} label="Instagram">
                  <Instagram className="w-4 h-4" />
                </SocialLink>
              )}
              {settings?.social_youtube && (
                <SocialLink href={settings.social_youtube} label="YouTube">
                  <Youtube className="w-4 h-4" />
                </SocialLink>
              )}
            </div>
          </div>

          {/* Columna 2 — Categorías */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Secciones
            </h3>
            <ul className="space-y-2">
              {(settings?.nav_items ?? []).slice(0, 6).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 — Contacto */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {settings?.contact_email && (
                <li>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="hover:text-white transition-colors"
                  >
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings?.contact_phone && (
                <li>
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="hover:text-white transition-colors"
                  >
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings?.contact_address && (
                <li className="text-gray-500">{settings.contact_address}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="border-t border-gray-800">
        <div className="container-editorial py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {year} {siteName}. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/politica-de-privacidad" className="hover:text-gray-300 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-gray-300 transition-colors">
              Términos
            </Link>
            <Link href="/rss" className="hover:text-gray-300 transition-colors">
              RSS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 
                 hover:text-white transition-colors"
    >
      {children}
    </a>
  )
}

