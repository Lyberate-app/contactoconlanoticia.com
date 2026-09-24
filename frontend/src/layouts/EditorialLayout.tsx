import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Newspaper,
  FileText,
  PlusCircle,
  LogOut,
  Megaphone,
  Inbox,
  LayoutDashboard,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Compass,
  Building2,
  Sliders,
} from 'lucide-react';
import { authService, AuthUser } from '../services/auth';
import { useSettings } from '../context/SettingsContext';

interface EditorialLayoutProps {
  children?: React.ReactNode;
  activeTab?: 'dashboard' | 'articles' | 'new' | 'media' | 'ads' | 'submissions' | 'settings';
}

export const EditorialLayout: React.FC<EditorialLayoutProps> = ({ children, activeTab }) => {
  const { settings } = useSettings();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    authService.getMe().then((res) => {
      if (!isMounted) return;
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const getNavItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
      isActive
        ? 'bg-rose-900 text-white shadow-md shadow-rose-950/20'
        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/70'
    }`;

  const renderNavLinks = () => (
    <div className="space-y-6">
      {/* 1. PRINCIPAL */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3.5 block mb-2">
          Principal
        </span>
        <div className="space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              getNavItemClass(activeTab ? activeTab === 'dashboard' : isActive)
            }
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/articles/new"
            className={({ isActive }) =>
              getNavItemClass(activeTab ? activeTab === 'new' : isActive)
            }
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Redactar Noticia</span>
          </NavLink>
        </div>
      </div>

      {/* 2. CONTENIDO EDITORIAL */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3.5 block mb-2">
          Contenido Editorial
        </span>
        <div className="space-y-1">
          <NavLink
            to="/admin/articles"
            end
            className={({ isActive }) =>
              getNavItemClass(
                activeTab
                  ? activeTab === 'articles'
                  : isActive ||
                    location.pathname.startsWith('/admin/articles/edit') ||
                    (location.pathname.startsWith('/admin/articles/') && location.pathname !== '/admin/articles/new')
              )
            }
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Artículos & Notas</span>
          </NavLink>
          <NavLink
            to="/admin/media"
            className={({ isActive }) =>
              getNavItemClass(activeTab ? activeTab === 'media' : isActive)
            }
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>Biblioteca Multimedia</span>
          </NavLink>
        </div>
      </div>

      {/* 3. COMERCIAL & FINANZAS */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3.5 block mb-2">
          Comercial & Ads
        </span>
        <div className="space-y-1">
          <NavLink
            to="/admin/ads"
            className={({ isActive }) =>
              getNavItemClass(activeTab ? activeTab === 'ads' : isActive)
            }
          >
            <Megaphone className="w-4 h-4 shrink-0" />
            <span>Campañas Publicitarias</span>
          </NavLink>
        </div>
      </div>

      {/* 4. AUDIENCIA & CIUDADANÍA */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3.5 block mb-2">
          Crecimiento & Comunidad
        </span>
        <div className="space-y-1">
          <NavLink
            to="/admin/submissions"
            className={({ isActive }) =>
              getNavItemClass(activeTab ? activeTab === 'submissions' : isActive)
            }
          >
            <Inbox className="w-4 h-4 shrink-0" />
            <span>Buzón Ciudadano</span>
          </NavLink>
        </div>
      </div>

      {/* 5. SISTEMA */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3.5 block mb-2">
          Sistema & Salida
        </span>
        <div className="space-y-1">
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              getNavItemClass(activeTab ? activeTab === 'settings' : isActive)
            }
          >
            <Sliders className="w-4 h-4 shrink-0 text-rose-800" />
            <span>Marca Blanca & Sistema</span>
          </NavLink>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-950 hover:bg-stone-100/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 shrink-0 text-stone-500" />
              <span>Ver Portal Público</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] ambient-glow-mesh flex flex-col lg:flex-row font-sans text-stone-900 relative">
      {/* Mobile Top Bar */}
      <header className="lg:hidden glass-panel border-b border-white/60 sticky top-0 z-40 px-4 h-16 flex items-center justify-between shadow-xs">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div
            style={{ backgroundColor: settings.colors.primary }}
            className="w-9 h-9 rounded-2xl text-white flex items-center justify-center font-serif font-black text-sm shadow-sm"
          >
            {settings.identity.shortName.charAt(0) || 'L'}
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-stone-950 block leading-tight truncate max-w-[170px]">
              {settings.identity.siteName}
            </span>
            <span className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">Panel Editorial</span>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-stone-600 focus:outline-none"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-stone-950/40 backdrop-blur-md z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-72 glass-panel z-50 p-5 shadow-2xl transition-transform duration-300 overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: settings.colors.primary }}
              className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-serif font-black text-sm"
            >
              {settings.identity.shortName.charAt(0) || 'L'}
            </div>
            <div>
              <span className="font-serif font-bold text-sm text-stone-950 block truncate max-w-[150px]">
                {settings.identity.siteName}
              </span>
              <span className="text-[10px] text-stone-500">Redacción Central</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edition pill */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 mb-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-800" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-bold">Edición</span>
              <span className="font-semibold text-stone-800">{settings.identity.centralLocation}</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        </div>

        {renderNavLinks()}
      </div>

      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 glass-panel border-r border-white/60 sticky top-0 h-screen p-5 shrink-0 z-30 shadow-xs">
        {/* User / Brand Profile Card */}
        <div className="flex items-center justify-between pb-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: settings.colors.primary }}
              className="w-10 h-10 rounded-full text-white flex items-center justify-center font-serif font-black text-base shadow-sm"
            >
              {settings.identity.shortName.charAt(0) || 'L'}
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-950 leading-tight">
                {user?.name || 'Redacción Central'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {user?.roles[0] || 'ADMINISTRADOR'}
              </span>
            </div>
          </div>
          <Link
            to="/admin"
            className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
            title="Ir al inicio"
          >
            <Newspaper className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Sede / Edición Selector Box */}
        <div className="mt-4 bg-stone-50/80 border border-stone-200/70 hover:border-stone-300 rounded-2xl p-3 flex items-center justify-between transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/60 shadow-2xs flex items-center justify-center text-rose-800">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-bold">Sede / Edición</span>
              <span className="font-semibold text-xs text-stone-900">{settings.identity.centralLocation}</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 mt-6 overflow-y-auto pr-1">
          {renderNavLinks()}
        </nav>

        {/* Footer info & system badge */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>Lyberate v2.1</span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full font-bold">
            Modo Local
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
