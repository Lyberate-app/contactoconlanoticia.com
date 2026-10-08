/**
 * LYBERATE — EDITORIAL CMS CLIENT SERVICE
 *
 * Handles articles, categories, authors, and taxonomy for the newsroom CMS.
 * Supports mock development mode when VITE_DATA_MODE=mock.
 */

import { apiClient, ApiError } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import type {
  ArticleSummary,
  ArticleDetail,
  ArticleStatus,
  ArticleTag,
  Tag,
  CreateArticlePayload,
  UpdateArticlePayload,
  DashboardStats,
} from '../types/article';
import type { Category } from '../types/category';
import type { Author } from '../types/author';
import type { PaginationMeta } from '../types/api';
import type { ArticleVersionSnapshot } from '../types/version';
import type { CalendarItem } from '../types/calendar';
import type { AuditEntry, AuditFilterParams } from '../types/audit';
import type { JournalistProfile } from '../types/user';
import type { EditorialNotification } from '../types/notification';

export type {
  ArticleSummary,
  ArticleDetail,
  ArticleStatus,
  ArticleTag,
  Tag,
  Category,
  Author,
  CreateArticlePayload,
  UpdateArticlePayload,
  DashboardStats,
  ArticleVersionSnapshot,
  CalendarItem,
  AuditEntry,
  AuditFilterParams,
  JournalistProfile,
  EditorialNotification,
};

