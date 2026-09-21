/**
 * LYBERATE — EDITORIAL CMS CLIENT SERVICE
 *
 * Handles articles, categories, authors, and taxonomy for the newsroom CMS.
 */

export interface ArticleSummary {
  article_uuid: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED' | 'TRASH';
  published_at: string | null;
  modified_at: string | null;
  created_at: string;
  updated_at: string;
  author_uuid: string;
  author_name: string;
  author_slug: string;
  category_uuid: string;
  category_name: string;
  category_slug: string;
  featured_media_uuid: string | null;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  seo?: {
    meta_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image_media_uuid: string | null;
  } | null;
  tags?: Array<{
    tag_uuid: string;
    name: string;
    slug: string;
  }>;
}

export interface Category {
  category_uuid: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface Author {
  author_uuid: string;
  name: string;
  slug: string;
  bio: string | null;
}

export interface Tag {
  tag_uuid: string;
  name: string;
  slug: string;
}

const API_BASE = '/api/v1/admin';

export const editorialService = {
  async getArticles(params: Record<string, string> = {}): Promise<{
    articles: ArticleSummary[];
    pagination: { total: number; page: number; limit: number; total_pages: number };
  }> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/articles${qs ? '?' + qs : ''}`, {
      method: 'GET',
      credentials: 'include',
    });
    const json = await res.json();
    return json.data || { articles: [], pagination: { total: 0, page: 1, limit: 20, total_pages: 0 } };
  },

  async getArticle(uuid: string): Promise<ArticleDetail | null> {
    const res = await fetch(`${API_BASE}/articles/${uuid}`, {
      method: 'GET',
      credentials: 'include',
    });
    const json = await res.json();
    return json.data?.article || null;
  },

  async createArticle(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateArticle(uuid: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/articles/${uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteArticle(uuid: string, permanent: boolean = false): Promise<any> {
    const res = await fetch(`${API_BASE}/articles/${uuid}?permanent=${permanent}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'GET',
      credentials: 'include',
    });
    const json = await res.json();
    return json.data?.categories || [];
  },

  async getAuthors(): Promise<Author[]> {
    const res = await fetch(`${API_BASE}/authors`, {
      method: 'GET',
      credentials: 'include',
    });
    const json = await res.json();
    return json.data?.authors || [];
  },

  async getTags(): Promise<Tag[]> {
    const res = await fetch(`${API_BASE}/tags`, {
      method: 'GET',
      credentials: 'include',
    });
    const json = await res.json();
    return json.data?.tags || [];
  },
};

