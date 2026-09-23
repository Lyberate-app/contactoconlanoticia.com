/**
 * Application environment configuration
 */

export const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'mock';

export const isMockMode = (): boolean => DATA_MODE === 'mock';

/**
 * Canonical base URL for production SEO, JSON-LD, sitemaps, and Open Graph.
 * Defaults to official production domain without trailing slash.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://contactoconlanoticia.com').replace(/\/+$/, '');

export const getSiteUrl = (): string => SITE_URL;
