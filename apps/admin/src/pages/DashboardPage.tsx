import { useQuery } from '@tanstack/react-query'
import { FileText, Eye, Users, TrendingUp, PlusCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { postsApi } from '@/lib/api'
import { formatDateRelative } from '@/lib/utils'

export function DashboardPage() {
  const { data: draftsData } = useQuery({
    queryKey: ['posts', 'drafts'],
    queryFn: () => postsApi.list({ status: 'draft', per_page: 5 }),
  })

  const { data: scheduledData } = useQuery({
    queryKey: ['posts', 'scheduled'],
    queryFn: () => postsApi.list({ status: 'scheduled', per_page: 5 }),
  })

  const { data: publishedData } = useQuery({
    queryKey: ['posts', 'published-recent'],
    queryFn: () => postsApi.list({ status: 'published', per_page: 5, order_by: 'published_at', order: 'desc' }),
  })

  return (
    <div className="p-6 max-w-6xl">
      {/* Título */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen editorial del sitio</p>
        </div>
        <Link to="/noticias/nueva" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Nueva noticia
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Publicadas"
          value={publishedData?.pagination.total ?? '—'}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="Borradores"
          value={draftsData?.pagination.total ?? '—'}
          icon={FileText}
          color="yellow"
        />
        <StatCard
          label="Programadas"
          value={scheduledData?.pagination.total ?? '—'}
          icon={Clock}
          color="purple"
        />
        <StatCard
          label="Vistas hoy"
          value="—"
          icon={Eye}
          color="green"
        />
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Publicadas recientemente */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Publicadas recientemente</h2>
            <Link to="/noticias?status=published" className="text-xs text-brand-600 hover:text-brand-700">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {publishedData?.items.map((post) => (
              <PostRow key={post.uuid} post={post} />
            ))}
            {!publishedData?.items.length && (
              <p className="text-sm text-gray-400 text-center py-4">No hay noticias publicadas</p>
            )}
          </div>
        </div>

        {/* Borradores y programadas */}
        <div className="space-y-6">
          {/* Borradores */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Borradores</h2>
              <Link to="/noticias?status=draft" className="text-xs text-brand-600 hover:text-brand-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {draftsData?.items.map((post) => (
                <PostRow key={post.uuid} post={post} />
              ))}
              {!draftsData?.items.length && (
                <p className="text-sm text-gray-400 text-center py-4">No hay borradores</p>
              )}
            </div>
          </div>

          {/* Programadas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Programadas</h2>
            </div>
            <div className="space-y-3">
              {scheduledData?.items.map((post) => (
                <PostRow key={post.uuid} post={post} />
              ))}
              {!scheduledData?.items.length && (
                <p className="text-sm text-gray-400 text-center py-4">No hay noticias programadas</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Subcomponentes ────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: typeof FileText
  color: 'blue' | 'yellow' | 'green' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function PostRow({ post }: { post: import('@portal/shared-types').PostSummary }) {
  return (
    <Link
      to={`/noticias/${post.uuid}/editar`}
      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 group-hover:text-brand-600 transition-colors line-clamp-2">
          {post.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {post.category?.name ?? 'Sin categoría'} · {formatDateRelative(post.published_at)}
        </p>
      </div>
    </Link>
  )
}

