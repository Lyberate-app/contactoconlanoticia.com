/**
 * LYBERATE — CATEGORY & TAXONOMY TYPES
 */

export interface PublicCategory {
  category_uuid: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  articles_count?: number;
}

export interface Category {
  category_uuid: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

