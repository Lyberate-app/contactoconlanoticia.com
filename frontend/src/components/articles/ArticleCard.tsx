import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { OptimizedImage } from '../common/OptimizedImage';
import { formatDate } from '../../utils/date';
import type { PublicArticleSummary, RelatedArticle } from '../../types/article';

export interface ArticleCardProps {
  article: PublicArticleSummary | RelatedArticle;
  variant?: 'vertical' | 'horizontal' | 'compact';
  showExcerpt?: boolean;
  showCategory?: boolean;
  showAuthor?: boolean;
  showImage?: boolean;
  priority?: boolean;
  className?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'vertical',
  showExcerpt = true,
  showCategory = true,
  showAuthor = true,
  showImage = true,
  priority = false,
  className = '',
}) => {
  const articleUrl = `/noticia/${article.slug}`;
  const categoryUrl = `/categoria/${article.category_slug}`;
  const authorUrl = `/autor/${article.author_name ? article.author_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'redaccion'}`;
  const hasImage = Boolean(article.featured_media?.url);

  // 1. COMPACT VARIANT (Trending, Dense Lists, Sidebars)
  if (variant === 'compact') {
    return (
      <article className={`group py-2.5 flex items-start gap-3 border-b border-stone-200 last:border-b-0 ${className}`}>
        {showImage && hasImage && (
          <Link
            to={articleUrl}
            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-sm bg-stone-100 block"
            tabIndex={-1}
            aria-hidden="true"
          >
            <OptimizedImage
              src={article.featured_media?.url}
              alt={article.featured_media?.alt_text || article.title}
              aspectRatio="1/1"
              priority={priority}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          {showCategory && (
            <Link
              to={categoryUrl}
              className="text-[10px] font-bold uppercase tracking-wider text-red-700 hover:underline block truncate"
            >
              {article.category_name}
            </Link>
          )}

          <Link to={articleUrl} className="block">
            <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-[15px] leading-snug group-hover:text-red-900 transition-colors line-clamp-2">
              {article.title}
            </h4>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <Clock className="w-3 h-3 text-stone-400" />
            <span>{formatDate(article.published_at)}</span>
          </div>
        </div>
      </article>
    );
  }

  // 2. HORIZONTAL VARIANT (Search Results, Feeds, Secondary Grids)
  if (variant === 'horizontal') {
    return (
      <article className={`group py-4 sm:py-5 flex flex-col sm:flex-row items-start gap-4 border-b border-stone-200 last:border-b-0 ${className}`}>
        {showImage && (
          <Link
            to={articleUrl}
            className="w-full sm:w-44 md:w-52 shrink-0 aspect-[16/9] overflow-hidden rounded-sm bg-stone-100 block"
            tabIndex={-1}
            aria-hidden="true"
          >
            <OptimizedImage
              src={article.featured_media?.url}
              alt={article.featured_media?.alt_text || article.title}
              aspectRatio="16/9"
              priority={priority}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            {showCategory && (
              <Link
                to={categoryUrl}
                className="text-[10px] font-bold uppercase tracking-wider text-red-700 hover:underline"
              >
                {article.category_name}
              </Link>
            )}
            <span className="text-stone-300 text-xs">·</span>
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              {formatDate(article.published_at)}
            </span>
          </div>

          <Link to={articleUrl} className="block">
            <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg lg:text-xl leading-snug group-hover:text-red-900 transition-colors">
              {article.title}
            </h3>
          </Link>

          {'subtitle' in article && article.subtitle && (
            <p className="text-xs sm:text-sm font-serif italic text-stone-600 line-clamp-1">
              {article.subtitle}
            </p>
          )}

          {showExcerpt && article.excerpt && (
            <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {showAuthor && article.author_name && (
            <div className="text-[11px] text-stone-500 pt-1">
              Por{' '}
              <Link to={authorUrl} className="font-medium text-stone-700 hover:underline">
                {article.author_name}
              </Link>
            </div>
          )}
        </div>
      </article>
    );
  }

  // 3. VERTICAL VARIANT (Standard Card for Grids)
  return (
    <article className={`group bg-white border border-stone-200 p-4 sm:p-5 flex flex-col justify-between hover:border-stone-400 transition-colors ${className}`}>
      <div className="space-y-3">
        {showImage && (
          <Link
            to={articleUrl}
            className="block aspect-[16/9] overflow-hidden rounded-sm bg-stone-100"
            tabIndex={-1}
            aria-hidden="true"
          >
            <OptimizedImage
              src={article.featured_media?.url}
              alt={article.featured_media?.alt_text || article.title}
              aspectRatio="16/9"
              priority={priority}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        )}

        <div className="space-y-1.5">
          {showCategory && (
            <Link
              to={categoryUrl}
              className="text-[10px] font-bold uppercase tracking-wider text-red-700 hover:underline block"
            >
              {article.category_name}
            </Link>
          )}

          <Link to={articleUrl} className="block">
            <h3 className="font-serif font-bold text-stone-900 text-lg leading-snug group-hover:text-red-900 transition-colors line-clamp-3">
              {article.title}
            </h3>
          </Link>

          {'subtitle' in article && article.subtitle && (
            <p className="text-xs font-serif italic text-stone-600 line-clamp-2 leading-normal">
              {article.subtitle}
            </p>
          )}

          {showExcerpt && article.excerpt && (
            <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
        {showAuthor && article.author_name ? (
          <Link to={authorUrl} className="hover:underline text-stone-700 font-medium truncate max-w-[140px]">
            {article.author_name}
          </Link>
        ) : (
          <span></span>
        )}

        <span className="flex items-center gap-1 shrink-0 text-stone-400">
          <Clock className="w-3 h-3" />
          {formatDate(article.published_at)}
        </span>
      </div>
    </article>
  );
};

