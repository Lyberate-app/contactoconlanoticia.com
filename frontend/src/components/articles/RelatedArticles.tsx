import React from 'react';
import { ArticleCard } from './ArticleCard';
import type { RelatedArticle } from '../../types/article';
import { Sparkles } from 'lucide-react';

export interface RelatedArticlesProps {
  articles: RelatedArticle[];
  categoryName?: string;
  className?: string;
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  articles,
  categoryName,
  className = '',
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className={`pt-6 mt-8 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <h2 className="text-lg font-bold text-stone-950 tracking-tight">
          Noticias Relacionadas{categoryName ? ` en ${categoryName}` : ''}
        </h2>
      </div>

      {/* Mobile Horizontal Reel / Desktop 3-col Grid */}
      <div className="flex overflow-x-auto gap-4 no-scrollbar pb-3 sm:grid sm:grid-cols-3 sm:pb-0">
        {articles.map((rel) => (
          <div key={rel.article_uuid} className="min-w-[260px] sm:min-w-0 flex-1">
            <ArticleCard
              article={rel}
              variant="vertical"
              showAuthor={true}
              showExcerpt={true}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
};
