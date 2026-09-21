import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  Share2,
  Calendar,
  Tag,
  ArrowLeft,
  Check,
  Newspaper,
  ChevronRight,
} from 'lucide-react';
import { publicApi, PublicArticleDetail } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { AdSlot } from '../../components/common/AdSlot';

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://contactoconlanoticia.com';
  const canonicalUrl = article?.seo?.canonical_url || `${origin}/noticia/${article?.slug || slug}`;

  const jsonLdPayload = article ? [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      headline: article.seo?.meta_title || article.title,
      description: article.seo?.meta_description || article.excerpt || article.subtitle || '',
      image: article.featured_media?.url
        ? [article.featured_media.url.startsWith('http') ? article.featured_media.url : `${origin}${article.featured_media.url}`]
        : [`${origin}/placeholder-news.jpg`],
      datePublished: article.published_at.replace(' ', 'T') + 'Z',
      dateModified: (article.modified_at || article.published_at).replace(' ', 'T') + 'Z',
      author: {
        '@type': 'Person',
        name: article.author_name || 'Redacción Contacto',
        url: `${origin}/autor/${article.author_slug}`,
      },
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: 'Contacto con la Noticia',
        url: origin,
        logo: {
          '@type': 'ImageObject',
          url: `${origin}/logo.png`,
        },
      },
      articleSection: article.category_name,
      keywords: article.tags?.map(t => t.name) || [],
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
          name: article.category_name,
          item: `${origin}/categoria/${article.category_slug}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: canonicalUrl,
        },
      ],
    },
  ] : undefined;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    publicApi.getArticleBySlug(slug)
      .then(data => {
        setArticle(data);
        // Set document title dynamically
        if (data.title) {
          document.title = `${data.title} | Contacto con la Noticia`;
        }
      })
      .catch((err) => {
        if (err.code === 'ARTICLE_NOT_FOUND' || err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      document.title = 'Contacto con la Noticia';
    };
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return new Intl.DateTimeFormat('es-VE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-stone-200 rounded"></div>
        <div className="h-12 bg-stone-200 rounded"></div>
        <div className="h-6 w-3/4 bg-stone-200 rounded"></div>
        <div className="h-64 bg-stone-200 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 bg-stone-200 rounded"></div>
          <div className="h-4 bg-stone-200 rounded"></div>
          <div className="h-4 w-5/6 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <SeoHead title="Noticia no encontrada" noIndex={true} />
        <Newspaper className="w-12 h-12 text-stone-400 mx-auto" />
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Noticia no encontrada
        </h1>
        <p className="text-stone-600 text-sm max-w-md mx-auto">
          El artículo que busca no existe, ha sido retirado o se encuentra en proceso de redacción y aún no ha sido publicado.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-stone-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la portada</span>
          </Link>
          <Link
            to="/buscar"
            className="border border-stone-300 text-stone-800 px-4 py-2 rounded text-xs font-semibold hover:bg-stone-100"
          >
            Buscar en el archivo
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(article.title);

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      <SeoHead
        title={article.seo?.meta_title || article.title}
        description={article.seo?.meta_description || article.excerpt || article.subtitle || undefined}
        canonicalUrl={canonicalUrl}
        type="article"
        imageUrl={article.featured_media?.url}
        publishedTime={article.published_at.replace(' ', 'T') + 'Z'}
        modifiedTime={(article.modified_at || article.published_at).replace(' ', 'T') + 'Z'}
        section={article.category_name}
        authorName={article.author_name}
        jsonLd={jsonLdPayload}
      />

      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 flex-wrap">
        <Link to="/" className="hover:text-stone-900">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
        <Link to={`/categoria/${article.category_slug}`} className="hover:text-stone-900 font-medium">
          {article.category_name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
        <span className="text-stone-700 truncate max-w-xs sm:max-w-md">{article.title}</span>
      </nav>

      {/* 2. ARTICLE HEADER */}
      <header className="space-y-4 border-b border-stone-200 pb-6">
        <Link
          to={`/categoria/${article.category_slug}`}
          className="inline-block text-xs font-bold uppercase tracking-wider text-red-700 hover:underline"
        >
          {article.category_name}
        </Link>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-950 leading-tight">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-lg sm:text-xl font-serif italic text-stone-700 leading-snug">
            {article.subtitle}
          </p>
        )}

        {/* BYLINE & TIMESTAMPS */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600 border-t border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center font-serif font-bold text-stone-700 text-xs">
              {article.author_name.charAt(0)}
            </div>
            <div>
              <span className="font-semibold text-stone-900 block">
                Por{' '}
                <Link to={`/autor/${article.author_slug}`} className="hover:text-red-700 hover:underline">
                  {article.author_name}
                </Link>
              </span>
              <span className="text-[11px] text-stone-500">Mesa de Redacción · Guárico</span>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 space-y-0.5 sm:text-right">
            <div className="flex items-center gap-1 sm:justify-end">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Publicado: {formatDate(article.published_at)}</span>
            </div>
            {article.modified_at && (
              <div className="flex items-center gap-1 text-stone-400 sm:justify-end">
                <Clock className="w-3 h-3" />
                <span>Actualizado: {formatDate(article.modified_at)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. SOCIAL SHARING BAR */}
      <div className="flex items-center justify-between py-2 border-y border-stone-200 text-xs text-stone-600">
        <span className="flex items-center gap-1.5 font-medium text-stone-700">
          <Share2 className="w-4 h-4 text-stone-500" />
          <span>Compartir esta noticia:</span>
        </span>

        <div className="flex items-center gap-2">
          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 hover:bg-emerald-100 font-medium transition-colors"
          >
            WhatsApp
          </a>

          {/* X / Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded border border-stone-200 hover:bg-stone-200 font-medium transition-colors"
          >
            X (Twitter)
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded border border-blue-200 hover:bg-blue-100 font-medium transition-colors"
          >
            Facebook
          </a>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded border border-stone-200 hover:bg-stone-200 transition-colors inline-flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">¡Copiado!</span>
              </>
            ) : (
              <span>Copiar enlace</span>
            )}
          </button>
        </div>
      </div>

      {/* 4. FEATURED IMAGE FRAME */}
      <div className="space-y-1.5">
        <div className="aspect-[16/9] bg-stone-200 border border-stone-300 rounded overflow-hidden flex items-center justify-center text-stone-500">
          <div className="text-center p-6">
            <Newspaper className="w-12 h-12 mx-auto text-stone-400 mb-2" />
            <span className="text-xs font-serif italic text-stone-600">
              Cobertura informativa oficial · Contacto con la Noticia
            </span>
          </div>
        </div>
        <p className="text-[11px] font-serif italic text-stone-500 text-center">
          Fotografía de archivo / Redacción Central de Contacto con la Noticia en San Juan de los Morros.
        </p>
      </div>

      {/* ARTICLE_TOP AD SLOT */}
      <AdSlot placement="ARTICLE_TOP" />

      {/* 5. EXCERPT & BODY PROSE */}
      <div className="max-w-prose mx-auto space-y-6">
        {article.excerpt && (
          <div className="border-l-4 border-red-700 pl-4 py-1 text-base sm:text-lg font-serif italic text-stone-800 leading-relaxed bg-stone-100/50">
            {article.excerpt}
          </div>
        )}

        {/* Rich article paragraphs with drop cap on first letter */}
        <div className="text-base sm:text-lg text-stone-900 font-serif leading-relaxed space-y-5">
          {(() => {
            const paragraphs = article.content.split('\n\n').filter(p => p.trim().length > 0);
            const middleIndex = Math.max(1, Math.floor(paragraphs.length / 2));

            return paragraphs.map((paragraph, idx) => {
              const trimmed = paragraph.trim();
              const isDropCap = idx === 0;
              const isMiddle = idx === middleIndex && paragraphs.length > 2;

              let contentEl: React.ReactNode = null;
              if (isDropCap) {
                const firstLetter = trimmed.charAt(0);
                const rest = trimmed.slice(1);
                contentEl = (
                  <p key={idx} className="leading-relaxed">
                    <span className="float-left text-4xl sm:text-5xl font-black font-serif leading-none pr-2 pt-1 text-stone-950">
                      {firstLetter}
                    </span>
                    {rest}
                  </p>
                );
              } else {
                contentEl = <p key={idx}>{trimmed}</p>;
              }

              if (isMiddle) {
                return (
                  <React.Fragment key={idx}>
                    {contentEl}
                    <AdSlot placement="ARTICLE_MIDDLE" />
                  </React.Fragment>
                );
              }

              return contentEl;
            });
          })()}
        </div>

        {/* 6. TAGS CLOUD */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t border-stone-200">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
              Temas relacionados:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map(tag => (
                <Link
                  key={tag.tag_uuid}
                  to={`/buscar?q=${encodeURIComponent(tag.name)}`}
                  className="inline-flex items-center gap-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded transition-colors"
                >
                  <Tag className="w-3 h-3 text-stone-400" />
                  <span>{tag.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 7. AUTHOR BIO BOX */}
        <div className="bg-stone-100 border border-stone-200 p-5 rounded space-y-3 mt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-300 flex items-center justify-center font-serif font-bold text-stone-800 text-sm">
              {article.author_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                <Link to={`/autor/${article.author_slug}`} className="hover:underline">
                  {article.author_name}
                </Link>
              </h3>
              <span className="text-xs text-stone-500">Periodista / Redactor</span>
            </div>
          </div>
          {article.author_bio && (
            <p className="text-xs text-stone-600 leading-relaxed">
              {article.author_bio}
            </p>
          )}
          <Link
            to={`/autor/${article.author_slug}`}
            className="text-xs font-semibold text-red-700 hover:underline inline-block"
          >
            Ver más artículos de este autor &rarr;
          </Link>
        </div>
      </div>

      {/* ARTICLE_BOTTOM AD SLOT */}
      <AdSlot placement="ARTICLE_BOTTOM" />

      {/* 8. RELATED ARTICLES */}
      {article.related_articles && article.related_articles.length > 0 && (
        <section className="border-t-2 border-stone-900 pt-6 mt-12">
          <h2 className="font-serif text-lg font-bold uppercase tracking-wider text-stone-950 mb-4">
            Noticias Relacionadas en {article.category_name}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {article.related_articles.map(rel => (
              <article key={rel.article_uuid} className="bg-white border border-stone-200 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  {rel.category_name}
                </span>

                <Link to={`/noticias/${rel.slug}`} className="block group">
                  <h3 className="font-serif font-bold text-stone-900 text-sm leading-snug group-hover:text-red-900 transition-colors">
                    {rel.title}
                  </h3>
                </Link>

                <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                  {formatDate(rel.published_at)}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
