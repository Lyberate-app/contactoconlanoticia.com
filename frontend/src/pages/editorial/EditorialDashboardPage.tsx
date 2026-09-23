import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { editorialService, ArticleSummary, DashboardStats } from '../../services/editorial';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  Megaphone,
  Inbox,
  ExternalLink,
  Edit3,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const EditorialDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPublished, setRecentPublished] = useState<ArticleSummary[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const statsData = await editorialService.getDashboardStats();
        setStats(statsData);

        const publishedRes = await editorialService.getArticles({
          status: 'PUBLISHED',
          limit: '5',
        });
        setRecentPublished(publishedRes.articles);

        const draftsRes = await editorialService.getArticles({
          status: 'DRAFT',
          limit: '5',
        });
        setPendingDrafts(draftsRes.articles);
      } catch (err) {
        console.error('Error al cargar panel editorial:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Top Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold capitalize">
            {todayFormatted}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Mesa Central de Redacción
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Panel de control editorial &bull; Contacto con la Noticia &bull; Plataforma Lyberate
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded transition-colors"
          >
            <span>Ver Portal Público</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </a>

          <Link
            to="/admin/articles/new"
            className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Redactar Noticia</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Published */}
        <Link
          to="/admin/articles"
          className="bg-white border border-stone-200 p-4 shadow-sm hover:border-emerald-600 transition-colors group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Publicados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {stats ? stats.published_articles : '—'}
            </span>
            <p className="text-[10px] text-stone-400 mt-0.5">En línea en el portal</p>
          </div>
        </Link>

        {/* Drafts */}
        <Link
          to="/admin/articles"
          className="bg-white border border-stone-200 p-4 shadow-sm hover:border-stone-500 transition-colors group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Borradores</span>
            <FileText className="w-4 h-4 text-stone-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {stats ? stats.draft_articles : '—'}
            </span>
            <p className="text-[10px] text-stone-400 mt-0.5">En proceso de redacción</p>
          </div>
        </Link>

        {/* Pending Review */}
        <Link
          to="/admin/articles"
          className="bg-white border border-stone-200 p-4 shadow-sm hover:border-amber-600 transition-colors group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">En Revisión</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {stats ? stats.pending_review_articles : '—'}
            </span>
            <p className="text-[10px] text-stone-400 mt-0.5">Pendiente de editor jefe</p>
          </div>
        </Link>

        {/* Scheduled */}
        <Link
          to="/admin/articles"
          className="bg-white border border-stone-200 p-4 shadow-sm hover:border-blue-600 transition-colors group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Programados</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {stats ? stats.scheduled_articles : '—'}
            </span>
            <p className="text-[10px] text-stone-400 mt-0.5">Para publicación diferida</p>
          </div>
        </Link>

        {/* Media */}
        <Link
          to="/admin/media"
          className="bg-white border border-stone-200 p-4 shadow-sm hover:border-purple-600 transition-colors group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Multimedia</span>
            <ImageIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {stats ? stats.total_media : '—'}
            </span>
            <p className="text-[10px] text-stone-400 mt-0.5">Fotografías y gráficos</p>
          </div>
        </Link>

        {/* Ads */}
        <Link
          to="/admin/ads"
          className="bg-white border border-stone-200 p-4 shadow-sm hover:border-rose-600 transition-colors group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Publicidad</span>
            <Megaphone className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-stone-900">
              {stats ? stats.total_ads : '—'}
            </span>
            <p className="text-[10px] text-stone-400 mt-0.5">Campañas configuradas</p>
          </div>
        </Link>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Editorial Activity & Recent Articles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Published */}
          <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-stone-600" />
                <h2 className="font-serif font-bold text-sm text-stone-900">
                  Últimas Noticias Publicadas
                </h2>
              </div>
              <Link
                to="/admin/articles"
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-stone-100">
              {loading ? (
                <div className="p-8 text-center text-xs text-stone-500">Cargando noticias...</div>
              ) : recentPublished.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">No hay noticias publicadas aún.</div>
              ) : (
                recentPublished.map((article) => (
                  <div key={article.article_uuid} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                          {article.category_name}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                            : 'Reciente'}
                        </span>
                      </div>
                      <h3 className="text-sm font-serif font-bold text-stone-900 truncate">
                        <Link to={`/admin/articles/edit/${article.article_uuid}`} className="hover:underline">
                          {article.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-stone-500 truncate mt-0.5">
                        Por {article.author_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/noticia/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                        title="Ver en portal público"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        to={`/admin/articles/edit/${article.article_uuid}`}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                        title="Editar noticia"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Drafts */}
          <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-600" />
                <h2 className="font-serif font-bold text-sm text-stone-900">
                  Borradores en Elaboración
                </h2>
              </div>
              <Link
                to="/admin/articles/new"
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <span>+ Nueva Noticia</span>
              </Link>
            </div>

            <div className="divide-y divide-stone-100">
              {loading ? (
                <div className="p-8 text-center text-xs text-stone-500">Cargando borradores...</div>
              ) : pendingDrafts.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  No hay borradores pendientes. ¡La mesa de redacción está al día!
                </div>
              ) : (
                pendingDrafts.map((draft) => (
                  <div key={draft.article_uuid} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                          {draft.category_name}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          Actualizado: {new Date(draft.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <h3 className="text-sm font-serif font-bold text-stone-900 truncate">
                        <Link to={`/admin/articles/edit/${draft.article_uuid}`} className="hover:underline">
                          {draft.title || 'Sin titular todavía'}
                        </Link>
                      </h3>
                    </div>

                    <Link
                      to={`/admin/articles/edit/${draft.article_uuid}`}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors rounded shadow-sm"
                    >
                      Continuar Edición
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Status */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white border border-stone-200 p-5 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-sm text-stone-900 border-b border-stone-200 pb-2">
              Atajos Editoriales
            </h2>

            <div className="space-y-2 text-xs">
              <Link
                to="/admin/articles/new"
                className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 font-medium text-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-stone-600" />
                  <span>Redactar nueva noticia</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/admin/media"
                className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 font-medium text-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-stone-600" />
                  <span>Gestionar multimedia y fotos</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/admin/submissions"
                className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 font-medium text-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-stone-600" />
                  <span>Moderar buzón ciudadano</span>
                </div>
                {stats && stats.pending_submissions > 0 && (
                  <span className="bg-red-700 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                    {stats.pending_submissions}
                  </span>
                )}
              </Link>

              <Link
                to="/admin/ads"
                className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 font-medium text-stone-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-stone-600" />
                  <span>Campañas publicitarias</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </div>

          {/* System & Architecture Status Box */}
          <div className="bg-stone-50 border border-stone-200 p-5 text-xs space-y-3">
            <h3 className="font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
              Estado de la Plataforma
            </h3>

            <div className="space-y-2 text-stone-600">
              <div className="flex items-center justify-between">
                <span>Modo de Operación:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  MOCK LOCAL (Vite)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Persistencia:</span>
                <span className="font-mono text-stone-800">localStorage (Dev)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Contratos API:</span>
                <span className="font-mono text-stone-800">docs/API.md v1</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fase de Frontend:</span>
                <span className="font-bold text-stone-900">FE-4 (CMS + Media)</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-200 leading-relaxed">
              El CMS funciona de manera desacoplada y autónoma mediante la capa de servicios, preparado para conectarse al backend real de PHP en etapas posteriores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
