import React from 'react';
import { ArticleCard } from './ArticleCard';
import type { RelatedArticle } from '../../types/article';

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
    <section className={`border-t-2 border-stone-900 pt-6 mt-10 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-wider text-stone-950">
          Noticias Relacionadas{categoryName ? ` en ${categoryName}` : ''}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {articles.map((rel) => (
          <ArticleCard
            key={rel.article_uuid}
            article={rel}
            variant="vertical"
            showAuthor={true}
            showExcerpt={true}
          />
        ))}
      </div>
    </section>
  );
};

