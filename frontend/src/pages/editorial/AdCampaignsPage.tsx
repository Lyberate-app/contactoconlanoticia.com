import React, { useEffect, useState } from 'react';
import {
  listAdminCampaigns,
  createAdminCampaign,
  updateAdminCampaign,
  deleteAdminCampaign,
  AdCampaign,
} from '../../services/adsApi';
import { Megaphone, Plus, Trash2, Edit2, CheckCircle2, XCircle, ExternalLink, RefreshCw, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { MediaPickerModal } from '../../components/media/MediaPickerModal';

const LOCATIONS = [
  { id: 'HEADER_BANNER', name: 'Banner Cabecera (Header Banner)' },
  { id: 'TOP_NEWS', name: 'Cabecera de Noticias (Top News)' },
  { id: 'SIDEBAR', name: 'Columna Lateral (Sidebar)' },
  { id: 'ARTICLE_TOP', name: 'Artículo - Superior (Article Top)' },
  { id: 'ARTICLE_MIDDLE', name: 'Artículo - Medio (Article Middle)' },
  { id: 'ARTICLE_BOTTOM', name: 'Artículo - Inferior (Article Bottom)' },
  { id: 'FOOTER', name: 'Pie de Página (Footer)' },
];

export const AdCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    campaign_name: '',
    ad_type: 'BANNER' as 'BANNER' | 'SPONSORED' | 'POPUP',
    location: 'HEADER_BANNER',
    target_url: 'https://',
    media_uuid: '',
    start_at: '',
    end_at: '',
    active: true,
  });

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await listAdminCampaigns({
        location: locationFilter || undefined,
        active: activeFilter !== '' ? activeFilter : undefined,
      });
      setCampaigns(data.items);
    } catch (err) {
      console.error('Error al cargar campañas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [locationFilter, activeFilter]);

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setSelectedMediaUrl(null);
    setFormData({
      company_name: '',
      campaign_name: '',
      ad_type: 'BANNER',
      location: 'HEADER_BANNER',
      target_url: 'https://',
      media_uuid: '',
      start_at: '',
      end_at: '',
      active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: AdCampaign) => {
    setEditingCampaign(c);
    setSelectedMediaUrl(c.media_url || null);
    setFormData({
      company_name: c.company_name,
      campaign_name: c.campaign_name,
      ad_type: c.ad_type,
      location: c.location,
      target_url: c.target_url,
      media_uuid: c.media_uuid || '',
      start_at: c.start_at ? c.start_at.replace(' ', 'T').slice(0, 16) : '',
      end_at: c.end_at ? c.end_at.replace(' ', 'T').slice(0, 16) : '',
      active: c.active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta campaña publicitaria?')) return;
    try {
      await deleteAdminCampaign(uuid);
      loadCampaigns();
    } catch (err) {
      alert('Error al eliminar la campaña.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const payload = {
      company_name: formData.company_name,
      campaign_name: formData.campaign_name,
      ad_type: formData.ad_type,
      location: formData.location,
      target_url: formData.target_url,
      media_uuid: formData.media_uuid || null,
      start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
      end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
      active: formData.active,
    };

    try {
      if (editingCampaign) {
        await updateAdminCampaign(editingCampaign.campaign_uuid, payload);
      } else {
        await createAdminCampaign(payload);
      }
      setIsModalOpen(false);
      loadCampaigns();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la campaña');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Glass Card */}
      <div className="glass-card rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/60 dark:border-white/10 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 mb-2">
            <Sparkles className="w-3 h-3 text-rose-600" />
            <span>Monetización &bull; Red de Pauta Comercial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
            Gestión Publicitaria & Campañas
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Administración de anunciantes, espacios comerciales en el portal y métricas de rendimiento (CTR).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-lg shadow-black/10 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md px-4 py-2.5 rounded-full text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs cursor-pointer"
          >
            <option value="">Todas las ubicaciones</option>
            {LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="text-xs border border-white/60 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 backdrop-blur-md px-4 py-2.5 rounded-full text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-800 shadow-xs cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="1">Activas</option>
            <option value="0">Inactivas</option>
          </select>
        </div>

        <button
          onClick={loadCampaigns}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70 dark:bg-stone-800/70 border border-white/60 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:text-stone-900 active:scale-90 transition-all shadow-xs"
          title="Actualizar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="glass-card rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
          <thead className="bg-white/40 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400 uppercase font-bold text-[10px] border-b border-black/5 dark:border-white/5">
            <tr>
              <th className="py-4 px-5">Anunciante & Campaña</th>
              <th className="py-4 px-5">Ubicación (Slot)</th>
              <th className="py-4 px-5">Vigencia</th>
              <th className="py-4 px-5">Impresiones</th>
              <th className="py-4 px-5">Clics</th>
              <th className="py-4 px-5">CTR</th>
              <th className="py-4 px-5 text-center">Estado</th>
              <th className="py-4 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] font-sans">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-400 font-mono animate-pulse">
                  Cargando campañas publicitarias...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-stone-500 font-serif">
                  <Megaphone className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  No hay campañas registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.campaign_uuid} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-bold text-stone-900 dark:text-white">{c.company_name}</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">{c.campaign_name}</div>
                    <a
                      href={c.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:underline mt-0.5"
                    >
                      <span className="truncate max-w-[180px]">{c.target_url}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>

                  <td className="py-4 px-5 font-mono text-[11px]">
                    <span className="bg-stone-100/80 dark:bg-stone-800/80 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5 text-[10px]">
                      {c.location}
                    </span>
                  </td>

                  <td className="py-4 px-5 text-[11px] text-stone-500">
                    <div>Desde: {c.start_at ? c.start_at.slice(0, 10) : 'Inmediato'}</div>
                    <div>Hasta: {c.end_at ? c.end_at.slice(0, 10) : 'Indefinido'}</div>
                  </td>

                  <td className="py-4 px-5 font-mono text-stone-800 dark:text-stone-200">
                    {c.impressions_count.toLocaleString()}
                  </td>

                  <td className="py-4 px-5 font-mono text-stone-800 dark:text-stone-200">
                    {c.clicks_count.toLocaleString()}
                  </td>

                  <td className="py-4 px-5 font-mono font-bold text-stone-900 dark:text-white">
                    <span className="bg-rose-500/10 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20">
                      {c.ctr}%
                    </span>
                  </td>

                  <td className="py-4 px-5 text-center">
                    {c.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-500/20 backdrop-blur-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-stone-500 font-medium bg-stone-500/10 px-2.5 py-0.5 rounded-full text-[11px] border border-stone-500/20">
                        <XCircle className="w-3 h-3" />
                        Pausada
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100/70 dark:bg-stone-800/70 hover:bg-white text-stone-600 hover:text-stone-900 dark:hover:text-white active:scale-90 transition-all shadow-2xs"
                        title="Editar campaña"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.campaign_uuid)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-600 active:scale-90 transition-all"
                        title="Eliminar campaña"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-card rounded-[32px] max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8 border border-white/50 dark:border-white/10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all absolute top-5 right-5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-black text-stone-900 dark:text-white mb-4 pb-2 border-b border-black/5 dark:border-white/5">
              {editingCampaign ? 'Editar Campaña Publicitaria' : 'Nueva Campaña Publicitaria'}
            </h3>

            {formError && (
              <div className="p-3 mb-4 text-xs bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Empresa Anunciante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
                    placeholder="Ej: Agropecuaria El Llano"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Nombre de Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
                    placeholder="Ej: Siembra de Cereales 2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Ubicación (Slot) *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Tipo de Anuncio
                  </label>
                  <select
                    value={formData.ad_type}
                    onChange={(e) => setFormData({ ...formData, ad_type: e.target.value as any })}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
                  >
                    <option value="BANNER">Banner</option>
                    <option value="SPONSORED">Contenido Patrocinado</option>
                    <option value="POPUP">Popup Emergente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  URL de Destino (Enlace) *
                </label>
                <input
                  type="url"
                  required
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 bg-white/70 dark:bg-stone-800/70 font-mono text-[11px] text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-800"
                  placeholder="https://ejemplo.com/promocion"
                />
              </div>

              <div className="border border-black/5 dark:border-white/5 p-3.5 bg-stone-50/50 dark:bg-stone-800/50 rounded-2xl space-y-2">
                <label className="block text-stone-700 dark:text-stone-300 font-semibold">
                  Banner Publicitario (Archivo Multimedia)
                </label>

                {selectedMediaUrl || formData.media_uuid ? (
                  <div className="flex items-center gap-3 bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                    <img
                      src={selectedMediaUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=400&q=80'}
                      alt="Banner Preview"
                      className="w-20 h-10 object-cover rounded-lg border border-black/5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono text-stone-600 dark:text-stone-400 truncate">
                        UUID: {formData.media_uuid || 'Seleccionado'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="text-[11px] text-rose-600 hover:underline mr-3 font-semibold"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, media_uuid: '' });
                          setSelectedMediaUrl(null);
                        }}
                        className="text-[11px] text-red-600 hover:underline font-semibold"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold rounded-full transition-all active:scale-95 shadow-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Seleccionar de la Biblioteca</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Fecha y Hora de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Fecha y Hora de Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                    className="w-full border border-black/10 dark:border-white/10 rounded-xl p-2.5 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="accent-stone-900 rounded"
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">Campaña Activa para visualización pública</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 border border-stone-300 dark:border-stone-700 rounded-full font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-full disabled:opacity-50 active:scale-95 transition-all shadow-md"
                >
                  {formLoading ? 'Guardando...' : editingCampaign ? 'Actualizar Campaña' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => {
          setFormData({ ...formData, media_uuid: media.media_uuid });
          setSelectedMediaUrl(media.url);
        }}
        selectedMediaUuid={formData.media_uuid}
        title="Seleccionar Banner Publicitario"
      />
    </div>
  );
};
