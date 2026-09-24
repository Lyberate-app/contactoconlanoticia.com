import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowUpRight } from 'lucide-react';
import { OptimizedImage } from '../common/OptimizedImage';
import { formatDate } from '../../utils/date';
import type { PublicArticleSummary } from '../../types/article';

export interface LeadArticleProps {
  article: PublicArticleSummary;
  kicker?: string;
  className?: string;
}

export const LeadArticle: React.FC<LeadArticleProps> = ({
  article,
  kicker = 'Tema Principal',
  className = '',
}) => {
  const articleUrl = `/noticia/${article.slug}`;
  const categoryUrl = `/categoria/${article.category_slug}`;
  const authorUrl = `/autor/${article.author_slug || 'carlos-mendoza'}`;

  return (
    <article className={`glass-card glass-card-interactive p-4 sm:p-6 rounded-[28px] space-y-4 relative ${className}`}>
      {/* 1. KICKER & CATEGORY CHIPS */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          to={categoryUrl}
          className="glass-pill px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50/70 inline-flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          <span>{article.category_name}</span>
        </Link>
        <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100/60">
          {kicker}
        </span>
      </div>

      {/* 2. MAIN HEADLINE */}
      <Link to={articleUrl} className="block group">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-stone-950 leading-[1.15] tracking-tight group-hover:text-rose-900 transition-colors">
          {article.title}
        </h2>
      </Link>

      {/* 3. SUBTITLE / DECK */}
      {article.subtitle && (
        <p className="text-sm sm:text-base lg:text-lg font-serif italic text-stone-600 leading-snug">
          {article.subtitle}
        </p>
      )}

      {/* 4. HERO PHOTOGRAPHY (SQUIRCLE CORNERS) */}
      <Link
        to={articleUrl}
        className="block overflow-hidden rounded-[20px] relative group aspect-[16/9] shadow-sm"
        tabIndex={-1}
        aria-hidden="true"
      >
        <OptimizedImage
          src={article.featured_media?.url}
          alt={article.featured_media?.alt_text || article.title}
          caption={article.featured_media?.caption}
          credit={article.featured_media?.credit}
          priority={true}
          aspectRatio="16/9"
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/20 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-30 transition-opacity"></div>
      </Link>

      {/* 5. EXCERPT */}
      {article.excerpt && (
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-serif pt-0.5 line-clamp-3">
          {article.excerpt}
        </p>
      )}

      {/* 6. GLASS BYLINE & TIMESTAMP TRAY */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl flex items-center justify-between text-xs text-stone-600 mt-2">
        <span className="flex items-center gap-2 font-medium text-stone-800">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px]">
            {article.author_name ? article.author_name.charAt(0) : 'R'}
          </div>
          <Link to={authorUrl} className="hover:text-rose-700 font-semibold text-[11px] sm:text-xs">
            {article.author_name || 'Redacción Contacto'}
          </Link>
        </span>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-stone-500 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            {formatDate(article.published_at)}
          </span>

          <Link
            to={articleUrl}
            className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-sm"
            aria-label="Leer noticia completa"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
