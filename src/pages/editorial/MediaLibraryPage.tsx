import React, { useEffect, useState } from 'react';
import { mediaService } from '../../services/mediaApi';
import { MediaItem } from '../../types/media';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Grid,
  List,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Check,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';

export const MediaLibraryPage: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Drawer / Inspection Modal
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCredit, setEditCredit] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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
        search: searchTerm || undefined,
        mime_type: mimeFilter || undefined,
        limit: 50,
      });
      setItems(res.items);
    } catch (err) {
      console.error('Error al cargar multimedia:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [searchTerm, mimeFilter]);

  const handleOpenDetail = (item: MediaItem) => {
    setSelectedMedia(item);
    setEditTitle(item.title || '');
    setEditAlt(item.alt_text || '');
    setEditCaption(item.caption || '');
    setEditCredit(item.credit || '');
    setCopiedUrl(false);
  };

  const handleSaveDetail = async () => {
    if (!selectedMedia) return;
    setSavingEdit(true);
    try {
      const res = await mediaService.updateMedia(selectedMedia.media_uuid, {
        title: editTitle,
        alt_text: editAlt,
        caption: editCaption,
        credit: editCredit,
      });
      if (res.success && res.data?.media) {
        setSelectedMedia(res.data.media);
        loadMedia();
      }
    } catch {
      alert('Error al guardar metadatos.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('¿Está seguro de eliminar este recurso multimedia definitivamente?')) return;
    try {
      await mediaService.deleteMedia(uuid);
      if (selectedMedia?.media_uuid === uuid) {
        setSelectedMedia(null);
      }
      loadMedia();
    } catch {
      alert('Error al eliminar recurso multimedia.');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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

      if (res.success) {
        setIsUploadOpen(false);
        setSelectedFile(null);
        setUploadUrl('');
        setUploadTitle('');
        setUploadAlt('');
        setUploadCaption('');
        setUploadCredit('');
        loadMedia();
      } else {
        setUploadError(res.error?.message || 'Error al procesar la subida.');
      }
    } catch {
      setUploadError('Fallo de conexión al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return Math.round(bytes / 1024) + ' KB';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/60 dark:border-white/10 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 mb-2">
            <Sparkles className="w-3 h-3 text-rose-600" />
            <span>Archivo Gráfico &bull; {items.length} Recursos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
            Biblioteca Multimedia
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Gestión y archivo digital de fotografías periodísticas, infografías y material publicitario.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUploadError(null);
            setIsUploadOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-lg shadow-black/10 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Subir Nuevo Recurso</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, autor o pie..."
              className="w-full text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md rounded-full pl-9 pr-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          {/* MIME Filter */}
          <select
            value={mimeFilter}
            onChange={(e) => setMimeFilter(e.target.value)}
            className="text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md px-4 py-2.5 rounded-full text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs cursor-pointer"
          >
            <option value="">Todos los formatos</option>
            <option value="image/jpeg">JPEG / JPG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="glass-panel p-1 rounded-full flex gap-1 self-end sm:self-center border border-white/60 dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Vista de cuadrícula"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Vista de lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs font-mono glass-card rounded-[28px] border border-white/60 dark:border-white/10">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-600" />
          <span>Accediendo a los archivos de medios...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-xs text-stone-500 glass-card rounded-[28px] border border-white/60 dark:border-white/10 space-y-2">
          <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="font-serif text-base font-bold text-stone-800 dark:text-stone-200">
            No se encontraron recursos multimedia
          </p>
          <p className="text-xs text-stone-400">Pruebe a cambiar los filtros o suba una nueva imagen.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.media_uuid}
              className="group glass-card rounded-[24px] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col border border-white/60 dark:border-white/10"
            >
              <div
                className="aspect-[4/3] bg-stone-100 dark:bg-stone-800 relative overflow-hidden cursor-pointer"
                onClick={() => handleOpenDetail(item)}
              >
                <img
                  src={item.url}
                  alt={item.alt_text || item.title || item.filename}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="text-[11px] font-bold text-stone-900 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md">
                    Ver Detalles
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    className="text-xs font-bold text-stone-900 dark:text-white truncate cursor-pointer hover:underline"
                    onClick={() => handleOpenDetail(item)}
                    title={item.title || item.filename}
                  >
                    {item.title || item.filename}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                    {item.width}&times;{item.height} px &bull; {formatFileSize(item.filesize_bytes)}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-stone-400">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white active:scale-90 transition-all"
                    title="Copiar URL directa"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(item)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white active:scale-90 transition-all"
                    title="Editar metadatos"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.media_uuid)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/10 text-red-500 hover:text-red-600 active:scale-90 transition-all"
                    title="Eliminar recurso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="glass-card rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/40 dark:bg-stone-900/40 border-b border-black/5 dark:border-white/5 text-stone-600 dark:text-stone-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Recurso</th>
                <th className="p-4">Título / Archivo</th>
                <th className="p-4">Dimensiones</th>
                <th className="p-4">Peso</th>
                <th className="p-4">Créditos</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] text-stone-700 dark:text-stone-300">
              {items.map((item) => (
                <tr key={item.media_uuid} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <img
                      src={item.url}
                      alt={item.title || ''}
                      className="w-14 h-10 object-cover rounded-xl border border-black/5 dark:border-white/5 cursor-pointer shadow-xs"
                      onClick={() => handleOpenDetail(item)}
                    />
                  </td>
                  <td className="p-4 max-w-xs">
                    <p
                      className="font-bold text-stone-900 dark:text-white truncate cursor-pointer hover:underline"
                      onClick={() => handleOpenDetail(item)}
                    >
                      {item.title || item.filename}
                    </p>
                    <p className="font-mono text-[10px] text-stone-400 truncate">{item.filename}</p>
                  </td>
                  <td className="p-4 whitespace-nowrap text-stone-500 font-mono">
                    {item.width}&times;{item.height} px
                  </td>
                  <td className="p-4 whitespace-nowrap text-stone-500 font-mono">
                    {formatFileSize(item.filesize_bytes)}
                  </td>
                  <td className="p-4 text-stone-500 truncate max-w-[150px]">
                    {item.credit || '—'}
                  </td>
                  <td className="p-4 whitespace-nowrap text-stone-500">
                    {new Date(item.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleCopyUrl(item.url)}
                      className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                      title="Copiar URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDetail(item)}
                      className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                      title="Editar metadatos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.media_uuid)}
                      className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL / METADATA MODAL */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card rounded-[32px] max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto border border-white/50 dark:border-white/10">
            {/* Header */}
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h2 className="font-serif font-black text-base text-stone-900 dark:text-white">Detalle y Metadatos del Recurso</h2>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50/50 dark:bg-stone-950/50">
              {/* Left Column: Image Preview and Tech Specs */}
              <div className="space-y-4">
                <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-800 rounded-[22px] overflow-hidden flex items-center justify-center shadow-inner">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.title || ''}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="glass-panel rounded-2xl p-4 space-y-2 text-xs border border-black/5 dark:border-white/5">
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Nombre de Archivo:</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200 text-[11px] truncate max-w-[180px]">
                      {selectedMedia.filename}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Dimensiones:</span>
                    <span className="text-stone-800 dark:text-stone-200 font-semibold font-mono">
                      {selectedMedia.width} &times; {selectedMedia.height} px
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Tipo MIME:</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200 text-[11px]">{selectedMedia.mime_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-medium">Peso del Archivo:</span>
                    <span className="text-stone-800 dark:text-stone-200 font-semibold">{formatFileSize(selectedMedia.filesize_bytes)}</span>
                  </div>
                </div>

                {/* Direct Link Copy Button */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedMedia.url}
                    className="flex-1 text-[11px] font-mono border border-black/10 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 rounded-full px-3 py-2 text-stone-600 dark:text-stone-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(selectedMedia.url)}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full border border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:bg-white active:scale-90 transition-all"
                    title="Abrir imagen en nueva pestaña"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Right Column: Editable Metadata */}
              <div className="space-y-4 text-xs">
                <h3 className="font-serif font-black text-stone-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">
                  Metadatos Editoriales
                </h3>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">Título del Recurso</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    placeholder="Título identificativo"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Texto Alternativo (Alt Text para SEO y Accesibilidad)
                  </label>
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    placeholder="Describa el contenido visual de la foto"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Pie de Foto (Epígrafe Informativo)
                  </label>
                  <textarea
                    rows={3}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    placeholder="Explicación contextual que se imprimirá junto a la imagen"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Crédito Fotográfico / Fuente
                  </label>
                  <input
                    type="text"
                    value={editCredit}
                    onChange={(e) => setEditCredit(e.target.value)}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                    placeholder="Nombre del fotógrafo o agencia informativa"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedMedia.media_uuid)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold text-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Recurso</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={handleSaveDetail}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-full transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{savingEdit ? 'Guardando...' : 'Guardar Metadatos'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden my-auto border border-white/50 dark:border-white/10">
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                  <Upload className="w-4 h-4" />
                </div>
                <h2 className="font-serif font-black text-base text-stone-900 dark:text-white">Subir a la Biblioteca Multimedia</h2>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs bg-stone-50/50 dark:bg-stone-950/50">
              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs rounded-xl">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Archivo Local (JPEG, PNG, WebP)
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
                  className="w-full text-stone-600 dark:text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer"
                />
              </div>

              <div className="text-center text-stone-400 font-semibold">— O BIEN —</div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  URL Directa de Imagen Externa
                </label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Título del Recurso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Título de la imagen"
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Texto Alternativo (Alt Text)
                  </label>
                  <input
                    type="text"
                    value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    placeholder="Descripción visual para lectores de pantalla"
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Pie de Foto (Epígrafe)
                  </label>
                  <input
                    type="text"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Detalle periodístico adicional"
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Crédito Fotográfico
                  </label>
                  <input
                    type="text"
                    value={uploadCredit}
                    onChange={(e) => setUploadCredit(e.target.value)}
                    placeholder="Autor o agencia proveedora"
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-stone-800 dark:text-stone-200 bg-white/70 dark:bg-stone-800/70 focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? 'Procesando...' : 'Cargar en Biblioteca'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
