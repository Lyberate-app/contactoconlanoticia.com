/**
 * Application environment configuration
 * Defaults strictly to local mock storage mode (standalone frontend)
 */

export const DATA_MODE = (import.meta.env.VITE_DATA_MODE || 'mock').toLowerCase();

/**
 * Returns true if running standalone with localStorage mock data.
 * Safe default: runs in mock mode unless explicitly set to 'api'.
 */
export const isMockMode = (): boolean => DATA_MODE !== 'api';

/**
 * Canonical base URL for production SEO, JSON-LD, sitemaps, and Open Graph.
 * Defaults to official production domain without trailing slash.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://contactoconlanoticia.com').replace(/\/+$/, '');

export const getSiteUrl = (): string => SITE_URL;
