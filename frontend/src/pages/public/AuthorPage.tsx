import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { User, Newspaper, ArrowLeft, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { publicApi, PublicAuthor, PublicArticleSummary, PaginationMeta } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';

export const AuthorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [author, setAuthor] = useState<PublicAuthor | null>(null);
  const [articles, setArticles] = useState<PublicArticleSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    publicApi.getAuthorBySlug(slug, page, 9)
      .then(res => {
        setAuthor(res.author);
        setArticles(res.articles);
        setPagination(res.pagination);
        document.title = `${res.author.name} | Contacto con la Noticia`;
      })
      .catch((err) => {
        if (err.code === 'AUTHOR_NOT_FOUND' || err.status === 404) {
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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return new Intl.DateTimeFormat('es-VE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-8 space-y-6 animate-pulse">
        <div className="h-20 w-full bg-stone-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="h-64 bg-stone-200 rounded"></div>
          <div className="h-64 bg-stone-200 rounded"></div>
          <div className="h-64 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (notFound || !author) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <SeoHead title="Autor no encontrado" noIndex={true} />
        <User className="w-12 h-12 text-stone-400 mx-auto" />
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Autor no encontrado
        </h1>
        <p className="text-stone-600 text-sm max-w-md mx-auto">
          El periodista o autor editorial solicitado no se encuentra registrado en nuestro equipo.
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

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://contactoconlanoticia.com';
  const canonicalUrl = `${origin}/autor/${author.slug}`;

  const authorSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.name,
      description: author.bio || `Artículos y cobertura periodística de ${author.name} en Contacto con la Noticia.`,
      url: canonicalUrl,
      worksFor: {
        '@type': 'NewsMediaOrganization',
        name: 'Contacto con la Noticia',
        url: origin,
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
          item: origin,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: author.name,
          item: canonicalUrl,
        },
      ],
    },
  ];

  return (
    <div className="py-4 space-y-8">
      <SeoHead
        title={`Artículos de ${author.name}`}
        description={author.bio || `Perfil y noticias publicadas por el periodista ${author.name} en Contacto con la Noticia.`}
        canonicalUrl={canonicalUrl}
        type="website"
        authorName={author.name}
        jsonLd={authorSchema}
      />

      {/* 1. AUTHOR PROFILE HEADER */}
      <header className="bg-white border border-stone-200 p-6 sm:p-8 rounded flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-200 flex items-center justify-center font-serif font-bold text-2xl text-stone-800 shrink-0">
          {author.name.charAt(0)}
        </div>

        <div className="space-y-1.5 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700 block">
            Mesa de Redacción
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950">
            {author.name}
          </h1>
          {author.bio && (
            <p className="text-xs sm:text-sm font-serif italic text-stone-600 max-w-2xl leading-relaxed">
              {author.bio}
            </p>
          )}
        </div>
      </header>

      {/* 2. PUBLISHED ARTICLES */}
      <section className="space-y-4">
        <div className="border-b-2 border-stone-900 pb-1">
          <h2 className="font-serif text-base font-bold uppercase text-stone-950 tracking-wider">
            Artículos publicados por {author.name}
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white border border-stone-200 p-8 text-center my-6 rounded">
            <Newspaper className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-xs text-stone-500">
              Este autor no cuenta actualmente con noticias publicadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(art => (
              <article
                key={art.article_uuid}
                className="bg-white border border-stone-200 p-5 flex flex-col justify-between hover:border-stone-400 transition-colors"
              >
                <div className="space-y-2">
                  <Link
                    to={`/categoria/${art.category_slug}`}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-700 hover:underline block"
                  >
                    {art.category_name}
                  </Link>

                  <Link to={`/noticias/${art.slug}`} className="block group">
                    <h3 className="font-serif font-bold text-stone-900 text-base leading-snug group-hover:text-red-900 transition-colors">
                      {art.title}
                    </h3>
                  </Link>

                  {art.excerpt && (
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 text-[11px] text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(art.published_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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

