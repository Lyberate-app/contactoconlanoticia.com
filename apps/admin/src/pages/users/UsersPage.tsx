import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Pencil, Trash2, Users as UsersIcon, Loader2, X, AlertCircle, Shield } from 'lucide-react'
import { usersApi, getApiError } from '@/lib/api'
import type { User, UserRole } from '@portal/shared-types'

const ROLE_BADGES: Record<UserRole, { label: string; cls: string }> = {
  superadmin: { label: 'Super Admin', cls: 'bg-red-100 text-red-800' },
  admin: { label: 'Administrador', cls: 'bg-purple-100 text-purple-800' },
  editor: { label: 'Editor', cls: 'bg-blue-100 text-blue-800' },
  author: { label: 'Autor / Periodista', cls: 'bg-green-100 text-green-800' },
  viewer: { label: 'Lector / Revisor', cls: 'bg-gray-100 text-gray-700' },
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('author')
  const [bio, setBio] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersApi.list,
  })

  const openCreateModal = () => {
    setEditingUser(null)
    setDisplayName('')
    setEmail('')
    setPassword('')
    setRole('author')
    setBio('')
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setDisplayName(user.display_name)
    setEmail(user.email)
    setPassword('')
    setRole(user.role)
    setBio(user.bio || '')
    setFormError(null)
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<User> & { password?: string } = {
        display_name: displayName,
        email,
        role,
        bio: bio || null,
      }
      if (password) {
        payload.password = password
      }

      return editingUser
        ? usersApi.update(editingUser.id, payload)
        : usersApi.create(payload as Partial<User> & { password: string })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setModalOpen(false)
    },
    onError: (err) => setFormError(getApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const handleDelete = (u: User) => {
    if (confirm(`¿Eliminar al usuario "${u.display_name}"?`)) {
      deleteMutation.mutate(u.id)
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipo Editorial</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona administradores, redactores y colaboradores del portal
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo miembro
        </button>
      </div>

      {/* ── Tabla de Usuarios ──────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">No hay usuarios registrados</p>
            <button onClick={openCreateModal} className="btn-primary inline-flex mt-4">
              <PlusCircle className="w-4 h-4" />
              Crear primer usuario
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const badge = ROLE_BADGES[u.role] || ROLE_BADGES.viewer

                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-sm">
                          {u.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.display_name}</p>
                          {u.bio && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{u.bio}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                        <Shield className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded text-gray-400 hover:text-brand-600 hover:bg-gray-100"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
                {editingUser ? 'Editar miembro' : 'Nuevo miembro del equipo'}
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
                <label className="admin-label">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. María Pérez"
                  className="admin-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="admin-label">Correo electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@portalnoticia.com"
                  className="admin-input text-xs"
                />
              </div>

              <div>
                <label className="admin-label">
                  {editingUser ? 'Contraseña (dejar vacío para conservar)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="admin-input text-xs"
                  minLength={6}
                />
              </div>

              <div>
                <label className="admin-label">Rol y permisos *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="admin-input text-sm"
                >
                  <option value="author">Autor / Periodista (crea y edita sus notas)</option>
                  <option value="editor">Editor (puede publicar y editar todas las notas)</option>
                  <option value="admin">Administrador (control total del sitio)</option>
                  <option value="viewer">Lector / Revisor (solo lectura)</option>
                </select>
              </div>

              <div>
                <label className="admin-label">Biografía corta (opcional)</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Periodista de investigación con 10 años de experiencia..."
                  className="admin-input resize-none text-xs"
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
                  disabled={saveMutation.isPending || !displayName.trim() || !email.trim()}
                  className="btn-primary text-xs"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  {editingUser ? 'Actualizar usuario' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

