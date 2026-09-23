/**
 * Public News Portal API Client
 * Connects to /api/v1/public/* endpoints
 * Supports mock development mode when VITE_DATA_MODE=mock.
 */

import { apiClient, ApiError } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import type {
  PublicArticleSummary,
  PublicArticleDetail,
  HomeFeedData,
  SearchParams,
  SearchFilterCategory,
  SearchFilterAuthor,
  SearchFilterTag,
  SearchFilterOptions,
} from '../types/article';
import type { PublicCategory } from '../types/category';
import type { PublicAuthor } from '../types/author';
import type { PaginationMeta } from '../types/api';

export type {
  PublicArticleSummary,
  PublicArticleDetail,
  PublicCategory,
  PublicAuthor,
  PaginationMeta,
  HomeFeedData,
  SearchParams,
  SearchFilterCategory,
  SearchFilterAuthor,
  SearchFilterTag,
  SearchFilterOptions,
};

function toSummary(art: import('../types/article').ArticleDetail): PublicArticleSummary {
  return {
    article_uuid: art.article_uuid,
    title: art.title,
    subtitle: art.subtitle,
    excerpt: art.excerpt,
    slug: art.slug,
    published_at: art.published_at || art.created_at,
    modified_at: art.modified_at,
    category_name: art.category_name,
    category_slug: art.category_slug,
    author_name: art.author_name,
    author_slug: art.author_slug,
    featured_media: art.featured_media || null,
  };
}

