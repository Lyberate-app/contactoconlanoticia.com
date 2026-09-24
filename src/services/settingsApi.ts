/**
 * LYBERATE — WHITE-LABEL & SYSTEM SETTINGS API SERVICE
 *
 * Provides operations to read, update, reset, export, and import
 * the system white-label branding, PWA configuration, theme colors, and typography.
 */

import { apiClient, ApiError } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import type { WhiteLabelConfig, WhiteLabelPreset } from '../types/settings';
import { WHITE_LABEL_PRESETS } from '../config/whiteLabelDefaults';

export const settingsApi = {
  /**
   * Fetches the active white-label settings.
   */
  async getSettings(): Promise<WhiteLabelConfig> {
    if (isMockMode()) {
      return mockStorage.getSettings();
    }

    try {
      const res = await apiClient.get<WhiteLabelConfig>('/admin/settings');
      if (!res.success || !res.data) {
        throw new ApiError(res.error?.message || 'Error al obtener la configuración');
      }
      return res.data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('No se pudo cargar la configuración de marca blanca');
    }
  },

  /**
   * Updates partial or full branding settings.
   */
  async updateSettings(payload: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig> {
    if (isMockMode()) {
      return mockStorage.updateSettings(payload);
    }

    try {
      const res = await apiClient.put<WhiteLabelConfig>('/admin/settings', payload);
      if (!res.success || !res.data) {
        throw new ApiError(res.error?.message || 'Error al actualizar la configuración');
      }
      return res.data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('No se pudo guardar la configuración de marca blanca');
    }
  },

  /**
   * Resets all branding settings to the default factory configuration.
   */
  async resetSettings(): Promise<WhiteLabelConfig> {
    if (isMockMode()) {
      return mockStorage.resetSettings();
    }

    try {
      const res = await apiClient.post<WhiteLabelConfig>('/admin/settings/reset');
      if (!res.success || !res.data) {
        throw new ApiError(res.error?.message || 'Error al restablecer la configuración');
      }
      return res.data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('No se pudo restablecer la configuración');
    }
  },

  /**
   * Applies an editorial preset (Navy, Crimson, Emerald, Amber, etc.).
   */
  async applyPreset(preset: WhiteLabelPreset): Promise<WhiteLabelConfig> {
    const current = await this.getSettings();
    const merged: Partial<WhiteLabelConfig> = {
      colors: preset.config.colors ? { ...current.colors, ...preset.config.colors } : current.colors,
      typography: preset.config.typography ? { ...current.typography, ...preset.config.typography } : current.typography,
      features: preset.config.features ? { ...current.features, ...preset.config.features } : current.features,
    };
    return this.updateSettings(merged);
  },

  /**
   * Exports the current configuration as a downloadable JSON string.
   */
  exportConfigJson(config: WhiteLabelConfig): string {
    const exportData = {
      schemaVersion: 'lyberate-whitelabel-v2',
      exportedAt: new Date().toISOString(),
      config,
    };
    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Validates and parses an imported JSON file string into a valid WhiteLabelConfig.
   */
  parseImportedConfig(jsonStr: string): Partial<WhiteLabelConfig> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.config && typeof parsed.config === 'object') {
        return parsed.config as Partial<WhiteLabelConfig>;
      }
      if (parsed.identity && parsed.colors && parsed.pwa) {
        return parsed as Partial<WhiteLabelConfig>;
      }
      throw new Error('Estructura de archivo de configuración no válida.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'JSON inválido';
      throw new ApiError(`Error al procesar el archivo: ${msg}`);
    }
  },

  /**
   * Converts a user uploaded image file to a base64 Data URL (useful for logos, favicons, PWA icons).
   */
  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
      reader.readAsDataURL(file);
    });
  },

  getPresets(): WhiteLabelPreset[] {
    return WHITE_LABEL_PRESETS;
  },
};

