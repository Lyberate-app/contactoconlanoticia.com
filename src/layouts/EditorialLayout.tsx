import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Inbox,
  Settings,
  Building2,
  Store,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { authService, AuthUser } from '../services/auth';
import { useSettings } from '../context/SettingsContext';

interface EditorialLayoutProps {
  children?: React.ReactNode;
  activeTab?: 'dashboard' | 'articles' | 'new' | 'media' | 'ads' | 'submissions' | 'settings';
}

interface NavItemDef {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  isActiveOverride?: boolean;
}

interface NavSectionDef {
  title: string;
  items: NavItemDef[];
}

export const EditorialLayout: React.FC<EditorialLayoutProps> = ({ children, activeTab }) => {
  const { settings } = useSettings();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editorial_sidebar_collapsed');
      return saved !== null ? saved === 'true' : false;
    }
    return false;
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    authService
      .getMe()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('editorial_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const brandColor = settings?.colors?.primary || '#9e3d60';

  const navSections: NavSectionDef[] = [
    {
      title: 'Principal',
      items: [
        {
          to: '/admin',
          icon: LayoutDashboard,
          label: 'Dashboard',
          end: true,
          isActiveOverride: activeTab ? activeTab === 'dashboard' : undefined,
        },
        {
          to: '/admin/articles/new',
          icon: PlusCircle,
          label: 'Redactar Noticia',
          isActiveOverride: activeTab ? activeTab === 'new' : undefined,
        },
      ],
    },
    {
      title: 'Catálogo & Contenido',
      items: [
        {
          to: '/admin/articles',
          icon: FileText,
          label: 'Artículos & Notas',
          end: true,
          isActiveOverride: activeTab
            ? activeTab === 'articles'
            : location.pathname.startsWith('/admin/articles/edit') ||
              (location.pathname.startsWith('/admin/articles/') && location.pathname !== '/admin/articles/new'),
        },
        {
          to: '/admin/media',
          icon: ImageIcon,
          label: 'Biblioteca Multimedia',
          isActiveOverride: activeTab ? activeTab === 'media' : undefined,
        },
      ],
    },
    {
      title: 'Ventas & Finanzas',
      items: [
        {
          to: '/admin/ads',
          icon: Megaphone,
          label: 'Campañas Publicitarias',
          isActiveOverride: activeTab ? activeTab === 'ads' : undefined,
        },
      ],
    },
    {
      title: 'Crecimiento',
      items: [
        {
          to: '/admin/submissions',
          icon: Inbox,
          label: 'Buzón Ciudadano',
          isActiveOverride: activeTab ? activeTab === 'submissions' : undefined,
        },
      ],
    },
    {
      title: 'Sistema',
      items: [
        {
          to: '/admin/settings',
          icon: Settings,
          label: 'Configuración & Marca',
          isActiveOverride: activeTab ? activeTab === 'settings' : undefined,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] ambient-glow-mesh flex flex-col lg:flex-row font-sans text-stone-900 relative">
      {/* Mobile Top Bar */}
      <header className="lg:hidden glass-panel border-b border-white/60 sticky top-0 z-40 px-4 h-16 flex items-center justify-between shadow-xs">
        <Link to="/admin" className="flex items-center gap-2.5">
          {settings.logos?.headerLogoUrl ? (
            <img
              src={settings.logos.headerLogoUrl}
              alt={settings.identity.siteName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div
              style={{ backgroundColor: brandColor }}
              className="w-9 h-9 rounded-2xl text-white flex items-center justify-center font-serif font-black text-sm shadow-sm"
            >
              {settings.identity.shortName.charAt(0) || 'C'}
            </div>
          )}
          <div>
            <span className="font-serif font-bold text-sm text-stone-950 block leading-tight truncate max-w-[170px]">
              {settings.identity.siteName || 'ccmustore'}
            </span>
            <span className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">
              Panel Editorial
            </span>
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
            {settings.logos?.headerLogoUrl ? (
              <img
                src={settings.logos.headerLogoUrl}
                alt={settings.identity.siteName}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div
                style={{ backgroundColor: brandColor }}
                className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-serif font-black text-sm"
              >
                {settings.identity.shortName.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <span className="font-serif font-bold text-sm text-stone-950 block truncate max-w-[150px]">
                {settings.identity.siteName || 'ccmustore'}
              </span>
              <span className="text-[10px] text-stone-500">Redacción Central</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edition pill */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 mb-6 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-800" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-bold">Sede</span>
              <span className="font-semibold text-stone-800">
                {settings.identity.centralLocation || 'COROMOTO'}
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        </div>

        {/* Mobile Navigation Links */}
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3.5 block mb-2">
                {section.title}
              </span>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => {
                        const active =
                          item.isActiveOverride !== undefined ? item.isActiveOverride : isActive;
                        return `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                          active
                            ? 'text-white shadow-md shadow-rose-950/20'
                            : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/70'
                        }`;
                      }}
                      style={({ isActive }) => {
                        const active =
                          item.isActiveOverride !== undefined ? item.isActiveOverride : isActive;
                        return active ? { backgroundColor: brandColor } : undefined;
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Mobile Footer Links */}
          <div className="pt-4 border-t border-stone-100 space-y-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-950 hover:bg-stone-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 shrink-0 text-stone-500" />
                <span>Ver Portal Público</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP FLOATING STICKY SIDEBAR (COLLAPSIBLE / EXPANDABLE)
          ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-4 left-4 h-[calc(100dvh-2rem)] my-4 ml-4 z-30 bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-xl shadow-stone-900/5 rounded-[32px] transition-[width,padding] duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-[78px] px-2.5 py-4' : 'w-[272px] p-4'
        }`}
      >
        {/* TOP SECTION: BRAND & CONTROLS */}
        {isCollapsed ? (
          /* Collapsed Header */
          <div className="flex flex-col items-center w-full pt-1 pb-1 shrink-0">
            {/* Logo / Monogram */}
            <Link
              to="/admin"
              className="flex items-center justify-center p-1 group"
              title={settings.identity.siteName || 'ccmustore'}
            >
              {settings.logos?.headerLogoUrl ? (
                <img
                  src={settings.logos.headerLogoUrl}
                  alt={settings.identity.siteName}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <div
                  style={{ backgroundColor: brandColor }}
                  className="w-9 h-9 rounded-2xl text-white flex items-center justify-center font-serif font-black text-sm shadow-sm group-hover:scale-105 transition-transform"
                >
                  {settings.identity.shortName.charAt(0) || 'C'}
                </div>
              )}
            </Link>

            {/* Circular Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="w-8 h-8 rounded-full border border-stone-200/90 bg-white shadow-xs flex items-center justify-center text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:shadow-sm active:scale-90 transition-all my-3 cursor-pointer"
              title="Expandir menú"
              aria-label="Expandir menú"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Sede Squircle Box */}
            <div
              className="w-11 h-11 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex items-center justify-center text-rose-800 hover:border-rose-300 hover:bg-rose-50/30 transition-colors cursor-pointer"
              title={`Sede: ${settings.identity.centralLocation || 'COROMOTO'}`}
            >
              <Building2 className="w-5 h-5 text-rose-800" />
            </div>

            {/* Hairline Divider below Sede */}
            <div className="w-8 h-[1px] bg-stone-200/80 mt-3 mb-1 mx-auto" />
          </div>
        ) : (
          /* Expanded Header */
          <div className="pb-3 border-b border-stone-100/90 shrink-0">
            <div className="flex items-center justify-between">
              <Link to="/admin" className="flex items-center gap-2.5 min-w-0 group">
                {settings.logos?.headerLogoUrl ? (
                  <img
                    src={settings.logos.headerLogoUrl}
                    alt={settings.identity.siteName}
                    className="h-8 w-auto object-contain shrink-0"
                  />
                ) : (
                  <div
                    style={{ backgroundColor: brandColor }}
                    className="w-9 h-9 rounded-2xl text-white flex items-center justify-center font-serif font-black text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                  >
                    {settings.identity.shortName.charAt(0) || 'C'}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-stone-950 leading-tight truncate">
                    {settings.identity.siteName || 'ccmustore'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 shadow-2xs"></span>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider truncate">
                      {user?.name || user?.roles?.[0] || 'JENDER'}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Circular Collapse Toggle Button */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="w-8 h-8 rounded-full border border-stone-200/90 bg-white shadow-xs flex items-center justify-center text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:shadow-sm active:scale-90 transition-all shrink-0 cursor-pointer"
                title="Contraer menú"
                aria-label="Contraer menú"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Sede Selector Box */}
            <div className="mt-3.5 bg-stone-50/80 border border-stone-200/70 hover:border-stone-300 rounded-2xl p-2.5 flex items-center justify-between transition-colors cursor-pointer group shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/60 shadow-2xs flex items-center justify-center text-rose-800 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-bold">
                    Sede
                  </span>
                  <span className="font-bold text-xs text-stone-850 truncate block">
                    {settings.identity.centralLocation || 'COROMOTO'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" />
            </div>
          </div>
        )}

        {/* MIDDLE SECTION: SCROLLABLE NAVIGATION LINKS */}
        <nav className="flex-1 my-3 overflow-y-auto no-scrollbar overflow-x-hidden">
          {isCollapsed ? (
            /* Collapsed Nav Links */
            <div className="flex flex-col items-center space-y-1 w-full">
              {navSections.map((section, idx) => (
                <React.Fragment key={section.title}>
                  {idx > 0 && <div className="w-8 h-[1px] bg-stone-200/80 my-2 mx-auto shrink-0" />}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => {
                          const active =
                            item.isActiveOverride !== undefined
                              ? item.isActiveOverride
                              : isActive;
                          return `w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                            active
                              ? 'text-white shadow-md shadow-rose-950/20'
                              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/80'
                          }`;
                        }}
                        style={({ isActive }) => {
                          const active =
                            item.isActiveOverride !== undefined
                              ? item.isActiveOverride
                              : isActive;
                          return active ? { backgroundColor: brandColor } : undefined;
                        }}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {/* Senior Floating Tooltip on Hover */}
                        <span className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                          {item.label}
                        </span>
                      </NavLink>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          ) : (
            /* Expanded Nav Links */
            <div className="space-y-4">
              {navSections.map((section) => (
                <div key={section.title}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3.5 block mb-1.5">
                    {section.title}
                  </span>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) => {
                            const active =
                              item.isActiveOverride !== undefined
                                ? item.isActiveOverride
                                : isActive;
                            return `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                              active
                                ? 'text-white shadow-md shadow-rose-950/20'
                                : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/70'
                            }`;
                          }}
                          style={({ isActive }) => {
                            const active =
                              item.isActiveOverride !== undefined
                                ? item.isActiveOverride
                                : isActive;
                            return active ? { backgroundColor: brandColor } : undefined;
                          }}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* BOTTOM SECTION: FOOTER & ACTIONS */}
        {isCollapsed ? (
          /* Collapsed Footer */
          <div className="flex flex-col items-center w-full pt-1 pb-1 mt-auto shrink-0">
            <div className="w-8 h-[1px] bg-stone-200/80 my-2 mx-auto" />

            {/* Ver Portal */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100/80 transition-all duration-200 relative group cursor-pointer"
            >
              <Store className="w-5 h-5 shrink-0" />
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                Ver Tienda / Portal
              </span>
            </a>

            {/* Cerrar Sesión */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-all duration-200 relative group cursor-pointer my-1"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-stone-900 text-white text-[11px] font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg">
                Cerrar Sesión
              </span>
            </button>

            {/* Version Badge */}
            <div className="mt-2 border border-rose-200 bg-rose-50/90 text-rose-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-2xs">
              v2.0.0
            </div>
          </div>
        ) : (
          /* Expanded Footer */
          <div className="pt-3 border-t border-stone-100/90 mt-auto space-y-1 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-stone-600 hover:text-stone-950 hover:bg-stone-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 shrink-0 text-stone-500" />
                <span>Ver Tienda / Portal</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>

            <div className="pt-2 px-2 flex items-center justify-between text-[11px] text-stone-400">
              <span className="text-[10px] font-medium text-stone-400">Lyberate CMS</span>
              <span className="border border-rose-200 bg-rose-50/90 text-rose-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                v2.0.0
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
