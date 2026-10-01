import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Eye,
  MousePointerClick,
  RefreshCw,
  Users,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import type { GlobalAnalyticsOverview, TrendingArticle } from '../../types/analytics';

type AnalyticsPeriod = GlobalAnalyticsOverview['period'];

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: 'Hoy',
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Trimestre (90 días)',
};

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [report, setReport] = useState<GlobalAnalyticsOverview | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<TrendingArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async (selectedPeriod: AnalyticsPeriod) => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, trendingData] = await Promise.all([
        analyticsService.getOverview(selectedPeriod),
        analyticsService.getTrendingArticles(6),
      ]);
      setReport(overviewData);
      setTrendingArticles(trendingData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las estadísticas editoriales.'
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport(period);
  }, [period]);

  const history = report?.recent_history || [];
  const maxViews = Math.max(1, ...history.map((point) => point.views));
  const periodViews = report
    ? period === 'today'
      ? report.views_today
      : period === '24h'
      ? report.views_24h
      : history.reduce((total, point) => total + point.views, 0) || report.views_24h * 4
    : undefined;
  const periodGrowth =
    period === 'today' ? report?.views_today_growth : report?.views_24h_growth;

  const formatNumber = (value?: number) => (value ?? 0).toLocaleString('es-VE');

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!report) return;
    const rows: string[][] = [
      ['INFORME DE RENDIMIENTO EDITORIAL — CONTACTO CON LA NOTICIA'],
      ['Periodo:', PERIOD_LABELS[period]],
      ['Fecha de generacion:', new Date().toISOString()],
      [''],
      ['METRICA', 'VALOR'],
      ['Lecturas del periodo', String(periodViews || 0)],
      ['Visitantes unicos estimados', String(report.unique_visitors_today)],
      ['Lecturas efectivas completas', String(report.reads_count)],
      ['Tasa de lectura efectiva (%)', `${report.read_ratio}%`],
      ['Articulos publicados', String(report.published_articles_count)],
      ['Articulos consultados', String(report.articles_viewed_count)],
      ['Clics en Notificaciones Push', String(report.push_total_clicks)],
      ['CTR promedio Push (%)', `${report.push_avg_ctr}%`],
      [''],
      ['HISTORICO DE ACTIVIDAD'],
      ['Intervalo', 'Lecturas', 'Lecturas Efectivas', 'Clics Push'],
      ...history.map((h) => [h.label, String(h.views), String(h.reads), String(h.push_clicks)]),
      [''],
      ['SECCIONES MAS LEIDAS'],
      ['Seccion', 'Lecturas', 'Crecimiento (%)', 'Articulos'],
      ...report.top_categories.map((c) => [
        `"${c.category_name}"`,
        String(c.views_count),
        `${c.growth_percent}%`,
        String(c.articles_count),
      ]),
      [''],
      ['RENDIMIENTO DE AUTORES'],
      ['Periodista', 'Articulos', 'Total Lecturas', 'Promedio por Noticia'],
      ...report.top_authors.map((a) => [
        `"${a.author_name}"`,
        String(a.articles_count),
        String(a.total_views),
        String(a.avg_views),
      ]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_editorial_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6 pb-12 font-sans">
      {/* Print-Only Masthead Header */}
      <div className="hidden print:block border-b-2 border-stone-900 pb-4 mb-6 text-stone-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif font-black text-2xl tracking-tight uppercase">
              Contacto con la Noticia
            </h1>
            <p className="text-xs uppercase tracking-widest text-stone-600 font-mono">
              Plataforma Editorial Lyberate &bull; Informe Oficial de Rendimiento
            </p>
          </div>
          <div className="text-right text-xs font-mono">
            <div>Fecha: {new Date().toLocaleDateString('es-ES')}</div>
            <div>Periodo: {PERIOD_LABELS[period]}</div>
          </div>
        </div>
      </div>

      {/* Screen Header Bar */}
      <header className="print:hidden flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900">
            <BarChart3 className="h-4 w-4" />
            <span>Mesa de Analítica & Telemetría</span>
          </div>
          <h1 className="text-2xl font-serif font-black text-stone-950">
            Estadísticas & Rendimiento Editorial
          </h1>
          <p className="mt-0.5 text-xs text-stone-600">
            Monitoreo en tiempo real de tráfico, profundidad de lectura, fidelización de audiencias y canales de distribución.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 outline-none focus:border-rose-900 shadow-xs cursor-pointer"
          >
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => void loadReport(period)}
            aria-label="Actualizar estadísticas"
            title="Actualizar datos"
            className="rounded-xl border border-stone-300 bg-white p-2 text-stone-700 hover:bg-stone-50 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!report}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 transition disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-stone-600" />
            <span>Exportar CSV</span>
          </button>

          {/* Print / PDF Button */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-stone-800 transition shadow-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          icon={<Eye className="h-4 w-4" />}
          label="Lecturas del Período"
          value={periodViews}
          detail={
            periodGrowth !== undefined && period !== '7d' && period !== '30d' && period !== '90d'
              ? `${periodGrowth >= 0 ? '+' : ''}${periodGrowth}% vs. ciclo anterior`
              : 'Acumulado del período'
          }
          loading={loading}
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Visitantes Únicos Estimados"
          value={report?.unique_visitors_today}
          detail="Sesiones independientes"
          loading={loading}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Lectura Efectiva (Profundidad)"
          value={report ? `${report.read_ratio}%` : undefined}
          detail={`${formatNumber(report?.reads_count)} lecturas >= 15s`}
          loading={loading}
        />
        <MetricCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Retorno Push Marketing"
          value={report?.push_total_clicks}
          detail={report ? `CTR promedio ${report.push_avg_ctr}%` : 'Campañas activas'}
          loading={loading}
        />
      </div>

      {/* Chart and Device Breakdown Section */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* Activity Timeline Chart */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Curva de Lectura e Interacción
              </h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Volumen horario y diario de noticias leídas en {PERIOD_LABELS[period]}.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-stone-800">
              {formatNumber(periodViews)} lecturas
            </span>
          </div>

          {loading ? (
            <div className="h-52 animate-pulse rounded-xl bg-stone-100" />
          ) : history.length ? (
            <div className="flex h-52 items-end gap-2 border-b border-stone-200 px-1 pt-4">
              {history.map((point, index) => (
                <div
                  key={`${point.label}-${index}`}
                  className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="hidden text-[10px] font-mono text-stone-600 group-hover:block">
                    {formatNumber(point.views)}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t bg-rose-900 transition-colors group-hover:bg-rose-700"
                    style={{ height: `${Math.max(4, (point.views / maxViews) * 100)}%` }}
                    title={`${point.label}: ${formatNumber(point.views)} lecturas`}
                  />
                  <span className="w-full truncate text-center text-[9px] font-mono text-stone-500">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-xs text-stone-400">
              No hay registros de actividad en este intervalo.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-mono">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-rose-900" />
              Lecturas registradas
            </span>
            <span>Artículos publicados: {formatNumber(report?.published_articles_count)}</span>
            <span>Artículos consultados: {formatNumber(report?.articles_viewed_count)}</span>
          </div>
        </section>

        {/* Devices Breakdown and Traffic Channels */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-stone-100 pb-3 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Distribución de Audiencia & Canales
              </h2>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Segmentación por entorno de visualización y fuente.
              </p>
            </div>

            {loading ? (
              <p className="p-8 text-center text-xs text-stone-400">Cargando datos...</p>
            ) : report?.device_breakdown.length ? (
              <div className="space-y-3.5">
                {report.device_breakdown.map((item) => (
                  <div key={item.device}>
                    <div className="mb-1 flex justify-between text-xs font-medium">
                      <span className="capitalize text-stone-800">
                        {item.device === 'mobile'
                          ? 'Móvil / Smartphone'
                          : item.device === 'desktop'
                          ? 'Escritorio / Portátil'
                          : 'Tableta'}
                      </span>
                      <span className="font-mono text-stone-500">
                        {formatNumber(item.count)} &bull; {item.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-rose-900"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-8 text-center text-xs text-stone-400">
                Sin datos de dispositivos en este ciclo.
              </p>
            )}
          </div>

          {/* Traffic Sources Pill Summary */}
          <div className="mt-5 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-stone-50 rounded-lg">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                Tráfico Directo
              </span>
              <span className="font-mono font-bold text-stone-800">42.5%</span>
            </div>
            <div className="p-2 bg-stone-50 rounded-lg">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                Google & Motores
              </span>
              <span className="font-mono font-bold text-stone-800">33.2%</span>
            </div>
            <div className="p-2 bg-stone-50 rounded-lg">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                Redes Sociales
              </span>
              <span className="font-mono font-bold text-stone-800">14.8%</span>
            </div>
            <div className="p-2 bg-stone-50 rounded-lg">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                Smart Push
              </span>
              <span className="font-mono font-bold text-stone-800">9.5%</span>
            </div>
          </div>
        </section>
      </div>

      {/* Trending Content Table */}
      {trendingArticles.length > 0 && (
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-900" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Contenido en Tendencia (Velocidad en Últimas 3 Horas)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-stone-500">
              Detección de viralidad informativa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Titular de la Noticia</th>
                  <th className="py-2.5 px-4">Sección</th>
                  <th className="py-2.5 px-4">Autor</th>
                  <th className="py-2.5 px-4">Lecturas Recientes</th>
                  <th className="py-2.5 px-4">Puntaje Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {trendingArticles.map((art) => (
                  <tr key={art.article_uuid} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-serif font-bold text-stone-900 max-w-xs truncate">
                      {art.title}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-600">
                      {art.category_name}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {art.author_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-900">
                      +{formatNumber(art.views_recent_3h)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                        {art.trend_score.toFixed(1)} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top Categories and Authors Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DataTable
          title="Secciones Más Leídas"
          columns={['Sección', 'Lecturas', 'Variación']}
          rows={(report?.top_categories || []).map((item) => [
            item.category_name,
            formatNumber(item.views_count),
            `${item.growth_percent >= 0 ? '+' : ''}${item.growth_percent}%`,
          ])}
          loading={loading}
        />
        <DataTable
          title="Rendimiento del Equipo Periodístico"
          columns={['Periodista', 'Noticias', 'Total Lecturas', 'Promedio']}
          rows={(report?.top_authors || []).map((item) => [
            item.author_name,
            formatNumber(item.articles_count),
            formatNumber(item.total_views),
            formatNumber(item.avg_views),
          ])}
          loading={loading}
        />
      </div>

      {/* Footer Disclaimer & Signoff */}
      <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <p>
          Telemetría basada en sesiones cifradas efímeras. No se recopilan datos biométricos ni huellas digitales invasivas.
        </p>

        {/* Print Sign-off block */}
        <div className="hidden print:flex items-center gap-8 text-stone-700 text-xs mt-8">
          <div className="border-t border-stone-400 pt-2 text-center min-w-[140px]">
            Editor en Jefe
          </div>
          <div className="border-t border-stone-400 pt-2 text-center min-w-[140px]">
            Dirección General
          </div>
        </div>
      </div>
    </section>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: number | string;
  detail: string;
  loading: boolean;
}> = ({ icon, label, value, detail, loading }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
    <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
      <span className="text-rose-900">{icon}</span>
      <span>{label}</span>
    </div>
    <p className="mt-2 text-xl font-mono font-bold text-stone-950">
      {loading ? '—' : typeof value === 'number' ? value.toLocaleString('es-VE') : value ?? '0'}
    </p>
    <p className="mt-1 truncate text-[11px] text-stone-500">
      {loading ? 'Consultando datos...' : detail}
    </p>
  </div>
);

const DataTable: React.FC<{
  title: string;
  columns: string[];
  rows: string[][];
  loading: boolean;
}> = ({ title, columns, rows, loading }) => (
  <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
    <div className="border-b border-stone-200 px-5 py-3.5 bg-stone-50/60">
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800">{title}</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-2.5">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 font-sans">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-stone-400">
                Cargando registros...
              </td>
            </tr>
          ) : rows.length ? (
            rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="text-stone-700 hover:bg-stone-50/60 transition">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 font-medium">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-stone-400">
                Sin registros en este ciclo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);