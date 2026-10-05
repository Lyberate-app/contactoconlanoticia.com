import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { commentsService } from '../../services/commentsService';

interface ArticleReactionsProps {
  articleUuid: string;
}

interface ReactionDef {
  key: string;
  emoji: string;
  label: string;
}

const REACTION_TYPES: ReactionDef[] = [
  { key: 'interesante', emoji: '💡', label: 'Gran Utilidad' },
  { key: 'alegria', emoji: '👏', label: 'Excelente Nota' },
  { key: 'sorprendente', emoji: '⚡', label: 'Impactante' },
  { key: 'preocupante', emoji: '⚠️', label: 'Preocupante' },
  { key: 'util', emoji: '🧐', label: 'Para Reflexionar' },
];

export const ArticleReactions: React.FC<ArticleReactionsProps> = ({ articleUuid }) => {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userSelected, setUserSelected] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    commentsService.getReactions(articleUuid).then((data) => {
      if (isMounted) setReactions(data);
    }).catch(() => {});

    try {
      const stored = localStorage.getItem(`lyberate_reaction_${articleUuid}`);
      if (stored) setUserSelected(stored);
    } catch {
      // quiet
    }

    return () => {
      isMounted = false;
    };
  }, [articleUuid]);

  const handleSelectReaction = async (key: string) => {
    if (userSelected === key) return;

    setUserSelected(key);
    try {
      localStorage.setItem(`lyberate_reaction_${articleUuid}`, key);
    } catch {
      // quiet
    }

    try {
      const updated = await commentsService.addReaction(articleUuid, key);
      setReactions(updated);
    } catch {
      // quiet fallback
    }
  };

  const totalVotes = Object.values(reactions).reduce((acc, v) => acc + (v || 0), 0);

  return (
    <div className="my-8 rounded-[24px] border border-stone-200/80 bg-gradient-to-br from-stone-50 via-white to-stone-50/50 p-5 sm:p-6 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            ¿Qué te pareció este artículo?
          </span>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Califica el impacto del reporte con tu reacción de lector
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-stone-500">
          {totalVotes} {totalVotes === 1 ? 'voto registrado' : 'votos registrados'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {REACTION_TYPES.map((type) => {
          const count = reactions[type.key] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = userSelected === type.key;

          return (
            <button
              key={type.key}
              type="button"
              onClick={() => handleSelectReaction(type.key)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 text-center relative overflow-hidden ${
                isSelected
                  ? 'border-rose-900 bg-rose-50/80 ring-2 ring-rose-900/20 shadow-xs'
                  : 'border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <span className="text-2xl mb-1 transition-transform group-hover:scale-110">
                {type.emoji}
              </span>
              <span className="font-bold text-[11px] text-stone-900 line-clamp-1">
                {type.label}
              </span>
              <span className="font-mono text-[10px] text-stone-500 mt-0.5">
                {count} {percentage > 0 ? `(${percentage}%)` : ''}
              </span>

              {/* Mini progress bar under reaction */}
              {totalVotes > 0 && (
                <div className="w-full bg-stone-100 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected ? 'bg-rose-700' : 'bg-stone-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

