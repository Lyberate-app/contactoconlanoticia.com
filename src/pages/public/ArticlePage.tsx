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
  MessageSquare,
  Send,
  ShieldCheck,
  ThumbsUp,
} from 'lucide-react';
import { publicApi, PublicArticleDetail } from '../../services/publicApi';
import { SeoHead } from '../../components/common/SeoHead';
import { AdSlot } from '../../components/common/AdSlot';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { RelatedArticles } from '../../components/articles';
import { formatDate } from '../../utils/date';
import { SITE_URL } from '../../config/env';

// Helper to resolve realistic journalist portrait photos
const getAuthorAvatar = (name?: string, slug?: string): string => {
  if (slug?.includes('maria') || name?.toLowerCase().includes('maría') || name?.toLowerCase().includes('maria')) {
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&q=80';
  }
  if (slug?.includes('valderrama') || name?.toLowerCase().includes('valderrama')) {
    return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80';
  }
  // Default: Carlos Mendoza (Periodista Principal)
  return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80';
};

interface CommentItem {
  id: string;
  name: string;
  email: string;
  text: string;
  date: string;
  likes: number;
}

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(0); // 0: Normal, 1: Grande, 2: Muy Grande
  const [readingProgress, setReadingProgress] = useState(0);

  // Comments state with pre-populated community opinions
  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: 'c1',
      name: 'Manuel Rivas',
      email: 'm.rivas@gmail.com',
      text: 'Excelente cobertura periodística y seguimiento a las obras viales en el estado. Es fundamental mantener informada a la ciudadanía.',
      date: 'Hace 2 horas',
      likes: 5,
    },
    {
      id: 'c2',
      name: 'Elena Morales',
      email: 'elena.morales@hotmail.com',
      text: 'Muy oportuna la noticia. Esperamos que los trabajos concluyan antes de que inicie la temporada de lluvias.',
      date: 'Hace 45 minutos',
      likes: 3,
    },
  ]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    const newC: CommentItem = {
      id: `c_${Date.now()}`,
      name: commentName.trim(),
      email: commentEmail.trim(),
      text: commentText.trim(),
      date: 'Justo ahora',
      likes: 0,
    };
    setComments([newC, ...comments]);
    setCommentName('');
    setCommentEmail('');
    setCommentText('');
    setCommentSubmitted(true);
    setTimeout(() => setCommentSubmitted(false), 4000);
  };

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
            <div className="w-10 h-10 rounded-full overflow-hidden border border-rose-200/80 shadow-sm shrink-0 bg-rose-100 flex items-center justify-center">
              <img
                src={getAuthorAvatar(article.author_name, article.author_slug)}
                alt={article.author_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-semibold text-stone-900 block text-xs">
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
      <div className="glass-card p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleNativeShare}
            className="glass-pill px-3 py-1.5 text-stone-800 font-semibold flex items-center gap-1.5 hover:bg-stone-100 active:scale-95 transition-transform cursor-pointer"
            title="Compartir noticia"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-700" />
            <span>Compartir</span>
          </button>

          <a
            href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 text-[11px] font-semibold transition cursor-pointer"
            title="Compartir en WhatsApp"
          >
            <span>WhatsApp</span>
          </a>

          <a
            href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-800 hover:bg-sky-500/20 text-[11px] font-semibold transition cursor-pointer"
            title="Compartir en Telegram"
          >
            <span>Telegram</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-900/10 text-stone-900 hover:bg-stone-900/20 text-[11px] font-semibold transition cursor-pointer"
            title="Compartir en X (Twitter)"
          >
            <span>𝕏</span>
          </a>

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-800 hover:bg-blue-600/20 text-[11px] font-semibold transition cursor-pointer"
            title="Compartir en Facebook"
          >
            <span>Facebook</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="glass-pill px-3 py-1.5 text-stone-600 flex items-center gap-1.5 hover:text-stone-900 active:scale-95 transition-transform cursor-pointer"
            title="Copiar enlace"
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

        {/* Text Size Control */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFontSize}
            className="glass-pill px-3 py-1.5 text-stone-700 font-semibold flex items-center gap-1 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
            title="Ajustar tamaño de letra"
          >
            <Type className="w-3.5 h-3.5 text-rose-700" />
            <span className="text-[11px]">
              {fontSizeIndex === 0 ? 'A' : fontSizeIndex === 1 ? 'A+' : 'A++'}
            </span>
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
        <div className="glass-card p-5 sm:p-6 rounded-[28px] space-y-3 mt-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-rose-200/80 shadow-md shrink-0 bg-rose-100 flex items-center justify-center">
              <img
                src={getAuthorAvatar(article.author_name, article.author_slug)}
                alt={article.author_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                <Link to={`/autor/${article.author_slug}`} className="hover:text-rose-700">
                  {article.author_name}
                </Link>
              </h3>
              <span className="text-xs text-stone-500 font-sans">Periodista / Redactor Especializado</span>
            </div>
          </div>
          {article.author_bio && (
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              {article.author_bio}
            </p>
          )}
          <Link
            to={`/autor/${article.author_slug}`}
            className="text-xs font-semibold text-rose-700 hover:underline inline-flex items-center gap-1 font-sans"
          >
            <span>Ver más artículos de este autor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 9. SECCIÓN DE COMENTARIOS Y OPINIÓN CIUDADANA */}
        <div className="glass-card p-6 sm:p-7 rounded-[32px] space-y-6 mt-8 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Comentarios y Opinión Ciudadana ({comments.length})
                </h3>
                <span className="text-[11px] text-stone-500">
                  Espacio moderado de intercambio comunitario
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protección Cloudflare Turnstile</span>
            </div>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tu Nombre o Apodo *
                </label>
                <input
                  type="text"
                  required
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Ej. Carlos Valera"
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Correo Electrónico (No se publicará)
                </label>
                <input
                  type="email"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Escribe tu comentario u opinión sobre esta noticia *
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Comparta su punto de vista respetuoso con la comunidad..."
                className="w-full px-3.5 py-2.5 bg-stone-50 rounded-2xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-sans leading-relaxed resize-none"
              />
            </div>

            {commentSubmitted && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Tu comentario ha sido publicado con éxito tras la verificación anti-bot!</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verificación Cloudflare Turnstile activa contra spam y bots automáticos</span>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-800 hover:bg-rose-900 active:scale-95 text-white font-semibold rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar Opinión</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-200 text-rose-900 font-bold text-xs flex items-center justify-center">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <span className="text-[10px] text-stone-400 ml-2">{c.date}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setComments(comments.map((item) => (item.id === c.id ? { ...item, likes: item.likes + 1 } : item)));
                    }}
                    className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-rose-700 bg-white px-2 py-0.5 rounded-full border border-stone-200 cursor-pointer"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{c.likes}</span>
                  </button>
                </div>
                <p className="text-xs text-stone-700 font-sans leading-relaxed pl-9">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
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
