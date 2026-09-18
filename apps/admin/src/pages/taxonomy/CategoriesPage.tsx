import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Pencil, Trash2, FolderOpen, Loader2, X, AlertCircle } from 'lucide-react'
import { categoriesApi, getApiError } from '@/lib/api'
import type { Category } from '@portal/shared-types'
import { slugify } from '@/lib/utils'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesApi.list,
  })

  const openCreateModal = () => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setDescription('')
    setParentId(null)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || '')
    setParentId(cat.parent_id || null)
    setFormError(null)
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<Category> = {
        name,
        slug: slug || slugify(name),
        description: description || null,
        parent_id: parentId,
      }
      return editingCategory
        ? categoriesApi.update(editingCategory.id, payload)
        : categoriesApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      setModalOpen(false)
    },
    onError: (err) => setFormError(getApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  })

  const handleDelete = (cat: Category) => {
    if (confirm(`¿Eliminar la categoría "${cat.name}"? Los posts asociados pasarán a "Sin categoría".`)) {
      deleteMutation.mutate(cat.id)
    }
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCategory) {
      setSlug(slugify(val))
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Organiza las secciones y temáticas de tu portal
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {/* ── Tabla de Categorías ───────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">No hay categorías creadas</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Crea una categoría para clasificar las noticias</p>
            <button onClick={openCreateModal} className="btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              Crear primera categoría
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Descripción</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {cat.parent_id && <span className="text-gray-300">↳</span>}
                      <span className="font-semibold text-gray-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    /{cat.slug}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell max-w-xs truncate">
                    {cat.description || <span className="text-gray-300">Sin descripción</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
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
                  placeholder="Ej. Política, Deportes, Economía"
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
                  placeholder="ej-politica"
                  className="admin-input font-mono text-xs"
                />
              </div>

              <div>
                <label className="admin-label">Categoría Padre (opcional)</label>
                <select
                  value={parentId ?? ''}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                  className="admin-input"
                >
                  <option value="">Ninguna (categoría principal)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="admin-label">Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve resumen de esta sección..."
                  className="admin-input resize-none"
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
                  {editingCategory ? 'Actualizar' : 'Guardar categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

