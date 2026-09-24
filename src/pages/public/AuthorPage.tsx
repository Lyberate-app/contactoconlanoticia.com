import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { User, Newspaper, ArrowLeft, ChevronLeft, ChevronRight, PenTool } from 'lucide-react';
import { publicApi, PublicAuthor, PublicArticleSummary, PaginationMeta } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { ArticleCard } from '../../components/articles';
import { SITE_URL } from '../../config/env';

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

  if (loading) {
    return (
      <div className="py-6 space-y-6 animate-pulse">
        <div className="h-32 glass-card rounded-[28px]"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="h-64 glass-card rounded-[24px]"></div>
          <div className="h-64 glass-card rounded-[24px]"></div>
          <div className="h-64 glass-card rounded-[24px]"></div>
        </div>
      </div>
    );
  }

  if (notFound || !author) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5 glass-card p-8 rounded-[28px] shadow-xl">
        <SeoHead title="Autor no encontrado" noIndex={true} />
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Autor no encontrado
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          El periodista o autor editorial solicitado no se encuentra registrado en nuestro equipo.
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

  const canonicalUrl = `${SITE_URL}/autor/${author.slug}`;
  const authorAvatar = author.avatar_url
    ? (author.avatar_url.startsWith('http') ? author.avatar_url : `${SITE_URL}${author.avatar_url}`)
    : `${SITE_URL}/placeholder-news.jpg`;

  const authorSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: `Perfil de ${author.name} | Contacto con la Noticia`,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Contacto con la Noticia',
        url: `${SITE_URL}/`,
      },
      mainEntity: {
        '@type': 'Person',
        name: author.name,
        description: author.bio || `Artículos y cobertura periodística de ${author.name} en Contacto con la Noticia.`,
        url: canonicalUrl,
        image: authorAvatar,
        jobTitle: 'Periodista / Redactor',
        worksFor: {
          '@type': 'NewsMediaOrganization',
          name: 'Contacto con la Noticia',
          url: `${SITE_URL}/`,
        },
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
          name: author.name,
          item: canonicalUrl,
        },
      ],
    },
  ];

  return (
    <div className="py-2 space-y-6">
      <SeoHead
        title={`Artículos de ${author.name}`}
        description={author.bio || `Perfil y noticias publicadas por el periodista ${author.name} en Contacto con la Noticia.`}
        canonicalUrl={canonicalUrl}
        type="website"
        imageUrl={author.avatar_url || undefined}
        imageAlt={`Fotografía de ${author.name}`}
        authorName={author.name}
        jsonLd={authorSchema}
      />

      {/* 1. iOS 27 AUTHOR PROFILE HERO */}
      <header className="glass-card p-6 sm:p-8 rounded-[28px] flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
        {author.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={author.name}
            className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-white/80 shadow-md shrink-0"
          />
        ) : (
          <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-rose-900 to-rose-700 text-white flex items-center justify-center font-serif font-black text-3xl shadow-md shrink-0">
            {author.name.charAt(0)}
          </div>
        )}

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="glass-pill px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 inline-flex items-center gap-1.5">
              <PenTool className="w-3 h-3" />
              Mesa de Redacción
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-950 tracking-tight">
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
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-rose-700 rounded-full"></span>
          <h2 className="text-lg font-bold text-stone-950 tracking-tight">
            Artículos publicados por {author.name}
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="glass-card p-10 text-center my-6 rounded-[28px] max-w-md mx-auto shadow-sm">
            <Newspaper className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-xs text-stone-500">
              Este autor no cuenta actualmente con noticias publicadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((art) => (
              <ArticleCard
                key={art.article_uuid}
                article={art}
                variant="vertical"
                showCategory={true}
                showAuthor={false}
                showExcerpt={true}
              />
            ))}
          </div>
        )}
      </section>

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
