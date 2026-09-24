import React, { useEffect, useState } from 'react';
import { X, Calendar, User, Clock, Tag as TagIcon, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { OptimizedImage } from '../common/OptimizedImage';

interface ArticleLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    content: string;
    categoryName?: string;
    authorName?: string;
    publishedAt?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
    imageCaption?: string | null;
    imageCredit?: string | null;
    tags?: string[];
  };
}

export const ArticleLivePreviewModal: React.FC<ArticleLivePreviewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate word count & reading time
  const wordCount = data.content ? data.content.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Render content with basic markdown paragraphs
  const renderFormattedContent = (raw: string) => {
    if (!raw) return <p className="italic text-stone-400">Sin contenido en el cuerpo de la noticia.</p>;

    const blocks = raw.split(/\n\s*\n/);
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="font-serif font-black text-2xl text-stone-900 dark:text-white mt-8 mb-4 border-b border-black/5 dark:border-white/5 pb-2">
            {trimmed.replace(/^##\s+/, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-serif font-bold text-xl text-stone-800 dark:text-stone-100 mt-6 mb-3">
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-rose-600 pl-4 py-2 my-6 italic font-serif text-lg text-stone-800 dark:text-stone-200 bg-rose-500/5 rounded-r-2xl">
            {trimmed.replace(/^>\s+/, '')}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').map((i) => i.replace(/^-\s+/, ''));
        return (
          <ul key={idx} className="list-disc list-inside space-y-1.5 my-4 text-stone-800 dark:text-stone-200">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ul>
        );
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split('\n').map((i) => i.replace(/^\d+\.\s+/, ''));
        return (
          <ol key={idx} className="list-decimal list-inside space-y-1.5 my-4 text-stone-800 dark:text-stone-200">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ol>
        );
      }

      return (
        <p key={idx} className="text-base sm:text-lg leading-relaxed text-stone-800 dark:text-stone-200 mb-6 font-sans">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card rounded-[32px] w-full max-w-5xl h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-white/50 dark:border-white/10">
        {/* Top Preview Bar */}
        <div className="px-6 py-3.5 bg-white/70 dark:bg-stone-900/80 backdrop-blur-md text-stone-900 dark:text-white flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>VISTA PREVIA EN VIVO</span>
            </span>
            <span className="hidden sm:inline-block text-xs text-stone-500 font-medium">
              Simulación de renderizado público en Contacto con la Noticia
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* iOS Segmented Device switcher */}
            <div className="glass-panel p-1 rounded-full flex gap-1 border border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setDeviceView('desktop')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  deviceView === 'desktop' ? 'bg-stone-900 text-white shadow-xs font-bold' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
                title="Vista de Escritorio"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Escritorio</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView('mobile')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  deviceView === 'mobile' ? 'bg-stone-900 text-white shadow-xs font-bold' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
                title="Vista Móvil"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Móvil (iPhone)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all"
              title="Cerrar vista previa"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Content */}
        <div className="flex-1 overflow-y-auto bg-stone-100/60 dark:bg-stone-950/60 py-6 px-4 flex justify-center">
          <article
            className={`transition-all duration-300 ${
              deviceView === 'mobile'
                ? 'max-w-[400px] w-full rounded-[44px] border-[10px] border-stone-800 bg-white dark:bg-stone-900 shadow-2xl p-6 sm:p-7 relative'
                : 'max-w-3xl w-full glass-card rounded-[28px] p-6 sm:p-10 border border-white/60 dark:border-white/10 shadow-sm'
            }`}
          >
            {/* Dynamic Island bar in mobile view */}
            {deviceView === 'mobile' && (
              <div className="w-24 h-4 bg-stone-900 rounded-full mx-auto mb-6 shadow-inner" />
            )}

            {/* Category Breadcrumb */}
            <div className="mb-4">
              <span className="inline-block bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                {data.categoryName || 'Regionales'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-2xl sm:text-4xl font-black text-stone-900 dark:text-white leading-tight tracking-tight mb-4">
              {data.title || 'Titular de la noticia no especificado'}
            </h1>

            {/* Subtitle */}
            {data.subtitle && (
              <p className="font-serif text-base sm:text-lg text-stone-600 dark:text-stone-300 italic border-l-2 border-rose-500 pl-3.5 mb-6">
                {data.subtitle}
              </p>
            )}

            {/* Editorial Byline */}
            <div className="flex flex-wrap items-center gap-4 py-3 border-y border-black/5 dark:border-white/5 text-xs text-stone-600 dark:text-stone-400 mb-6">
              <span className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                <User className="w-3.5 h-3.5 text-stone-400" />
                {data.authorName || 'Redacción Central'}
              </span>
              <span className="flex items-center gap-1 text-stone-500">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {data.publishedAt
                  ? new Date(data.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Pendiente de publicación'}
              </span>
              <span className="flex items-center gap-1 text-stone-500">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {wordCount} palabras &bull; ~{readingMinutes} min
              </span>
            </div>

            {/* Featured Image with squircle corners */}
            {data.imageUrl ? (
              <figure className="mb-8">
                <div className="aspect-[16/9] w-full bg-stone-100 rounded-[22px] overflow-hidden shadow-inner">
                  <OptimizedImage
                    src={data.imageUrl}
                    alt={data.imageAlt || data.title}
                    aspectRatio="16/9"
                    className="w-full h-full object-cover"
                  />
                </div>
                {(data.imageCaption || data.imageCredit) && (
                  <figcaption className="text-xs text-stone-500 dark:text-stone-400 mt-2.5 flex flex-col sm:flex-row sm:justify-between gap-1 italic border-b border-black/5 dark:border-white/5 pb-2">
                    <span>{data.imageCaption}</span>
                    {data.imageCredit && (
                      <span className="font-sans not-italic text-stone-400 text-[11px] sm:text-right">
                        Foto: {data.imageCredit}
                      </span>
                    )}
                  </figcaption>
                )}
              </figure>
            ) : null}

            {/* Excerpt / Lead */}
            {data.excerpt && (
              <div className="text-base sm:text-lg font-sans font-medium text-stone-800 dark:text-stone-200 leading-relaxed border-l-4 border-stone-900 dark:border-white pl-4 py-1.5 mb-8 bg-black/5 dark:bg-white/5 rounded-r-2xl">
                {data.excerpt}
              </div>
            )}

            {/* Body */}
            <div className="prose prose-stone dark:prose-invert max-w-none">
              {renderFormattedContent(data.content)}
            </div>

            {/* Tags */}
            {data.tags && data.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-2">
                <TagIcon className="w-4 h-4 text-stone-400" />
                {data.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 px-3 py-1 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white/70 dark:bg-stone-900/80 backdrop-blur-md border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
          <span className="text-stone-500 dark:text-stone-400">
            Vista previa simulada para verificación editorial antes de la publicación.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-full shadow-md active:scale-95 transition-all"
          >
            Volver al Editor
          </button>
        </div>
      </div>
    </div>
  );
};
