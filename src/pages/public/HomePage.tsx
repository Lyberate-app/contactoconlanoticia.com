import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Newspaper, ChevronRight, Flame, MessageSquareQuote } from 'lucide-react';
import { publicApi, HomeFeedData } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { AdSlot } from '../../components/common/AdSlot';
import { LeadArticle, ArticleCard } from '../../components/articles';
import { SITE_URL } from '../../config/env';

export const HomePage: React.FC = () => {
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPill, setSelectedPill] = useState<string>('todos');

  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Contacto con la Noticia',
      url: `${SITE_URL}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/buscar?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: 'Contacto con la Noticia',
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
      },
      description: 'Periódico digital independiente. Información veraz y oportuna de Venezuela y el mundo.',
      sameAs: [
        'https://twitter.com/contactonoticia',
        'https://facebook.com/contactoconlanoticia',
        'https://instagram.com/contactoconlanoticia',
      ],
      publishingPrinciples: `${SITE_URL}/`,
      ethicsPolicy: `${SITE_URL}/`,
    },
  ];

  useEffect(() => {
    setLoading(true);
    publicApi.getHomeFeed()
      .then(data => {
        setFeed(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Error al conectar con la redacción');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pt-2">
        <div className="flex gap-2 overflow-hidden">
          <div className="h-8 w-24 glass-pill rounded-full"></div>
          <div className="h-8 w-28 glass-pill rounded-full"></div>
          <div className="h-8 w-24 glass-pill rounded-full"></div>
          <div className="h-8 w-32 glass-pill rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-[420px] glass-card rounded-[28px]"></div>
          <div className="lg:col-span-5 space-y-4">
            <div className="h-32 glass-card rounded-2xl"></div>
            <div className="h-32 glass-card rounded-2xl"></div>
            <div className="h-32 glass-card rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !feed) {
    return (
      <div className="glass-card p-8 text-center my-8 rounded-[28px] max-w-xl mx-auto shadow-xl">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 mx-auto mb-3 flex items-center justify-center">
          <Newspaper className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">No se pudo cargar la portada</h2>
        <p className="text-stone-600 text-xs mb-5">{error || 'Intente de nuevo en unos momentos.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="glass-pill-dark text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-stone-900 transition-all shadow-md active:scale-95"
        >
          Recargar diario
        </button>
      </div>
    );
  }

  const { lead_article, secondary_articles, latest_articles, trending_articles, sections } = feed;

  // Filter latest articles if a category pill is selected on mobile
  const filteredLatest = selectedPill === 'todos'
    ? latest_articles
    : latest_articles.filter(a => a.category_slug === selectedPill);

  return (
    <div className="space-y-8">
      <SeoHead
        title="Contacto con la Noticia | Diario Digital Independiente"
        description="Periódico digital independiente. Información veraz y oportuna de Venezuela y el mundo."
        canonicalUrl={`${SITE_URL}/`}
        type="website"
        imageUrl="/icons/icon-512x512.png"
        imageWidth={512}
        imageHeight={512}
        imageAlt="Contacto con la Noticia"
        jsonLd={homeJsonLd}
      />

      {/* 1. iOS 27 HORIZONTAL CATEGORY PILL SELECTOR (Mobile-First Touch Rail) */}
      <section className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => setSelectedPill('todos')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 ${
            selectedPill === 'todos'
              ? 'bg-rose-900 text-white shadow-md'
              : 'glass-pill text-stone-600 hover:text-stone-900'
          }`}
        >
          Todo el Diario
        </button>
        {Object.entries(sections).map(([slug, sec]) => (
          <button
            key={slug}
            type="button"
            onClick={() => setSelectedPill(slug)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 ${
              selectedPill === slug
                ? 'bg-rose-900 text-white shadow-md'
                : 'glass-pill text-stone-600 hover:text-stone-900'
            }`}
          >
            {sec.category.name}
          </button>
        ))}
      </section>

      {/* 2. LEAD STORY + SECONDARY COLUMN (iOS 27 Glass) */}
      {lead_article && (
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Lead Article (Left 7 Cols) */}
            <div className="lg:col-span-7">
              <LeadArticle article={lead_article} kicker="Tema Principal" />
            </div>

            {/* Secondary News Column (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-900">
                    Noticias Destacadas
                  </h3>
                </div>
                <span className="text-[10px] text-stone-400 uppercase font-medium tracking-wider">
                  Edición Digital
                </span>
              </div>

              <div className="space-y-3">
                {secondary_articles.map((art) => (
                  <ArticleCard
                    key={art.article_uuid}
                    article={art}
                    variant="horizontal"
                    showAuthor={true}
                    showExcerpt={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TOP_NEWS AD SLOT */}
      <AdSlot placement="TOP_NEWS" />

      {/* 3. MAIN BODY: LATEST NEWS STREAM + SIDEBAR */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Main Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Section: Últimas Noticias */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 radar-pulse"></div>
                <h3 className="text-xl font-bold text-stone-950 tracking-tight">
                  {selectedPill === 'todos' ? 'Últimas Noticias' : `Noticias en ${sections[selectedPill]?.category.name || selectedPill}`}
                </h3>
              </div>
              <span className="glass-pill px-3 py-1 text-[11px] text-stone-500 font-medium">
                Actualización continua
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {filteredLatest.slice(0, 8).map((art) => (
                <ArticleCard
                  key={art.article_uuid}
                  article={art}
                  variant="vertical"
                  showExcerpt={true}
                  showAuthor={true}
                />
              ))}
            </div>
          </div>

          {/* Categorized Editorial Sections (Mobile Horizontal Card Reels) */}
          {Object.entries(sections).map(([slug, sec]) => (
            <div key={slug} className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-rose-700 rounded-full"></span>
                  <h3 className="text-lg font-bold text-stone-950 tracking-tight">
                    {sec.category.name}
                  </h3>
                </div>
                <Link
                  to={`/categoria/${slug}`}
                  className="glass-pill px-3 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                >
                  <span>Ver sección</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Mobile Horizontal Scroll Reel / Desktop Grid */}
              <div className="flex overflow-x-auto gap-4 no-scrollbar pb-3 sm:grid sm:grid-cols-3 sm:pb-0">
                {sec.articles.slice(0, 3).map((art) => (
                  <div key={art.article_uuid} className="min-w-[260px] sm:min-w-0 flex-1">
                    <ArticleCard
                      article={art}
                      variant="vertical"
                      showExcerpt={false}
                      showAuthor={true}
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar (4 Cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Sidebar Ad Space */}
          <AdSlot placement="SIDEBAR" />

          {/* Tendencias / Lo Más Leído (iOS Widget Card) */}
          <div className="glass-card p-5 rounded-[28px] shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-950">
                  Tendencias / Lo Más Leído
                </h3>
              </div>
              <span className="text-[10px] text-stone-400 font-semibold uppercase">24H</span>
            </div>

            <ol className="space-y-3">
              {trending_articles.map((art, idx) => (
                <li
                  key={art.article_uuid}
                  className="group flex items-start gap-3 p-2 rounded-2xl hover:bg-white/60 transition-colors"
                >
                  <span
                    className={`shrink-0 w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${
                      idx === 0
                        ? 'bg-rose-900 text-white'
                        : idx === 1
                        ? 'bg-rose-700 text-white'
                        : idx === 2
                        ? 'bg-rose-500/80 text-white'
                        : 'glass-pill text-stone-600'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="space-y-1 min-w-0 flex-1">
                    <Link
                      to={`/categoria/${art.category_slug}`}
                      className="text-[10px] font-bold uppercase tracking-wider text-rose-700 hover:underline block truncate"
                    >
                      {art.category_name}
                    </Link>
                    <Link
                      to={`/noticia/${art.slug}`}
                      className="font-serif font-bold text-xs sm:text-[13px] text-stone-900 group-hover:text-rose-900 leading-snug line-clamp-2 block transition-colors"
                    >
                      {art.title}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Tribuna Editorial (iOS Opinion Card) */}
          <div className="glass-card p-5 rounded-[28px] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200/60">
              <MessageSquareQuote className="w-4 h-4 text-rose-700" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-950">
                Tribuna & Opinión
              </h3>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="glass-panel p-3.5 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-[10px]">
                    C
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 block text-xs">Carlos Mendoza</span>
                    <span className="text-[10px] text-stone-500 italic block">Análisis Llanero</span>
                  </div>
                </div>
                <p className="line-clamp-3 text-stone-700 leading-relaxed font-serif text-[11px] pt-1">
                  "El valor de la producción cerealera llanera frente a los retos económicos del ciclo agrícola nacional."
                </p>
              </div>

              <div className="glass-panel p-3.5 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-700 text-white flex items-center justify-center font-bold text-[10px]">
                    E
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 block text-xs">Elena Vásquez</span>
                    <span className="text-[10px] text-stone-500 italic block">Comunidad & Servicios</span>
                  </div>
                </div>
                <p className="line-clamp-3 text-stone-700 leading-relaxed font-serif text-[11px] pt-1">
                  "La articulación vecinal y la preservación de los afluentes urbanos en la capital guariqueña."
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* FOOTER AD SLOT */}
      <AdSlot placement="FOOTER" />
    </div>
  );
};
