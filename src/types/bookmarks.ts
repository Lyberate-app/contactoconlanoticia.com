/**
 * LYBERATE — BOOKMARKED ARTICLES & READING LIST TYPES
 */

export interface BookmarkedArticle {
  article_uuid: string;
  slug: string;
  title: string;
  subtitle?: string;
  category_name: string;
  category_slug: string;
  published_at: string;
  thumbnail_url?: string;
  author_name: string;
  saved_at: string;
}