export const publicApi = {
  getHomeFeed: async (): Promise<HomeFeedData> => {
    if (isMockMode()) {
      const all = mockStorage.getArticles().filter((a) => a.status === 'PUBLISHED');
      const summaries = all.map(toSummary);

      const lead = summaries[0] || null;
      const secondary = summaries.slice(1, 3);
      const latest = summaries.slice(0, 6);
      const trending = [...summaries].reverse().slice(0, 4);
      const breaking = summaries.slice(0, 2);

      const categories = mockStorage.getCategories();
      const sections: Record<string, { category: PublicCategory; articles: PublicArticleSummary[] }> = {};

      for (const cat of categories) {
        const catArticles = summaries.filter((a) => a.category_slug === cat.slug);
        if (catArticles.length > 0) {
          sections[cat.slug] = {
            category: cat,
            articles: catArticles,
          };
        }
      }

      return {
        breaking_news: breaking,
        lead_article: lead,
        secondary_articles: secondary,
        latest_articles: latest,
        trending_articles: trending,
        sections,
      };
    }

    return apiClient.getData<HomeFeedData>('/public/home');
  },

  getArticles: async (params?: {
    category?: string;
    author?: string;
    tag?: string;
    page?: number;
    limit?: number;
  }): Promise<{ articles: PublicArticleSummary[]; pagination: PaginationMeta }> => {
    if (isMockMode()) {
      let list = mockStorage.getArticles().filter((a) => a.status === 'PUBLISHED');

      if (params?.category) {
        list = list.filter((a) => a.category_slug === params.category || a.category_uuid === params.category);
      }
      if (params?.author) {
        list = list.filter((a) => a.author_slug === params.author || a.author_uuid === params.author);
      }
      if (params?.tag) {
        list = list.filter((a) => a.tags?.some((t) => t.slug === params.tag || t.name === params.tag));
      }

      const page = Math.max(1, params?.page || 1);
      const limit = Math.max(1, params?.limit || 12);
      const total = list.length;
      const total_pages = Math.ceil(total / limit) || 1;
      const offset = (page - 1) * limit;
      const paginated = list.slice(offset, offset + limit).map(toSummary);

      return {
        articles: paginated,
        pagination: { total, page, limit, total_pages },
      };
    }

    const res = await apiClient.get<PublicArticleSummary[]>('/public/articles', {
      params: params as Record<string, string | number | undefined>,
    });
    return {
      articles: res.data || [],
      pagination: (res.meta?.pagination as PaginationMeta) || { total: 0, page: 1, limit: 12, total_pages: 0 },
    };
  },

  getArticleBySlug: async (slug: string): Promise<PublicArticleDetail> => {
    if (isMockMode()) {
      const art = mockStorage.getArticleBySlug(slug);
      if (!art || art.status !== 'PUBLISHED') {
        throw new ApiError('Noticia no encontrada', 'NOT_FOUND', 404);
      }

      const all = mockStorage.getArticles().filter((a) => a.status === 'PUBLISHED' && a.article_uuid !== art.article_uuid);
      const related = all.slice(0, 3).map((r) => ({
        article_uuid: r.article_uuid,
        title: r.title,
        slug: r.slug,
        published_at: r.published_at || r.created_at,
        category_name: r.category_name,
        category_slug: r.category_slug,
        author_name: r.author_name,
        excerpt: r.excerpt,
        featured_media: r.featured_media || null,
      }));

      return {
        article_uuid: art.article_uuid,
        title: art.title,
        subtitle: art.subtitle,
        excerpt: art.excerpt,
        content: art.content,
        slug: art.slug,
        published_at: art.published_at || art.created_at,
        modified_at: art.modified_at,
        category_name: art.category_name,
        category_slug: art.category_slug,
        author_name: art.author_name,
        author_slug: art.author_slug,
        author_bio: mockStorage.getAuthor().bio,
        featured_media: art.featured_media || null,
        seo: art.seo,
        tags: art.tags || [],
        related_articles: related,
      };
    }

    return apiClient.getData<PublicArticleDetail>(`/public/articles/${encodeURIComponent(slug)}`);
  },

  getCategories: async (): Promise<PublicCategory[]> => {
    if (isMockMode()) {
      return mockStorage.getCategories();
    }

    return apiClient.getData<PublicCategory[]>('/public/categories');
  },

  getCategoryBySlug: async (
    slug: string,
    page = 1,
    limit = 12
  ): Promise<{ category: PublicCategory; articles: PublicArticleSummary[]; pagination: PaginationMeta }> => {
    if (isMockMode()) {
      const categories = mockStorage.getCategories();
      const category = categories.find((c) => c.slug === slug);
      if (!category) {
        throw new ApiError('Categoría no encontrada', 'NOT_FOUND', 404);
      }

      const all = mockStorage
        .getArticles()
        .filter((a) => a.status === 'PUBLISHED' && (a.category_slug === slug || a.category_uuid === category.category_uuid))
        .map(toSummary);

      const total = all.length;
      const total_pages = Math.ceil(total / limit) || 1;
      const offset = (page - 1) * limit;
      const articles = all.slice(offset, offset + limit);

      return {
        category,
        articles,
        pagination: { total, page, limit, total_pages },
      };
    }

    const res = await apiClient.get<PublicArticleSummary[]>(`/public/categories/${encodeURIComponent(slug)}`, {
      params: { page, limit },
    });
    return {
      category: res.meta?.category as PublicCategory,
      articles: res.data || [],
      pagination: (res.meta?.pagination as PaginationMeta) || { total: 0, page, limit, total_pages: 0 },
    };
  },

  getAuthorBySlug: async (
    slug: string,
    page = 1,
    limit = 12
  ): Promise<{ author: PublicAuthor; articles: PublicArticleSummary[]; pagination: PaginationMeta }> => {
    if (isMockMode()) {
      const author = mockStorage.getAuthor();
      if (author.slug !== slug) {
        throw new ApiError('Autor no encontrado', 'NOT_FOUND', 404);
      }

      const all = mockStorage
        .getArticles()
        .filter((a) => a.status === 'PUBLISHED' && a.author_slug === slug)
        .map(toSummary);

      const total = all.length;
      const total_pages = Math.ceil(total / limit) || 1;
      const offset = (page - 1) * limit;
      const articles = all.slice(offset, offset + limit);

      return {
        author,
        articles,
        pagination: { total, page, limit, total_pages },
      };
    }

    const res = await apiClient.get<PublicArticleSummary[]>(`/public/authors/${encodeURIComponent(slug)}`, {
      params: { page, limit },
    });
    return {
      author: res.meta?.author as PublicAuthor,
      articles: res.data || [],
      pagination: (res.meta?.pagination as PaginationMeta) || { total: 0, page, limit, total_pages: 0 },
    };
  },

  searchArticles: async (
    queryOrParams: string | SearchParams,
    page = 1,
    limit = 12
  ): Promise<{
    query: string;
    articles: PublicArticleSummary[];
    pagination: PaginationMeta;
    filters_applied?: Record<string, string>;
  }> => {
    if (isMockMode()) {
      const q = (typeof queryOrParams === 'string' ? queryOrParams : queryOrParams.q || '').toLowerCase();
      const cat = typeof queryOrParams === 'object' ? queryOrParams.category : undefined;
      const p = typeof queryOrParams === 'object' ? queryOrParams.page || page : page;
      const l = typeof queryOrParams === 'object' ? queryOrParams.limit || limit : limit;

      let list = mockStorage.getArticles().filter((a) => a.status === 'PUBLISHED');
      if (q) {
        list = list.filter((a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      }
      if (cat) {
        list = list.filter((a) => a.category_slug === cat || a.category_uuid === cat);
      }

      const total = list.length;
      const total_pages = Math.ceil(total / l) || 1;
      const offset = (p - 1) * l;
      const articles = list.slice(offset, offset + l).map(toSummary);

      return {
        query: q,
        articles,
        pagination: { total, page: p, limit: l, total_pages },
        filters_applied: q ? { q } : undefined,
      };
    }

    const params: Record<string, string | number | undefined> =
      typeof queryOrParams === 'string'
        ? { q: queryOrParams, page, limit }
        : {
            q: queryOrParams.q,
            category: queryOrParams.category,
            author: queryOrParams.author,
            tag: queryOrParams.tag,
            date_from: queryOrParams.date_from,
            date_to: queryOrParams.date_to,
            sort: queryOrParams.sort,
            page: queryOrParams.page || page,
            limit: queryOrParams.limit || limit,
          };

    const res = await apiClient.get<PublicArticleSummary[]>('/public/search', { params });
    const meta = res.meta as { pagination?: PaginationMeta; filters_applied?: Record<string, string> } | undefined;
    const qStr = typeof queryOrParams === 'string' ? queryOrParams : queryOrParams.q || '';

    return {
      query: meta?.filters_applied?.q || qStr,
      articles: res.data || [],
      pagination: meta?.pagination || { total: 0, page: 1, limit, total_pages: 0 },
      filters_applied: meta?.filters_applied,
    };
  },

  getSearchFilters: async (): Promise<SearchFilterOptions> => {
    if (isMockMode()) {
      const categories = mockStorage.getCategories().map((c) => ({
        category_uuid: c.category_uuid,
        name: c.name,
        slug: c.slug,
        articles_count: c.articles_count || 1,
      }));
      const author = mockStorage.getAuthor();
      const tags = mockStorage.getTags().map((t) => ({
        tag_uuid: t.tag_uuid,
        name: t.name,
        slug: t.slug,
        articles_count: 1,
      }));

      return {
        categories,
        authors: [{ author_uuid: author.author_uuid, name: author.name, slug: author.slug, articles_count: 3 }],
        tags,
      };
    }

    return apiClient.getData<SearchFilterOptions>('/public/search/filters');
  },
};
