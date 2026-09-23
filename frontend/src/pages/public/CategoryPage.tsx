import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Newspaper, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="py-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-stone-200 rounded"></div>
        <div className="h-4 w-96 bg-stone-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="h-64 bg-stone-200 rounded"></div>
          <div className="h-64 bg-stone-200 rounded"></div>
          <div className="h-64 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <SeoHead title="Sección no encontrada" noIndex={true} />
        <Newspaper className="w-12 h-12 text-stone-400 mx-auto" />
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Sección no encontrada
        </h1>
        <p className="text-stone-600 text-sm max-w-md mx-auto">
          La sección o categoría editorial que intenta consultar no existe o ha sido dada de baja.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-stone-800"
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
    <div className="py-4 space-y-8">
      <SeoHead
        title={`Noticias de ${category.name}`}
        description={category.description || `Últimas noticias y reportajes de la sección ${category.name} en Contacto con la Noticia.`}
        canonicalUrl={canonicalUrl}
        type="website"
        section={category.name}
        jsonLd={categoryJsonLd}
      />

      {/* 1. SECTION HEADER */}
      <header className="border-b-2 border-stone-900 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-red-700 block mb-1">
          Sección Editorial
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-950 uppercase tracking-tight">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-sm font-serif italic text-stone-600 mt-1 max-w-2xl">
            {category.description}
          </p>
        )}
      </header>

      {/* 2. ARTICLES GRID */}
      {articles.length === 0 ? (
        <div className="bg-white border border-stone-200 p-8 text-center my-6 rounded">
          <Newspaper className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h2 className="text-base font-serif font-bold text-stone-800">
            No hay noticias publicadas en esta sección
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Nuestros redactores están preparando nuevos contenidos para esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* 3. PAGINATION */}
      {pagination && pagination.total_pages > 1 && (
        <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-950 disabled:opacity-30 disabled:pointer-events-none px-3 py-1.5 border border-stone-300 rounded bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Página Anterior</span>
          </button>

          <span className="text-xs text-stone-500">
            Página <span className="font-semibold text-stone-800">{page}</span> de{' '}
            <span className="font-semibold text-stone-800">{pagination.total_pages}</span>
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pagination.total_pages}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-950 disabled:opacity-30 disabled:pointer-events-none px-3 py-1.5 border border-stone-300 rounded bg-white"
          >
            <span>Página Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

