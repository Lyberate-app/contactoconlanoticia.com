/**
 * LYBERATE — MEDIA LIBRARY & UPLOAD TYPES
 *
 * Implements the contract defined in docs/API.md (Fase 7).
 */

export interface MediaVariant {
  variant_name: string; // 'thumbnail' | 'medium' | 'large' | 'original'
  format: string; // 'webp' | 'avif' | 'jpeg' | 'png'
  url: string;
  width: number;
  height: number;
  filesize_bytes?: number;
}

export interface MediaItem {
  media_uuid: string;
  tenant_uuid?: string;
  site_uuid?: string;
  filename: string;
  title?: string | null;
  mime_type: string;
  filesize_bytes: number;
  width: number;
  height: number;
  url: string;
  alt_text?: string | null;
  caption?: string | null;
  credit?: string | null;
  variants?: MediaVariant[];
  created_at: string;
  updated_at?: string | null;
}

export interface MediaUploadPayload {
  file?: File;
  url?: string;
  title?: string;
  alt_text?: string;
  caption?: string;
  credit?: string;
}

export interface MediaUpdatePayload {
  title?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  credit?: string | null;
}

export interface MediaPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface MediaListResponse {
  items: MediaItem[];
  pagination: MediaPaginationMeta;
}
