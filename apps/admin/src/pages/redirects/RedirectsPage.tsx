import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Pencil, Trash2, ArrowLeftRight, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { redirectsApi, getApiError } from '@/lib/api'
import type { Redirect } from '@portal/shared-types'

export function RedirectsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null)
  const [fromPath, setFromPath] = useState('')
  const [toPath, setToPath] = useState('')
  const [httpCode, setHttpCode] = useState<301 | 302>(301)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: redirects = [], isLoading } = useQuery({
    queryKey: ['admin-redirects'],
    queryFn: redirectsApi.list,
  })

  const openCreateModal = () => {
    setEditingRedirect(null)
    setFromPath('')
    setToPath('')
    setHttpCode(301)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (r: Redirect) => {
    setEditingRedirect(r)
    setFromPath(r.from_path)
    setToPath(r.to_path)
    setHttpCode(r.http_code)
    setFormError(null)
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      // Normalizar paths asegurando slash inicial
      const cleanFrom = fromPath.startsWith('/') ? fromPath : `/${fromPath}`
      const cleanTo = toPath.startsWith('/') || toPath.startsWith('http') ? toPath : `/${toPath}`

      const payload = {
        from_path: cleanFrom,
        to_path: cleanTo,
        http_code: httpCode,
        is_active: true,
      }

      return editingRedirect
        ? redirectsApi.update(editingRedirect.id, payload)
        : redirectsApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-redirects'] })
      setModalOpen(false)
    },
    onError: (err) => setFormError(getApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => redirectsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-redirects'] }),
  })

  const handleDelete = (r: Redirect) => {
    if (confirm(`¿Eliminar la redirección de "${r.from_path}" a "${r.to_path}"?`)) {
      deleteMutation.mutate(r.id)
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redirecciones 301 / 302</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Preserva el posicionamiento SEO migrando enlaces antiguos de WordPress a las nuevas rutas
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva redirección
        </button>
      </div>

      {/* ── Tabla de Redirecciones ──────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Cargando redirecciones...</p>
          </div>
        ) : redirects.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">No hay redirecciones configuradas</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Crea redirecciones para evitar errores 404 al cambiar URLs
            </p>
            <button onClick={openCreateModal} className="btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              Crear primera redirección
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ruta de origen (From)</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Destino (To)</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Visitas</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-xs">
              {redirects.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">
                    {r.from_path}
                  </td>
                  <td className="px-4 py-3 text-brand-600 truncate max-w-xs">
                    {r.to_path}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.http_code === 301
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.http_code} {r.http_code === 301 ? 'Permanente' : 'Temporal'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {r.hits_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 font-sans">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
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
                {editingRedirect ? 'Editar redirección' : 'Nueva redirección'}
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
                <label className="admin-label">Ruta de origen (From) *</label>
                <input
                  type="text"
                  required
                  value={fromPath}
                  onChange={(e) => setFromPath(e.target.value)}
                  placeholder="/2023/10/antigua-noticia/"
                  className="admin-input font-mono text-xs"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  La URL antigua que el usuario o Google intentará abrir.
                </p>
              </div>

              <div>
                <label className="admin-label">Destino (To) *</label>
                <input
                  type="text"
                  required
                  value={toPath}
                  onChange={(e) => setToPath(e.target.value)}
                  placeholder="/politica/antigua-noticia"
                  className="admin-input font-mono text-xs"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  La nueva URL interna o enlace absoluto donde será enviado.
                </p>
              </div>

              <div>
                <label className="admin-label">Código HTTP</label>
                <select
                  value={httpCode}
                  onChange={(e) => setHttpCode(Number(e.target.value) as 301 | 302)}
                  className="admin-input text-sm"
                >
                  <option value={301}>301 — Redirección Permanente (Recomendado para SEO)</option>
                  <option value={302}>302 — Redirección Temporal</option>
                </select>
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
                  disabled={saveMutation.isPending || !fromPath.trim() || !toPath.trim()}
                  className="btn-primary text-xs"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  {editingRedirect ? 'Actualizar' : 'Guardar redirección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

