import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  RotateCcw,
  Sun,
  Moon,
  BookOpen,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import {
  WHITE_LABEL_PRESETS,
  AVAILABLE_HEADING_FONTS,
} from '../../config/whiteLabelDefaults';
import type { WhiteLabelPreset } from '../../types/settings';
import { notify } from '../../utils/notice';

export const LiveThemeCustomizer: React.FC = () => {
  const { settings, updateSettings, applyPreset, resetSettings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [readingMode, setReadingMode] = useState<'light' | 'sepia' | 'dark'>('light');

  const handleSelectPreset = async (preset: WhiteLabelPreset) => {
    try {
      await applyPreset(preset);
      notify(`Tema "${preset.name}" aplicado correctamente`, 'success', 'Estilo Actualizado');
    } catch {
      notify('No se pudo aplicar el preset', 'error');
    }
  };

  const handleColorChange = async (colorKey: 'primary' | 'accent', value: string) => {
    try {
      await updateSettings({
        colors: {
          ...settings.colors,
          [colorKey]: value,
          ...(colorKey === 'primary' ? { primaryHover: value } : {}),
        },
      });
    } catch {}
  };

  const handleFontChange = async (headingFont: string) => {
    try {
      await updateSettings({
        typography: {
          ...settings.typography,
          headingFont,
        },
      });
    } catch {}
  };

  const handleFeatureToggle = async (featureKey: keyof typeof settings.features, val: boolean) => {
    try {
      await updateSettings({
        features: {
          ...settings.features,
          [featureKey]: val,
        },
      });
    } catch {}
  };

  const handleMastheadLayoutChange = async (layout: 'classic_double_rule' | 'modern_centered' | 'clean_compact') => {
    try {
      await updateSettings({
        features: {
          ...settings.features,
          mastheadLayout: layout,
        },
      });
    } catch {}
  };

  const handleReadingMode = (mode: 'light' | 'sepia' | 'dark') => {
    setReadingMode(mode);
    const root = document.documentElement;
    if (mode === 'sepia') {
      root.style.setProperty('--color-brand-page-bg', '#fbf7ee');
      root.style.setProperty('--color-brand-card-bg', '#fffdf9');
    } else if (mode === 'dark') {
      root.style.setProperty('--color-brand-page-bg', '#0f172a');
      root.style.setProperty('--color-brand-card-bg', '#1e293b');
      root.style.setProperty('--color-brand-masthead-bg', '#0f172a');
      root.style.setProperty('--color-brand-masthead-text', '#f8fafc');
    } else {
      root.style.setProperty('--color-brand-page-bg', settings.colors.pageBg);
      root.style.setProperty('--color-brand-card-bg', settings.colors.cardBg);
      root.style.setProperty('--color-brand-masthead-bg', settings.colors.mastheadBg);
      root.style.setProperty('--color-brand-masthead-text', settings.colors.mastheadText);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 left-6 z-40 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-stone-900 text-white shadow-xl hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
          title="Personalizar diseño y marca del periódico"
        >
          <Palette className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold hidden sm:inline">Personalizar Periódico</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn print:hidden">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-md bg-stone-50 shadow-2xl flex flex-col border-r border-stone-200">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center font-bold">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">
                      Personalizador de Marca y Edición
                    </h3>
                    <span className="text-[11px] text-stone-500">
                      Prueba en vivo estilos, fuentes y opciones
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
                {/* 1. Presets */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Estilos Editoriales Predefinidos
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {WHITE_LABEL_PRESETS.map((preset) => {
                      const isActive = settings.colors.primary === preset.config.colors?.primary;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isActive
                              ? 'border-rose-600 bg-rose-50/70 shadow-xs'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-stone-900 flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full inline-block border border-white/60 shadow-2xs"
                                style={{ backgroundColor: preset.config.colors?.primary || '#881337' }}
                              />
                              <span>{preset.name}</span>
                            </div>
                            <div className="text-[10px] text-stone-500 line-clamp-1">
                              {preset.description}
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-rose-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Reading Tone Mode */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Modo de Lectura
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleReadingMode('light')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        readingMode === 'light' ? 'border-rose-600 bg-white shadow-xs font-bold' : 'border-stone-200 bg-stone-100'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span className="text-[11px]">Blanco</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReadingMode('sepia')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        readingMode === 'sepia' ? 'border-amber-600 bg-[#fbf7ee] shadow-xs font-bold text-amber-900' : 'border-stone-200 bg-stone-100'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span className="text-[11px]">Sepia Prensa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReadingMode('dark')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        readingMode === 'dark' ? 'border-rose-600 bg-stone-900 text-white shadow-xs font-bold' : 'border-stone-200 bg-stone-100'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-sky-400" />
                      <span className="text-[11px]">Oscuro</span>
                    </button>
                  </div>
                </div>

                {/* 3. Primary Color Quick Palette */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Color Primario de la Portada
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { hex: '#881337', name: 'Borgoña' },
                      { hex: '#1e3a8a', name: 'Navy' },
                      { hex: '#0f172a', name: 'Carbón' },
                      { hex: '#065f46', name: 'Esmeralda' },
                      { hex: '#451a03', name: 'Ámbar' },
                      { hex: '#b91c1c', name: 'Rojo Prensa' },
                      { hex: '#4c1d95', name: 'Púrpura' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => handleColorChange('primary', col.hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                          settings.colors.primary === col.hex ? 'border-stone-900 ring-2 ring-stone-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      >
                        {settings.colors.primary === col.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Heading Font */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Tipografía de Titulares
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_HEADING_FONTS.map((font) => {
                      const isActive = settings.typography.headingFont === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => handleFontChange(font.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isActive
                              ? 'border-rose-600 bg-rose-50/70 font-bold'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="text-xs truncate" style={{ fontFamily: font.id }}>
                            {font.name.split(' (')[0]}
                          </div>
                          <div className="text-[10px] text-stone-400">{font.category}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Masthead Layout Style */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Estilo de Cabecera (Masthead)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'classic_double_rule', label: 'Doble Filete' },
                      { id: 'modern_centered', label: 'Centrado' },
                      { id: 'clean_compact', label: 'Compacto' },
                    ].map((lay) => (
                      <button
                        key={lay.id}
                        type="button"
                        onClick={() => handleMastheadLayoutChange(lay.id as any)}
                        className={`p-2 rounded-xl border text-center text-xs cursor-pointer ${
                          settings.features.mastheadLayout === lay.id
                            ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                      >
                        {lay.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Feature Toggles */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Módulos y Componentes
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'showBreakingNewsTicker', label: 'Cintillo de Última Hora' },
                      { key: 'showEconomicIndicators', label: 'Indicadores de Divisas (BCV / Paralelo / Euro)' },
                      { key: 'showWeatherWidget', label: 'Estación de Clima Regional' },
                      { key: 'showAudioReader', label: 'Lector de Voz (TTS) en Artículos' },
                      { key: 'showComments', label: 'Debate y Comentarios Ciudadanos' },
                      { key: 'showCitizenSubmissionButton', label: 'Buzón de Denuncias ("Envíanos tu noticia")' },
                    ].map((feat) => {
                      const enabled = (settings.features as any)[feat.key] !== false;
                      return (
                        <div
                          key={feat.key}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200/80"
                        >
                          <span className="text-xs text-stone-700 font-medium">{feat.label}</span>
                          <button
                            type="button"
                            onClick={() => handleFeatureToggle(feat.key as any, !enabled)}
                            className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                              enabled ? 'bg-rose-900 justify-end' : 'bg-stone-300 justify-start'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    await resetSettings();
                    notify('Ajustes restablecidos de fábrica', 'info');
                  }}
                  className="text-xs text-stone-500 hover:text-rose-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>

                <Link
                  to="/admin/settings"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Panel Completo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
