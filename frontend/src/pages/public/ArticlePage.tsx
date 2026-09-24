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
  Type,
  ArrowUp,
} from 'lucide-react';
import { publicApi, PublicArticleDetail } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { AdSlot } from '../../components/common/AdSlot';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { RelatedArticles } from '../../components/articles';
import { formatDate } from '../../utils/date';
import { SITE_URL } from '../../config/env';

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(0); // 0: Normal, 1: Grande, 2: Muy Grande
  const [readingProgress, setReadingProgress] = useState(0);

  const fontSizes = [
    'text-base sm:text-lg leading-relaxed',
    'text-lg sm:text-xl leading-relaxed',
    'text-xl sm:text-2xl leading-loose',
  ];

  const canonicalUrl = article?.seo?.canonical_url || `${SITE_URL}/noticia/${article?.slug || slug}`;

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
        ? [article.featured_media.url.startsWith('http') ? article.featured_media.url : `${SITE_URL}${article.featured_media.url}`]
        : [`${SITE_URL}/placeholder-news.jpg`],
      datePublished: article.published_at.replace(' ', 'T') + 'Z',
      dateModified: (article.modified_at || article.published_at).replace(' ', 'T') + 'Z',
      inLanguage: 'es-VE',
      author: {
        '@type': 'Person',
        name: article.author_name || 'Redacción Contacto',
        url: `${SITE_URL}/autor/${article.author_slug}`,
      },
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: 'Contacto con la Noticia',
        url: `${SITE_URL}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icons/icon-512x512.png`,
          width: 512,
          height: 512,
        },
        publishingPrinciples: `${SITE_URL}/`,
      },
      articleSection: article.category_name,
      keywords: article.tags?.map(t => t.name) || [],
      copyrightHolder: {
        '@type': 'NewsMediaOrganization',
        name: 'Contacto con la Noticia',
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
          name: article.category_name,
          item: `${SITE_URL}/categoria/${article.category_slug}`,
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

  // Track scroll progress for reading bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scroll = `${(totalScroll / windowHeight) * 100}`;
        setReadingProgress(Math.min(100, Math.max(0, Number(scroll))));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.subtitle || article.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const toggleFontSize = () => {
    setFontSizeIndex((prev) => (prev + 1) % fontSizes.length);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-6 animate-pulse">
        <div className="h-6 w-36 glass-pill rounded-full"></div>
        <div className="h-12 glass-card rounded-2xl"></div>
        <div className="h-6 w-3/4 glass-pill rounded-full"></div>
        <div className="h-72 glass-card rounded-[28px]"></div>
        <div className="space-y-3 pt-4">
          <div className="h-4 glass-pill rounded-full"></div>
          <div className="h-4 glass-pill rounded-full"></div>
          <div className="h-4 w-5/6 glass-pill rounded-full"></div>
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5 glass-card p-8 rounded-[28px] shadow-xl">
        <SeoHead title="Noticia no encontrada" noIndex={true} />
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center">
          <Newspaper className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Noticia no encontrada
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          El artículo que busca no existe, ha sido retirado o se encuentra en proceso de redacción.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-rose-900 transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la portada</span>
          </Link>
          <Link
            to="/buscar"
            className="glass-pill text-stone-800 px-4 py-2 rounded-full text-xs font-semibold hover:bg-stone-100"
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
    <div className="max-w-3xl mx-auto py-4 space-y-6 relative">
      {/* 1. iOS READING PROGRESS BAR (FIXED TOP) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-stone-200/40 z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-rose-700 to-rose-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

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
        imageAlt={article.featured_media?.alt_text || article.featured_media?.caption || article.title}
        jsonLd={jsonLdPayload}
      />

      {/* 2. BREADCRUMB CAPSULE */}
      <nav className="inline-flex items-center gap-1.5 text-xs text-stone-500 glass-pill px-3.5 py-1.5 rounded-full flex-wrap">
        <Link to="/" className="hover:text-stone-900 font-medium">Inicio</Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <Link to={`/categoria/${article.category_slug}`} className="hover:text-stone-900 font-semibold text-rose-700">
          {article.category_name}
        </Link>
        <ChevronRight className="w-3 h-3 text-stone-400" />
        <span className="text-stone-500 truncate max-w-[160px] sm:max-w-xs">{article.title}</span>
      </nav>

      {/* 3. ARTICLE HEADER */}
      <header className="space-y-4 pt-1">
        <Link
          to={`/categoria/${article.category_slug}`}
          className="glass-pill px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50/70 inline-flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          <span>{article.category_name}</span>
        </Link>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-stone-950 leading-[1.18] tracking-tight">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-base sm:text-lg lg:text-xl font-serif italic text-stone-600 leading-snug">
            {article.subtitle}
          </p>
        )}

        {/* BYLINE & TIMESTAMPS IN GLASS TRAY */}
        <div className="glass-panel p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center font-serif font-bold text-xs shadow-sm">
              {article.author_name.charAt(0)}
            </div>
            <div>
              <span className="font-semibold text-stone-900 block">
                Por{' '}
                <Link to={`/autor/${article.author_slug}`} className="hover:text-rose-700 hover:underline">
                  {article.author_name}
                </Link>
              </span>
              <span className="text-[11px] text-stone-500">Mesa de Redacción · Guárico</span>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 space-y-0.5 sm:text-right">
            <div className="flex items-center gap-1 sm:justify-end">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Publicado: {formatDate(article.published_at, 'full')}</span>
            </div>
            {article.modified_at && (
              <div className="flex items-center gap-1 text-stone-400 sm:justify-end">
                <Clock className="w-3 h-3" />
                <span>Actualizado: {formatDate(article.modified_at, 'full')}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 4. SOCIAL SHARING & READER TOOLBAR (iOS 27 Glass) */}
      <div className="glass-card p-2 sm:p-3 rounded-2xl flex items-center justify-between text-xs text-stone-700">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleNativeShare}
            className="glass-pill px-3 py-1.5 text-stone-800 font-semibold flex items-center gap-1.5 hover:bg-stone-100/80 active:scale-95 transition-transform"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Compartir</span>
          </button>

          <a
            href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-2.5 py-1.5 glass-pill text-emerald-800 hover:bg-emerald-50 text-[11px] font-medium"
          >
            WhatsApp
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-2.5 py-1.5 glass-pill text-stone-800 hover:bg-stone-100 text-[11px] font-medium"
          >
            X
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Font Size Adjuster (Apple News / Safari style) */}
          <button
            type="button"
            onClick={toggleFontSize}
            className="glass-pill px-2.5 py-1.5 text-stone-700 hover:text-stone-950 flex items-center gap-1 text-[11px] font-medium"
            title="Ajustar tamaño de letra"
          >
            <Type className="w-3.5 h-3.5" />
            <span>A{fontSizeIndex === 1 ? '+' : fontSizeIndex === 2 ? '++' : ''}</span>
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="glass-pill px-2.5 py-1.5 text-stone-700 hover:text-stone-900 transition-colors inline-flex items-center gap-1 text-[11px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">¡Copiado!</span>
              </>
            ) : (
              <span>Copiar enlace</span>
            )}
          </button>
        </div>
      </div>

      {/* 5. FEATURED IMAGE (SQUIRCLE CORNERS) */}
      {article.featured_media?.url ? (
        <div className="rounded-[28px] overflow-hidden shadow-sm glass-card p-1">
          <OptimizedImage
            src={article.featured_media.url}
            alt={article.featured_media.alt_text || article.title}
            caption={article.featured_media.caption}
            credit={article.featured_media.credit}
            priority={true}
            aspectRatio="16/9"
            className="rounded-[24px] object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] glass-card rounded-[28px] overflow-hidden flex items-center justify-center text-stone-400">
          <div className="text-center p-6">
            <Newspaper className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <span className="text-xs font-serif italic text-stone-500">
              Cobertura informativa · Contacto con la Noticia
            </span>
          </div>
        </div>
      )}

      {/* ARTICLE_TOP AD SLOT */}
      <AdSlot placement="ARTICLE_TOP" />

      {/* 6. EXCERPT & BODY PROSE */}
      <div className="space-y-6 pt-2">
        {article.excerpt && (
          <div className="glass-panel border-l-4 border-rose-700 p-4 sm:p-5 rounded-r-2xl text-base sm:text-lg font-serif italic text-stone-800 leading-relaxed shadow-sm">
            {article.excerpt}
          </div>
        )}

        {/* Rich article paragraphs with drop cap on first letter */}
        <div className={`text-stone-900 font-serif space-y-5 ${fontSizes[fontSizeIndex]}`}>
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
                    <span className="float-left text-4xl sm:text-5xl font-black font-serif leading-none pr-2 pt-1 text-rose-950">
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

        {/* 7. TAGS CLOUD (GLASS PILLS) */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t border-stone-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2.5">
              Temas relacionados:
            </span>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <Link
                  key={tag.tag_uuid}
                  to={`/buscar?q=${encodeURIComponent(tag.name)}`}
                  className="glass-pill px-3 py-1 rounded-full text-xs text-stone-700 hover:text-rose-700 inline-flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3 text-stone-400" />
                  <span>{tag.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 8. AUTHOR BIO CARD (iOS 27 Glass) */}
        <div className="glass-card p-5 rounded-[28px] space-y-3 mt-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-rose-900 text-white flex items-center justify-center font-serif font-bold text-sm shadow-md">
              {article.author_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                <Link to={`/autor/${article.author_slug}`} className="hover:text-rose-700">
                  {article.author_name}
                </Link>
              </h3>
              <span className="text-xs text-stone-500">Periodista / Redactor Especializado</span>
            </div>
          </div>
          {article.author_bio && (
            <p className="text-xs text-stone-600 leading-relaxed">
              {article.author_bio}
            </p>
          )}
          <Link
            to={`/autor/${article.author_slug}`}
            className="text-xs font-semibold text-rose-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Ver más artículos de este autor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ARTICLE_BOTTOM AD SLOT */}
      <AdSlot placement="ARTICLE_BOTTOM" />

      {/* 9. RELATED ARTICLES */}
      <RelatedArticles
        articles={article.related_articles}
        categoryName={article.category_name}
      />

      {/* 10. FLOATING BACK TO TOP GLASS BUTTON (MOBILE ONLY) */}
      <div className="fixed bottom-20 right-4 z-30 md:hidden">
        <button
          type="button"
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full glass-dock flex items-center justify-center text-stone-700 shadow-xl active:scale-90"
          aria-label="Volver arriba"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
