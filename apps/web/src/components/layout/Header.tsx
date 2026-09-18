import Link from 'next/link'
import Image from 'next/image'
import { Menu, Search, X } from 'lucide-react'
import type { SitePublicSettings, NavItem } from '@portal/shared-types'
import { BreakingTicker } from './BreakingTicker'

interface HeaderProps {
  settings: SitePublicSettings | null
}

export function Header({ settings }: HeaderProps) {
  const siteName = settings?.name ?? 'Portal de Noticias'
  const navItems = settings?.nav_items ?? []

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      {/* Ticker de noticias de última hora */}
      <BreakingTicker />

      {/* Header principal */}
      <div className="container-editorial">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo / Nombre */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {settings?.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={siteName}
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            ) : (
              <span className="text-xl font-serif font-bold text-gray-900 hover:text-brand-600 transition-colors">
                {siteName}
              </span>
            )}
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {/* Búsqueda */}
            <Link
              href="/buscar"
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Buscar noticias"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Menú móvil — funciona sin JS con CSS */}
            <label
              htmlFor="mobile-menu-toggle"
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </label>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      <input type="checkbox" id="mobile-menu-toggle" className="sr-only peer" />
      <nav
        className="peer-checked:block hidden border-t border-gray-200 bg-white md:hidden"
        aria-label="Navegación móvil"
      >
        <div className="container-editorial py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2.5 rounded-md text-base font-medium text-gray-700 
                         hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
                 hover:text-gray-900 hover:bg-gray-50 transition-colors"
    >
      {item.label}
    </Link>
  )
}

