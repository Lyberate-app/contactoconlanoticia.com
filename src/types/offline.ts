/**
 * LYBERATE — PWA OFFLINE ENGINE TYPES
 */

export type OfflinePriority = 'RECENT_READ' | 'TRENDING' | 'BREAKING' | 'GENERAL';

export interface OfflineArticleRecord {
  article_uuid: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  content: string;
  category_name: string;
  category_slug: string;
  author_name: string;
  author_slug: string;
  published_at: string;
  featured_media?: {
    url: string;
    alt_text?: string | null;
    caption?: string | null;
  };
  cached_at: number;
  last_accessed_at: number;
  expires_at: number;
  priority: OfflinePriority;
  size_bytes: number;
}

export interface OfflineStorageStats {
  total_articles: number;
  max_articles: number;
  total_size_bytes: number;
  oldest_cached_at: number | null;
  newest_cached_at: number | null;
}