export const editorialService = {
  async getArticles(params: Record<string, string> = {}): Promise<{
    articles: ArticleSummary[];
    pagination: PaginationMeta;
  }> {
    if (isMockMode()) {
      let list = mockStorage.getArticles().sort((a, b) => {
        const dateA = new Date(a.updated_at || a.modified_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.modified_at || b.created_at).getTime();
        return dateB - dateA;
      });

      if (params.status) {
        list = list.filter((a) => a.status === params.status);
      } else if (params.include_trash !== 'true') {
        list = list.filter((a) => a.status !== 'TRASH');
      }

      if (params.category_uuid) {
        list = list.filter((a) => a.category_uuid === params.category_uuid);
      }

      if (params.author_uuid) {
        list = list.filter((a) => a.author_uuid === params.author_uuid);
      }

      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter((a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      }

      const page = Math.max(1, parseInt(params.page || '1', 10));
      const limit = Math.max(1, parseInt(params.limit || '15', 10));
      const total = list.length;
      const total_pages = Math.ceil(total / limit) || 1;
      const offset = (page - 1) * limit;
      const paginated = list.slice(offset, offset + limit);

      return {
        articles: paginated,
        pagination: { total, page, limit, total_pages },
      };
    }

    const res = await apiClient.get<{ articles: ArticleSummary[]; pagination: PaginationMeta }>('/admin/articles', {
      params,
    });
    return res.data || { articles: [], pagination: { total: 0, page: 1, limit: 20, total_pages: 0 } };
  },

  async getArticle(uuid: string): Promise<ArticleDetail | null> {
    if (isMockMode()) {
      return mockStorage.getArticleByUuid(uuid);
    }

    try {
      const res = await apiClient.get<{ article: ArticleDetail }>(`/admin/articles/${encodeURIComponent(uuid)}`);
      return res.data?.article || null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async createArticle(data: CreateArticlePayload): Promise<{
    success: boolean;
    data?: { article: ArticleDetail };
    error?: { code: string; message: string };
  }> {
    if (isMockMode()) {
      const article = mockStorage.saveArticle(data);
      return { success: true, data: { article } };
    }

    try {
      const res = await apiClient.post<{ article: ArticleDetail }>('/admin/articles', data);
      return { success: true, data: res.data };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: { code: err.code, message: err.message } };
      }
      throw err;
    }
  },

  async updateArticle(
    uuid: string,
    data: UpdateArticlePayload
  ): Promise<{
    success: boolean;
    data?: { article: ArticleDetail };
    error?: { code: string; message: string };
  }> {
    if (isMockMode()) {
      const article = mockStorage.updateArticle(uuid, data);
      if (!article) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Artículo no encontrado.' } };
      }
      return { success: true, data: { article } };
    }

    try {
      const res = await apiClient.put<{ article: ArticleDetail }>(`/admin/articles/${encodeURIComponent(uuid)}`, data);
      return { success: true, data: res.data };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: { code: err.code, message: err.message } };
      }
      throw err;
    }
  },

  async deleteArticle(uuid: string, permanent: boolean = false): Promise<void> {
    if (isMockMode()) {
      mockStorage.deleteArticle(uuid, permanent);
      return;
    }

    await apiClient.delete(`/admin/articles/${encodeURIComponent(uuid)}`, {
      params: { permanent: String(permanent) },
    });
  },

  async restoreArticle(uuid: string): Promise<ArticleDetail | null> {
    if (isMockMode()) {
      return mockStorage.restoreArticle(uuid);
    }

    try {
      const res = await apiClient.post<{ article: ArticleDetail }>(`/admin/articles/${encodeURIComponent(uuid)}/restore`);
      return res.data?.article || null;
    } catch {
      return null;
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (isMockMode()) {
      return mockStorage.getDashboardStats();
    }

    const res = await apiClient.get<{ stats: DashboardStats }>('/admin/dashboard/stats');
    return res.data?.stats || {
      total_articles: 0,
      published_articles: 0,
      draft_articles: 0,
      pending_review_articles: 0,
      scheduled_articles: 0,
      archived_articles: 0,
      trash_articles: 0,
      total_media: 0,
      total_ads: 0,
      pending_submissions: 0,
    };
  },

  async getCategories(): Promise<Category[]> {
    if (isMockMode()) {
      return mockStorage.getCategories().map((c) => ({
        category_uuid: c.category_uuid,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        sort_order: c.sort_order,
      }));
    }

    const res = await apiClient.get<{ categories: Category[] }>('/admin/categories');
    return res.data?.categories || [];
  },

  async getAuthors(): Promise<Author[]> {
    if (isMockMode()) {
      const defaultAuthor = mockStorage.getAuthor();
      return mockStorage.getJournalistProfiles().map((profile) => ({
        author_uuid: profile.name === defaultAuthor.name ? defaultAuthor.author_uuid : profile.author_uuid,
        name: profile.name,
        slug: profile.slug,
        bio: profile.bio ?? null,
      }));
    }

    const res = await apiClient.get<{ authors: Author[] }>('/admin/authors');
    return res.data?.authors || [];
  },

  async getTags(): Promise<Tag[]> {
    if (isMockMode()) {
      return mockStorage.getTags();
    }

    const res = await apiClient.get<{ tags: Tag[] }>('/admin/tags');
    return res.data?.tags || [];
  },

  async getArticleVersions(uuid: string): Promise<ArticleVersionSnapshot[]> {
    if (isMockMode()) {
      return mockStorage.getArticleVersions(uuid);
    }
    const res = await apiClient.get<{ versions: ArticleVersionSnapshot[] }>(
      `/admin/articles/${encodeURIComponent(uuid)}/versions`
    );
    return res.data?.versions || [];
  },

  async saveArticleVersion(snapshot: ArticleVersionSnapshot): Promise<void> {
    if (isMockMode()) {
      mockStorage.saveArticleVersion(snapshot);
      return;
    }
    await apiClient.post(
      `/admin/articles/${encodeURIComponent(snapshot.article_uuid)}/versions`,
      snapshot
    );
  },

  async returnArticleForCorrection(uuid: string, note: string): Promise<ArticleDetail> {
    if (isMockMode()) {
      const art = mockStorage.updateArticle(uuid, {
        status: 'DRAFT',
        editorial_note: note,
      } as any);
      if (!art) throw new Error('Artículo no encontrado.');
      mockStorage.logAudit({
        user_uuid: 'current_user',
        user_name: 'Editor de Guardia',
        user_email: 'editor@contactoconlanoticia.com',
        action: 'ARTICLE_RETURN_REVISION',
        module: 'ARTICLES',
        entity_id: uuid,
        entity_name: art.title,
        description: `Devolvió noticia a corrección con nota: "${note}"`,
        ip_address: '127.0.0.1',
      });
      mockStorage.addNotification({
        type: 'ARTICLE_RETURNED',
        title: 'Artículo devuelto para corrección',
        message: `"${art.title}" requiere cambios: ${note}`,
        link: `/admin/articles/edit/${uuid}`,
        severity: 'warning',
      });
      return art;
    }
    const res = await apiClient.post<{ article: ArticleDetail }>(
      `/admin/articles/${encodeURIComponent(uuid)}/return`,
      { note }
    );
    if (!res.data?.article) throw new Error('Error al devolver el artículo.');
    return res.data.article;
  },

  async approveAndPublishArticle(uuid: string): Promise<ArticleDetail> {
    if (isMockMode()) {
      const art = mockStorage.updateArticle(uuid, {
        status: 'PUBLISHED',
        published_at: new Date().toISOString(),
      });
      if (!art) throw new Error('Artículo no encontrado.');
      mockStorage.logAudit({
        user_uuid: 'current_user',
        user_name: 'Editor en Jefe',
        user_email: 'editor@contactoconlanoticia.com',
        action: 'ARTICLE_PUBLISH',
        module: 'ARTICLES',
        entity_id: uuid,
        entity_name: art.title,
        description: `Aprobó y publicó la noticia.`,
        ip_address: '127.0.0.1',
      });
      mockStorage.addNotification({
        type: 'ARTICLE_APPROVED',
        title: 'Artículo aprobado y publicado',
        message: `"${art.title}" ha sido publicado en portada.`,
        link: `/noticia/${art.slug}`,
        severity: 'success',
      });
      return art;
    }
    const res = await apiClient.post<{ article: ArticleDetail }>(
      `/admin/articles/${encodeURIComponent(uuid)}/approve`
    );
    if (!res.data?.article) throw new Error('Error al publicar el artículo.');
    return res.data.article;
  },

  async getCalendarItems(): Promise<CalendarItem[]> {
    if (isMockMode()) {
      return mockStorage.getCalendarItems();
    }
    const res = await apiClient.get<{ items: CalendarItem[] }>('/admin/calendar');
    return res.data?.items || [];
  },

  async getAuditLogs(params: AuditFilterParams = {}): Promise<{
    entries: AuditEntry[];
    total: number;
    page: number;
    total_pages: number;
  }> {
    if (isMockMode()) {
      return mockStorage.getAuditLogs(params);
    }
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.user_uuid) query.set('user_uuid', params.user_uuid);
    if (params.module) query.set('module', params.module);
    if (params.action) query.set('action', params.action);
    if (params.search) query.set('search', params.search);
    const res = await apiClient.get<{
      entries: AuditEntry[];
      total: number;
      page: number;
      total_pages: number;
    }>(`/admin/audit?${query.toString()}`);
    return res.data || { entries: [], total: 0, page: 1, total_pages: 1 };
  },

  async logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    if (isMockMode()) {
      mockStorage.logAudit(entry);
      return;
    }
    await apiClient.post('/admin/audit', entry);
  },

  async getJournalistProfiles(): Promise<JournalistProfile[]> {
    if (isMockMode()) {
      return mockStorage.getJournalistProfiles();
    }
    const res = await apiClient.get<{ profiles: JournalistProfile[] }>('/admin/journalists');
    return res.data?.profiles || [];
  },

  async getNotifications(): Promise<EditorialNotification[]> {
    if (isMockMode()) {
      return mockStorage.getNotifications();
    }
    const res = await apiClient.get<{ notifications: EditorialNotification[] }>(
      '/admin/notifications'
    );
    return res.data?.notifications || [];
  },

  async markNotificationRead(id: string): Promise<void> {
    if (isMockMode()) {
      mockStorage.markNotificationRead(id);
      return;
    }
    await apiClient.post(`/admin/notifications/${encodeURIComponent(id)}/read`);
  },
};
