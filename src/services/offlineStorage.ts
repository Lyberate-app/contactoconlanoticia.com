/**
 * LYBERATE — PWA OFFLINE EDITORIAL ENGINE
 *
 * Implements high-performance structured caching using browser IndexedDB
 * for editorial articles and Cache Storage for associated media assets.
 *
 * Policy:
 * - Max 50 articles in local cache
 * - TTL: 72 hours with automatic cleanup
 * - LRU eviction with priority hierarchy: RECENT_READ > TRENDING > BREAKING > GENERAL
 */

import type { PublicArticleDetail } from './publicApi';
import type { OfflineArticleRecord, OfflinePriority, OfflineStorageStats } from '../types/offline';

const DB_NAME = 'lyberate_editorial_db';
const DB_VERSION = 1;
const STORE_NAME = 'articles';
const MAX_ARTICLES = 50;
const DEFAULT_TTL_HOURS = 72;
const RUNTIME_CACHE_NAME = 'lyberate-runtime-v1';

function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      reject(new Error('IndexedDB no está soportado en este entorno.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'article_uuid' });
        store.createIndex('by_cached_at', 'cached_at', { unique: false });
        store.createIndex('by_slug', 'slug', { unique: true });
        store.createIndex('by_expires_at', 'expires_at', { unique: false });
        store.createIndex('by_priority', 'priority', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error al abrir IndexedDB'));
  });
}

export const offlineStorage = {
  /**
   * Save an article into IndexedDB and cache its featured image.
   */
  async saveArticleOffline(
    article: PublicArticleDetail,
    priority: OfflinePriority = 'RECENT_READ'
  ): Promise<boolean> {
    if (!isIndexedDBSupported()) return false;

    try {
      const db = await openDB();
      const now = Date.now();
      const expiresAt = now + DEFAULT_TTL_HOURS * 3600 * 1000;

      const contentString = article.content || '';
      const sizeBytes = new Blob([JSON.stringify(article)]).size;

      const record: OfflineArticleRecord = {
        article_uuid: article.article_uuid,
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle,
        excerpt: article.excerpt || '',
        content: contentString,
        category_name: article.category_name,
        category_slug: article.category_slug,
        author_name: article.author_name,
        author_slug: article.author_slug,
        published_at: article.published_at,
        featured_media: article.featured_media
          ? {
              url: article.featured_media.url,
              alt_text: article.featured_media.alt_text,
              caption: article.featured_media.caption,
            }
          : undefined,
        cached_at: now,
        last_accessed_at: now,
        expires_at: expiresAt,
        priority,
        size_bytes: sizeBytes,
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Cache featured image in Cache Storage if available
      if (article.featured_media?.url && 'caches' in window) {
        try {
          const cache = await caches.open(RUNTIME_CACHE_NAME);
          await cache.add(article.featured_media.url);
        } catch {
          // Non-blocking asset cache failure
        }
      }

      // Check capacity and evict if needed
      await this.enforceCapacityLimit();

      return true;
    } catch (err) {
      console.warn('[OfflineStorage] Error saving article:', err);
      return false;
    }
  },

  /**
   * Retrieve an article by slug or UUID.
   */
  async getOfflineArticle(slugOrUuid: string): Promise<OfflineArticleRecord | null> {
    if (!isIndexedDBSupported()) return null;

    try {
      const db = await openDB();
      return new Promise<OfflineArticleRecord | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Try by primary key (UUID) first
        const pkReq = store.get(slugOrUuid);
        pkReq.onsuccess = () => {
          if (pkReq.result) {
            // Update last accessed time
            const updated: OfflineArticleRecord = {
              ...pkReq.result,
              last_accessed_at: Date.now(),
            };
            store.put(updated);
            resolve(updated);
          } else {
            // Try by slug index
            const slugIndex = store.index('by_slug');
            const slugReq = slugIndex.get(slugOrUuid);
            slugReq.onsuccess = () => {
              if (slugReq.result) {
                const updated: OfflineArticleRecord = {
                  ...slugReq.result,
                  last_accessed_at: Date.now(),
                };
                store.put(updated);
                resolve(updated);
              } else {
                resolve(null);
              }
            };
            slugReq.onerror = () => resolve(null);
          }
        };
        pkReq.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * List all stored articles sorted by cached_at descending.
   */
  async getAllOfflineArticles(): Promise<OfflineArticleRecord[]> {
    if (!isIndexedDBSupported()) return [];

    try {
      const db = await openDB();
      return new Promise<OfflineArticleRecord[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result || []) as OfflineArticleRecord[];
          list.sort((a, b) => b.cached_at - a.cached_at);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Remove a single article from offline cache.
   */
  async removeOfflineArticle(article_uuid: string): Promise<boolean> {
    if (!isIndexedDBSupported()) return false;

    try {
      const db = await openDB();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(article_uuid);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  /**
   * Alias for removeOfflineArticle.
   */
  async removeArticle(article_uuid: string): Promise<boolean> {
    return this.removeOfflineArticle(article_uuid);
  },

  /**
   * Delete articles that have exceeded their TTL.
   */
  async cleanupExpiredArticles(): Promise<number> {
    if (!isIndexedDBSupported()) return 0;

    try {
      const db = await openDB();
      const all = await this.getAllOfflineArticles();
      const now = Date.now();
      let count = 0;

      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const item of all) {
        if (now > item.expires_at) {
          store.delete(item.article_uuid);
          count++;
        }
      }

      return count;
    } catch {
      return 0;
    }
  },

  /**
   * Purge all offline articles.
   */
  async clearAll(): Promise<boolean> {
    if (!isIndexedDBSupported()) return false;

    try {
      const db = await openDB();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  /**
   * Get storage statistics (article count, size in bytes).
   */
  async getStorageStats(): Promise<OfflineStorageStats> {
    const articles = await this.getAllOfflineArticles();
    const totalBytes = articles.reduce((sum, a) => sum + (a.size_bytes || 0), 0);
    const timestamps = articles.map((a) => a.cached_at);

    return {
      total_articles: articles.length,
      max_articles: MAX_ARTICLES,
      total_size_bytes: totalBytes,
      oldest_cached_at: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newest_cached_at: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  },

  /**
   * Enforce capacity limit (max 50 articles) with priority eviction.
   */
  async enforceCapacityLimit(): Promise<void> {
    const all = await this.getAllOfflineArticles();
    if (all.length <= MAX_ARTICLES) return;

    // Sort by priority weight ascending (lower weight evicts first)
    // and then oldest last_accessed_at first (LRU)
    const priorityWeight: Record<OfflinePriority, number> = {
      GENERAL: 1,
      BREAKING: 2,
      TRENDING: 3,
      RECENT_READ: 4,
    };

    all.sort((a, b) => {
      const wA = priorityWeight[a.priority] || 1;
      const wB = priorityWeight[b.priority] || 1;
      if (wA !== wB) return wA - wB;
      return a.last_accessed_at - b.last_accessed_at;
    });

    const excessCount = all.length - MAX_ARTICLES;
    const toEvict = all.slice(0, excessCount);

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const item of toEvict) {
      store.delete(item.article_uuid);
    }
  },
};
