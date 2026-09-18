import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Save, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2, Globe } from 'lucide-react'
import { settingsApi, getApiError } from '@/lib/api'
import type { SitePublicSettings } from '@portal/shared-types'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'social' | 'contact'>('general')
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'og' | null>(null)
  const [successMessage, setSuccessMessage] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<SitePublicSettings>({
    name: '',
    description: '',
    url: '',
    logo_url: null,
    favicon_url: null,
    primary_color: '#1e3a8a',
    secondary_color: '#3b82f6',
    social_twitter: '',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    social_tiktok: '',
    seo_title_separator: ' | ',
    seo_default_description: '',
    og_default_image_url: null,
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    nav_items: [],
  })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: settingsApi.get,
  })

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        ...settings,
      }))
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () => settingsApi.update(formData),
    onSuccess: () => {
      setSuccessMessage(true)
      setErrorMessage(null)
      setTimeout(() => setSuccessMessage(false), 3000)
    },
    onError: (err) => {
      setErrorMessage(getApiError(err))
    },
  })

  const handleChange = (field: keyof SitePublicSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sitio</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Identidad visual, metadatos para buscadores y redes sociales
          </p>
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-primary"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar cambios
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm text-green-800">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>Configuración actualizada con éxito.</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Tabs de Navegación ─────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {[
          { id: 'general', label: 'General e Identidad' },
          { id: 'seo', label: 'SEO y Metadatos' },
          { id: 'social', label: 'Redes Sociales' },
          { id: 'contact', label: 'Contacto' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* ── TAB: GENERAL ─────────────────────────────── */}
        {activeTab === 'general' && (
          <div className="space-y-5">
            <div>
              <label className="admin-label">Nombre del Portal Editorial *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Contacto con la Noticia"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">Lema / Descripción Corta</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Periodismo independiente, veraz y de investigación"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">URL del Sitio Web</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://contactoconlanoticia.com"
                className="admin-input"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="admin-label">Logotipo Principal</label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="h-16 px-4 bg-gray-50 border rounded-xl flex items-center justify-center">
                    <img src={formData.logo_url} alt="Logo" className="max-h-12 w-auto object-contain" />
                  </div>
                ) : (
                  <div className="h-16 w-32 bg-gray-100 border border-dashed rounded-xl flex items-center justify-center text-gray-400 text-xs">
                    Sin logo
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget('logo')}
                    className="btn-secondary py-1.5 text-xs"
                  >
                    Seleccionar logo
                  </button>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => handleChange('logo_url', null)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Colores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="admin-label text-xs">Color Primario (Header, Botones)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="admin-input font-mono text-xs flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="admin-label text-xs">Color Secundario (Acentos, Badges)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="admin-input font-mono text-xs flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SEO ─────────────────────────────────── */}
        {activeTab === 'seo' && (
          <div className="space-y-5">
            <div>
              <label className="admin-label">Separador de Título en Pestañas</label>
              <input
                type="text"
                value={formData.seo_title_separator}
                onChange={(e) => handleChange('seo_title_separator', e.target.value)}
                placeholder=" | "
                className="admin-input max-w-xs font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Ejemplo: Noticia del Día {formData.seo_title_separator} {formData.name || 'Sitio'}</p>
            </div>

            <div>
              <label className="admin-label">Descripción Meta por Defecto</label>
              <textarea
                rows={3}
                value={formData.seo_default_description || ''}
                onChange={(e) => handleChange('seo_default_description', e.target.value)}
                placeholder="Portal de noticias con cobertura en tiempo real de sucesos, política y deportes."
                className="admin-input resize-none"
              />
            </div>

            {/* Imagen Open Graph Default */}
            <div>
              <label className="admin-label">Imagen Predeterminada para Redes (Open Graph / Twitter)</label>
              <div className="flex items-start gap-4">
                {formData.og_default_image_url ? (
                  <div className="aspect-[1.91/1] w-48 bg-gray-100 border rounded-xl overflow-hidden">
                    <img src={formData.og_default_image_url} alt="OG Default" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[1.91/1] w-48 bg-gray-50 border border-dashed rounded-xl flex items-center justify-center text-gray-400 text-xs">
                    1200 × 630 px
                  </div>
                )}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget('og')}
                    className="btn-secondary py-1.5 text-xs block"
                  >
                    Elegir imagen de portada
                  </button>
                  {formData.og_default_image_url && (
                    <button
                      type="button"
                      onClick={() => handleChange('og_default_image_url', null)}
                      className="text-xs text-red-600 hover:underline block"
                    >
                      Quitar imagen
                    </button>
                  )}
                  <p className="text-[11px] text-gray-400">
                    Se mostrará en Facebook, WhatsApp y X cuando se comparta el enlace de la portada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: REDES SOCIALES ───────────────────────── */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <div>
              <label className="admin-label">Twitter / X (Usuario o URL)</label>
              <input
                type="text"
                value={formData.social_twitter || ''}
                onChange={(e) => handleChange('social_twitter', e.target.value)}
                placeholder="@ContactoNoticia o https://x.com/..."
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">Facebook (URL de Página)</label>
              <input
                type="url"
                value={formData.social_facebook || ''}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                placeholder="https://facebook.com/contactoconlanoticia"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">Instagram (URL del Perfil)</label>
              <input
                type="url"
                value={formData.social_instagram || ''}
                onChange={(e) => handleChange('social_instagram', e.target.value)}
                placeholder="https://instagram.com/contactoconlanoticia"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">YouTube (Canal)</label>
              <input
                type="url"
                value={formData.social_youtube || ''}
                onChange={(e) => handleChange('social_youtube', e.target.value)}
                placeholder="https://youtube.com/@contactoconlanoticia"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">TikTok (Perfil)</label>
              <input
                type="url"
                value={formData.social_tiktok || ''}
                onChange={(e) => handleChange('social_tiktok', e.target.value)}
                placeholder="https://tiktok.com/@contactoconlanoticia"
                className="admin-input"
              />
            </div>
          </div>
        )}

        {/* ── TAB: CONTACTO ────────────────────────────── */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div>
              <label className="admin-label">Correo de Redacción / Contacto</label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="contacto@contactoconlanoticia.com"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">Teléfono o WhatsApp de Información</label>
              <input
                type="tel"
                value={formData.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="+58 412 000 0000"
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">Dirección Física o Sede</label>
              <input
                type="text"
                value={formData.contact_address || ''}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                placeholder="Caracas, Venezuela"
                className="admin-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Media Picker para Logo u OpenGraph */}
      <MediaPickerModal
        isOpen={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={(m) => {
          if (mediaPickerTarget === 'logo') {
            handleChange('logo_url', m.url)
          } else if (mediaPickerTarget === 'og') {
            handleChange('og_default_image_url', m.conversions?.og?.url || m.url)
          }
        }}
        title={mediaPickerTarget === 'logo' ? 'Seleccionar Logotipo' : 'Seleccionar Imagen Open Graph'}
      />
    </div>
  )
}

