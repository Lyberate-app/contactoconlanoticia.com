import { useQuery } from '@tanstack/react-query'
import { Eye, TrendingUp, Calendar, FileText, ExternalLink, Loader2, ArrowUpRight } from 'lucide-react'
import { analyticsApi } from '@/lib/api'
import { Link } from 'react-router-dom'

export function AnalyticsPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: analyticsApi.overview,
  })

  const { data: topPosts = [] } = useQuery({
    queryKey: ['admin-analytics-posts'],
    queryFn: analyticsApi.posts,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const todayViews = overview?.today_views ?? 0
  const weekViews = overview?.week_views ?? 0
  const monthViews = overview?.month_views ?? 0
  const totalPosts = overview?.total_posts ?? 0

  return (
    <div className="p-6 max-w-6xl">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Métricas y Rendimiento Editorial</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Estadísticas en tiempo real de visitas, lectura y artículos con mayor impacto
        </p>
      </div>

      {/* ── Tarjetas de Métricas ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Lecturas Hoy"
          value={todayViews.toLocaleString()}
          icon={Eye}
          color="blue"
        />
        <MetricCard
          title="Últimos 7 días"
          value={weekViews.toLocaleString()}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Últimos 30 días"
          value={monthViews.toLocaleString()}
          icon={Calendar}
          color="purple"
        />
        <MetricCard
          title="Total Artículos"
          value={totalPosts.toLocaleString()}
          icon={FileText}
          color="amber"
        />
      </div>

      {/* ── Grid Principal: Gráfico de Tendencia + Top Artículos ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Columna 1 & 2: Top Artículos Más Leídos ──── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">Noticias Más Leídas</h2>
              <p className="text-xs text-gray-500">Ranking por número de visualizaciones registradas</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
              Top Impacto
            </span>
          </div>

          {topPosts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">
              Aún no hay suficiente información de visitas acumuladas.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topPosts.map((post, idx) => (
                <div key={post.id} className="py-3.5 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-gray-200 text-gray-800'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-900'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <Link
                      to={`/noticias/${post.id}/editar`}
                      className="text-sm font-medium text-gray-800 hover:text-brand-600 transition-colors truncate"
                      title={post.title}
                    >
                      {post.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {post.views_count.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 block">vistas</span>
                    </div>
                    <a
                      href={`${import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000'}/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Ver noticia en web pública"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Columna 3: Información de Audiencia / Dispositivos ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Distribución Estimada
            </h3>
            <div className="space-y-4">
              <DistributionBar label="Dispositivos Móviles" percentage={78} color="bg-brand-600" />
              <DistributionBar label="Escritorio / Ordenadores" percentage={19} color="bg-blue-400" />
              <DistributionBar label="Tablets" percentage={3} color="bg-gray-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-2xl p-6 text-white shadow-sm">
            <h3 className="text-sm font-bold mb-2">Protección de Privacidad</h3>
            <p className="text-xs text-brand-100 leading-relaxed">
              El motor de analítica no utiliza cookies de rastreo invasivas ni almacena direcciones IP completas, cumpliendo con estándares de privacidad y velocidad sin penalizaciones de PageSpeed.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: any
  color: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  )
}

function DistributionBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
