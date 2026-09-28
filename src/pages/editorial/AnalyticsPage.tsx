import React, { useEffect, useState } from 'react';
import { BarChart3, Download, Eye, MousePointerClick, RefreshCw, Users } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import type { GlobalAnalyticsOverview } from '../../types/analytics';

type AnalyticsPeriod = GlobalAnalyticsOverview['period'];

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: 'Hoy',
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
};

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [report, setReport] = useState<GlobalAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async (selectedPeriod: AnalyticsPeriod) => {
    setLoading(true);
    setError('');
    try {
      setReport(await analyticsService.getOverview(selectedPeriod));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las estadísticas.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReport(period); }, [period]);

  const history = report?.recent_history || [];
  const maxViews = Math.max(1, ...history.map((point) => point.views));
  const periodViews = report
    ? period === 'today'
      ? report.views_today
      : period === '24h'
        ? report.views_24h
        : history.reduce((total, point) => total + point.views, 0)
    : undefined;
  const periodGrowth = period === 'today' ? report?.views_today_growth : report?.views_24h_growth;
  const formatNumber = (value?: number) => (value ?? 0).toLocaleString('es-VE');
  const exportPdf = () => window.print();

  return (
    <section className="space-y-5 pb-10">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-800"><BarChart3 className="h-4 w-4" /> RENDIMIENTO EDITORIAL</div>
          <h1 className="text-2xl font-bold text-stone-950">Estadísticas</h1>
          <p className="mt-1 text-sm text-stone-600">Tráfico, lectura, audiencias y distribución de contenido.</p>
        </div>
        <div className="print-hidden flex flex-wrap items-center gap-2">
          <select value={period} onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)} className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-rose-700">
            {Object.entries(PERIOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={() => void loadReport(period)} aria-label="Actualizar estadísticas" title="Actualizar" className="rounded-lg border border-stone-300 bg-white p-2.5 text-stone-700 hover:bg-stone-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"><Download className="h-4 w-4" /> Exportar PDF</button>
        </div>
      </header>

      <div className="hidden print:block"><h2 className="text-lg font-bold">Informe de estadísticas: {PERIOD_LABELS[period]}</h2><p className="text-xs text-stone-500">Generado el {new Date().toLocaleString('es-VE')}</p></div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric icon={<Eye className="h-4 w-4" />} label="Lecturas del período" value={periodViews} detail={periodGrowth !== undefined && period !== '7d' && period !== '30d' ? `${periodGrowth >= 0 ? '+' : ''}${periodGrowth}% vs. período anterior` : 'Acumulado del período seleccionado'} loading={loading} />
        <Metric icon={<Users className="h-4 w-4" />} label="Visitantes únicos hoy" value={report?.unique_visitors_today} detail="Audiencia estimada por sesión" loading={loading} />
        <Metric icon={<BarChart3 className="h-4 w-4" />} label="Lectura efectiva" value={report ? `${report.read_ratio}%` : undefined} detail={`${formatNumber(report?.reads_count)} lecturas completas`} loading={loading} />
        <Metric icon={<MousePointerClick className="h-4 w-4" />} label="Clics en push" value={report?.push_total_clicks} detail={report ? `CTR promedio ${report.push_avg_ctr}%` : ''} loading={loading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-sm font-bold text-stone-900">Actividad de lectura</h2><p className="mt-1 text-xs text-stone-500">Lecturas y visitas por intervalo · {PERIOD_LABELS[period]}</p></div><span className="text-xs font-semibold text-stone-600">{formatNumber(periodViews)} lecturas</span></div>
          {loading ? <div className="h-48 animate-pulse rounded-md bg-stone-100" /> : history.length ? <div className="flex h-52 items-end gap-2 border-b border-stone-200 px-1 pt-4">{history.map((point, index) => <div key={`${point.label}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="hidden text-[10px] text-stone-500 group-hover:block">{formatNumber(point.views)}</span><div className="w-full max-w-10 rounded-t-sm bg-rose-800 transition-colors group-hover:bg-rose-600" style={{ height: `${Math.max(3, point.views / maxViews * 100)}%` }} title={`${point.label}: ${formatNumber(point.views)} lecturas`} /><span className="w-full truncate text-center text-[9px] text-stone-500">{point.label}</span></div>)}</div> : <p className="py-16 text-center text-sm text-stone-500">No hay actividad en el período seleccionado.</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-stone-500"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-rose-800" /> Lecturas</span><span>Artículos publicados: {formatNumber(report?.published_articles_count)}</span><span>Noticias consultadas: {formatNumber(report?.articles_viewed_count)}</span></div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-4 py-3"><h2 className="text-sm font-bold text-stone-900">Dispositivos</h2><p className="mt-1 text-xs text-stone-500">Distribución de la audiencia</p></div>
          {loading ? <p className="p-8 text-center text-sm text-stone-500">Cargando…</p> : report?.device_breakdown.length ? <div className="space-y-4 p-4">{report.device_breakdown.map((item) => <div key={item.device}><div className="mb-1 flex justify-between text-xs"><span className="font-medium capitalize text-stone-800">{item.device === 'mobile' ? 'Móvil' : item.device === 'desktop' ? 'Escritorio' : 'Tableta'}</span><span className="text-stone-500">{formatNumber(item.count)} · {item.percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-rose-800" style={{ width: `${Math.min(100, item.percentage)}%` }} /></div></div>)}</div> : <p className="p-8 text-center text-sm text-stone-500">Sin datos de dispositivos.</p>}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DataTable title="Secciones más leídas" columns={['Sección', 'Lecturas', 'Variación']} rows={(report?.top_categories || []).map((item) => [item.category_name, formatNumber(item.views_count), `${item.growth_percent >= 0 ? '+' : ''}${item.growth_percent}%`])} loading={loading} />
        <DataTable title="Rendimiento de autores" columns={['Autor', 'Noticias', 'Lecturas', 'Promedio']} rows={(report?.top_authors || []).map((item) => [item.author_name, formatNumber(item.articles_count), formatNumber(item.total_views), formatNumber(item.avg_views)])} loading={loading} />
      </div>
      <p className="text-xs text-stone-500">Período del informe: {PERIOD_LABELS[period]}. Las cifras dependen de la telemetría disponible en el servicio de analítica.</p>
    </section>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value?: number | string; detail: string; loading: boolean }> = ({ icon, label, value, detail, loading }) => (
  <div className="rounded-lg border border-stone-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-stone-500"><span className="text-rose-800">{icon}</span>{label}</div><p className="mt-3 text-xl font-bold text-stone-950">{loading ? '—' : typeof value === 'number' ? value.toLocaleString('es-VE') : value ?? '0'}</p><p className="mt-1 truncate text-[11px] text-stone-500">{loading ? 'Consultando datos…' : detail}</p></div>
);

const DataTable: React.FC<{ title: string; columns: string[]; rows: string[][]; loading: boolean }> = ({ title, columns, rows, loading }) => (
  <section className="overflow-hidden rounded-lg border border-stone-200 bg-white"><div className="border-b border-stone-200 px-4 py-3"><h2 className="text-sm font-bold text-stone-900">{title}</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead className="bg-stone-50 text-[10px] uppercase text-stone-500"><tr>{columns.map((column) => <th key={column} className="px-4 py-2.5">{column}</th>)}</tr></thead><tbody className="divide-y divide-stone-100">{loading ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-stone-500">Cargando…</td></tr> : rows.length ? rows.map((row, index) => <tr key={`${row[0]}-${index}`} className="text-stone-700">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-stone-500">Sin registros en este período.</td></tr>}</tbody></table></div></section>
);