/**
 * LYBERATE — ARTICLE & EDITORIAL TYPES
 */

import { PublicCategory } from './category';
import { PaginationMeta } from './api';

export type ArticleStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'TRASH';

export interface ArticleTag {
  tag_uuid: string;
  name: string;
  slug: string;
}

export interface Tag {
  tag_uuid: string;
  name: string;
  slug: string;
}

export interface ArticleSeo {
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_media_uuid?: string | null;
}

export interface FeaturedMedia {
  media_uuid?: string;
  url: string;
  alt_text?: string | null;
  caption?: string | null;
  credit?: string | null;
  width?: number;
  height?: number;
}

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
  featured_media?: FeaturedMedia | null;
}

export interface RelatedArticle {
  article_uuid: string;
  title: string;
  slug: string;
  published_at: string;
  category_name: string;
  category_slug: string;
  author_name: string;
  excerpt?: string | null;
  featured_media?: FeaturedMedia | null;
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
  featured_media?: FeaturedMedia | null;
  seo?: ArticleSeo | null;
  tags: ArticleTag[];
  related_articles: RelatedArticle[];
}

export interface ArticleSummary {
  article_uuid: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string;
  status: ArticleStatus;
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
  featured_media?: FeaturedMedia | null;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  seo?: ArticleSeo | null;
  tags?: ArticleTag[];
  featured_media?: FeaturedMedia | null;
}

export interface CreateArticlePayload {
  title: string;
  slug?: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content?: string;
  category_uuid?: string;
  author_uuid?: string;
  status?: ArticleStatus;
  published_at?: string | null;
  featured_media_uuid?: string | null;
  tags?: string[];
  seo?: ArticleSeo;
}

export type UpdateArticlePayload = Partial<CreateArticlePayload>;

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

export interface ArticlesListResponse {
  articles: ArticleSummary[];
  pagination: PaginationMeta;
}

export interface PublicArticlesResponse {
  articles: PublicArticleSummary[];
  pagination: PaginationMeta;
}

export interface DashboardStats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  pending_review_articles: number;
  scheduled_articles: number;
  archived_articles: number;
  trash_articles: number;
  total_media: number;
  total_ads: number;
  pending_submissions: number;
}
