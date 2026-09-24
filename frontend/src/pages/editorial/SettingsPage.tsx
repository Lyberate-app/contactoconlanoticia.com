import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Type,
  Smartphone,
  Image as ImageIcon,
  Building2,
  Share2,
  Sliders,
  Download,
  Upload,
  RotateCcw,
  Check,
  Eye,
  Sparkles,
  Globe,
  Bell,
  SunMedium,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { settingsApi } from '../../services/settingsApi';
import type {
  WhiteLabelConfig,
  WhiteLabelPreset,
} from '../../types/settings';
import {
  AVAILABLE_HEADING_FONTS,
  AVAILABLE_BODY_FONTS,
  WHITE_LABEL_PRESETS,
} from '../../config/whiteLabelDefaults';

type ActiveTab =
  | 'identity'
  | 'logos'
  | 'colors'
  | 'typography'
  | 'pwa'
  | 'social'
  | 'features'
  | 'backup';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  // Local draft state
  const [draft, setDraft] = useState<WhiteLabelConfig>(settings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('identity');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize draft when settings change from outside
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Handle Save
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(draft);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error al guardar la configuración: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // Handle Reset to Defaults
  const handleConfirmReset = async () => {
    try {
      setSaving(true);
      const res = await resetSettings();
      setDraft(res);
      setResetModalOpen(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error al restablecer: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // Handle Applying a Preset
  const handleSelectPreset = async (preset: WhiteLabelPreset) => {
    const newConfig: WhiteLabelConfig = {
      ...draft,
      colors: preset.config.colors ? { ...draft.colors, ...preset.config.colors } : draft.colors,
      typography: preset.config.typography ? { ...draft.typography, ...preset.config.typography } : draft.typography,
      features: preset.config.features ? { ...draft.features, ...preset.config.features } : draft.features,
    };
    setDraft(newConfig);
    // Instant preview & live apply
    await updateSettings(newConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handle File Upload to Data URL (for logos, favicons, PWA icons)
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'headerLogoUrl' | 'headerLogoDarkUrl' | 'faviconUrl' | 'ogFallbackImageUrl' | 'pwaIcon192' | 'pwaIcon512' | 'pwaIconMaskable' | 'pwaIconSvg'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await settingsApi.readFileAsDataUrl(file);
      if (field === 'pwaIcon192') {
        setDraft((prev) => ({ ...prev, pwa: { ...prev.pwa, icon192Url: dataUrl } }));
      } else if (field === 'pwaIcon512') {
        setDraft((prev) => ({ ...prev, pwa: { ...prev.pwa, icon512Url: dataUrl } }));
      } else if (field === 'pwaIconMaskable') {
        setDraft((prev) => ({ ...prev, pwa: { ...prev.pwa, iconMaskableUrl: dataUrl } }));
      } else if (field === 'pwaIconSvg') {
        setDraft((prev) => ({ ...prev, pwa: { ...prev.pwa, iconSvgUrl: dataUrl } }));
      } else {
        setDraft((prev) => ({ ...prev, logos: { ...prev.logos, [field]: dataUrl } }));
      }
    } catch {
      alert('Error al procesar el archivo de imagen.');
    }
  };

  // Handle JSON Configuration Export
  const handleExportJson = () => {
    const jsonStr = settingsApi.exportConfigJson(draft);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marca-blanca-${draft.identity.shortName.toLowerCase().replace(/\s+/g, '-')}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle JSON Configuration Import
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportError(null);
        const content = event.target?.result as string;
        const parsed = settingsApi.parseImportedConfig(content);
        const merged: WhiteLabelConfig = {
          ...draft,
          ...parsed,
          identity: { ...draft.identity, ...(parsed.identity || {}) },
          logos: { ...draft.logos, ...(parsed.logos || {}) },
          colors: { ...draft.colors, ...(parsed.colors || {}) },
          typography: { ...draft.typography, ...(parsed.typography || {}) },
          pwa: { ...draft.pwa, ...(parsed.pwa || {}) },
          social: { ...draft.social, ...(parsed.social || {}) },
          features: { ...draft.features, ...(parsed.features || {}) },
        };
        setDraft(merged);
        await updateSettings(merged);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Archivo inválido');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="glass-card rounded-[28px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/60 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
              <Sparkles className="w-3 h-3 text-rose-600" />
              Módulo de Marca Blanca v2.0
            </span>
            <span className="text-xs text-stone-400">&bull;</span>
            <span className="text-xs text-stone-500 font-mono">
              Tenant: {draft.identity.siteName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
            Personalización de Marca Blanca & Sistema
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            Gestiona la identidad completa del portal de noticias: logotipo, icono PWA, paleta de colores cromática, tipografías editoriales y configuración móvil para cualquier medio de comunicación.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setPreviewOpen(!previewOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
              previewOpen
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                : 'bg-white/70 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:bg-white'
            }`}
          >
            <Eye className="w-4 h-4 text-stone-500" />
            <span>{previewOpen ? 'Ocultar Previsualización' : 'Previsualizar en Vivo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-stone-600 dark:text-stone-300 bg-white/70 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Restablecer a valores por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white transition-all shadow-md cursor-pointer active:scale-95 ${
              savedSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-stone-900 hover:bg-stone-800'
            }`}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Cambios Aplicados!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar y Aplicar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Info Notification Bar */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Configuración sincronizada con éxito:</strong> Los estilos, variables CSS y parámetros de la PWA se han actualizado en tiempo real en todo el sistema.
            </span>
          </div>
        </div>
      )}

      {/* 2. LIVE PREVIEW DRAWER / MODAL */}
      {previewOpen && (
        <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold tracking-tight">
                Previsualización en Vivo de Marca Blanca
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Render interactivo en caliente</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Masthead Preview */}
            <div className="lg:col-span-2 bg-stone-50 rounded-xl p-4 text-stone-900 border border-stone-200 overflow-hidden">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">
                Cabecera del Periódico (Masthead)
              </span>

              {/* Utility Top Bar */}
              <div
                style={{
                  backgroundColor: draft.colors.topBarBg,
                  color: draft.colors.topBarText,
                }}
                className="px-3 py-1 text-[11px] rounded-t-lg border-b border-stone-200 flex items-center justify-between font-sans"
              >
                <span>{draft.identity.editionName}</span>
                <div className="flex items-center gap-3">
                  {draft.features.showWeatherWidget && (
                    <span className="flex items-center gap-1">
                      <SunMedium className="w-3 h-3 text-amber-500" /> 31°C
                    </span>
                  )}
                  {draft.features.showCitizenSubmissionButton && (
                    <span
                      style={{ color: draft.colors.accent }}
                      className="font-semibold flex items-center gap-1"
                    >
                      <Send className="w-2.5 h-2.5" /> Envíanos tu noticia
                    </span>
                  )}
                </div>
              </div>

              {/* Masthead Hero */}
              <div
                style={{
                  backgroundColor: draft.colors.mastheadBg,
                  color: draft.colors.mastheadText,
                }}
                className="py-4 text-center border-b border-stone-200"
              >
                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-1">
                  {draft.identity.historicSubtitle}
                </div>

                {draft.logos.headerLogoUrl ? (
                  <img
                    src={draft.logos.headerLogoUrl}
                    alt={draft.identity.siteName}
                    style={{ height: `${draft.logos.headerLogoHeight}px` }}
                    className="mx-auto object-contain my-1"
                  />
                ) : (
                  <h3
                    style={{
                      fontFamily: `"${draft.typography.headingFont}", serif`,
                      fontWeight: Number(draft.typography.headingWeight),
                      color: draft.colors.primary,
                    }}
                    className="text-2xl sm:text-3xl uppercase tracking-tight"
                  >
                    {draft.identity.siteName}
                  </h3>
                )}

                <p
                  style={{ fontFamily: `"${draft.typography.headingFont}", serif` }}
                  className="text-xs italic text-stone-600 mt-1 max-w-lg mx-auto"
                >
                  {draft.identity.tagline}
                </p>

                {draft.features.mastheadLayout === 'classic_double_rule' && (
                  <div className="mt-3 pt-0.5 border-t-2 border-b border-stone-900 max-w-xl mx-auto"></div>
                )}
              </div>

              {/* Category Navbar Preview */}
              <div
                style={{
                  backgroundColor: draft.colors.navBg,
                  color: draft.colors.navText,
                }}
                className="px-3 py-1.5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider overflow-x-auto rounded-b-lg"
              >
                <span style={{ color: draft.colors.primary }} className="border-b-2 pb-0.5">
                  Portada
                </span>
                <span>Regionales</span>
                <span>Sucesos</span>
                <span>Comunidades</span>
                <span>Economía</span>
              </div>
            </div>

            {/* PWA & Mobile Phone Simulator */}
            <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-3">
                Simulador de Pantalla PWA (Móvil)
              </span>

              {/* Phone Frame Mockup */}
              <div className="w-48 bg-stone-950 p-2.5 rounded-3xl border-4 border-stone-700 shadow-2xl space-y-3">
                {/* Status Bar */}
                <div
                  style={{ backgroundColor: draft.pwa.themeColor }}
                  className="rounded-t-xl px-3 py-1 text-[9px] flex items-center justify-between text-white font-mono"
                >
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    <span className="text-[8px]">5G</span>
                  </div>
                </div>

                {/* Home Screen App Icon Preview */}
                <div className="py-4 flex flex-col items-center justify-center space-y-1.5">
                  <div
                    style={{ backgroundColor: draft.pwa.backgroundColor }}
                    className="w-14 h-14 rounded-2xl shadow-lg border border-white/20 p-2 flex items-center justify-center overflow-hidden"
                  >
                    {draft.pwa.icon192Url ? (
                      <img
                        src={draft.pwa.icon192Url}
                        alt="PWA Icon"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: draft.colors.primary }}
                        className="w-full h-full rounded-xl text-white font-black text-xl flex items-center justify-center"
                      >
                        {draft.identity.shortName.charAt(0) || 'C'}
                      </div>
                    )}
                  </div>
                  <span className="text-white font-semibold text-[11px] truncate max-w-[120px]">
                    {draft.pwa.shortName || draft.identity.shortName}
                  </span>
                  <span className="text-[9px] text-stone-400">PWA Instalable</span>
                </div>

                {/* Simulated Push Notification */}
                <div className="bg-stone-800/90 border border-stone-700/80 rounded-xl p-2 text-left space-y-1">
                  <div className="flex items-center gap-1 text-[9px] text-stone-300 font-semibold">
                    <Bell className="w-2.5 h-2.5 text-amber-400" />
                    <span>{draft.pwa.shortName}</span>
                    <span className="text-stone-500">· Ahora</span>
                  </div>
                  <p className="text-[9px] text-white font-medium leading-tight">
                    Alerta de noticia de última hora para el estado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION TABS */}
      <div className="glass-panel p-1.5 rounded-full flex items-center gap-1 overflow-x-auto no-scrollbar border border-white/60 dark:border-white/10 shadow-xs">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'identity'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <Building2 className="w-4 h-4 text-rose-600" />
          <span>1. Identidad</span>
        </button>

        <button
          onClick={() => setActiveTab('logos')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'logos'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-rose-600" />
          <span>2. Logos</span>
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'colors'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <Palette className="w-4 h-4 text-rose-600" />
          <span>3. Colores</span>
        </button>

        <button
          onClick={() => setActiveTab('typography')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'typography'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <Type className="w-4 h-4 text-rose-600" />
          <span>4. Tipografía</span>
        </button>

        <button
          onClick={() => setActiveTab('pwa')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'pwa'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <Smartphone className="w-4 h-4 text-rose-600" />
          <span>5. PWA & Móvil</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'social'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <Share2 className="w-4 h-4 text-rose-600" />
          <span>6. Redes</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'features'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <Sliders className="w-4 h-4 text-rose-600" />
          <span>7. Diseño</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTab === 'backup'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-bold'
              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40'
          }`}
        >
          <Download className="w-4 h-4 text-rose-600" />
          <span>8. Respaldo</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS CONTAINER */}
      <div className="glass-card rounded-[28px] p-6 sm:p-8 border border-white/60 dark:border-white/10 shadow-sm">
        {/* ========================================================================= */}
        {/* TAB 1: IDENTIDAD DEL MEDIO */}
        {/* ========================================================================= */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Identidad Institucional del Medio
              </h2>
              <p className="text-xs text-stone-500">
                Información canónica del diario o portal de noticias que se proyecta en la cabecera, pie de página, metaetiquetas SEO y datos estructurados JSON-LD.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre Oficial del Periódico / Sitio Web *
                </label>
                <input
                  type="text"
                  value={draft.identity.siteName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, siteName: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="Ej: Contacto con la Noticia"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre Corto / Acrónimo *
                </label>
                <input
                  type="text"
                  value={draft.identity.shortName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, shortName: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="Ej: Contacto"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Lema Periodístico / Eslogan de Portada
                </label>
                <input
                  type="text"
                  value={draft.identity.tagline}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, tagline: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800 font-serif italic"
                  placeholder='Ej: "Información oportuna, veraz y con sentido social"'
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Bajada Histórica / Subtítulo Institucional
                </label>
                <input
                  type="text"
                  value={draft.identity.historicSubtitle}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, historicSubtitle: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="Ej: Diario Regional Independiente · Fundado en 2011"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Edición Territorial (Barra Superior)
                </label>
                <input
                  type="text"
                  value={draft.identity.editionName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, editionName: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="Ej: Edición Digital · San Juan de los Morros, Guárico"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Sede Central & Región
                </label>
                <input
                  type="text"
                  value={draft.identity.centralLocation}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, centralLocation: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="Ej: San Juan de los Morros, Estado Guárico"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Correo Electrónico de Redacción
                </label>
                <input
                  type="email"
                  value={draft.identity.contactEmail}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, contactEmail: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="redaccion@tumedio.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Dirección Física de la Sede
                </label>
                <input
                  type="text"
                  value={draft.identity.address}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, address: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="Av. Bolívar, Edificio Centro Cívico, San Juan de los Morros..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Leyenda de Copyright (Pie de página)
                </label>
                <input
                  type="text"
                  value={draft.identity.copyrightText}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, copyrightText: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800 focus:border-rose-800"
                  placeholder="Contacto con la Noticia Media Group. Todos los derechos reservados."
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.identity.showLyberateBadge}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        identity: { ...prev.identity, showLyberateBadge: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-rose-900 focus:ring-rose-800"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">
                      Mostrar distintivo "Plataforma desarrollada con arquitectura Lyberate"
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Desactiva esta opción si deseas ofrecer la solución en modalidad marca blanca 100% ciega.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LOGOS & FAVICON */}
        {/* ========================================================================= */}
        {activeTab === 'logos' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Logotipos, Favicon y Recursos Gráficos
              </h2>
              <p className="text-xs text-stone-500">
                Carga o ingresa la URL de los activos gráficos de tu marca. Si el logotipo principal se deja vacío, el portal utilizará un titular tipográfico periodístico clásico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Header Logo */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">
                    Logotipo Principal (Cabecera Claro)
                  </label>
                  <span className="text-[10px] text-stone-400">PNG / SVG / WebP</span>
                </div>

                <div className="h-24 bg-white border border-dashed border-stone-300 rounded-xl flex items-center justify-center p-3 relative group">
                  {draft.logos.headerLogoUrl ? (
                    <img
                      src={draft.logos.headerLogoUrl}
                      alt="Logo Principal"
                      style={{ maxHeight: `${draft.logos.headerLogoHeight || 48}px` }}
                      className="object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                      <span className="text-[11px] text-stone-400">
                        Sin logotipo (usa titular tipográfico)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.logos.headerLogoUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        logos: { ...prev.logos, headerLogoUrl: e.target.value },
                      }))
                    }
                    placeholder="URL externa del logo..."
                    className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-800"
                  />
                  <label className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'headerLogoUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Logo Height Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-stone-600 font-medium mb-1">
                    <span>Altura máxima en cabecera:</span>
                    <span>{draft.logos.headerLogoHeight || 48}px</span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="80"
                    value={draft.logos.headerLogoHeight || 48}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        logos: { ...prev.logos, headerLogoHeight: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-rose-900"
                  />
                </div>
              </div>

              {/* Favicon Browser Icon */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">
                    Favicon del Navegador (Pestaña)
                  </label>
                  <span className="text-[10px] text-stone-400">ICO / SVG / PNG</span>
                </div>

                <div className="h-24 bg-white border border-stone-200 rounded-xl flex items-center justify-center p-3">
                  {/* Browser Tab Simulator */}
                  <div className="flex items-center gap-2 bg-stone-100 border border-stone-300 px-3 py-1.5 rounded-lg max-w-[200px] shadow-2xs">
                    {draft.logos.faviconUrl ? (
                      <img
                        src={draft.logos.faviconUrl}
                        alt="Favicon"
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <Globe className="w-4 h-4 text-stone-400" />
                    )}
                    <span className="text-[11px] text-stone-700 truncate font-sans">
                      {draft.identity.siteName}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.logos.faviconUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        logos: { ...prev.logos, faviconUrl: e.target.value },
                      }))
                    }
                    placeholder="URL del favicon..."
                    className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-800"
                  />
                  <label className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'faviconUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Social OG Image Fallback */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block">
                      Imagen OpenGraph Predeterminada (Compartir en Redes Sociales)
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Imagen que se muestra en WhatsApp, X, Facebook o Telegram al compartir un enlace de portada (Recomendado 1200x630 px).
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-full sm:w-48 h-28 bg-stone-200 rounded-xl overflow-hidden border border-stone-300 shrink-0 flex items-center justify-center">
                    {draft.logos.ogFallbackImageUrl ? (
                      <img
                        src={draft.logos.ogFallbackImageUrl}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-stone-400" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={draft.logos.ogFallbackImageUrl}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          logos: { ...prev.logos, ogFallbackImageUrl: e.target.value },
                        }))
                      }
                      placeholder="URL de la imagen de portada social..."
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-800"
                    />
                    <label className="inline-flex px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Cargar Imagen desde Archivo Local</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'ogFallbackImageUrl')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PALETA DE COLORES */}
        {/* ========================================================================= */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Sistema Cromático & Paletas de Marca
              </h2>
              <p className="text-xs text-stone-500">
                Personaliza los tokens de color del portal o selecciona un preajuste de diseño periodístico validado con alto contraste y legibilidad editorial.
              </p>
            </div>

            {/* Presets Grid */}
            <div>
              <span className="text-xs font-bold text-stone-800 block mb-2.5">
                Preajustes Editoriales de 1-Clic:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {WHITE_LABEL_PRESETS.map((preset) => {
                  const isCurrent =
                    draft.colors.primary.toLowerCase() ===
                    preset.config.colors?.primary?.toLowerCase();

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isCurrent
                          ? 'border-rose-900 bg-rose-50/40 ring-2 ring-rose-900/20'
                          : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-900">
                          {preset.name}
                        </span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-rose-800"></span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-500 line-clamp-2 mb-3">
                        {preset.description}
                      </p>

                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ backgroundColor: preset.config.colors?.primary }}
                          className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs"
                          title="Color Primario"
                        />
                        <span
                          style={{ backgroundColor: preset.config.colors?.accent }}
                          className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs"
                          title="Color de Acento"
                        />
                        <span
                          style={{ backgroundColor: preset.config.colors?.navBg }}
                          className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs"
                          title="Fondo Navegación"
                        />
                        <span
                          style={{ backgroundColor: preset.config.colors?.topBarBg }}
                          className="w-5 h-5 rounded-full border border-stone-300 shadow-2xs"
                          title="Barra Superior"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual Color Inputs */}
            <div className="border-t border-stone-100 pt-5">
              <span className="text-xs font-bold text-stone-800 block mb-3">
                Ajuste Fino de Tokens Cromáticos:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Primary Color */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-800">Color Primario (Marca)</label>
                    <span className="text-[10px] text-stone-400">Titulares & Botones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.primary}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.colors.primary}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value },
                        }))
                      }
                      className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Primary Hover Color */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-800">Color Primario Hover</label>
                    <span className="text-[10px] text-stone-400">Interacción</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.primaryHover}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, primaryHover: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.colors.primaryHover}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, primaryHover: e.target.value },
                        }))
                      }
                      className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-800">Color de Acento</label>
                    <span className="text-[10px] text-stone-400">Breaking News & Badges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.accent}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, accent: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.colors.accent}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, accent: e.target.value },
                        }))
                      }
                      className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Top Bar Background */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-800">Fondo Barra Superior</label>
                    <span className="text-[10px] text-stone-400">Top Bar Bg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.topBarBg}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, topBarBg: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.colors.topBarBg}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, topBarBg: e.target.value },
                        }))
                      }
                      className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Navigation Background */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-800">Fondo Barra de Secciones</label>
                    <span className="text-[10px] text-stone-400">Nav Bg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.navBg}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, navBg: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.colors.navBg}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, navBg: e.target.value },
                        }))
                      }
                      className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Page Background */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-800">Fondo General del Portal</label>
                    <span className="text-[10px] text-stone-400">Page Bg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.colors.pageBg}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, pageBg: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.colors.pageBg}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, pageBg: e.target.value },
                        }))
                      }
                      className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TIPOGRAFÍA EDITORIAL */}
        {/* ========================================================================= */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Tipografía & Estilo Editorial
              </h2>
              <p className="text-xs text-stone-500">
                Selecciona las familias tipográficas para titulares y texto corrido. El sistema carga automáticamente las fuentes seleccionadas vía Google Fonts.
              </p>
            </div>

            {/* Headline Font Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  Tipografía de Titulares & Cabecera (Headline Serif/Display)
                </label>
                <span className="text-[11px] text-stone-500">
                  Activa: <strong>{draft.typography.headingFont}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_HEADING_FONTS.map((font) => {
                  const isSelected = draft.typography.headingFont === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          typography: { ...prev.typography, headingFont: font.id },
                        }))
                      }
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-900 bg-rose-50/50 ring-2 ring-rose-900/20'
                          : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-[11px] text-stone-400 block mb-1">
                        {font.category}
                      </span>
                      <span
                        style={{ fontFamily: `"${font.id}", Georgia, serif` }}
                        className="text-lg font-bold text-stone-900 block truncate"
                      >
                        {font.name}
                      </span>
                      <p
                        style={{ fontFamily: `"${font.id}", Georgia, serif` }}
                        className="text-xs text-stone-600 mt-2 line-clamp-1 italic"
                      >
                        "Juicio a la noticia con rigor y veracidad."
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body Font Selector */}
            <div className="space-y-3 border-t border-stone-100 pt-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  Tipografía de Lectura & UI (Body & Navigation)
                </label>
                <span className="text-[11px] text-stone-500">
                  Activa: <strong>{draft.typography.bodyFont}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_BODY_FONTS.map((font) => {
                  const isSelected = draft.typography.bodyFont === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          typography: { ...prev.typography, bodyFont: font.id },
                        }))
                      }
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-900 bg-rose-50/50 ring-2 ring-rose-900/20'
                          : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-[11px] text-stone-400 block mb-1">
                        {font.category}
                      </span>
                      <span
                        style={{ fontFamily: `"${font.id}", sans-serif` }}
                        className="text-base font-semibold text-stone-900 block truncate"
                      >
                        {font.name}
                      </span>
                      <p
                        style={{ fontFamily: `"${font.id}", sans-serif` }}
                        className="text-xs text-stone-600 mt-1 line-clamp-2"
                      >
                        Párrafos periodísticos de alta legibilidad optimizados para pantallas retina y móviles.
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Heading Weight */}
            <div className="border-t border-stone-100 pt-5">
              <label className="block text-xs font-bold text-stone-800 mb-2">
                Grosor de Titulares Periodísticos:
              </label>
              <div className="flex gap-2">
                {(['600', '700', '800', '900'] as const).map((weight) => (
                  <button
                    key={weight}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        typography: { ...prev.typography, headingWeight: weight },
                      }))
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      draft.typography.headingWeight === weight
                        ? 'bg-rose-900 text-white border-rose-900'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {weight === '600' && 'Semi-Bold (600)'}
                    {weight === '700' && 'Bold (700)'}
                    {weight === '800' && 'Extra-Bold (800)'}
                    {weight === '900' && 'Black / Prensa (900)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PWA & EXPERIENCIA MÓVIL */}
        {/* ========================================================================= */}
        {activeTab === 'pwa' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Personalización Total de Progressive Web App (PWA)
              </h2>
              <p className="text-xs text-stone-500">
                Configura los parámetros del archivo `manifest.webmanifest`, los iconos de instalación en smartphones (Android/iOS) y los colores nativos de la barra de sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre Completo de la Aplicación PWA *
                </label>
                <input
                  type="text"
                  value={draft.pwa.appName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      pwa: { ...prev.pwa, appName: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="Ej: Contacto con la Noticia"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Aparece en el banner de solicitud de instalación del navegador.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre Corto (Short Name - Max 12 car.) *
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={draft.pwa.shortName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      pwa: { ...prev.pwa, shortName: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="Ej: Contacto"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Aparece debajo del icono en la pantalla de inicio del teléfono.
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Descripción de la PWA
                </label>
                <input
                  type="text"
                  value={draft.pwa.description}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      pwa: { ...prev.pwa, description: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="Periódico Digital de Guárico y Venezuela..."
                />
              </div>

              {/* Theme Color & Splash Background */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-800">Theme Color (Status Bar)</label>
                  <span className="text-[10px] text-stone-400">Barra de estado móvil</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.pwa.themeColor}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        pwa: { ...prev.pwa, themeColor: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={draft.pwa.themeColor}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        pwa: { ...prev.pwa, themeColor: e.target.value },
                      }))
                    }
                    className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-800">Color Splash Screen</label>
                  <span className="text-[10px] text-stone-400">Fondo de arranque PWA</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.pwa.backgroundColor}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        pwa: { ...prev.pwa, backgroundColor: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={draft.pwa.backgroundColor}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        pwa: { ...prev.pwa, backgroundColor: e.target.value },
                      }))
                    }
                    className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              {/* PWA Icon Uploaders */}
              <div className="md:col-span-2 border-t border-stone-100 pt-5 space-y-4">
                <span className="text-xs font-bold text-stone-800 block">
                  Iconos de la Aplicación Móvil (App Icons):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Icon 192 */}
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-center">
                    <span className="text-xs font-bold text-stone-700 block">
                      Icono 192x192 (PNG)
                    </span>
                    <div className="w-16 h-16 bg-white border border-stone-300 rounded-2xl mx-auto flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                      {draft.pwa.icon192Url ? (
                        <img
                          src={draft.pwa.icon192Url}
                          alt="Icon 192"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Smartphone className="w-6 h-6 text-stone-400" />
                      )}
                    </div>
                    <label className="inline-flex px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Subir 192px</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml"
                        onChange={(e) => handleImageUpload(e, 'pwaIcon192')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Icon 512 */}
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-center">
                    <span className="text-xs font-bold text-stone-700 block">
                      Icono 512x512 (HD)
                    </span>
                    <div className="w-16 h-16 bg-white border border-stone-300 rounded-2xl mx-auto flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                      {draft.pwa.icon512Url ? (
                        <img
                          src={draft.pwa.icon512Url}
                          alt="Icon 512"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Smartphone className="w-6 h-6 text-stone-400" />
                      )}
                    </div>
                    <label className="inline-flex px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Subir 512px</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml"
                        onChange={(e) => handleImageUpload(e, 'pwaIcon512')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Icon Maskable */}
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-center">
                    <span className="text-xs font-bold text-stone-700 block">
                      Maskable Android
                    </span>
                    <div className="w-16 h-16 bg-white border border-stone-300 rounded-full mx-auto flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                      {draft.pwa.iconMaskableUrl ? (
                        <img
                          src={draft.pwa.iconMaskableUrl}
                          alt="Maskable Icon"
                          className="w-full h-full object-contain rounded-full"
                        />
                      ) : (
                        <Smartphone className="w-6 h-6 text-stone-400" />
                      )}
                    </div>
                    <label className="inline-flex px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Subir Maskable</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml"
                        onChange={(e) => handleImageUpload(e, 'pwaIconMaskable')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CANALES & REDES SOCIALES */}
        {/* ========================================================================= */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Canales de Difusión & Redes Sociales
              </h2>
              <p className="text-xs text-stone-500">
                Enlaces oficiales del medio para las etiquetas OpenGraph, Twitter Cards y los botones de comunidad en el portal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Usuario Twitter / X (Handle con @)
                </label>
                <input
                  type="text"
                  value={draft.social.twitterSite}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      social: { ...prev.social, twitterSite: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="@contactonoticia"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Enlace Perfil Twitter / X
                </label>
                <input
                  type="url"
                  value={draft.social.twitterUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      social: { ...prev.social, twitterUrl: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="https://x.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Canal de WhatsApp Informativo
                </label>
                <input
                  type="url"
                  value={draft.social.whatsappChannelUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      social: { ...prev.social, whatsappChannelUrl: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="https://whatsapp.com/channel/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Canal de Telegram
                </label>
                <input
                  type="url"
                  value={draft.social.telegramChannelUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      social: { ...prev.social, telegramChannelUrl: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="https://t.me/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Página de Facebook
                </label>
                <input
                  type="url"
                  value={draft.social.facebookUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      social: { ...prev.social, facebookUrl: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Cuenta de Instagram
                </label>
                <input
                  type="url"
                  value={draft.social.instagramUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      social: { ...prev.social, instagramUrl: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: DISEÑO & MASTHEAD */}
        {/* ========================================================================= */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Disposición de Cabecera & Módulos Activos
              </h2>
              <p className="text-xs text-stone-500">
                Controla la apariencia del diario impreso vs. formato digital y activa o desactiva elementos clave del portal.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-stone-800">
                Estilo Visual del Masthead (Cabecera Principal):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      features: { ...prev.features, mastheadLayout: 'classic_double_rule' },
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    draft.features.mastheadLayout === 'classic_double_rule'
                      ? 'border-rose-900 bg-rose-50/50 ring-2 ring-rose-900/20'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xs font-bold text-stone-900 block mb-1">
                    1. Clásico con Doble Pleca
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Estilo tradicional de periódico impreso con doble línea superior e inferior.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      features: { ...prev.features, mastheadLayout: 'modern_centered' },
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    draft.features.mastheadLayout === 'modern_centered'
                      ? 'border-rose-900 bg-rose-50/50 ring-2 ring-rose-900/20'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xs font-bold text-stone-900 block mb-1">
                    2. Moderno Centrado
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Diseño contemporáneo sin plecas rígidas con espaciado limpio y balanceado.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      features: { ...prev.features, mastheadLayout: 'clean_compact' },
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    draft.features.mastheadLayout === 'clean_compact'
                      ? 'border-rose-900 bg-rose-50/50 ring-2 ring-rose-900/20'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xs font-bold text-stone-900 block mb-1">
                    3. Compacto de Noticias
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Altura reducida para dar prioridad inmediata al carrusel de noticias principales.
                  </p>
                </button>
              </div>

              {/* Feature Toggles */}
              <div className="border-t border-stone-100 pt-5 space-y-3">
                <span className="text-xs font-bold text-stone-800 block">
                  Conmutadores de Módulos:
                </span>

                <label className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Cintillo de Última Hora (Breaking News Ticker)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Muestra la cinta deslizante con noticias urgentes en la portada.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.features.showBreakingNewsTicker}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, showBreakingNewsTicker: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-rose-900 focus:ring-rose-800"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Widget del Clima en Barra Superior
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Muestra la temperatura y pronóstico regional en la cabecera.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.features.showWeatherWidget}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, showWeatherWidget: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-rose-900 focus:ring-rose-800"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Acceso Rápido a "Envíanos tu noticia" (Buzón Ciudadano)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Muestra el enlace directo en la barra superior para captar reportes de la comunidad.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.features.showCitizenSubmissionButton}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        features: { ...prev.features, showCitizenSubmissionButton: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-rose-900 focus:ring-rose-800"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: RESPALDO & JSON (IMPORT/EXPORT) */}
        {/* ========================================================================= */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-base font-bold text-stone-900">
                Respaldo, Clonación & Portabilidad de Marca Blanca
              </h2>
              <p className="text-xs text-stone-500">
                Exporta el perfil de marca a un archivo JSON para respaldo o importa una configuración preexistente para desplegar un nuevo medio periodístico en cuestión de segundos.
              </p>
            </div>

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Export Box */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <Download className="w-4 h-4 text-rose-800" />
                  <span>Exportar Configuración Actual</span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Descarga un archivo JSON estructurado con todos los colores, tipografías, logotipos, configuración PWA y datos del portal.
                </p>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo JSON de Marca</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                  <Upload className="w-4 h-4 text-rose-800" />
                  <span>Importar Configuración Externa</span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Carga un archivo JSON de marca blanca para aplicar al instante toda la identidad de otro medio de comunicación.
                </p>
                <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-stone-600" />
                  <span>Seleccionar Archivo JSON</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                ¿Restablecer configuración a valores de fábrica?
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Esta acción restaurará el medio a la identidad predeterminada de <strong>Contacto con la Noticia</strong> (paleta borgoña, tipografía Merriweather y logos originales).
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 transition-colors shadow-xs cursor-pointer"
              >
                Sí, Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
