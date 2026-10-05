import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { editorialService, ArticleSummary, DashboardStats } from '../../services/editorial';
import { analyticsService } from '../../services/analyticsService';
import type { GlobalAnalyticsOverview } from '../../types/analytics';
import { useSettings } from '../../context/SettingsContext';
import { isMockMode } from '../../config/env';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  Image as ImageIcon,
  Megaphone,
  Inbox,
  ExternalLink,
  Edit3,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Building,
  ChevronRight,
  Activity,
} from 'lucide-react';

export const EditorialDashboardPage: React.FC = () => {
  const { settings } = useSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPublished, setRecentPublished] = useState<ArticleSummary[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<ArticleSummary[]>([]);
  const [analytics, setAnalytics] = useState<GlobalAnalyticsOverview | null>(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [chartMetric, setChartMetric] = useState<'views' | 'reads'>('views');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setDashboardError('');
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
      setDashboardError(err instanceof Error ? err.message : 'No se pudieron cargar los datos editoriales.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    const period = timeFilter === 'today' ? 'today' : timeFilter === 'week' ? '7d' : '30d';

    analyticsService.getOverview(period)
      .then((data) => {
        if (!isCurrentRequest) return;
        setAnalytics(data);
        setAnalyticsError('');
      })
      .catch((err: unknown) => {
        if (!isCurrentRequest) return;
        console.error('Error al cargar analítica del panel editorial:', err);
        setAnalytics(null);
        setAnalyticsError(
          err instanceof Error ? err.message : 'No se pudieron cargar las métricas.',
        );
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [timeFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Dynamic greeting based on hour
  const currentHour = new Date().getHours();
  let greeting = 'Buenos días';
  if (currentHour >= 12 && currentHour < 19) {
    greeting = 'Buenas tardes';
  } else if (currentHour >= 19 || currentHour < 5) {
    greeting = 'Buenas noches';
  }

  const periodTitle = timeFilter === 'today'
    ? 'Hoy'
    : timeFilter === 'week'
      ? 'Últimos 7 días'
      : 'Últimos 30 días';
  const history = analytics?.recent_history ?? [];
  const sourcePoints = chartMetric === 'views'
    ? history.map((point) => point.views)
    : history.map((point) => point.reads);
  const chartLabels = history.length > 0
    ? history.map((point) => point.label)
    : ['Sin datos'];
  const activePoints = sourcePoints.length > 0 ? sourcePoints : [0];
  const metricTotal = sourcePoints.reduce((total, value) => total + value, 0);
  const peakValue = Math.max(0, ...sourcePoints);
  const peakIndex = sourcePoints.indexOf(peakValue);
  const growth = timeFilter === 'today'
    ? analytics?.views_today_growth
    : analytics?.views_24h_growth;

  // Chart layout dimensions
  const svgWidth = 760;
  const svgHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 32;
  const paddingBottom = 35;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // Y-Scale calculations
  const dataMaximum = Math.max(1, ...activePoints);
  const magnitude = 10 ** Math.floor(Math.log10(dataMaximum));
  const normalizedMaximum = dataMaximum / magnitude;
  const maxVal = (normalizedMaximum <= 1 ? 1 : normalizedMaximum <= 2 ? 2 : normalizedMaximum <= 5 ? 5 : 10) * magnitude;

  const yTicks = [
    { val: maxVal, label: maxVal >= 1000 ? `${Math.round(maxVal / 1000)}k` : `${maxVal}` },
    { val: maxVal * 0.75, label: maxVal >= 1000 ? `${+(maxVal * 0.75 / 1000).toFixed(1)}k` : `${Math.round(maxVal * 0.75)}` },
    { val: maxVal * 0.5, label: maxVal >= 1000 ? `${+(maxVal * 0.5 / 1000).toFixed(1)}k` : `${Math.round(maxVal * 0.5)}` },
    { val: maxVal * 0.25, label: maxVal >= 1000 ? `${+(maxVal * 0.25 / 1000).toFixed(1)}k` : `${Math.round(maxVal * 0.25)}` },
    { val: 0, label: '0' },
  ];

  const coordinates = activePoints.map((val, idx) => {
    const x = paddingLeft + (idx / Math.max(1, activePoints.length - 1)) * chartInnerWidth;
    const y = paddingTop + chartInnerHeight - (val / maxVal) * chartInnerHeight;
    return { x, y, val, label: chartLabels[idx] };
  });

  const pathD = coordinates.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (point.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (point.x - prev.x) / 2;
    const cy2 = point.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x},${point.y}`;
  }, '');

  const areaD = `${pathD} L ${coordinates[coordinates.length - 1].x},${paddingTop + chartInnerHeight} L ${coordinates[0].x},${paddingTop + chartInnerHeight} Z`;

  return (
    <div className="space-y-6 sm:space-y-7 pb-10">
      {/* 1. TOP WELCOME CARD (iOS 27 Glass) */}
      <div className="glass-card p-6 sm:p-8 rounded-[32px] shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            {/* Pill Badges Header */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-bold text-rose-800 inline-flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>LYBERATE PRO</span>
              </span>
              <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-semibold text-stone-700 inline-flex items-center gap-1.5 shadow-2xs">
                <Building className="w-3.5 h-3.5 text-stone-500" />
                <span>{settings.identity.centralLocation}</span>
              </span>
              <span className={`glass-pill px-3 py-1 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5 shadow-2xs ${
                isMockMode() ? 'text-amber-800' : 'text-emerald-800'
              }`}>
                <Activity className={`w-3.5 h-3.5 ${isMockMode() ? 'text-amber-600' : 'text-emerald-600'}`} />
                <span>{isMockMode() ? 'Datos de demostración' : 'Modo API'}</span>
              </span>
            </div>

            {/* Greeting & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-950 tracking-tight">
                {greeting}, Administrador
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 font-sans">
                Gestión de contenidos, planificación y seguimiento editorial.
              </p>
            </div>
          </div>

          {/* Action Buttons & Time Selector on Right */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Filter Pills */}
            <div className="glass-panel p-1 rounded-full flex items-center gap-1 shadow-inner">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  timeFilter === 'today'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  timeFilter === 'week'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                7 Días
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  timeFilter === 'month'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                30 Días
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-full glass-pill text-stone-600 hover:text-stone-950 transition-all active:scale-95 cursor-pointer ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="Actualizar datos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Main Action CTA Button */}
            <Link
              to="/admin/articles/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-900 to-rose-700 hover:from-rose-950 hover:to-rose-800 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Redactar Noticia</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI CARDS (iOS 27 Glassmorphic Widgets) */}
      {dashboardError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
          No fue posible cargar el resumen editorial: {dashboardError}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* CARD 1: NOTICIAS PUBLICADAS */}
        <div className="glass-card glass-card-interactive rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shadow-inner">
                <FileText className="w-5 h-5" />
              </div>
              <span className="glass-pill px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-stone-600">
                Publicadas
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
                Artículos publicados
              </span>
              <div className="text-3xl font-serif font-black text-stone-950 mt-1">
                {loading ? '...' : (stats?.published_articles ?? '—')}
                <span className="text-xs font-sans font-normal text-stone-400 ml-1.5">artículos</span>
              </div>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                {stats ? `${stats.total_articles} artículos registrados en total` : 'Conteo disponible al conectar el CMS'}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-200/60 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">Resumen editorial</span>
            <Link
              to="/admin/articles"
              className="text-rose-900 font-semibold text-xs hover:text-rose-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Ver Mesa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CARD 2: BORRADORES EN PREPARACIÓN */}
        <div className="glass-card glass-card-interactive rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-inner">
                <Edit3 className="w-5 h-5" />
              </div>
              <span className={`glass-pill px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                (stats?.draft_articles ?? 0) > 0
                  ? 'text-amber-700 bg-amber-50/80 border border-amber-200/60'
                  : 'text-emerald-700 bg-emerald-50/80 border border-emerald-200/60'
              }`}>
                {stats ? (stats.draft_articles > 0 ? 'En redacción' : 'Al día') : '—'}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
                Borradores en Curso
              </span>
              <div className="text-3xl font-serif font-black text-stone-950 mt-1 flex items-baseline">
                {loading ? '...' : (stats?.draft_articles ?? '—')}
                <span className="text-xs font-sans font-normal text-stone-500 ml-1.5">
                  {stats?.draft_articles === 1 ? 'nota en borrador' : 'notas en borrador'}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                {stats ? `${stats.pending_review_articles} en revisión editorial` : 'Estado de revisión no disponible'}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-200/60 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">Mesa de redacción</span>
            <Link
              to="/admin/articles?status=DRAFT"
              className="text-amber-800 font-semibold text-xs hover:text-amber-950 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Revisar Notas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CARD 3: BUZÓN CIUDADANO */}
        <div className="glass-card glass-card-interactive rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shadow-inner">
                <Inbox className="w-5 h-5" />
              </div>
              <span className="glass-pill px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-stone-600">
                Moderación
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
                Reportes Ciudadanos
              </span>
              <div className="text-3xl font-serif font-black text-stone-950 mt-1 flex items-baseline">
                {loading ? '...' : (stats?.pending_submissions ?? '—')}
                <span className="text-xs font-sans font-normal text-stone-400 ml-1.5">pendientes</span>
              </div>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                {stats ? 'Reportes por revisar' : 'Conteo disponible al conectar el CMS'}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-200/60 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">Mesa ciudadana:</span>
            <Link
              to="/admin/submissions"
              className="text-blue-700 font-semibold text-xs hover:text-blue-900 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Moderar Buzón</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CARD 4: PUBLICIDAD & ACTIVOS */}
        <div className="glass-card glass-card-interactive rounded-[28px] p-5 sm:p-6 shadow-sm flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shadow-inner">
                <Megaphone className="w-5 h-5" />
              </div>
              <span className="glass-pill px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-stone-600">
                Publicidad
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
                Campañas de Anuncios
              </span>
              <div className="text-3xl font-serif font-black text-stone-950 mt-1 flex items-baseline">
                {loading ? '...' : (stats?.total_ads ?? '—')}
                <span className="text-xs font-sans font-normal text-stone-400 ml-1.5">campañas</span>
              </div>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Archivos multimedia: {loading ? '...' : (stats?.total_media ?? '—')}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-200/60 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">Centro comercial</span>
            <Link
              to="/admin/ads"
              className="text-purple-700 font-semibold text-xs hover:text-purple-900 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Ver Campañas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. EVOLUCIÓN INFORMATIVA & AUDIENCIA CHART CARD (iOS 27 Glass) */}
      <div className="glass-card p-6 sm:p-8 rounded-[32px] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-700 mt-1.5 shrink-0 radar-pulse"></span>
            <div>
              <h2 className="text-lg font-bold text-stone-950 tracking-tight">
                Evolución de Cobertura Periodística & Audiencia
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {periodTitle} · Serie de analítica para el período seleccionado
              </p>
            </div>
          </div>

          {/* Metric Selector Pills */}
          <div className="glass-panel p-1 rounded-full flex items-center gap-1 self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setChartMetric('views')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                chartMetric === 'views'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lecturas (Vistas)
            </button>
            <button
              onClick={() => setChartMetric('reads')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                chartMetric === 'reads'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Lecturas efectivas
            </button>
          </div>
        </div>

        {analyticsError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
            No fue posible actualizar las métricas: {analyticsError}
          </p>
        )}
        {!analytics && !analyticsError && (
          <p role="status" className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
            Cargando métricas del período...
          </p>
        )}
        {analytics && sourcePoints.length === 0 && (
          <p role="status" className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
            Todavía no hay registros de {chartMetric === 'views' ? 'vistas' : 'lecturas efectivas'} para este período.
          </p>
        )}

        {/* Executive KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
              {chartMetric === 'views' ? 'Total de vistas' : 'Lecturas efectivas'}
            </span>
            <span className="text-base sm:text-lg font-serif font-black text-stone-950 mt-0.5 block">
              {metricTotal.toLocaleString('es-VE')}
              <span className="text-[11px] font-sans font-normal text-stone-400 ml-1">
                {chartMetric === 'views' ? 'vistas' : 'lecturas'}
              </span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
              Promedio
            </span>
            <span className="text-base sm:text-lg font-serif font-black text-stone-950 mt-0.5 block">
              {sourcePoints.length > 0
                ? `${(metricTotal / sourcePoints.length).toLocaleString('es-VE', { maximumFractionDigits: 1 })} / intervalo`
                : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
              Pico Máximo
            </span>
            <span className="text-xs sm:text-sm font-semibold text-rose-900 mt-1 block line-clamp-1">
              {sourcePoints.length > 0
                ? `${peakValue.toLocaleString('es-VE')} · ${chartLabels[peakIndex]}`
                : 'Sin registros'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">
              Variación de vistas
            </span>
            <span className={`text-xs sm:text-sm font-bold mt-1 inline-flex items-center gap-1 ${
              (growth ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              <TrendingUp className={`w-3.5 h-3.5 ${(growth ?? 0) < 0 ? 'rotate-180' : ''}`} />
              {growth === undefined ? '—' : `${growth >= 0 ? '+' : ''}${growth}%`} vs. período anterior
            </span>
          </div>
        </div>

        {/* SVG Curve Chart with Scaled Y-Axis and Value Tags */}
        <div className="pt-2">
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 sm:h-64 overflow-visible"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#881337" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#881337" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#881337" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Y-Axis Numerical Scale and Horizontal Grid Lines */}
              {yTicks.map((tick, i) => {
                const yPos = paddingTop + (i / (yTicks.length - 1)) * chartInnerHeight;
                return (
                  <g key={i}>
                    <text
                      x={paddingLeft - 10}
                      y={yPos + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-mono font-medium fill-stone-400"
                    >
                      {tick.label}
                    </text>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={svgWidth - paddingRight}
                      y2={yPos}
                      stroke={i === yTicks.length - 1 ? '#cbd5e1' : '#f1f5f9'}
                      strokeDasharray={i === yTicks.length - 1 ? 'none' : '3 3'}
                      strokeWidth="1"
                    />
                  </g>
                );
              })}

              {/* Area fill */}
              <path d={areaD} fill="url(#roseGradient)" />

              {/* Smooth curve line */}
              <path d={pathD} fill="none" stroke="#881337" strokeWidth="3" strokeLinecap="round" />

              {/* Data points with visible numerical badges */}
              {coordinates.map((point, i) => {
                const formattedVal = chartMetric === 'views'
                  ? (point.val >= 1000 ? `${(point.val / 1000).toFixed(1)}k` : `${point.val}`)
                  : `${point.val}`;

                return (
                  <g key={i} className="group cursor-pointer">
                    {/* Hover Glow */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="8"
                      className="fill-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    {/* Core Point Circle */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      className="fill-white stroke-rose-900 stroke-[2.5] group-hover:r-6 transition-all"
                    />
                    {/* Floating Value Tag */}
                    <g transform={`translate(${point.x}, ${point.y - 12})`}>
                      <rect
                        x="-17"
                        y="-13"
                        width="34"
                        height="14"
                        rx="4"
                        fill="#ffffff"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        className="filter drop-shadow-2xs"
                      />
                      <text
                        x="0"
                        y="-3"
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-stone-800 pointer-events-none"
                      >
                        {formattedVal}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* X-Axis aligned labels */}
              {coordinates.map((pt, i) => (
                <text
                  key={i}
                  x={pt.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="text-[11px] font-sans font-medium fill-stone-500 hover:fill-stone-900 transition-colors"
                >
                  {pt.label}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 4. LOWER SECTION: TWO-COLUMN EDITORIAL WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Últimas Noticias Publicadas */}
        <div className="lg:col-span-7 glass-card rounded-[32px] p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-stone-900 text-base">
                Últimas Noticias Publicadas
              </h3>
            </div>
            <Link
              to="/admin/articles"
              className="glass-pill px-3 py-1 text-xs font-semibold text-rose-900 hover:text-rose-700 inline-flex items-center gap-1"
            >
              <span>Ver todas ({stats?.published_articles || 0})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentPublished.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center italic">
                No hay artículos publicados todavía.
              </p>
            ) : (
              recentPublished.map((article) => (
                <div key={article.article_uuid} className="p-3.5 glass-panel rounded-2xl flex items-start justify-between gap-4 group hover:border-white/90 transition-all">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
                        {article.category_name}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {article.author_name}
                      </span>
                    </div>
                    <Link
                      to={`/admin/articles/edit/${article.article_uuid}`}
                      className="font-serif font-bold text-xs sm:text-sm text-stone-900 hover:text-rose-900 transition-colors line-clamp-1 block"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-stone-500 line-clamp-1 font-serif">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-1">
                    <a
                      href={`/noticia/${article.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-7 h-7 rounded-full glass-pill flex items-center justify-center text-stone-400 hover:text-stone-800 transition-colors"
                      title="Ver en portal público"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Link
                      to={`/admin/articles/edit/${article.article_uuid}`}
                      className="w-7 h-7 rounded-full glass-pill flex items-center justify-center text-stone-500 hover:text-rose-900 transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Borradores & Atajos Rápidos */}
        <div className="lg:col-span-5 space-y-6">
          {/* Borradores en Elaboración */}
          <div className="glass-card rounded-[32px] p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Borradores Pendientes
                </h3>
              </div>
              <span className="glass-pill px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {stats?.draft_articles || 0} notas
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingDrafts.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center italic">
                  No hay borradores pendientes.
                </p>
              ) : (
                pendingDrafts.slice(0, 3).map((draft) => (
                  <Link
                    key={draft.article_uuid}
                    to={`/admin/articles/edit/${draft.article_uuid}`}
                    className="block p-3 rounded-2xl glass-panel hover:border-amber-300 hover:bg-amber-50/20 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                      <span className="font-semibold text-stone-700">{draft.category_name}</span>
                      <span className="text-[10px] uppercase font-bold text-amber-700">Borrador</span>
                    </div>
                    <h4 className="font-serif font-bold text-xs text-stone-900 group-hover:text-amber-800 line-clamp-1">
                      {draft.title || 'Sin título'}
                    </h4>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Atajos Operativos de Redacción */}
          <div className="glass-card rounded-[32px] p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Atajos Rápidos de Redacción
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/admin/articles/new"
                className="p-3.5 rounded-2xl glass-panel text-stone-700 hover:text-rose-900 hover:border-rose-300 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <PlusCircle className="w-5 h-5 text-rose-800" />
                <span className="text-xs font-bold">Nueva Nota</span>
              </Link>

              <Link
                to="/admin/media"
                className="p-3.5 rounded-2xl glass-panel text-stone-700 hover:text-blue-900 hover:border-blue-300 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <ImageIcon className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold">Subir Foto</span>
              </Link>

              <Link
                to="/admin/submissions"
                className="p-3.5 rounded-2xl glass-panel text-stone-700 hover:text-amber-900 hover:border-amber-300 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <Inbox className="w-5 h-5 text-amber-700" />
                <span className="text-xs font-bold">Moderar Buzón</span>
              </Link>

              <Link
                to="/admin/ads"
                className="p-3.5 rounded-2xl glass-panel text-stone-700 hover:text-purple-900 hover:border-purple-300 transition-all flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <Megaphone className="w-5 h-5 text-purple-700" />
                <span className="text-xs font-bold">Banners Ads</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
