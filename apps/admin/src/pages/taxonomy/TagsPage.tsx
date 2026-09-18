import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Pencil, Trash2, Tag as TagIcon, Loader2, X, AlertCircle } from 'lucide-react'
import { tagsApi, getApiError } from '@/lib/api'
import type { Tag } from '@portal/shared-types'
import { slugify } from '@/lib/utils'

export function TagsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: tagsApi.list,
  })

  const openCreateModal = () => {
    setEditingTag(null)
    setName('')
    setSlug('')
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag)
    setName(tag.name)
    setSlug(tag.slug)
    setFormError(null)
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<Tag> = {
        name,
        slug: slug || slugify(name),
      }
      return editingTag
        ? tagsApi.create(payload) // API updates/creates
        : tagsApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      setModalOpen(false)
    },
    onError: (err) => setFormError(getApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tags'] }),
  })

  const handleDelete = (tag: Tag) => {
    if (confirm(`¿Eliminar la etiqueta "${tag.name}"?`)) {
      deleteMutation.mutate(tag.id)
    }
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingTag) {
      setSlug(slugify(val))
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Palabras clave para relacionar artículos y mejorar la indexación
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva etiqueta
        </button>
      </div>

      {/* ── Tabla de Etiquetas ─────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Cargando etiquetas...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="p-12 text-center">
            <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">No hay etiquetas creadas</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Crea etiquetas para enriquecer tus artículos</p>
            <button onClick={openCreateModal} className="btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              Crear primera etiqueta
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900 inline-flex items-center gap-1.5">
                      <span className="text-gray-400">#</span> {tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    /{tag.slug}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(tag)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                {editingTag ? 'Editar etiqueta' : 'Nueva etiqueta'}
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
                <label className="admin-label">Nombre *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Elecciones, Sucesos, Petróleo"
                  className="admin-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="admin-label">Slug (URL)</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ej-elecciones"
                  className="admin-input font-mono text-xs"
                />
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
                  disabled={saveMutation.isPending || !name.trim()}
                  className="btn-primary text-xs"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  {editingTag ? 'Actualizar' : 'Guardar etiqueta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

