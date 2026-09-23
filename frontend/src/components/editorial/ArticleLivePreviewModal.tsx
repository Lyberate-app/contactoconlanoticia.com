import React, { useEffect, useState } from 'react';
import { X, Calendar, User, Clock, Tag as TagIcon, Monitor, Smartphone } from 'lucide-react';
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
          <h2 key={idx} className="font-serif font-bold text-2xl text-stone-900 mt-8 mb-4 border-b border-stone-200 pb-2">
            {trimmed.replace(/^##\s+/, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-serif font-bold text-xl text-stone-800 mt-6 mb-3">
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-red-700 pl-4 py-2 my-6 italic font-serif text-lg text-stone-800 bg-stone-50">
            {trimmed.replace(/^>\s+/, '')}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').map((i) => i.replace(/^-\s+/, ''));
        return (
          <ul key={idx} className="list-disc list-inside space-y-1.5 my-4 text-stone-800">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ul>
        );
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split('\n').map((i) => i.replace(/^\d+\.\s+/, ''));
        return (
          <ol key={idx} className="list-decimal list-inside space-y-1.5 my-4 text-stone-800">
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ol>
        );
      }

      return (
        <p key={idx} className="text-base sm:text-lg leading-relaxed text-stone-800 mb-6 font-sans">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/80 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-stone-300 w-full max-w-5xl h-[94vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Top Preview Bar */}
        <div className="px-6 py-3 bg-stone-950 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase bg-red-700 text-white px-2 py-0.5 rounded font-bold">
              VISTA PREVIA EN VIVO
            </span>
            <span className="hidden sm:inline-block text-xs text-stone-400">
              Simulación de renderizado público en Contacto con la Noticia
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport switcher */}
            <div className="flex items-center bg-stone-800 rounded p-0.5">
              <button
                type="button"
                onClick={() => setDeviceView('desktop')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  deviceView === 'desktop' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Vista de Escritorio"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Escritorio</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceView('mobile')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  deviceView === 'mobile' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Vista Móvil"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Móvil</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded transition-colors"
              title="Cerrar vista previa"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Content */}
        <div className="flex-1 overflow-y-auto bg-stone-100 py-6 px-4 flex justify-center">
          <article
            className={`bg-white border border-stone-200 shadow-sm p-6 sm:p-10 transition-all duration-200 ${
              deviceView === 'mobile' ? 'max-w-md w-full' : 'max-w-3xl w-full'
            }`}
          >
            {/* Category Breadcrumb */}
            <div className="mb-4">
              <span className="inline-block bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                {data.categoryName || 'Regionales'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 leading-tight tracking-tight mb-4">
              {data.title || 'Titular de la noticia no especificado'}
            </h1>

            {/* Subtitle */}
            {data.subtitle && (
              <p className="font-serif text-base sm:text-lg text-stone-600 italic border-l-2 border-stone-300 pl-3 mb-6">
                {data.subtitle}
              </p>
            )}

            {/* Editorial Byline */}
            <div className="flex flex-wrap items-center gap-4 py-3 border-y border-stone-200 text-xs text-stone-600 mb-6">
              <span className="flex items-center gap-1.5 font-medium text-stone-800">
                <User className="w-3.5 h-3.5 text-stone-400" />
                {data.authorName || 'Redacción Central'}
              </span>
              <span className="flex items-center gap-1 text-stone-500">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {data.publishedAt
                  ? new Date(data.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Fecha de publicación pendiente'}
              </span>
              <span className="flex items-center gap-1 text-stone-500">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {wordCount} palabras &bull; ~{readingMinutes} min de lectura
              </span>
            </div>

            {/* Featured Image */}
            {data.imageUrl ? (
              <figure className="mb-8">
                <div className="aspect-[16/9] w-full bg-stone-200 overflow-hidden">
                  <OptimizedImage
                    src={data.imageUrl}
                    alt={data.imageAlt || data.title}
                    aspectRatio="16/9"
                    className="w-full h-full object-cover"
                  />
                </div>
                {(data.imageCaption || data.imageCredit) && (
                  <figcaption className="text-xs text-stone-500 mt-2 flex flex-col sm:flex-row sm:justify-between gap-1 italic border-b border-stone-100 pb-2">
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
              <div className="text-base sm:text-lg font-sans font-semibold text-stone-800 leading-relaxed border-l-4 border-stone-900 pl-4 py-1 mb-8 bg-stone-50">
                {data.excerpt}
              </div>
            )}

            {/* Body */}
            <div className="prose prose-stone max-w-none">
              {renderFormattedContent(data.content)}
            </div>

            {/* Tags */}
            {data.tags && data.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-stone-200 flex flex-wrap items-center gap-2">
                <TagIcon className="w-4 h-4 text-stone-400" />
                {data.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            Vista previa generada para comprobación editorial previa a publicación.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded shadow-sm transition-colors"
          >
            Volver a Editar
          </button>
        </div>
      </div>
    </div>
  );
};

