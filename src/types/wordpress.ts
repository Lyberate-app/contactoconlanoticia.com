/**
 * LYBERATE — WORDPRESS HISTORIC CONNECTOR CONTRACTS
 *
 * Decoupled read-only integration contracts for querying the legacy WordPress
 * archive without mass migration.
 */

export interface WordPressHistoricArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  modified?: string;
  author_name: string;
  categories: string[];
  tags: string[];
  featured_image_url?: string | null;
  canonical_url: string;
  original_url?: string;
  is_external_archive: true;
  archive_source: 'wordpress_legacy';
}

export interface WordPressHistoricQuery {
  search?: string;
  page?: number;
  per_page?: number;
  categories?: number[] | string[];
  tags?: number[] | string[];
  before?: string;
  after?: string;
}

export type WordPressConnectorStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'READY_FOR_BACKEND';

export interface WordPressConnectorState {
  status: WordPressConnectorStatus;
  lastChecked: string;
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
  endpointUrl: string;
  timeoutMs: number;
}

export interface WordPressHistoricResponse {
  articles: WordPressHistoricArticle[];
  total: number;
  totalPages: number;
  page: number;
  sourceStatus: WordPressConnectorStatus;
  status: WordPressConnectorStatus;
  fromCache: boolean;
}

