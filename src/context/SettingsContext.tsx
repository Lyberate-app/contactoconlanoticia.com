import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { WhiteLabelConfig, WhiteLabelPreset } from '../types/settings';
import { DEFAULT_WHITE_LABEL_CONFIG } from '../config/whiteLabelDefaults';
import { settingsApi } from '../services/settingsApi';

interface SettingsContextValue {
  settings: WhiteLabelConfig;
  loading: boolean;
  error: string | null;
  updateSettings: (partial: Partial<WhiteLabelConfig>) => Promise<WhiteLabelConfig>;
  resetSettings: () => Promise<WhiteLabelConfig>;
  applyPreset: (preset: WhiteLabelPreset) => Promise<WhiteLabelConfig>;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// Helper to inject Google Fonts on the fly
function injectDynamicFonts(headingFont: string, bodyFont: string) {
  if (typeof document === 'undefined') return;

  const fontFamiliesToLoad = new Set<string>();
  const systemFonts = ['Georgia', 'Times New Roman', 'Arial', 'system-ui', 'sans-serif', 'serif'];

  if (!systemFonts.includes(headingFont)) {
    fontFamiliesToLoad.add(headingFont);
  }
  if (!systemFonts.includes(bodyFont)) {
    fontFamiliesToLoad.add(bodyFont);
  }

  if (fontFamiliesToLoad.size === 0) return;

  const fontParams = Array.from(fontFamiliesToLoad)
    .map((font) => `family=${encodeURIComponent(font)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700`)
    .join('&');

  const href = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;

  let linkEl = document.getElementById('lyberate-dynamic-fonts') as HTMLLinkElement | null;
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = 'lyberate-dynamic-fonts';
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }

  if (linkEl.href !== href) {
    linkEl.href = href;
  }
}

// Helper to dynamically synchronize PWA manifest
let activeManifestBlobUrl: string | null = null;
function syncDynamicPwaManifest(config: WhiteLabelConfig) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    const dynamicManifest = {
      name: config.pwa.appName || config.identity.siteName,
      short_name: config.pwa.shortName || config.identity.shortName,
      description: config.pwa.description || config.identity.tagline,
      start_url: config.pwa.startUrl || '/',
      scope: '/',
      display: config.pwa.display || 'standalone',
      orientation: config.pwa.orientation || 'portrait-primary',
      background_color: config.pwa.backgroundColor || '#ffffff',
      theme_color: config.pwa.themeColor || '#0c0a09',
      lang: 'es-VE',
      categories: ['news', 'magazines'],
      icons: [
        {
          src: config.pwa.icon192Url || '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: config.pwa.icon512Url || '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: config.pwa.iconMaskableUrl || '/icons/icon-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: config.pwa.iconSvgUrl || '/icons/icon.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
      shortcuts: config.pwa.shortcuts || [],
    };

    const blob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
      type: 'application/manifest+json',
    });

    if (activeManifestBlobUrl) {
      URL.revokeObjectURL(activeManifestBlobUrl);
    }
    activeManifestBlobUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = activeManifestBlobUrl;
  } catch (err) {
    console.warn('[Lyberate WhiteLabel] Dynamic PWA manifest sync warning:', err);
  }
}

// Helper to apply branding tokens (CSS Variables, theme-color, favicon) to the DOM
function applyBrandingToDOM(config: WhiteLabelConfig) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Color design tokens
  root.style.setProperty('--color-brand-primary', config.colors.primary);
  root.style.setProperty('--color-brand-primary-hover', config.colors.primaryHover);
  root.style.setProperty('--color-brand-accent', config.colors.accent);
  root.style.setProperty('--color-brand-topbar-bg', config.colors.topBarBg);
  root.style.setProperty('--color-brand-topbar-text', config.colors.topBarText);
  root.style.setProperty('--color-brand-nav-bg', config.colors.navBg);
  root.style.setProperty('--color-brand-nav-text', config.colors.navText);
  root.style.setProperty('--color-brand-page-bg', config.colors.pageBg);
  root.style.setProperty('--color-brand-masthead-bg', config.colors.mastheadBg);
  root.style.setProperty('--color-brand-masthead-text', config.colors.mastheadText);
  root.style.setProperty('--color-brand-card-bg', config.colors.cardBg);

  // 2. Typography tokens
  root.style.setProperty('--font-serif-brand', `"${config.typography.headingFont}", Georgia, serif`);
  root.style.setProperty('--font-sans-brand', `"${config.typography.bodyFont}", system-ui, sans-serif`);
  root.style.setProperty('--font-heading-weight', config.typography.headingWeight);

  // 3. Dynamic Google Fonts loader
  injectDynamicFonts(config.typography.headingFont, config.typography.bodyFont);

  // 4. Update Favicon & Apple Touch Icon
  if (config.logos.faviconUrl) {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = config.logos.faviconUrl;
    }
  }

  if (config.pwa.icon192Url) {
    let appleTouch = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (appleTouch) {
      appleTouch.href = config.pwa.icon192Url;
    }
  }

  // 5. Update Theme Color & Title
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', config.pwa.themeColor || config.colors.primary);
  }

  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) {
    appleTitleMeta.setAttribute('content', config.pwa.shortName || config.identity.shortName);
  }

  // 6. Update PWA Manifest dynamically
  syncDynamicPwaManifest(config);
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WhiteLabelConfig>(DEFAULT_WHITE_LABEL_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getSettings();
      setSettings(data);
      applyBrandingToDOM(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar configuración';
      setError(msg);
      // Fallback to default
      applyBrandingToDOM(DEFAULT_WHITE_LABEL_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdate = useCallback(async (partial: Partial<WhiteLabelConfig>) => {
    try {
      setError(null);
      const updated = await settingsApi.updateSettings(partial);
      setSettings(updated);
      applyBrandingToDOM(updated);
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar configuración';
      setError(msg);
      throw err;
    }
  }, []);

  const handleReset = useCallback(async () => {
    try {
      setError(null);
      const resetConfig = await settingsApi.resetSettings();
      setSettings(resetConfig);
      applyBrandingToDOM(resetConfig);
      return resetConfig;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al restablecer configuración';
      setError(msg);
      throw err;
    }
  }, []);

  const handleApplyPreset = useCallback(async (preset: WhiteLabelPreset) => {
    try {
      setError(null);
      const updated = await settingsApi.applyPreset(preset);
      setSettings(updated);
      applyBrandingToDOM(updated);
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al aplicar preset';
      setError(msg);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      updateSettings: handleUpdate,
      resetSettings: handleReset,
      applyPreset: handleApplyPreset,
      refresh: fetchSettings,
    }),
    [settings, loading, error, handleUpdate, handleReset, handleApplyPreset, fetchSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

