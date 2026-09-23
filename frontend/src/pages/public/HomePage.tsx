import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Newspaper, ChevronRight } from 'lucide-react';
import { publicApi, HomeFeedData } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { AdSlot } from '../../components/common/AdSlot';
import { LeadArticle, ArticleCard, NewsTicker } from '../../components/articles';

export const HomePage: React.FC = () => {
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Contacto con la Noticia',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://contactoconlanoticia.com',
    logo: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://contactoconlanoticia.com/logo.png',
    description: 'Periódico digital independiente. Información veraz y oportuna de Venezuela y el mundo.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${typeof window !== 'undefined' ? window.location.origin : 'https://contactoconlanoticia.com'}/buscar?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

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
      <div className="space-y-8 animate-pulse">
        <div className="h-6 w-full bg-stone-200 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-stone-200 rounded"></div>
          <div className="lg:col-span-5 space-y-4">
            <div className="h-28 bg-stone-200 rounded"></div>
            <div className="h-28 bg-stone-200 rounded"></div>
            <div className="h-28 bg-stone-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !feed) {
    return (
      <div className="bg-white border border-stone-200 p-8 text-center my-8 rounded">
        <Newspaper className="w-10 h-10 text-stone-400 mx-auto mb-3" />
        <h2 className="text-xl font-serif font-bold text-stone-800 mb-2">No se pudo cargar la portada</h2>
        <p className="text-stone-600 text-sm mb-4">{error || 'Intente de nuevo en unos momentos.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-stone-800"
        >
          Recargar diario
        </button>
      </div>
    );
  }

  const { breaking_news, lead_article, secondary_articles, latest_articles, trending_articles, sections } = feed;

  return (
    <div className="space-y-8">
      <SeoHead
        title="Contacto con la Noticia | Diario Digital Independiente"
        description="Periódico digital independiente. Información veraz y oportuna de Venezuela y el mundo."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://contactoconlanoticia.com/'}
        type="website"
        jsonLd={websiteSchema}
      />

      {/* 1. BREAKING NEWS TICKER */}
      {breaking_news && breaking_news.length > 0 && (
        <NewsTicker articles={breaking_news} label="Última Hora" />
      )}

      {/* 2. LEAD STORY + SECONDARY COLUMN */}
      {lead_article && (
        <section className="border-b border-stone-300 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lead Article (Left 7 Cols) */}
            <div className="lg:col-span-7">
              <LeadArticle article={lead_article} kicker="Tema Principal" />
            </div>

            {/* Secondary News Column (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-stone-200 lg:pl-8">
              <div className="border-b border-stone-300 pb-1 mb-2">
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-900">
                  Noticias Destacadas
                </h3>
              </div>

              <div className="divide-y divide-stone-200">
                {secondary_articles.map((art) => (
                  <ArticleCard
                    key={art.article_uuid}
                    article={art}
                    variant="horizontal"
                    showAuthor={true}
                    showExcerpt={true}
                    className="py-3.5"
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
            <div className="flex items-center justify-between border-b-2 border-stone-900 pb-1 mb-6">
              <h3 className="font-serif text-lg font-bold uppercase text-stone-950 tracking-tight">
                Últimas Noticias
              </h3>
              <span className="text-xs text-stone-500 italic">Actualización continua</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {latest_articles.map((art) => (
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

          {/* Categorized Editorial Sections */}
          {Object.entries(sections).map(([slug, sec]) => (
            <div key={slug} className="border-t border-stone-300 pt-8">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-6">
                <h3 className="font-serif text-base sm:text-lg font-bold uppercase text-stone-950 tracking-wider">
                  {sec.category.name}
                </h3>
                <Link
                  to={`/categoria/${slug}`}
                  className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1"
                >
                  <span>Ver sección completa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {sec.articles.slice(0, 3).map((art) => (
                  <ArticleCard
                    key={art.article_uuid}
                    article={art}
                    variant="vertical"
                    showExcerpt={false}
                    showAuthor={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar (4 Cols) */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Sidebar Ad Space */}
          <AdSlot placement="SIDEBAR" />

          {/* Tendencias / Lo Más Leído */}
          <div className="bg-white border border-stone-200 p-5 rounded-sm">
            <div className="flex items-center gap-2 border-b-2 border-stone-900 pb-2 mb-4">
              <TrendingUp className="w-4 h-4 text-red-700" />
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-950">
                Tendencias / Lo Más Leído
              </h3>
            </div>

            <ol className="divide-y divide-stone-100">
              {trending_articles.map((art, idx) => (
                <li key={art.article_uuid} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className="font-serif font-black text-2xl text-stone-300 leading-none shrink-0 w-6 text-right">
                      {idx + 1}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <Link
                        to={`/categoria/${art.category_slug}`}
                        className="text-[10px] font-bold uppercase tracking-wider text-red-700 hover:underline block truncate"
                      >
                        {art.category_name}
                      </Link>
                      <Link
                        to={`/noticia/${art.slug}`}
                        className="font-serif font-bold text-xs sm:text-[13px] text-stone-900 hover:text-red-900 leading-snug line-clamp-2 block transition-colors"
                      >
                        {art.title}
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Tribuna Editorial */}
          <div className="bg-stone-100 border border-stone-200 p-5 rounded-sm space-y-4">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-950 border-b border-stone-300 pb-1">
              Tribuna Editorial
            </h3>

            <div className="space-y-3.5 text-xs text-stone-700">
              <div className="border-b border-stone-200 pb-3">
                <span className="font-serif font-semibold text-stone-900 block">Carlos Mendoza</span>
                <span className="text-[11px] text-stone-500 italic block mb-1">Análisis Regional</span>
                <p className="line-clamp-2 text-stone-600 leading-relaxed font-serif">
                  "El valor de la producción cerealera llanera frente a los retos económicos del ciclo agrícola nacional."
                </p>
              </div>

              <div>
                <span className="font-serif font-semibold text-stone-900 block">Elena Vásquez</span>
                <span className="text-[11px] text-stone-500 italic block mb-1">Seguridad y Comunidad</span>
                <p className="line-clamp-2 text-stone-600 leading-relaxed font-serif">
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
