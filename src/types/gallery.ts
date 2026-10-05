/**
 * LYBERATE — PHOTO GALLERY & MULTI-IMAGE CONTRACTS
 */

export interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
  alt_text?: string;
  credit?: string;
  order: number;
  is_cover?: boolean;
}

export interface GalleryData {
  title?: string;
  description?: string;
  items: GalleryItem[];
}

