/**
 * LYBERATE — READING LIST & BOOKMARKS SERVICE
 * Persists saved articles to localStorage with reactive cross-component custom events.
 */

import type { BookmarkedArticle } from '../types/bookmarks';

const BOOKMARKS_STORAGE_KEY = 'lyberate_reader_bookmarks';
export const BOOKMARKS_CHANGED_EVENT = 'lyberate_bookmarks_changed';

export const bookmarksService = {
  getBookmarks(): BookmarkedArticle[] {
    try {
      const data = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isBookmarked(articleUuid: string): boolean {
    const list = this.getBookmarks();
    return list.some((b) => b.article_uuid === articleUuid);
  },

  toggleBookmark(article: BookmarkedArticle): boolean {
    const list = this.getBookmarks();
    const index = list.findIndex((b) => b.article_uuid === article.article_uuid);
    let nextSavedState: boolean;

    if (index >= 0) {
      list.splice(index, 1);
      nextSavedState = false;
    } else {
      list.unshift(article);
      nextSavedState = true;
    }

    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { count: list.length } }));
    } catch {
      // storage quota or unavailable
    }

    return nextSavedState;
  },

  removeBookmark(articleUuid: string): void {
    const list = this.getBookmarks().filter((b) => b.article_uuid !== articleUuid);
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { count: list.length } }));
    } catch {
      // ignore
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { count: 0 } }));
    } catch {
      // ignore
    }
  },

  onBookmarksChange(callback: (count: number) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      callback(customEvent.detail?.count ?? this.getBookmarks().length);
    };
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener(BOOKMARKS_CHANGED_EVENT, handler);
    };
  },
};
