import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { PublicArticleSummary } from '../../types/article';

export interface NewsTickerProps {
  articles: PublicArticleSummary[];
  label?: string;
  className?: string;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  articles,
  label = 'Última Hora',
  className = '',
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div
      className={`text-white text-xs flex items-center overflow-hidden border-y ${className}`}
      style={{ backgroundColor: 'var(--color-brand-primary, #881337)' }}
      aria-label={`${label}: ${articles.length} noticias`}
    >
      {/* Kicker Tag */}
      <div className="text-white font-bold px-3 py-2.5 flex items-center gap-1.5 shrink-0 uppercase tracking-wider text-[10px] border-r border-white/20" style={{ backgroundColor: 'var(--color-brand-accent, #e11d48)' }}>
        <span className="w-2 h-2 rounded-full bg-white radar-pulse"></span>
        <span>{label}</span>
      </div>

      {/* Articles Ticker Items */}
      <div className="flex-1 overflow-x-auto no-scrollbar py-2 px-3 flex items-center gap-4 text-white/90">
        {articles.map((item, idx) => (
          <div key={item.article_uuid} className="flex items-center gap-2 shrink-0">
            {idx > 0 && <span className="text-white/50 select-none">·</span>}
            <span className="text-[10px] uppercase font-bold text-white/70">
              {item.category_name}
            </span>
            <Link
              to={`/noticia/${item.slug}`}
              className="text-white/90 hover:text-white transition-colors truncate max-w-xs sm:max-w-md font-medium text-xs flex items-center gap-1"
            >
              <span>{item.title}</span>
              <ChevronRight className="w-3 h-3 text-white/70" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
