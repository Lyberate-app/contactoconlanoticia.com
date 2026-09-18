import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Image,
  FolderOpen,
  Tag,
  Users,
  BarChart2,
  Settings,
  ArrowLeftRight,
  Megaphone,
  LogOut,
  ChevronRight,
  Newspaper,
} from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/noticias', icon: FileText, label: 'Noticias' },
  { to: '/media', icon: Image, label: 'Multimedia' },
  { to: '/categorias', icon: FolderOpen, label: 'Categorías' },
  { to: '/etiquetas', icon: Tag, label: 'Etiquetas' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/anuncios', icon: Megaphone, label: 'Anuncios' },
  { to: '/analitica', icon: BarChart2, label: 'Analítica' },
  { to: '/redirecciones', icon: ArrowLeftRight, label: 'Redirecciones' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="w-64 bg-gray-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Portal Editorial</p>
              <p className="text-gray-500 text-xs">Panel de administración</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 group cursor-pointer"
               onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.display_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.display_name}</p>
              <p className="text-gray-500 text-xs truncate capitalize">{user?.role}</p>
            </div>
            <LogOut className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0" />
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ───────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <Breadcrumbs />
          <div className="flex items-center gap-3">
            <a
              href={import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              Ver sitio
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Outlet — página activa */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ── Breadcrumbs dinámicos ─────────────────────────────────
function Breadcrumbs() {
  // Implementación simple — mejorable con react-router hooks
  return (
    <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-sm text-gray-500">
      <span className="text-gray-800 font-medium">Portal Editorial</span>
    </nav>
  )
}

