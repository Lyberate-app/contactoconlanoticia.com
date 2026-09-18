import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Eye, Trash2, Send, Archive, Clock } from 'lucide-react'
import { postsApi } from '@/lib/api'
import type { PostSummary } from '@portal/shared-types'
import { formatDateRelative } from '@/lib/utils'
import { useState } from 'react'

const STATUS_LABELS = {
  draft: { label: 'Borrador', cls: 'bg-yellow-100 text-yellow-800' },
  scheduled: { label: 'Programada', cls: 'bg-purple-100 text-purple-800' },
  published: { label: 'Publicada', cls: 'bg-green-100 text-green-800' },
  archived: { label: 'Archivada', cls: 'bg-gray-100 text-gray-700' },
}

export function PostListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-posts', statusFilter, page],
    queryFn: () =>
      postsApi.list({
        status: statusFilter !== 'all' ? (statusFilter as never) : undefined,
        page,
        per_page: 20,
        order_by: 'published_at',
        order: 'desc',
      }),
  })

  const publishMutation = useMutation({
    mutationFn: (id: number) => postsApi.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
  })

  const handleDelete = (id: number, title: string) => {
    if (confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Noticias</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.pagination.total ?? 0} en total
          </p>
        </div>
        <Link to="/noticias/nueva" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Nueva noticia
        </Link>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'published', 'draft', 'scheduled', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {s === 'all' ? 'Todas' : STATUS_LABELS[s as keyof typeof STATUS_LABELS]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Cargando...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-500 mb-4">No hay noticias con este filtro.</p>
            <Link to="/noticias/nueva" className="btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              Crear primera noticia
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Autor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map((post) => (
                <PostRow
                  key={post.uuid}
                  post={post}
                  onEdit={() => navigate(`/noticias/${post.uuid}/editar`)}
                  onPublish={() => publishMutation.mutate(post.uuid as never)}
                  onDelete={() => handleDelete(post.uuid as never, post.title)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {data && data.pagination.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {data.pagination.last_page}
          </span>
          <button
            disabled={page >= data.pagination.last_page}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}

function PostRow({
  post,
  onEdit,
  onPublish,
  onDelete,
}: {
  post: PostSummary
  onEdit: () => void
  onPublish: () => void
  onDelete: () => void
}) {
  const statusStyle = STATUS_LABELS[post.status as keyof typeof STATUS_LABELS]

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <button
          onClick={onEdit}
          className="text-left font-medium text-gray-900 hover:text-brand-600 transition-colors line-clamp-2 max-w-sm"
        >
          {post.title}
        </button>
      </td>
      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
        {post.category?.name ?? <span className="text-gray-300">Sin categoría</span>}
      </td>
      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
        {post.author.display_name}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle?.cls}`}>
          {statusStyle?.label ?? post.status}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
        {formatDateRelative(post.published_at)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <ActionButton onClick={onEdit} title="Editar" icon={<Pencil className="w-3.5 h-3.5" />} />
          {post.status === 'draft' && (
            <ActionButton onClick={onPublish} title="Publicar" icon={<Send className="w-3.5 h-3.5" />} color="green" />
          )}
          <ActionButton onClick={onDelete} title="Eliminar" icon={<Trash2 className="w-3.5 h-3.5" />} color="red" />
        </div>
      </td>
    </tr>
  )
}

function ActionButton({
  onClick,
  title,
  icon,
  color = 'gray',
}: {
  onClick: () => void
  title: string
  icon: React.ReactNode
  color?: 'gray' | 'green' | 'red'
}) {
  const colors = {
    gray: 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
    green: 'text-green-500 hover:text-green-700 hover:bg-green-50',
    red: 'text-red-400 hover:text-red-600 hover:bg-red-50',
  }
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${colors[color]}`}
    >
      {icon}
    </button>
  )
}

