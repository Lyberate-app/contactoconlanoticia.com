import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Pencil, Trash2, Megaphone, Loader2, X, AlertCircle, ExternalLink, Code } from 'lucide-react'
import { adsApi, getApiError } from '@/lib/api'
import type { Ad, AdType } from '@portal/shared-types'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'

const SLOTS = [
  { id: 'header_banner', label: 'Cabecera (Header Banner - 728x90 / responsive)' },
  { id: 'sidebar_top', label: 'Lateral Superior (Sidebar Top - 300x250)' },
  { id: 'article_middle', label: 'Dentro del Artículo (In-content Banner)' },
  { id: 'article_bottom', label: 'Final del Artículo (Article Footer)' },
  { id: 'footer_banner', label: 'Pie de Página (Footer Banner)' },
]

export function AdsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [slot, setSlot] = useState(SLOTS[0].id)
  const [type, setType] = useState<AdType>('image')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: adsApi.list,
  })

  const openCreateModal = () => {
    setEditingAd(null)
    setSlot(SLOTS[0].id)
    setType('image')
    setImageUrl('')
    setLinkUrl('')
    setContent('')
    setIsActive(true)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (ad: Ad) => {
    setEditingAd(ad)
    setSlot(ad.slot)
    setType(ad.type)
    setImageUrl(ad.image_url || '')
    setLinkUrl(ad.link_url || '')
    setContent(ad.content || '')
    setIsActive(ad.is_active)
    setFormError(null)
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<Ad> = {
        slot,
        type,
        image_url: type === 'image' ? imageUrl : null,
        link_url: type === 'image' ? linkUrl : null,
        content: type !== 'image' ? content : null,
        is_active: isActive,
      }

      return editingAd
        ? adsApi.update(editingAd.id, payload)
        : adsApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] })
      setModalOpen(false)
    },
    onError: (err) => setFormError(getApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  })

  const handleDelete = (ad: Ad) => {
    if (confirm(`¿Eliminar este anuncio del espacio "${ad.slot}"?`)) {
      deleteMutation.mutate(ad.id)
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espacios Publicitarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Administra banners comerciales, enlaces patrocinados y códigos de Google AdSense
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo anuncio
        </button>
      </div>

      {/* ── Lista de Anuncios ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Cargando anuncios...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">No hay anuncios configurados</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Crea espacios de monetización en la cabecera, artículos o lateral
            </p>
            <button onClick={openCreateModal} className="btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              Crear primer anuncio
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Espacio (Slot)</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Detalles</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {SLOTS.find((s) => s.id === ad.slot)?.label.split('(')[0] || ad.slot}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {ad.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {ad.type === 'image' ? (
                      <div className="flex items-center gap-2">
                        {ad.image_url && (
                          <img src={ad.image_url} alt="Banner" className="w-12 h-8 object-cover rounded border" />
                        )}
                        <span className="truncate">{ad.link_url || 'Sin enlace'}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-gray-400 truncate block">{ad.content}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ad.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ad.is_active ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(ad)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal de Creación / Edición ────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                {editingAd ? 'Editar anuncio' : 'Nuevo espacio de anuncio'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="admin-label">Ubicación / Espacio *</label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="admin-input"
                >
                  {SLOTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="admin-label">Tipo de Anuncio</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['image', 'code', 'adsense'] as AdType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-colors ${
                        type === t
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'image' ? 'Banner Imagen' : t === 'code' ? 'Código HTML' : 'AdSense'}
                    </button>
                  ))}
                </div>
              </div>

              {type === 'image' ? (
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <label className="admin-label text-xs">Imagen del Banner *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://... o selecciona de multimedia"
                        className="admin-input text-xs flex-1"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMediaPickerOpen(true)}
                        className="btn-secondary py-2 text-xs shrink-0"
                      >
                        Biblioteca
                      </button>
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="aspect-[4/1] rounded-lg overflow-hidden bg-gray-200 border">
                      <img src={imageUrl} alt="Vista previa" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div>
                    <label className="admin-label text-xs">Enlace de destino (Link URL)</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://anunciante.com/promocion"
                      className="admin-input text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="admin-label">Código del Anuncio / Script *</label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<script async src='https://pagead2.googlesyndication.com...'></script>"
                    className="admin-input font-mono text-xs resize-none"
                    required
                  />
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">Anuncio activo e visible</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary text-xs"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  {editingAd ? 'Actualizar anuncio' : 'Guardar anuncio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker para imagen de anuncio */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(m) => {
          setImageUrl(m.conversions?.large?.url || m.url)
        }}
        title="Seleccionar imagen de banner publicitario"
      />
    </div>
  )
}
