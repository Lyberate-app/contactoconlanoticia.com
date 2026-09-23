import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
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
    <article className={`space-y-4 ${className}`}>
      {/* 1. KICKER & CATEGORY BADGE */}
      <div className="flex items-center gap-2">
        <Link
          to={categoryUrl}
          className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-700 hover:underline"
        >
          {article.category_name}
        </Link>
        <span className="text-stone-300 text-xs">·</span>
        <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">
          {kicker}
        </span>
      </div>

      {/* 2. MAIN HEADLINE */}
      <Link to={articleUrl} className="block group">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-black text-stone-950 leading-[1.12] group-hover:text-red-900 transition-colors">
          {article.title}
        </h2>
      </Link>

      {/* 3. SUBTITLE / DECK */}
      {article.subtitle && (
        <p className="text-base sm:text-lg lg:text-xl font-serif italic text-stone-700 leading-snug">
          {article.subtitle}
        </p>
      )}

      {/* 4. HERO PHOTOGRAPHY */}
      <Link to={articleUrl} className="block overflow-hidden rounded-sm" tabIndex={-1} aria-hidden="true">
        <OptimizedImage
          src={article.featured_media?.url}
          alt={article.featured_media?.alt_text || article.title}
          caption={article.featured_media?.caption}
          credit={article.featured_media?.credit}
          priority={true}
          aspectRatio="16/9"
          className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500"
        />
      </Link>

      {/* 5. EXCERPT */}
      {article.excerpt && (
        <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-serif pt-1">
          {article.excerpt}
        </p>
      )}

      {/* 6. BYLINE & TIMESTAMP */}
      <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-200">
        <span className="flex items-center gap-1.5 font-medium text-stone-800">
          <User className="w-3.5 h-3.5 text-stone-400" />
          <Link to={authorUrl} className="hover:text-red-700 hover:underline">
            {article.author_name}
          </Link>
        </span>

        <span className="flex items-center gap-1 text-stone-500">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          {formatDate(article.published_at)}
        </span>
      </div>
    </article>
  );
};

