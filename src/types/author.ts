/**
 * LYBERATE — AUTHOR & BYLINE TYPES
 */

export interface PublicAuthor {
  author_uuid: string;
  name: string;
  slug: string;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface Author {
  author_uuid: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url?: string | null;
}

