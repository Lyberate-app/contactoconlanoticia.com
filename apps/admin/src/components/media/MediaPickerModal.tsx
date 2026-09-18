import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Upload,
  Search,
  Check,
  Image as ImageIcon,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { mediaApi, getApiError } from '@/lib/api'
import type { Media } from '@portal/shared-types'

interface MediaPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: Media) => void
  title?: string
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Biblioteca Multimedia'
}: MediaPickerModalProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['media', search],
    queryFn: () => mediaApi.list({ search: search || undefined, per_page: 30 }),
    enabled: isOpen,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => mediaApi.upload({ file }),
    onSuccess: (newMedia) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setSelectedMedia(newMedia)
      setIsUploading(false)
      setUploadError(null)
    },
    onError: (err) => {
      setIsUploading(false)
      setUploadError(getApiError(err))
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    uploadMutation.mutate(file)
  }

  const handleConfirm = () => {
    if (selectedMedia) {
      onSelect(selectedMedia)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Selecciona o sube una imagen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Upload Button */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
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
              className="btn-primary py-1.5 text-xs inline-flex items-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? 'Subiendo...' : 'Subir imagen'}
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Cargando biblioteca...</p>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <ImageIcon className="w-12 h-12 stroke-1 mb-2" />
              <p className="text-base font-medium text-gray-700">No hay imágenes disponibles</p>
              <p className="text-xs text-gray-500 mt-1">Sube una imagen con el botón superior</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data?.items.map((media) => {
                const isSelected = selectedMedia?.id === media.id
                const previewUrl =
                  media.conversions?.thumbnail?.url ||
                  media.conversions?.card?.url ||
                  media.url

                return (
                  <div
                    key={media.id}
                    onClick={() => setSelectedMedia(media)}
                    className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-150 bg-gray-100 ${
                      isSelected
                        ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md scale-[1.02]'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={previewUrl}
                      alt={media.alt_text || media.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Overlay Title */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate font-medium">
                        {media.filename}
                      </p>
                      <p className="text-[10px] text-gray-300">
                        {media.width && media.height ? `${media.width}×${media.height}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {selectedMedia ? (
              <span className="font-medium text-gray-700">
                Seleccionado: {selectedMedia.filename}
              </span>
            ) : (
              'Ninguna imagen seleccionada'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedMedia}
              onClick={handleConfirm}
              className="btn-primary py-1.5 text-xs disabled:opacity-50"
            >
              Confirmar selección
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

