/**
 * Public News Portal API Client
 * Connects to /api/v1/public/* endpoints
 */

export interface PublicArticleSummary {
  article_uuid: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  slug: string;
  published_at: string;
  modified_at?: string | null;
  category_name: string;
  category_slug: string;
  author_name: string;
  author_slug: string;
}

export interface PublicArticleDetail {
  article_uuid: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content: string;
  slug: string;
  published_at: string;
  modified_at?: string | null;
  category_name: string;
  category_slug: string;
  author_name: string;
  author_slug: string;
  author_bio?: string | null;
  featured_media?: {
    media_uuid?: string;
    url: string;
    alt_text?: string | null;
    caption?: string | null;
    credit?: string | null;
    width?: number;
    height?: number;
  } | null;
  seo?: {
    meta_title?: string | null;
    meta_description?: string | null;
    canonical_url?: string | null;
    og_title?: string | null;
    og_description?: string | null;
  } | null;
  tags: Array<{
    tag_uuid: string;
    name: string;
    slug: string;
  }>;
  related_articles: Array<{
    article_uuid: string;
    title: string;
    slug: string;
    published_at: string;
    category_name: string;
    category_slug: string;
    author_name: string;
  }>;
}

export interface PublicCategory {
  category_uuid: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  articles_count?: number;
}

export interface PublicAuthor {
  author_uuid: string;
  name: string;
  slug: string;
  bio?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface HomeFeedData {
  breaking_news: PublicArticleSummary[];
  lead_article: PublicArticleSummary | null;
  secondary_articles: PublicArticleSummary[];
  latest_articles: PublicArticleSummary[];
  trending_articles: PublicArticleSummary[];
  sections: Record<string, {
    category: PublicCategory;
    articles: PublicArticleSummary[];
  }>;
}

export interface SearchParams {
  q?: string;
  category?: string;
  author?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  sort?: 'relevance' | 'latest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface SearchFilterCategory {
  category_uuid: string;
  name: string;
  slug: string;
  articles_count: number;
}

export interface SearchFilterAuthor {
  author_uuid: string;
  name: string;
  slug: string;
  articles_count: number;
}

export interface SearchFilterTag {
  tag_uuid: string;
  name: string;
  slug: string;
  articles_count: number;
}

export interface SearchFilterOptions {
  categories: SearchFilterCategory[];
  authors: SearchFilterAuthor[];
  tags: SearchFilterTag[];
}

const API_BASE = '/api/v1/public';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    const errorMsg = json?.error?.message || `Error ${res.status}: ${res.statusText}`;
    const err = new Error(errorMsg);
    (err as unknown as { code?: string; status?: number }).code = json?.error?.code;
    (err as unknown as { status?: number }).status = res.status;
    throw err;
  }

  return json.data;
}

export const publicApi = {
  getHomeFeed: (): Promise<HomeFeedData> => {
    return fetchJson<HomeFeedData>(`${API_BASE}/home`);
  },

  getArticles: (params?: { category?: string; author?: string; tag?: string; page?: number; limit?: number }): Promise<{ articles: PublicArticleSummary[]; pagination: PaginationMeta }> => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.author) query.set('author', params.author);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const url = qs ? `${API_BASE}/articles?${qs}` : `${API_BASE}/articles`;

    return fetch(`${url}`, { headers: { 'Accept': 'application/json' } })
      .then(res => res.json())
      .then(json => {
        if (!json.success) throw new Error(json?.error?.message || 'Error al cargar artículos');
        return { articles: json.data, pagination: json.meta.pagination };
      });
  },

  getArticleBySlug: (slug: string): Promise<PublicArticleDetail> => {
    return fetchJson<PublicArticleDetail>(`${API_BASE}/articles/${encodeURIComponent(slug)}`);
  },

  getCategories: (): Promise<PublicCategory[]> => {
    return fetchJson<PublicCategory[]>(`${API_BASE}/categories`);
  },

  getCategoryBySlug: (slug: string, page = 1, limit = 12): Promise<{ category: PublicCategory; articles: PublicArticleSummary[]; pagination: PaginationMeta }> => {
    return fetch(`${API_BASE}/categories/${encodeURIComponent(slug)}?page=${page}&limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          const err = new Error(json?.error?.message || 'Categoría no encontrada');
          (err as unknown as { code?: string }).code = json?.error?.code;
          throw err;
        }
        return {
          category: json.meta.category,
          articles: json.data,
          pagination: json.meta.pagination,
        };
      });
  },

  getAuthorBySlug: (slug: string, page = 1, limit = 12): Promise<{ author: PublicAuthor; articles: PublicArticleSummary[]; pagination: PaginationMeta }> => {
    return fetch(`${API_BASE}/authors/${encodeURIComponent(slug)}?page=${page}&limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          const err = new Error(json?.error?.message || 'Autor no encontrado');
          (err as unknown as { code?: string }).code = json?.error?.code;
          throw err;
        }
        return {
          author: json.meta.author,
          articles: json.data,
          pagination: json.meta.pagination,
        };
      });
  },

  searchArticles: (
    queryOrParams: string | SearchParams,
    page = 1,
    limit = 12
  ): Promise<{
    query: string;
    articles: PublicArticleSummary[];
    pagination: PaginationMeta;
    filters_applied?: Record<string, string>;
  }> => {
    let url = `${API_BASE}/search?`;
    if (typeof queryOrParams === 'string') {
      url += `q=${encodeURIComponent(queryOrParams)}&page=${page}&limit=${limit}`;
    } else {
      const sp = new URLSearchParams();
      if (queryOrParams.q) sp.append('q', queryOrParams.q);
      if (queryOrParams.category) sp.append('category', queryOrParams.category);
      if (queryOrParams.author) sp.append('author', queryOrParams.author);
      if (queryOrParams.tag) sp.append('tag', queryOrParams.tag);
      if (queryOrParams.date_from) sp.append('date_from', queryOrParams.date_from);
      if (queryOrParams.date_to) sp.append('date_to', queryOrParams.date_to);
      if (queryOrParams.sort) sp.append('sort', queryOrParams.sort);
      sp.append('page', String(queryOrParams.page || page));
      sp.append('limit', String(queryOrParams.limit || limit));
      url += sp.toString();
    }

    return fetch(url, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) throw new Error(json?.error?.message || 'Error en la búsqueda');
        return {
          query: json.meta?.filters_applied?.q || (typeof queryOrParams === 'string' ? queryOrParams : queryOrParams.q || ''),
          articles: json.data,
          pagination: json.meta.pagination,
          filters_applied: json.meta?.filters_applied,
        };
      });
  },

  getSearchFilters: (): Promise<SearchFilterOptions> => {
    return fetchJson<SearchFilterOptions>(`${API_BASE}/search/filters`);
  },
};

