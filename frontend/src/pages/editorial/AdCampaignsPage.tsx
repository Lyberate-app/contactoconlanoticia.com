import React, { useEffect, useState } from 'react';
import {
  listAdminCampaigns,
  createAdminCampaign,
  updateAdminCampaign,
  deleteAdminCampaign,
  AdCampaign,
} from '../../services/adsApi';
import { Megaphone, Plus, Trash2, Edit2, CheckCircle2, XCircle, ExternalLink, RefreshCw, Image as ImageIcon } from 'lucide-react';
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
    if (!window.confirm('¿Seguro que deseas eliminar esta campaña publicitaria?')) return;
    try {
      await deleteAdminCampaign(uuid);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar campaña');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const payload: Partial<AdCampaign> = {
        company_name: formData.company_name,
        campaign_name: formData.campaign_name,
        ad_type: formData.ad_type,
        location: formData.location,
        target_url: formData.target_url,
        media_uuid: formData.media_uuid || null,
        start_at: formData.start_at ? formData.start_at.replace('T', ' ') + ':00' : null,
        end_at: formData.end_at ? formData.end_at.replace('T', ' ') + ':00' : null,
        active: formData.active,
      };

      if (editingCampaign) {
        await updateAdminCampaign(editingCampaign.campaign_uuid, payload);
      } else {
        await createAdminCampaign(payload);
      }

      setIsModalOpen(false);
      loadCampaigns();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar campaña');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-red-700" />
            Gestión Publicitaria & Campañas
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Administra anunciantes, espacios comerciales en el portal y métricas de rendimiento (CTR).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-4 py-2 text-xs font-semibold rounded-sm transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-1">
              Ubicación / Slot
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="text-xs border border-stone-300 rounded px-2.5 py-1.5 bg-stone-50 text-stone-800 focus:outline-none focus:border-stone-900"
            >
              <option value="">Todas las ubicaciones</option>
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-1">
              Estado
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="text-xs border border-stone-300 rounded px-2.5 py-1.5 bg-stone-50 text-stone-800 focus:outline-none focus:border-stone-900"
            >
              <option value="">Todos los estados</option>
              <option value="1">Activas</option>
              <option value="0">Inactivas</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadCampaigns}
          className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 py-1 px-2 border border-stone-300 rounded bg-stone-50"
          title="Recargar"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-stone-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-100 text-stone-900 uppercase font-mono text-[11px] border-b border-stone-200">
            <tr>
              <th className="py-3 px-4">Anunciante & Campaña</th>
              <th className="py-3 px-4">Ubicación (Slot)</th>
              <th className="py-3 px-4">Vigencia</th>
              <th className="py-3 px-4">Impresiones</th>
              <th className="py-3 px-4">Clics</th>
              <th className="py-3 px-4">CTR</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 font-sans">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-stone-400">
                  Cargando campañas publicitarias...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-stone-500 font-serif">
                  No hay campañas registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.campaign_uuid} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-stone-900">{c.company_name}</div>
                    <div className="text-[11px] text-stone-500">{c.campaign_name}</div>
                    <a
                      href={c.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-red-700 hover:underline mt-0.5"
                    >
                      <span className="truncate max-w-[180px]">{c.target_url}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {c.location}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[11px] text-stone-600">
                    <div>Desde: {c.start_at ? c.start_at.slice(0, 10) : 'Inmediato'}</div>
                    <div>Hasta: {c.end_at ? c.end_at.slice(0, 10) : 'Indefinido'}</div>
                  </td>

                  <td className="py-3 px-4 font-mono text-stone-800">
                    {c.impressions_count.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 font-mono text-stone-800">
                    {c.clicks_count.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-stone-900">
                    {c.ctr}%
                  </td>

                  <td className="py-3 px-4 text-center">
                    {c.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded text-[11px] border border-stone-200">
                        <XCircle className="w-3 h-3" />
                        Pausada
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded"
                        title="Editar campaña"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.campaign_uuid)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
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
        <div className="fixed inset-0 z-50 bg-stone-900/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 max-w-lg w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-xl font-bold"
            >
              &times;
            </button>

            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4 pb-2 border-b border-stone-200">
              {editingCampaign ? 'Editar Campaña Publicitaria' : 'Nueva Campaña Publicitaria'}
            </h3>

            {formError && (
              <div className="p-3 mb-4 text-xs bg-red-50 text-red-800 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Empresa Anunciante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full border border-stone-300 rounded p-2 bg-stone-50 focus:bg-white focus:border-stone-900"
                    placeholder="Ej: Agropecuaria El Llano"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Nombre de Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    className="w-full border border-stone-300 rounded p-2 bg-stone-50 focus:bg-white focus:border-stone-900"
                    placeholder="Ej: Siembra de Cereales 2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Ubicación (Slot) *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-stone-300 rounded p-2 bg-stone-50 focus:bg-white"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Tipo de Anuncio
                  </label>
                  <select
                    value={formData.ad_type}
                    onChange={(e) => setFormData({ ...formData, ad_type: e.target.value as any })}
                    className="w-full border border-stone-300 rounded p-2 bg-stone-50 focus:bg-white"
                  >
                    <option value="BANNER">Banner</option>
                    <option value="SPONSORED">Contenido Patrocinado</option>
                    <option value="POPUP">Popup Emergente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  URL de Destino (Enlace) *
                </label>
                <input
                  type="url"
                  required
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full border border-stone-300 rounded p-2 bg-stone-50 focus:bg-white font-mono text-[11px]"
                  placeholder="https://ejemplo.com/promocion"
                />
              </div>

              <div className="border border-stone-200 p-3 bg-stone-50 space-y-2">
                <label className="block text-stone-700 font-medium">
                  Banner Publicitario (Archivo Multimedia)
                </label>

                {selectedMediaUrl || formData.media_uuid ? (
                  <div className="flex items-center gap-3 bg-white p-2 border border-stone-200">
                    <img
                      src={selectedMediaUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=400&q=80'}
                      alt="Banner Preview"
                      className="w-20 h-10 object-cover border border-stone-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono text-stone-600 truncate">
                        UUID: {formData.media_uuid || 'Seleccionado'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="text-[11px] text-blue-700 hover:underline mr-3"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, media_uuid: '' });
                          setSelectedMediaUrl(null);
                        }}
                        className="text-[11px] text-red-600 hover:underline"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-[11px] font-semibold transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Seleccionar de la Biblioteca de Medios</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Fecha y Hora de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                    className="w-full border border-stone-300 rounded p-2 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Fecha y Hora de Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                    className="w-full border border-stone-300 rounded p-2 bg-stone-50"
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
                  <span className="font-semibold text-stone-800">Campaña Activa para visualización pública</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 border border-stone-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded disabled:opacity-50"
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
