import React, { useEffect, useState } from 'react';
import { mediaService } from '../../services/mediaApi';
import { MediaItem } from '../../types/media';
import { compressAndResizeImage } from '../../utils/imageCompressor';
import { Search, Upload, Check, X, Image as ImageIcon, Link as LinkIcon, RefreshCw, Sparkles } from 'lucide-react';

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
  title = 'Biblioteca de Medios — Seleccionar Fotografía',
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
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<string | null>(null);
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-card rounded-[32px] max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto border border-white/50 dark:border-white/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-black text-base text-stone-900 dark:text-white tracking-tight">{title}</h2>
              <p className="text-[11px] text-stone-400">Seleccione un archivo multimedia de alta resolución</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all"
            title="Cerrar modal"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls & Search */}
        <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="glass-panel p-1 rounded-full flex gap-1 border border-white/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => setTab('browse')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all active:scale-95 ${
                tab === 'browse'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Explorar ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all active:scale-95 ${
                tab === 'upload'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Archivo / URL</span>
            </button>
          </div>

          {tab === 'browse' && (
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título o pie..."
                className="w-full text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 rounded-full pl-8 pr-3 py-1.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
            </div>
          )}
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50 dark:bg-stone-950/50">
          {tab === 'browse' ? (
            <div>
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs font-mono">
                  <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
                  <span>Cargando biblioteca fotográfica...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-500 space-y-2">
                  <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="font-semibold text-stone-700 dark:text-stone-300">No se encontraron imágenes</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((item) => {
                    const isSelected = selectedItem?.media_uuid === item.media_uuid;
                    return (
                      <div
                        key={item.media_uuid}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative rounded-[20px] bg-white dark:bg-stone-900 cursor-pointer overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? 'ring-3 ring-stone-950 dark:ring-white shadow-lg scale-102'
                            : 'border border-black/5 dark:border-white/5 hover:border-black/20 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                          <img
                            src={item.url}
                            alt={item.alt_text || item.title || item.filename}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 bg-stone-900 text-white p-1 rounded-full shadow-md">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xs">
                          <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200 truncate" title={item.title || item.filename}>
                            {item.title || item.filename}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono">
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
            <form onSubmit={handleUploadSubmit} className="max-w-xl mx-auto glass-card rounded-[28px] p-6 space-y-4 shadow-sm border border-white/60 dark:border-white/10">
              <h3 className="font-serif font-black text-sm text-stone-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">
                Incorporar Imagen a la Noticia
              </h3>

              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs rounded-xl">
                  {uploadError}
                </div>
              )}

              {/* Local File Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Opción 1: Archivo Local (JPEG, PNG, WebP)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-optimización máx 1200px
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={async (e) => {
                    const f = e.target.files?.[0] || null;
                    if (!f) {
                      setSelectedFile(null);
                      setCompressionStats(null);
                      return;
                    }
                    setCompressing(true);
                    try {
                      const res = await compressAndResizeImage(f, 1200, 0.82);
                      setSelectedFile(res.file);
                      const origKb = Math.round(res.originalSizeBytes / 1024);
                      const compKb = Math.round(res.compressedSizeBytes / 1024);
                      setCompressionStats(`Imagen optimizada a ${res.width}×${res.height}px: ${origKb} KB → ${compKb} KB (Ahorro del ${res.savingsPercent}%)`);
                      if (!uploadTitle) {
                        setUploadTitle(f.name.replace(/\.[^/.]+$/, ''));
                      }
                    } catch (err) {
                      console.error('Error al comprimir:', err);
                      setSelectedFile(f);
                    } finally {
                      setCompressing(false);
                    }
                  }}
                  className="w-full text-xs text-stone-600 dark:text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer"
                />

                {compressing && (
                  <p className="mt-1.5 text-xs text-stone-400 animate-pulse flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Optimizando dimensiones y comprimiendo en WebP...
                  </p>
                )}

                {compressionStats && !compressing && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{compressionStats}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-stone-400 font-semibold">— O BIEN —</div>

              {/* Direct Image URL */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Opción 2: URL Directa de Imagen (https://...)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs border border-black/10 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Título de la Fotografía <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Ej: Obras en el viaducto sobre el Río Portuguesa"
                    className="w-full text-xs border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Texto Alternativo (Accesibilidad / SEO)
                  </label>
                  <input
                    type="text"
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    placeholder="Descripción visual de lo que se observa en la fotografía"
                    className="w-full text-xs border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Pie de Foto (Epígrafe Informativo)
                  </label>
                  <input
                    type="text"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Detalle periodístico para publicar bajo la foto"
                    className="w-full text-xs border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Créditos Fotográficos / Fuente
                  </label>
                  <input
                    type="text"
                    value={uploadCredit}
                    onChange={(e) => setUploadCredit(e.target.value)}
                    placeholder="Ej: Juan Colmenares / Contacto con la Noticia"
                    className="w-full text-xs border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTab('browse')}
                  className="px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? 'Procesando...' : 'Guardar y Seleccionar'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Selected Details & Actions */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            {selectedItem ? (
              <div className="flex items-center gap-3">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title || ''}
                  className="w-12 h-12 rounded-[14px] object-cover ring-1 ring-black/10 shadow-xs"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                    {selectedItem.title || selectedItem.filename}
                  </p>
                  <p className="text-[11px] text-stone-500 font-mono truncate">
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
              className="px-4 py-2 rounded-full border border-stone-200/80 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-white active:scale-95 transition-all"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleConfirmSelection}
              className="px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
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
