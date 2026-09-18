import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  Search,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Save,
  Loader2,
  ExternalLink,
  Info,
  X
} from 'lucide-react'
import { mediaApi, getApiError } from '@/lib/api'
import type { Media } from '@portal/shared-types'
import { formatDate } from '@/lib/utils'

export function MediaLibraryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit metadata form state
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [photographer, setPhotographer] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-media', search, page],
    queryFn: () => mediaApi.list({ search: search || undefined, page, per_page: 24 }),
  })

  // Select media and sync form fields
  const handleSelectMedia = (media: Media) => {
    setSelectedMedia(media)
    setAltText(media.alt_text || '')
    setCaption(media.caption || '')
    setPhotographer(media.photographer || '')
  }

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => mediaApi.upload({ file }),
    onSuccess: (newMedia) => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] })
      handleSelectMedia(newMedia)
      setIsUploading(false)
      setUploadError(null)
    },
    onError: (err) => {
      setIsUploading(false)
      setUploadError(getApiError(err))
    }
  })

  // Update metadata mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      mediaApi.update(selectedMedia!.id, {
        alt_text: altText,
        caption,
        photographer,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] })
      setSelectedMedia(updated)
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] })
      setSelectedMedia(null)
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    uploadMutation.mutate(file)
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleDelete = (media: Media) => {
    if (confirm(`¿Eliminar la imagen "${media.filename}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(media.id)
    }
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca Multimedia</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.pagination.total ?? 0} archivos subidos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary py-2 px-4 inline-flex items-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Procesando imagen...' : 'Subir multimedia'}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* ── Barra de búsqueda ─────────────────────────────── */}
      <div className="mb-6 max-w-md shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nombre o descripción..."
            className="admin-input pl-9"
          />
        </div>
      </div>

      {/* ── Área principal: Grid + Panel de detalle ────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Grid de imágenes */}
        <div className={`${selectedMedia ? 'lg:col-span-2' : 'lg:col-span-3'} overflow-y-auto pr-1`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">No hay archivos multimedia</h3>
              <p className="text-sm text-gray-500 mt-1">Sube imágenes para utilizarlas en tus noticias</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data?.items.map((media) => {
                const isSelected = selectedMedia?.id === media.id
                const previewUrl =
                  media.conversions?.thumbnail?.url ||
                  media.conversions?.card?.url ||
                  media.url

                return (
                  <div
                    key={media.id}
                    onClick={() => handleSelectMedia(media)}
                    className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-150 bg-gray-100 ${
                      isSelected
                        ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={previewUrl}
                      alt={media.alt_text || media.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate font-medium">{media.filename}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginación */}
          {data && data.pagination.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1 text-xs text-gray-600">
                {page} / {data.pagination.last_page}
              </span>
              <button
                disabled={page >= data.pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* Panel lateral de detalle */}
        {selectedMedia && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 overflow-y-auto flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Detalles del archivo</h3>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vista previa */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4 border border-gray-200">
              <img
                src={selectedMedia.conversions?.medium?.url || selectedMedia.url}
                alt={selectedMedia.alt_text || selectedMedia.filename}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metadatos técnicos */}
            <div className="text-xs text-gray-500 space-y-1 mb-5 bg-gray-50 p-3 rounded-lg">
              <p className="truncate"><span className="font-semibold text-gray-700">Nombre:</span> {selectedMedia.filename}</p>
              <p><span className="font-semibold text-gray-700">Dimensiones:</span> {selectedMedia.width} × {selectedMedia.height} px</p>
              <p><span className="font-semibold text-gray-700">Tipo:</span> {selectedMedia.mime_type}</p>
              <p><span className="font-semibold text-gray-700">Fecha:</span> {formatDate(selectedMedia.created_at)}</p>
            </div>

            {/* Formulario de metadatos editoriales */}
            <div className="space-y-3 flex-1">
              <div>
                <label className="admin-label text-xs">Texto alternativo (Alt)</label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Descripción para accesibilidad y SEO..."
                  className="admin-input text-xs"
                />
              </div>

              <div>
                <label className="admin-label text-xs">Leyenda / Pie de foto</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Texto explicativo al pie de la imagen..."
                  className="admin-input text-xs resize-none"
                />
              </div>

              <div>
                <label className="admin-label text-xs">Fotógrafo / Crédito</label>
                <input
                  type="text"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  placeholder="Nombre de la agencia o fotógrafo..."
                  className="admin-input text-xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="btn-primary py-1.5 text-xs flex-1 inline-flex items-center justify-center gap-1.5"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Guardar cambios
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedMedia.url)}
                  className="btn-secondary py-1.5 text-xs inline-flex items-center gap-1"
                  title="Copiar enlace"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUrl ? 'Copiado' : 'Copiar URL'}
                </button>
              </div>
            </div>

            {/* Zona de peligro: Eliminar */}
            <div className="pt-4 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleDelete(selectedMedia)}
                disabled={deleteMutation.isPending}
                className="w-full btn-danger py-1.5 text-xs inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar imagen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
