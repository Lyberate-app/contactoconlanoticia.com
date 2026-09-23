import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
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
    <div className={`bg-stone-900 text-white text-xs flex items-center overflow-hidden rounded-sm border border-stone-800 ${className}`}>
      {/* Kicker Tag */}
      <div className="bg-red-700 text-white font-bold px-3 py-2 flex items-center gap-1.5 shrink-0 uppercase tracking-widest text-[11px]">
        <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-300" />
        <span>{label}</span>
      </div>

      {/* Articles Ticker Items */}
      <div className="flex-1 overflow-x-auto no-scrollbar py-1.5 px-3 flex items-center gap-4 text-stone-200">
        {articles.map((item, idx) => (
          <div key={item.article_uuid} className="flex items-center gap-2 shrink-0">
            {idx > 0 && <span className="text-stone-600 select-none">/</span>}
            <span className="text-[10px] uppercase font-bold text-red-400">
              {item.category_name}:
            </span>
            <Link
              to={`/noticia/${item.slug}`}
              className="hover:text-white hover:underline transition-colors font-serif truncate max-w-xs sm:max-w-md"
            >
              {item.title}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
