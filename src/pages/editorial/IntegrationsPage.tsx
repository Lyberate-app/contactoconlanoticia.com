import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Link2, RefreshCw, ShieldCheck, Unplug } from 'lucide-react';
import { integrationsApi, type PublicationIntegration, type PublicationProvider } from '../../services/integrationsApi';
import { useSettings } from '../../context/SettingsContext';

const CHANNELS: { provider: PublicationProvider; label: string; description: string; settingsKey: 'facebookUrl' | 'instagramUrl' | 'telegramChannelUrl' | 'twitterUrl' }[] = [
	{ provider: 'facebook', label: 'Facebook Pages', description: 'Comparte noticias en la página institucional.', settingsKey: 'facebookUrl' },
	{ provider: 'instagram', label: 'Instagram', description: 'Publica contenido en cuentas profesionales vinculadas.', settingsKey: 'instagramUrl' },
	{ provider: 'telegram', label: 'Telegram', description: 'Distribuye titulares en el canal de noticias.', settingsKey: 'telegramChannelUrl' },
	{ provider: 'x', label: 'X', description: 'Publica titulares y enlaces en la cuenta del medio.', settingsKey: 'twitterUrl' },
];

export const IntegrationsPage: React.FC = () => {
	const { settings } = useSettings();
	const [integrations, setIntegrations] = useState<PublicationIntegration[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const [busyProvider, setBusyProvider] = useState<PublicationProvider | null>(null);

	const loadIntegrations = async () => {
		setLoading(true);
		setError('');
		try {
			setIntegrations(await integrationsApi.listPublicationIntegrations());
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'No se pudo consultar el servicio de integraciones.');
			setIntegrations(CHANNELS.map(({ provider }) => ({ provider, connected: false, account_name: null, auto_publish: false, last_published_at: null })));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { void loadIntegrations(); }, []);

	const connect = async (provider: PublicationProvider) => {
		setBusyProvider(provider);
		setError('');
		try {
			const authorizationUrl = await integrationsApi.connect(provider);
			window.location.assign(authorizationUrl);
		} catch (connectError) {
			setError(connectError instanceof Error ? connectError.message : 'No se pudo iniciar la autorización.');
		} finally {
			setBusyProvider(null);
		}
	};

	const toggleAutomatic = async (integration: PublicationIntegration) => {
		setBusyProvider(integration.provider);
		setError('');
		try {
			await integrationsApi.setAutoPublish(integration.provider, !integration.auto_publish);
			setIntegrations((items) => items.map((item) => item.provider === integration.provider ? { ...item, auto_publish: !item.auto_publish } : item));
			setNotice(`Publicación automática ${integration.auto_publish ? 'desactivada' : 'activada'} para ${integration.provider}.`);
		} catch (toggleError) {
			setError(toggleError instanceof Error ? toggleError.message : 'No se pudo guardar la preferencia.');
		} finally {
			setBusyProvider(null);
		}
	};

	const disconnect = async (provider: PublicationProvider) => {
		if (!window.confirm('¿Desconectar esta cuenta de publicación?')) return;
		setBusyProvider(provider);
		setError('');
		try {
			await integrationsApi.disconnect(provider);
			setIntegrations((items) => items.map((item) => item.provider === provider ? { ...item, connected: false, account_name: null, auto_publish: false } : item));
		} catch (disconnectError) {
			setError(disconnectError instanceof Error ? disconnectError.message : 'No se pudo desconectar la cuenta.');
		} finally {
			setBusyProvider(null);
		}
	};

	const stats = settings.social;
	const destinations: Record<string, string> = {
		facebook: stats.facebookUrl,
		instagram: stats.instagramUrl,
		telegram: stats.telegramChannelUrl,
		x: stats.twitterUrl,
	};

	return (
		<section className="space-y-5 pb-10">
			<header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-800"><Link2 className="h-4 w-4" /> DISTRIBUCIÓN</div><h1 className="text-2xl font-bold text-stone-950">Integraciones editoriales</h1><p className="mt-1 text-sm text-stone-600">Conecta canales para distribuir noticias al publicarlas.</p></div>
				<button type="button" onClick={() => void loadIntegrations()} className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"><RefreshCw className="h-4 w-4" /> Actualizar</button>
			</header>

			{error && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
			{notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}

			<div className="grid gap-3 md:grid-cols-2">
				{CHANNELS.map((channel) => {
					const integration = integrations.find((item) => item.provider === channel.provider);
					const busy = busyProvider === channel.provider;
					return <article key={channel.provider} className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
						<div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-stone-950">{channel.label}</h2><p className="mt-1 text-xs text-stone-500">{channel.description}</p></div><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${integration?.connected ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{integration?.connected ? <><Check className="h-3 w-3" /> Conectado</> : 'Sin conectar'}</span></div>
						{integration?.connected ? <div className="mt-4 border-t border-stone-100 pt-3"><p className="text-xs text-stone-700">Cuenta: <span className="font-semibold">{integration.account_name || 'Cuenta autorizada'}</span></p><label className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-stone-700"><span>Publicar automáticamente al publicar una noticia</span><input type="checkbox" checked={integration.auto_publish} disabled={busy || loading} onChange={() => void toggleAutomatic(integration)} className="h-4 w-4 accent-rose-800" /></label><div className="mt-4 flex justify-between gap-2"><span className="text-[11px] text-stone-500">{integration.last_published_at ? `Última publicación: ${new Date(integration.last_published_at).toLocaleDateString()}` : 'Aún sin publicaciones automáticas'}</span><button type="button" disabled={busy} onClick={() => void disconnect(channel.provider)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"><Unplug className="h-3.5 w-3.5" /> Desconectar</button></div></div> : <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3"><button type="button" disabled={busy || loading} onClick={() => void connect(channel.provider)} className="rounded-md bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-700 disabled:opacity-50">{busy ? 'Conectando…' : 'Conectar cuenta'}</button>{destinations[channel.provider] && <a href={destinations[channel.provider]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-rose-800">Canal público <ExternalLink className="h-3 w-3" /></a>}</div>}
					</article>;
				})}
			</div>

			<aside className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs leading-relaxed text-stone-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><p>La autorización y los tokens deben gestionarse en el servidor. La publicación automática requiere endpoints OAuth por plataforma; el modo demo solo permite revisar preferencias locales y no publica en redes.</p></aside>
		</section>
	);
};
