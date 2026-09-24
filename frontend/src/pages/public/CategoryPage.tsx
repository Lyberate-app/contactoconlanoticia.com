import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Newspaper, ArrowLeft, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { publicApi, PublicCategory, PublicArticleSummary, PaginationMeta } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { ArticleCard } from '../../components/articles';
import { SITE_URL } from '../../config/env';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [category, setCategory] = useState<PublicCategory | null>(null);
  const [articles, setArticles] = useState<PublicArticleSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    publicApi.getCategoryBySlug(slug, page, 9)
      .then(res => {
        setCategory(res.category);
        setArticles(res.articles);
        setPagination(res.pagination);
        document.title = `${res.category.name} | Contacto con la Noticia`;
      })
      .catch((err) => {
        if (err.code === 'CATEGORY_NOT_FOUND' || err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      document.title = 'Contacto con la Noticia';
    };
  }, [slug, page]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="py-6 space-y-6 animate-pulse">
        <div className="h-24 glass-card rounded-[28px]"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="h-64 glass-card rounded-[24px]"></div>
          <div className="h-64 glass-card rounded-[24px]"></div>
          <div className="h-64 glass-card rounded-[24px]"></div>
        </div>
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5 glass-card p-8 rounded-[28px] shadow-xl">
        <SeoHead title="Sección no encontrada" noIndex={true} />
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center">
          <Newspaper className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Sección no encontrada
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          La sección o categoría editorial que intenta consultar no existe o ha sido dada de baja.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-rose-900 transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la portada</span>
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = `${SITE_URL}/categoria/${category.slug}`;

  const categoryJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Noticias de ${category.name} | Contacto con la Noticia`,
      description: category.description || `Últimas noticias y reportajes de la sección ${category.name} en Contacto con la Noticia.`,
      url: canonicalUrl,
      inLanguage: 'es-VE',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Contacto con la Noticia',
        url: `${SITE_URL}/`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Portada',
          item: `${SITE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: category.name,
          item: canonicalUrl,
        },
      ],
    },
  ];

  return (
    <div className="py-2 space-y-6">
      <SeoHead
        title={`Noticias de ${category.name}`}
        description={category.description || `Últimas noticias y reportajes de la sección ${category.name} en Contacto con la Noticia.`}
        canonicalUrl={canonicalUrl}
        type="website"
        section={category.name}
        jsonLd={categoryJsonLd}
      />

      {/* 1. iOS 27 GLASS SECTION HERO */}
      <header className="glass-card p-6 sm:p-8 rounded-[28px] relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
            Sección Editorial
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-stone-950 uppercase tracking-tight">
          {category.name}
        </h1>

        {category.description && (
          <p className="text-xs sm:text-sm font-serif italic text-stone-600 mt-2 max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </header>

      {/* 2. ARTICLES GRID */}
      {articles.length === 0 ? (
        <div className="glass-card p-10 text-center my-6 rounded-[28px] max-w-md mx-auto shadow-sm">
          <Newspaper className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h2 className="text-base font-serif font-bold text-stone-800">
            No hay noticias publicadas en esta sección
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Nuestros redactores están preparando nuevos contenidos para esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((art) => (
            <ArticleCard
              key={art.article_uuid}
              article={art}
              variant="vertical"
              showCategory={false}
              showAuthor={true}
              showExcerpt={true}
            />
          ))}
        </div>
      )}

      {/* 3. iOS 27 GLASS PAGINATION */}
      {pagination && pagination.total_pages > 1 && (
        <div className="pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="glass-pill px-4 py-2 text-xs font-semibold text-stone-800 hover:text-rose-700 disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <span className="glass-pill px-3.5 py-1 text-xs text-stone-600">
            Página <span className="font-bold text-stone-900">{page}</span> de{' '}
            <span className="font-bold text-stone-900">{pagination.total_pages}</span>
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pagination.total_pages}
            className="glass-pill px-4 py-2 text-xs font-semibold text-stone-800 hover:text-rose-700 disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
