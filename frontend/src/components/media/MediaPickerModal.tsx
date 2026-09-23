import React, { useEffect, useState } from 'react';
import { mediaService } from '../../services/mediaApi';
import { MediaItem } from '../../types/media';
import { Search, Upload, Check, X, Image as ImageIcon, Link as LinkIcon, RefreshCw } from 'lucide-react';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  selectedMediaUuid?: string | null;
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedMediaUuid,
  title = 'Biblioteca de Medios — Seleccionar Imagen',
}) => {
  const [tab, setTab] = useState<'browse' | 'upload'>('browse');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Upload Form State
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCredit, setUploadCredit] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await mediaService.getMedia({
        limit: 30,
        search: searchTerm || undefined,
      });
      setItems(res.items);

      if (selectedMediaUuid && !selectedItem) {
        const found = res.items.find((m) => m.media_uuid === selectedMediaUuid);
        if (found) setSelectedItem(found);
      }
    } catch (err) {
      console.error('Error al cargar multimedia:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, searchTerm]);

  // Handle ESC key to close
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

  const handleConfirmSelection = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile && !uploadUrl) {
      setUploadError('Debe seleccionar un archivo de imagen o ingresar una URL.');
      return;
    }

    setUploading(true);
    try {
      const res = await mediaService.uploadMedia({
        file: selectedFile || undefined,
        url: uploadUrl || undefined,
        title: uploadTitle || (selectedFile ? selectedFile.name : 'Imagen editorial'),
        alt_text: uploadAlt || uploadTitle || 'Fotografía periodística',
        caption: uploadCaption || undefined,
        credit: uploadCredit || 'Contacto con la Noticia',
      });

      if (res.success && res.data?.media) {
        const newMedia = res.data.media;
        setSelectedItem(newMedia);
        onSelect(newMedia);
        onClose();
      } else {
        setUploadError(res.error?.message || 'Error al procesar la subida.');
      }
    } catch {
      setUploadError('Fallo de conexión al cargar la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-stone-300 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-stone-300" />
            <h2 className="font-serif font-bold text-base text-white tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded transition-colors"
            title="Cerrar modal"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Search */}
        <div className="px-6 py-3 border-b border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('browse')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                tab === 'browse'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              Explorar Biblioteca ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                tab === 'upload'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir / Agregar URL</span>
            </button>
          </div>

          {tab === 'browse' && (
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título o pie..."
                className="w-full text-xs border border-stone-300 bg-white pl-8 pr-3 py-1.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-800"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
            </div>
          )}
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100/50">
          {tab === 'browse' ? (
            <div>
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-stone-600" />
                  <span>Cargando archivos multimedia...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-500">
                  No se encontraron elementos en la biblioteca de medios.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((item) => {
                    const isSelected = selectedItem?.media_uuid === item.media_uuid;
                    return (
                      <div
                        key={item.media_uuid}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative bg-white border cursor-pointer overflow-hidden transition-all ${
                          isSelected
                            ? 'border-stone-900 ring-2 ring-stone-900 shadow-md'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-stone-200 overflow-hidden relative">
                          <img
                            src={item.url}
                            alt={item.alt_text || item.title || item.filename}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-stone-900 text-white p-1 rounded-full shadow">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-[11px] font-medium text-stone-800 truncate" title={item.title || item.filename}>
                            {item.title || item.filename}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {item.width}&times;{item.height} px
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Upload / URL Form */
            <form onSubmit={handleUploadSubmit} className="max-w-xl mx-auto bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
              <h3 className="font-serif font-bold text-sm text-stone-900 border-b border-stone-200 pb-2">
                Incorporar Imagen a la Noticia
              </h3>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs">
                  {uploadError}
                </div>
              )}

              {/* Local File Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Opción 1: Archivo Local (JPEG, PNG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    if (f && !uploadTitle) {
                      setUploadTitle(f.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-stone-300 file:text-xs file:font-medium file:bg-stone-100 hover:file:bg-stone-200 file:text-stone-800"
                />
              </div>

              <div className="text-center text-xs text-stone-400 font-semibold">— O BIEN —</div>

              {/* Direct Image URL */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Opción 2: URL Directa de Imagen (https://...)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs border border-stone-300 pl-8 pr-3 py-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="pt-2 border-t border-stone-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Título de la Fotografía <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Ej: Obras en el viaducto sobre el Río Portuguesa"
                    className="w-full text-xs border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Texto Alternativo (Accesibilidad / SEO)
                  </label>
                  <input
                    type="text"
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    placeholder="Descripción visual de lo que se observa en la fotografía"
                    className="w-full text-xs border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pie de Foto (Epígrafe Informativo)
                  </label>
                  <input
                    type="text"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Detalle periodístico para publicar bajo la foto"
                    className="w-full text-xs border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Créditos Fotográficos / Fuente
                  </label>
                  <input
                    type="text"
                    value={uploadCredit}
                    onChange={(e) => setUploadCredit(e.target.value)}
                    placeholder="Ej: Juan Colmenares / Contacto con la Noticia"
                    className="w-full text-xs border border-stone-300 p-2 text-stone-800 focus:outline-none focus:border-stone-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTab('browse')}
                  className="px-3 py-2 border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? 'Procesando...' : 'Guardar y Seleccionar'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Selected Details & Actions */}
        <div className="px-6 py-3 border-t border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            {selectedItem ? (
              <div className="flex items-center gap-3">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title || ''}
                  className="w-10 h-10 object-cover border border-stone-300"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {selectedItem.title || selectedItem.filename}
                  </p>
                  <p className="text-[10px] text-stone-500 truncate">
                    Crédito: {selectedItem.credit || 'Sin crédito'} &bull; {selectedItem.width}&times;{selectedItem.height} px
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">Ninguna imagen seleccionada actualmente.</p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleConfirmSelection}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Usar Esta Imagen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

