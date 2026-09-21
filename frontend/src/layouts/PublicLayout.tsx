import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Clock, SunMedium, ArrowRight, Shield, Bell, Send } from 'lucide-react';
import { publicApi, PublicCategory, PublicArticleSummary } from '../services/publicApi';
import { PwaManager } from '../components/common/PwaManager';
import { AdSlot } from '../components/common/AdSlot';

export const PublicLayout: React.FC = () => {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [breakingNews, setBreakingNews] = useState<PublicArticleSummary[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      })
      .catch(() => {});
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const currentDateStr = new Intl.DateTimeFormat('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const formattedDate = currentDateStr.charAt(0).toUpperCase() + currentDateStr.slice(1);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col antialiased selection:bg-red-100 selection:text-red-900">
      {/* 1. TOP UTILITY BAR */}
      <div className="border-b border-stone-200 bg-white text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-serif font-medium text-stone-800">{formattedDate}</span>
            <span className="hidden sm:inline text-stone-300">|</span>
            <span className="hidden sm:inline">Edición Digital · San Juan de los Morros, Guárico</span>
            <span className="hidden md:inline text-stone-300">|</span>
            <span className="hidden md:inline-flex items-center gap-1 text-stone-500">
              <SunMedium className="w-3.5 h-3.5 text-amber-600" />
              <span>31°C · Soleado</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (window as any).openPushPreferences?.()}
              className="flex items-center gap-1 text-stone-600 hover:text-red-700 transition-colors"
              title="Alertas y notificaciones"
            >
              <Bell className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Alertas</span>
            </button>
            <span className="text-stone-300">|</span>
            <Link
              to="/enviar-noticia"
              className="flex items-center gap-1 text-red-700 hover:text-red-900 font-medium transition-colors"
              title="Envíanos tu noticia o denuncia comunitaria"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Envíanos tu noticia</span>
            </Link>
            <span className="text-stone-300">|</span>
            <Link
              to="/buscar"
              className="flex items-center gap-1 hover:text-stone-950 transition-colors"
              title="Buscar noticias"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buscar</span>
            </Link>
            <span className="text-stone-300">|</span>
            <Link
              to="/login"
              className="flex items-center gap-1 text-stone-500 hover:text-stone-900 transition-colors"
              title="Acceso al panel editorial"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redacción</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NEWSPAPER MASTHEAD */}
      <header className="bg-white border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="text-center">
            <div className="text-[11px] font-semibold tracking-widest text-stone-500 uppercase mb-1">
              Diario Regional Independiente · Fundado en 2011
            </div>

            <Link to="/" className="inline-block group">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-stone-950 uppercase group-hover:text-red-900 transition-colors">
                Contacto con la Noticia
              </h1>
            </Link>

            <p className="mt-1 text-xs sm:text-sm font-serif italic text-stone-600 max-w-xl mx-auto">
              "Información oportuna, veraz y con sentido social para el estado Guárico y los Llanos Centrales"
            </p>
          </div>

          {/* Newspaper Double Rules */}
          <div className="mt-4 pt-1 border-t-2 border-b border-stone-900"></div>
        </div>

        {/* 3. PRIMARY NAVIGATION BAR */}
        <nav className="border-b border-stone-300 bg-stone-100/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Desktop Categories Links */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2 py-2 overflow-x-auto">
              <Link
                to="/"
                className={`px-3 py-1 text-xs lg:text-sm font-semibold uppercase tracking-wider transition-colors ${
                  location.pathname === '/'
                    ? 'text-red-700 border-b-2 border-red-700 -mb-[9px] pb-[7px]'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                Portada
              </Link>
              {categories.map(cat => {
                const isActive = location.pathname === `/categoria/${cat.slug}`;
                return (
                  <Link
                    key={cat.category_uuid}
                    to={`/categoria/${cat.slug}`}
                    className={`px-3 py-1 text-xs lg:text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-red-700 border-b-2 border-red-700 -mb-[9px] pb-[7px]'
                        : 'text-stone-700 hover:text-stone-950'
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Trigger & Search */}
            <div className="flex md:hidden items-center justify-between w-full py-2.5">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase text-stone-800 p-1"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                <span>Secciones</span>
              </button>

              <Link
                to="/buscar"
                className="p-1.5 text-stone-700 hover:text-stone-950"
                aria-label="Buscar noticias"
              >
                <Search className="w-4 h-4" />
              </Link>
            </div>

            {/* Desktop Quick Search Form */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-1.5 py-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar en el diario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-44 lg:w-56 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:border-stone-600"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800"
                  aria-label="Ejecutar búsqueda"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Dropdown Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-900"
                />
                <button
                  type="submit"
                  className="bg-stone-900 text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                  Buscar
                </button>
              </form>

              <div className="border-t border-stone-100 pt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/"
                  className="py-1.5 text-xs font-semibold uppercase text-stone-800 hover:text-red-700"
                >
                  Portada
                </Link>
                {categories.map(cat => (
                  <Link
                    key={cat.category_uuid}
                    to={`/categoria/${cat.slug}`}
                    className="py-1.5 text-xs font-semibold uppercase text-stone-800 hover:text-red-700"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* 4. BREAKING NEWS TICKER (SUBTLE) */}
      {breakingNews.length > 0 && (
        <div className="bg-stone-900 text-stone-100 border-b border-stone-800 text-xs py-1.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-bold text-[10px] tracking-wider uppercase bg-red-700 text-white px-2 py-0.5 rounded-sm shrink-0">
              <Clock className="w-3 h-3" />
              Última Hora
            </span>

            <div className="truncate flex-1">
              <Link
                to={`/noticias/${breakingNews[0].slug}`}
                className="hover:underline hover:text-white transition-colors"
              >
                {breakingNews[0].title}
              </Link>
            </div>

            {breakingNews.length > 1 && (
              <span className="hidden sm:inline text-stone-400 text-[11px] shrink-0">
                +{breakingNews.length - 1} informaciones más
              </span>
            )}
          </div>
        </div>
      )}

      {/* 5. TOP LEADERBOARD AD SPACE (728x90) */}
      <AdSlot placement="HEADER_BANNER" className="px-4 sm:px-6 lg:px-8" />

      {/* 6. MAIN CONTENT OUTLET */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* FOOTER AD SPACE */}
      <AdSlot placement="FOOTER" className="px-4 sm:px-6 lg:px-8" />

      {/* 7. NEWSPAPER FOOTER */}
      <footer className="border-t-2 border-stone-900 bg-white text-stone-800 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-200">
            {/* Column 1: Newspaper Identity */}
            <div className="space-y-3">
              <h2 className="font-serif text-lg font-bold text-stone-950 uppercase tracking-tight">
                Contacto con la Noticia
              </h2>
              <p className="text-stone-600 leading-relaxed text-xs">
                Periódico digital independiente fundado en San Juan de los Morros, estado Guárico. Cobertura comprometida con el desarrollo comunitario, productivo e institucional de los Llanos Centrales venezolanos.
              </p>
              <div className="text-stone-500 text-[11px]">
                Sede Central: Av. Bolívar, Edificio Centro Cívico, San Juan de los Morros, Estado Guárico.
              </div>
            </div>

            {/* Column 2: Sections */}
            <div>
              <h3 className="font-serif font-bold text-stone-950 uppercase text-xs tracking-wider mb-3 border-b border-stone-200 pb-1">
                Secciones
              </h3>
              <ul className="space-y-1.5 text-stone-600">
                {categories.map(cat => (
                  <li key={cat.category_uuid}>
                    <Link
                      to={`/categoria/${cat.slug}`}
                      className="hover:text-red-700 hover:underline transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Institutional */}
            <div>
              <h3 className="font-serif font-bold text-stone-950 uppercase text-xs tracking-wider mb-3 border-b border-stone-200 pb-1">
                Institucional
              </h3>
              <ul className="space-y-1.5 text-stone-600">
                <li><Link to="/autor/carlos-mendoza" className="hover:text-red-700 hover:underline">Equipo de Redacción</Link></li>
                <li><span className="text-stone-400">Código de Ética Periodística</span></li>
                <li><span className="text-stone-400">Tarifario Publicitario</span></li>
                <li><span className="text-stone-400">Contacto con la Dirección</span></li>
                <li><Link to="/buscar" className="hover:text-red-700 hover:underline">Hemeroteca / Archivo Digital</Link></li>
              </ul>
            </div>

            {/* Column 4: Redacción & Plataforma */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-stone-950 uppercase text-xs tracking-wider mb-3 border-b border-stone-200 pb-1">
                Redacción Digital
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Área reservada para periodistas, editores y administradores de contenido de la mesa editorial.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                <span>Acceso Editorial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-2">
            <div>
              &copy; {new Date().getFullYear()} Contacto con la Noticia Media Group. Todos los derechos reservados.
            </div>
            <div>
              Plataforma desarrollada con arquitectura <span className="font-semibold text-stone-700">Lyberate</span>.
            </div>
          </div>
        </div>
      </footer>

      {/* PWA & Web Push Manager */}
      <PwaManager />
    </div>
  );
};

