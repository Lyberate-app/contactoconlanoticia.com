import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  SunMedium,
  ArrowRight,
  Shield,
  Bell,
  Send,
  Home,
  Compass,
  Sparkles,
  ChevronRight,
  Zap,
  Clock,
} from 'lucide-react';
import { publicApi, PublicCategory, PublicArticleSummary } from '../services/publicApi';
import { PwaManager } from '../components/common/PwaManager';
import { AdSlot } from '../components/common/AdSlot';
import { formatMastheadDate } from '../utils/date';
import { useSettings } from '../context/SettingsContext';

declare global {
  interface Window {
    openPushPreferences?: () => void;
  }
}

export const PublicLayout: React.FC = () => {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [breakingNews, setBreakingNews] = useState<PublicArticleSummary[]>([]);
  const [recentFeed, setRecentFeed] = useState<PublicArticleSummary[]>([]);
  const [latestNewsOpen, setLatestNewsOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Load categories for navbar and breaking news for ticker
    publicApi.getCategories()
      .then(cats => setCategories(cats))
      .catch(() => {
        // Fallback default canonical categories if initial offline
        setCategories([
          { category_uuid: '1', name: 'Regionales', slug: 'regionales', sort_order: 1 },
          { category_uuid: '2', name: 'Sucesos', slug: 'sucesos', sort_order: 2 },
          { category_uuid: '3', name: 'Comunidades', slug: 'comunidades', sort_order: 3 },
          { category_uuid: '4', name: 'Municipales', slug: 'municipales', sort_order: 4 },
          { category_uuid: '5', name: 'Turismo', slug: 'turismo', sort_order: 5 },
          { category_uuid: '6', name: 'Internacionales', slug: 'internacionales', sort_order: 6 },
        ]);
      });

    publicApi.getHomeFeed()
      .then(feed => {
        if (feed.breaking_news && feed.breaking_news.length > 0) {
          setBreakingNews(feed.breaking_news);
        }
        if (feed.latest_articles && feed.latest_articles.length > 0) {
          setRecentFeed(feed.latest_articles);
        }
      })
      .catch(() => {});

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawers on route change
  useEffect(() => {
    setBottomSheetOpen(false);
    setSearchModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setBottomSheetOpen(false);
      setSearchModalOpen(false);
    }
  };

  const formattedDate = formatMastheadDate();

  return (
    <div className="min-h-screen text-stone-900 font-sans flex flex-col antialiased selection:bg-rose-500/20 selection:text-rose-950 ambient-glow-mesh relative">
      {/* 2. STICKY FROSTED GLASS HEADER (iOS 27 Glass) */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-panel shadow-sm border-b border-white/60 py-2 sm:py-2.5'
            : 'bg-white/80 backdrop-blur-xl border-b border-stone-200/60 py-2.5 sm:py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Date, Weather Chip & Redaction */}
          <div className="flex items-center justify-between gap-3 text-xs mb-1.5 sm:mb-2 text-stone-500">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="font-medium text-stone-700 text-[11px] sm:text-xs tracking-tight">
                {formattedDate}
              </span>
              <span className="hidden sm:inline text-stone-300">·</span>
              <span className="hidden sm:inline text-[11px] text-stone-500">
                {settings.identity.editionName}
              </span>
              {settings.features.showWeatherWidget && (
                <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-900 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <SunMedium className="w-3 h-3 text-amber-600" />
                  <span>31°C · Soleado</span>
                </div>
              )}
            </div>

            {/* Header Right Actions (Alerts, Citizen Submit, Redacción) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.openPushPreferences?.()}
                className="glass-pill px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:text-rose-700 flex items-center gap-1.5"
                title="Alertas y Notificaciones"
              >
                <Bell className="w-3 h-3 text-rose-600" />
                <span className="hidden sm:inline">Alertas</span>
              </button>

              {settings.features.showCitizenSubmissionButton && (
                <Link
                  to="/enviar-noticia"
                  className="hidden md:inline-flex items-center gap-1.5 glass-pill px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50/70"
                >
                  <Send className="w-3 h-3" />
                  <span>Envíanos tu noticia</span>
                </Link>
              )}

              <Link
                to="/login"
                className="hidden lg:inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 transition-colors px-1"
                title="Acceso editorial"
              >
                <Shield className="w-3 h-3" />
                <span>Redacción</span>
              </Link>
            </div>
          </div>

          {/* Middle Row: Brand Masthead */}
          <div className="flex items-center justify-between py-1">
            <Link to="/" className="inline-block group">
              {settings.logos.headerLogoUrl ? (
                <img
                  src={settings.logos.headerLogoUrl}
                  alt={settings.identity.siteName}
                  style={{ maxHeight: `${settings.logos.headerLogoHeight || 44}px` }}
                  className="object-contain"
                />
              ) : (
                <div className="flex items-baseline gap-2">
                  <h1
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: Number(settings.typography.headingWeight) || 900,
                      color: settings.colors.primary,
                    }}
                    className="text-2xl sm:text-4xl md:text-5xl uppercase tracking-tighter group-hover:opacity-90 transition-opacity"
                  >
                    {settings.identity.siteName}
                  </h1>
                </div>
              )}
            </Link>

            {/* Desktop Quick Search Pill */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-1.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-64 glass-pill px-3.5 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                  aria-label="Buscar"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Mobile Header Menu & Search Icons */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-stone-700"
                aria-label="Buscar"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setBottomSheetOpen(true)}
                className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-stone-800"
                aria-label="Secciones"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Categories Pill Navigation Bar */}
          <div className="hidden md:flex items-center gap-1 pt-2.5 pb-1 overflow-x-auto no-scrollbar border-t border-stone-200/50">
            <Link
              to="/"
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                location.pathname === '/'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/70'
              }`}
            >
              Portada
            </Link>
            {categories.map((cat) => {
              const isActive = location.pathname === `/categoria/${cat.slug}`;
              return (
                <Link
                  key={cat.category_uuid}
                  to={`/categoria/${cat.slug}`}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/70'
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* 3. LEADERBOARD AD SPACE */}
      <AdSlot placement="HEADER_BANNER" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-4" />

      {/* 4. MAIN CONTENT ROUTED PAGES */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-safe-nav">
        <Outlet />
      </main>

      {/* 5. FOOTER AD SPACE */}
      <AdSlot placement="FOOTER" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-4" />

      {/* 6. iOS 27 GLASS FOOTER */}
      <footer className="mt-12 glass-panel border-t border-white/60 text-stone-700 text-xs pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-200/60">
            {/* Column 1: Identity */}
            <div className="space-y-3">
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: settings.colors.primary,
                }}
                className="text-lg font-black uppercase tracking-tight"
              >
                {settings.identity.siteName}
              </h2>
              <p className="text-stone-600 leading-relaxed text-xs">
                {settings.identity.tagline}
              </p>
              <div className="text-stone-500 text-[11px]">
                {settings.identity.address || `Sede: ${settings.identity.centralLocation}`}
              </div>
            </div>

            {/* Column 2: Sections */}
            <div>
              <h3 className="font-bold text-stone-950 uppercase text-[11px] tracking-wider mb-3">
                Secciones Principales
              </h3>
              <ul className="space-y-1.5 text-stone-600">
                {categories.map((cat) => (
                  <li key={cat.category_uuid}>
                    <Link
                      to={`/categoria/${cat.slug}`}
                      className="hover:text-rose-700 hover:underline transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Institutional */}
            <div>
              <h3 className="font-bold text-stone-950 uppercase text-[11px] tracking-wider mb-3">
                Institucional & Ética
              </h3>
              <ul className="space-y-1.5 text-stone-600">
                <li><Link to="/autor/carlos-mendoza" className="hover:text-rose-700">Mesa de Redacción</Link></li>
                <li><span className="text-stone-400">Código de Ética y Verificación</span></li>
                <li><span className="text-stone-400">Tarifario Publicitario</span></li>
                <li><Link to="/buscar" className="hover:text-rose-700">Hemeroteca & Archivo</Link></li>
              </ul>
            </div>

            {/* Column 4: Redacción Digital */}
            <div className="space-y-3">
              <h3 className="font-bold text-stone-950 uppercase text-[11px] tracking-wider mb-3">
                Redacción Periodística
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Plataforma editorial para redactores, fotoperiodistas y corresponsales.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 glass-pill px-3.5 py-1.5 text-xs font-semibold text-stone-900 hover:bg-stone-900 hover:text-white transition-all shadow-sm"
              >
                <span>Acceso Redacción</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-3">
            <div>
              &copy; {new Date().getFullYear()} {settings.identity.copyrightText}
            </div>
            {settings.identity.showLyberateBadge && (
              <div className="flex items-center gap-1.5 text-stone-400">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Experiencia Móvil iOS 27 Glass — Arquitectura Lyberate</span>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* 7. MOBILE FLOATING iOS 27 GLASS DOCK (BOTTOM TAB BAR) */}
      <nav
        aria-label="Navegación Móvil"
        className="fixed bottom-3 inset-x-3 sm:inset-x-6 z-40 md:hidden pointer-events-none flex justify-center"
      >
        <div className="pointer-events-auto bg-white/98 border border-stone-200/90 rounded-[28px] px-3 py-2 flex items-center justify-between w-full max-w-md shadow-2xl">
          {/* 1. Portada */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-12 py-1 transition-all ${
              location.pathname === '/' ? 'text-rose-700 scale-105' : 'text-stone-500 active:scale-95'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Portada</span>
            {location.pathname === '/' && (
              <span className="w-1 h-1 rounded-full bg-rose-600 mt-0.5"></span>
            )}
          </Link>

          {/* 2. Secciones */}
          <button
            type="button"
            onClick={() => setBottomSheetOpen(true)}
            className={`flex flex-col items-center justify-center w-12 py-1 transition-all ${
              bottomSheetOpen ? 'text-rose-700 scale-105' : 'text-stone-500 active:scale-95'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Secciones</span>
            {bottomSheetOpen && (
              <span className="w-1 h-1 rounded-full bg-rose-600 mt-0.5"></span>
            )}
          </button>

          {/* 3. Action Center: Rayo ⚡ Últimas Noticias al Minuto */}
          <button
            type="button"
            onClick={() => setLatestNewsOpen(true)}
            className="flex flex-col items-center justify-center -mt-4 group cursor-pointer"
            title="Ver últimas noticias al minuto"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-rose-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-900/30 group-active:scale-90 transition-transform">
              <Zap className="w-6 h-6 fill-white text-white" />
            </div>
            <span className="text-[10px] font-bold text-rose-800 mt-0.5">Al Minuto</span>
          </button>

          {/* 4. Buscar */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className={`flex flex-col items-center justify-center w-12 py-1 transition-all ${
              searchModalOpen || location.pathname.startsWith('/buscar')
                ? 'text-rose-700 scale-105'
                : 'text-stone-500 active:scale-95'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Buscar</span>
          </button>

          {/* 5. Alertas */}
          <button
            type="button"
            onClick={() => window.openPushPreferences?.()}
            className="flex flex-col items-center justify-center w-12 py-1 text-stone-500 active:scale-95"
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Alertas</span>
          </button>
        </div>
      </nav>

      {/* 8. iOS 27 FLUID BOTTOM SHEET (SECTIONS & DRAWER) */}
      {bottomSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-md transition-opacity"
            onClick={() => setBottomSheetOpen(false)}
          ></div>

          {/* Sliding Sheet */}
          <div className="relative w-full max-h-[88vh] glass-panel rounded-t-[32px] p-5 overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-4"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-rose-700" />
                <h3 className="font-bold text-stone-900 text-base">Secciones del Diario</h3>
              </div>
              <button
                type="button"
                onClick={() => setBottomSheetOpen(false)}
                className="w-7 h-7 rounded-full glass-pill flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar artículos o temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-pill py-2 pl-3.5 pr-10 text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Grouped Category Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <Link
                to="/"
                onClick={() => setBottomSheetOpen(false)}
                className="glass-card p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-stone-800 hover:text-rose-700"
              >
                <span>Portada Principal</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.category_uuid}
                  to={`/categoria/${cat.slug}`}
                  onClick={() => setBottomSheetOpen(false)}
                  className="glass-card p-3 rounded-2xl flex items-center justify-between text-xs font-semibold text-stone-800 hover:text-rose-700"
                >
                  <span>{cat.name}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </Link>
              ))}
            </div>

            {/* Extra Shortcuts */}
            <div className="space-y-2 pt-2 border-t border-stone-200/60">
              <Link
                to="/enviar-noticia"
                onClick={() => setBottomSheetOpen(false)}
                className="w-full glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-rose-700"
              >
                <Send className="w-4 h-4" />
                <span>Buzón de Denuncias & Noticias Comunitarias</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setBottomSheetOpen(false);
                  window.openPushPreferences?.();
                }}
                className="w-full glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium text-stone-700"
              >
                <Bell className="w-4 h-4 text-stone-500" />
                <span>Configuración de Alertas & Notificaciones</span>
              </button>

              <Link
                to="/login"
                onClick={() => setBottomSheetOpen(false)}
                className="w-full glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium text-stone-500"
              >
                <Shield className="w-4 h-4" />
                <span>Acceso a Mesa de Redacción Digital</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 9. iOS SEARCH MODAL */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-md transition-opacity"
            onClick={() => setSearchModalOpen(false)}
          ></div>

          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-5 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-stone-900 text-sm">Buscar en el Diario</h4>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="w-6 h-6 rounded-full glass-pill flex items-center justify-center text-stone-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Escriba palabra clave o tema..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-pill py-3 pl-4 pr-12 text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-rose-900 text-white p-1.5 rounded-full"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-stone-200/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Sugerencias de búsqueda
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Guárico', 'San Juan de los Morros', 'Sucesos', 'Turismo', 'Comunidades'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      navigate(`/buscar?q=${encodeURIComponent(tag)}`);
                      setSearchModalOpen(false);
                    }}
                    className="glass-pill px-3 py-1 text-xs text-stone-700 hover:text-rose-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. ÚLTIMAS NOTICIAS AL MINUTO (DRAWER DESDE EL RAYO ⚡) */}
      {latestNewsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setLatestNewsOpen(false)}
          ></div>

          <div className="relative w-full max-w-xl max-h-[85vh] bg-white border-t border-stone-200 text-stone-900 rounded-t-[32px] p-5 overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-4"></div>

            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
                  <Zap className="w-4 h-4 fill-white text-white" />
                </span>
                <div>
                  <h3 className="font-serif font-black text-stone-950 text-base leading-tight">
                    Últimas Noticias al Minuto
                  </h3>
                  <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                    Transmisión y cobertura informativa continua
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLatestNewsOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* News Chronological List */}
            <div className="space-y-3">
              {(recentFeed.length > 0 ? recentFeed : breakingNews).map((art, idx) => (
                <Link
                  key={art.article_uuid || idx}
                  to={`/noticia/${art.slug}`}
                  onClick={() => setLatestNewsOpen(false)}
                  className="block p-3.5 rounded-2xl bg-stone-50 hover:bg-rose-50/50 border border-stone-200/70 hover:border-rose-300 transition group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                      {art.category_name}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {art.published_at ? new Date(art.published_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-stone-900 group-hover:text-rose-900 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h4>
                  {art.excerpt && (
                    <p className="text-xs text-stone-600 line-clamp-1 mt-1 font-sans">
                      {art.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 text-center">
              <Link
                to="/"
                onClick={() => setLatestNewsOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 transition"
              >
                <span>Ver toda la portada del periódico</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* PWA & Web Push Manager */}
      <PwaManager />
    </div>
  );
};
