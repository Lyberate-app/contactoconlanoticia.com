import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Check,
} from 'lucide-react';
import type { GalleryItem } from '../../types/gallery';

interface GalleryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertGallery: (newContent: string) => void;
  currentContent?: string;
}

export const GalleryManagerModal: React.FC<GalleryManagerModalProps> = ({
  isOpen,
  onClose,
  onInsertGallery,
  currentContent = '',
}) => {
  const [galleryTitle, setGalleryTitle] = useState('Fotorreportaje de los Hechos');
  const [items, setItems] = useState<GalleryItem[]>([
    {
      id: 'g-1',
      url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80',
      caption: 'Vista panorámica de la concentración periodística en la Plaza Bolívar.',
      alt_text: 'Concentración ciudadana en San Juan de los Morros',
      credit: 'Foto: Corresponsalía Guárico',
      order: 1,
      is_cover: true,
    },
    {
      id: 'g-2',
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80',
      caption: 'Declaraciones de los voceros comunales ante los medios.',
      alt_text: 'Voceros comunitarios ofreciendo rueda de prensa',
      credit: 'Foto: Archivo Contacto con la Noticia',
      order: 2,
      is_cover: false,
    },
  ]);

  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [newCredit, setNewCredit] = useState('');

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const newItem: GalleryItem = {
      id: `g-${Date.now()}`,
      url: newUrl.trim(),
      caption: newCaption.trim() || undefined,
      alt_text: newAlt.trim() || 'Fotografía de la galería',
      credit: newCredit.trim() || undefined,
      order: items.length + 1,
      is_cover: items.length === 0,
    };

    setItems([...items, newItem]);
    setNewUrl('');
    setNewCaption('');
    setNewAlt('');
    setNewCredit('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleSetCover = (id: string) => {
    setItems(
      items.map((i) => ({
        ...i,
        is_cover: i.id === id,
      }))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // reindex order
    setItems(newItems.map((item, idx) => ({ ...item, order: idx + 1 })));
  };

  const handleInsert = () => {
    if (items.length === 0) return;

    // Build responsive gallery markup
    const gallerySnippet = `
<div class="my-8 p-4 bg-stone-50 border border-stone-200 rounded-3xl not-prose editorial-gallery">
  <div class="mb-4 pb-2 border-b border-stone-200 flex items-center justify-between">
    <h3 class="font-serif font-bold text-base text-stone-900">${galleryTitle}</h3>
    <span class="text-xs font-mono text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full font-semibold border border-rose-200">
      ${items.length} Fotografías
    </span>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
${items
  .map(
    (item) => `    <figure class="relative rounded-2xl overflow-hidden border border-stone-200/80 bg-white">
      <img src="${item.url}" alt="${item.alt_text || ''}" class="w-full h-56 object-cover" loading="lazy" />
      ${
        item.caption || item.credit
          ? `<figcaption class="p-3 text-xs text-stone-600">
        ${item.caption ? `<p class="font-medium">${item.caption}</p>` : ''}
        ${item.credit ? `<p class="text-[10px] text-stone-400 font-mono mt-1">${item.credit}</p>` : ''}
      </figcaption>`
          : ''
      }
    </figure>`
  )
  .join('\n')}
  </div>
</div>
`;

    const updated = currentContent ? `${currentContent}\n\n${gallerySnippet}` : gallerySnippet;
    onInsertGallery(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-900 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-serif">
                Gestor de Galerías Fotográficas y Fotorreportajes
              </h2>
              <p className="text-xs text-stone-500">
                Organice múltiples fotografías, pies de foto, créditos y portada para incrustar en el artículo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Gallery Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Título o Epígrafe de la Galería
            </label>
            <input
              type="text"
              value={galleryTitle}
              onChange={(e) => setGalleryTitle(e.target.value)}
              placeholder="Ej: Fotorreportaje: La marcha campesina en Calabozo..."
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 font-serif text-stone-900"
            />
          </div>

          {/* Add Image Form */}
          <form
            onSubmit={handleAddItem}
            className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3"
          >
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
              Agregar Fotografía a la Galería
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                  URL de la Fotografía *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                  Texto Alternativo (ALT) *
                </label>
                <input
                  type="text"
                  placeholder="Descripción para accesibilidad..."
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                  Pie de Foto (Caption)
                </label>
                <input
                  type="text"
                  placeholder="Explicación del hecho fotografiado..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                  Crédito Fotográfico
                </label>
                <input
                  type="text"
                  placeholder="Ej: Foto: Juan Pérez / Prensa CN"
                  value={newCredit}
                  onChange={(e) => setNewCredit(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir a la Galería</span>
              </button>
            </div>
          </form>

          {/* Current Gallery Items List */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
              Fotografías en la Galería ({items.length})
            </span>

            {items.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                No hay fotos en la galería. Agregue fotografías usando el formulario superior.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex gap-3 items-start bg-white shadow-2xs transition-all ${
                      item.is_cover ? 'border-rose-400 ring-1 ring-rose-300' : 'border-stone-200'
                    }`}
                  >
                    <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={item.url}
                        alt={item.alt_text || ''}
                        className="w-full h-full object-cover"
                      />
                      {item.is_cover && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-rose-900 text-white text-[9px] font-bold rounded">
                          Portada
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono text-stone-400">
                            #{idx + 1} &bull; {item.is_cover ? 'Foto Principal' : 'Secundaria'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                              title="Subir orden"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === items.length - 1}
                              className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                              title="Bajar orden"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                              title="Eliminar de galería"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-stone-700 line-clamp-2 mt-0.5">
                          {item.caption || item.alt_text || 'Sin descripción'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                        <span className="text-[9px] text-stone-400 font-mono truncate max-w-[120px]">
                          {item.credit || 'Sin crédito'}
                        </span>
                        {!item.is_cover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(item.id)}
                            className="text-[10px] font-semibold text-rose-800 hover:underline inline-flex items-center gap-0.5"
                          >
                            <Star className="w-2.5 h-2.5" />
                            <span>Definir Portada</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleInsert}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insertar Galería en Artículo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
