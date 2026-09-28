import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, Bell, CheckCircle2, Clock3, FileSearch, RefreshCw, Send, Search, TrendingUp } from 'lucide-react';
import { editorialService, type ArticleDetail, type ArticleSummary } from '../../services/editorial';
import { smartPushService } from '../../services/smartPushService';
import type { PushAnalyticsOverview, PushCandidate } from '../../types/push';

type MarketingTab = 'seo' | 'push';
type SeoAuditRow = { article: ArticleSummary; detail: ArticleDetail | null; score: number; issues: string[] };

export const MarketingHubPage: React.FC = () => {
	const [tab, setTab] = useState<MarketingTab>('seo');
	const [auditRows, setAuditRows] = useState<SeoAuditRow[]>([]);
	const [candidates, setCandidates] = useState<PushCandidate[]>([]);
	const [pushStats, setPushStats] = useState<PushAnalyticsOverview | null>(null);
	const [selectedCandidate, setSelectedCandidate] = useState<PushCandidate | null>(null);
	const [pushTitle, setPushTitle] = useState('');
	const [pushMessage, setPushMessage] = useState('');
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [notice, setNotice] = useState('');
	const [error, setError] = useState('');

	const loadData = async () => {
		setLoading(true);
		setError('');
		const results = await Promise.allSettled([
			editorialService.getArticles({ status: 'PUBLISHED', limit: '25' }),
			smartPushService.getCandidates(),
			smartPushService.getPushAnalytics(),
		]);

		if (results[0].status === 'fulfilled') {
			const articles = results[0].value.articles;
			const details = await Promise.all(articles.map((article) => editorialService.getArticle(article.article_uuid).catch(() => null)));
			setAuditRows(articles.map((article, index) => {
				const detail = details[index];
				const title = detail?.seo?.meta_title || article.title;
				const description = detail?.seo?.meta_description || article.excerpt || '';
				const issues: string[] = [];
				if (title.length < 30 || title.length > 65) issues.push('Título SEO fuera del rango recomendado');
				if (description.length < 70 || description.length > 160) issues.push('Descripción SEO incompleta');
				if (!article.slug || article.slug.length > 80) issues.push('Ruta poco clara o demasiado larga');
				if (!detail?.featured_media?.alt_text) issues.push('Falta texto alternativo de portada');
				return { article, detail, score: Math.max(0, 100 - issues.length * 25), issues };
			}));
		} else {
			setError('No fue posible cargar el inventario de noticias para la auditoría SEO.');
		}
		if (results[1].status === 'fulfilled') setCandidates(results[1].value);
		if (results[2].status === 'fulfilled') setPushStats(results[2].value);
		if (results[1].status === 'rejected' || results[2].status === 'rejected') {
			setError('No se pudo consultar el servicio de notificaciones push. Verifica la conexión con el API.');
		}
		setLoading(false);
	};

	useEffect(() => { void loadData(); }, []);

	const filteredRows = useMemo(() => auditRows.filter(({ article }) =>
		`${article.title} ${article.slug}`.toLowerCase().includes(search.toLowerCase())
	), [auditRows, search]);
	const healthyCount = auditRows.filter((row) => row.score >= 75).length;
	const averageScore = auditRows.length ? Math.round(auditRows.reduce((sum, row) => sum + row.score, 0) / auditRows.length) : 0;

	const preparePush = (candidate: PushCandidate) => {
		setSelectedCandidate(candidate);
		setPushTitle(candidate.suggested_title || candidate.title);
		setPushMessage(candidate.suggested_message || '');
		setNotice('');
	};

	const sendPush = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedCandidate) return;
		setSending(true);
		setNotice('');
		const response = await smartPushService.sendPush({
			article_uuid: selectedCandidate.article_uuid,
			title: pushTitle.trim(),
			message: pushMessage.trim(),
			topic_id: selectedCandidate.topic_id,
			mode: 'editorial_smart_trend',
		});
		setSending(false);
		if (response.success) {
			setNotice('La notificación fue enviada a la cola de distribución.');
			setSelectedCandidate(null);
			await loadData();
		} else {
			setNotice(response.error || 'No se pudo enviar la notificación.');
		}
	};

	return (
		<section className="space-y-5 pb-10">
			<header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<div className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-800"><TrendingUp className="h-4 w-4" /> CRECIMIENTO EDITORIAL</div>
					<h1 className="text-2xl font-bold text-stone-950">Marketing y SEO</h1>
					<p className="mt-1 text-sm text-stone-600">Optimización orgánica, alertas push y rendimiento de campañas.</p>
				</div>
				<button type="button" onClick={() => void loadData()} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"><RefreshCw className="h-4 w-4" /> Actualizar</button>
			</header>

			<div className="flex gap-1 border-b border-stone-200" role="tablist" aria-label="Herramientas de marketing">
				<button type="button" role="tab" aria-selected={tab === 'seo'} onClick={() => setTab('seo')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'seo' ? 'border-rose-800 text-rose-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}><FileSearch className="h-4 w-4" /> SEO</button>
				<button type="button" role="tab" aria-selected={tab === 'push'} onClick={() => setTab('push')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'push' ? 'border-rose-800 text-rose-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}><Bell className="h-4 w-4" /> Push</button>
			</div>

			{error && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
			{notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}

			{tab === 'seo' ? (
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs font-medium text-stone-500">Noticias auditadas</p><p className="mt-2 text-2xl font-bold text-stone-950">{loading ? '—' : auditRows.length}</p></div>
						<div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs font-medium text-stone-500">SEO saludable</p><p className="mt-2 text-2xl font-bold text-emerald-800">{loading ? '—' : healthyCount}</p></div>
						<div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs font-medium text-stone-500">Puntuación promedio</p><p className="mt-2 text-2xl font-bold text-stone-950">{loading ? '—' : `${averageScore}/100`}</p></div>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div><h2 className="text-base font-bold text-stone-900">Auditoría de noticias publicadas</h2><p className="mt-1 text-xs text-stone-500">Revisa títulos, descripciones, enlaces y texto alternativo de portada.</p></div>
						<label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar noticia" className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-700" /></label>
					</div>
					<div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
						<table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-stone-50 text-[11px] uppercase text-stone-500"><tr><th className="px-4 py-3">Noticia</th><th className="px-4 py-3">SEO</th><th className="px-4 py-3">Revisar</th><th className="px-4 py-3 text-right">Edición</th></tr></thead><tbody className="divide-y divide-stone-100">
							{loading ? <tr><td colSpan={4} className="px-4 py-10 text-center text-stone-500">Analizando artículos…</td></tr> : filteredRows.map(({ article, score, issues }) => <tr key={article.article_uuid} className="align-top"><td className="px-4 py-3"><p className="max-w-md font-semibold text-stone-900">{article.title}</p><p className="mt-1 text-xs text-stone-500">/{article.slug}</p></td><td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${score >= 75 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{score}/100</span></td><td className="px-4 py-3"><span className="text-xs text-stone-600">{issues.length ? issues.join(' · ') : 'Sin observaciones'}</span></td><td className="px-4 py-3 text-right"><Link to={`/admin/articles/edit/${article.article_uuid}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-50">Editar <ArrowUpRight className="h-3.5 w-3.5" /></Link></td></tr>)}
							{!loading && filteredRows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-stone-500">No hay noticias para mostrar.</td></tr>}
						</tbody></table>
					</div>
					<p className="text-xs leading-relaxed text-stone-500">La revisión evalúa metadatos editoriales, slug y texto alternativo. El SEO técnico público se complementa con canonical, Open Graph, Twitter Cards y datos estructurados en cada noticia.</p>
				</div>
			) : (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Enviadas</p><p className="mt-2 text-xl font-bold text-stone-950">{pushStats?.total_sent ?? '—'}</p></div>
						<div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Entregadas</p><p className="mt-2 text-xl font-bold text-stone-950">{pushStats?.total_delivered ?? '—'}</p></div>
						<div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Clics</p><p className="mt-2 text-xl font-bold text-stone-950">{pushStats?.total_clicks ?? '—'}</p></div>
						<div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">CTR promedio</p><p className="mt-2 text-xl font-bold text-rose-800">{pushStats ? `${pushStats.avg_ctr}%` : '—'}</p></div>
					</div>
					<div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
						<div className="rounded-lg border border-stone-200 bg-white">
							<div className="border-b border-stone-200 px-4 py-3"><h2 className="text-sm font-bold text-stone-900">Oportunidades de envío</h2><p className="mt-1 text-xs text-stone-500">Sugerencias del motor de tendencias para historias con crecimiento reciente.</p></div>
							{loading ? <p className="p-8 text-center text-sm text-stone-500">Cargando sugerencias…</p> : candidates.length ? <div className="divide-y divide-stone-100">{candidates.map((candidate) => <article key={candidate.candidate_id} className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><span className="text-[11px] font-semibold uppercase text-rose-800">{candidate.category_name} · Tendencia {candidate.trend_score}</span><h3 className="mt-1 text-sm font-bold text-stone-950">{candidate.title}</h3><p className="mt-1 text-xs text-stone-600">{candidate.reason}</p><p className="mt-2 flex items-center gap-1 text-xs text-stone-500"><Activity className="h-3.5 w-3.5" /> {candidate.views_recent_3h.toLocaleString()} lecturas recientes · +{candidate.growth_rate_percent}%</p></div><button type="button" onClick={() => preparePush(candidate)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-700"><Send className="h-3.5 w-3.5" /> Preparar push</button></div></article>)}</div> : <p className="p-8 text-center text-sm text-stone-500">No hay oportunidades nuevas de envío.</p>}
						</div>
						<div className="space-y-4">
							{selectedCandidate ? <form onSubmit={sendPush} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4"><div><h2 className="text-sm font-bold text-stone-900">Confirmar notificación</h2><p className="mt-1 text-xs text-stone-500">{selectedCandidate.title}</p></div><label className="block text-xs font-semibold text-stone-700">Título<input required maxLength={80} value={pushTitle} onChange={(event) => setPushTitle(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-normal" /></label><label className="block text-xs font-semibold text-stone-700">Mensaje<textarea required rows={3} maxLength={160} value={pushMessage} onChange={(event) => setPushMessage(event.target.value)} className="mt-1 w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm font-normal" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedCandidate(null)} className="rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700">Cancelar</button><button disabled={sending} className="inline-flex items-center gap-2 rounded-md bg-rose-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />{sending ? 'Enviando…' : 'Enviar ahora'}</button></div></form> : <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center"><Bell className="mx-auto h-6 w-6 text-stone-400" /><h2 className="mt-2 text-sm font-bold text-stone-900">Notificaciones push</h2><p className="mt-1 text-xs leading-relaxed text-stone-500">Selecciona una oportunidad para preparar y revisar el mensaje antes de enviarlo.</p></div>}
							<div className="rounded-lg border border-stone-200 bg-white"><div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3"><Clock3 className="h-4 w-4 text-stone-500" /><h2 className="text-sm font-bold text-stone-900">Últimos envíos</h2></div>{pushStats?.recent_campaigns.length ? pushStats.recent_campaigns.slice(0, 5).map((campaign) => <div key={campaign.campaign_uuid} className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 last:border-0"><div className="min-w-0"><p className="truncate text-xs font-semibold text-stone-900">{campaign.title}</p><p className="mt-1 text-[11px] text-stone-500">{new Date(campaign.sent_at).toLocaleString()}</p></div><span className="shrink-0 text-xs font-bold text-rose-800">{campaign.ctr}% CTR</span></div>) : <p className="px-4 py-6 text-center text-xs text-stone-500">Todavía no hay campañas registradas.</p>}</div>
						</div>
					</div>
				</div>
			)}
			<div className="flex items-start gap-2 border-t border-stone-200 pt-4 text-xs text-stone-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> <span>Las funciones SEO usan los metadatos guardados en cada artículo. Los envíos y estadísticas push dependen de la configuración del servicio Web Push.</span></div>
		</section>
	);
};
