// ══════════════════════════════════════════════════════════
// Tipos — Media / Imágenes
// ══════════════════════════════════════════════════════════

export type StorageDisk = 'local' | 's3' | 'r2'

export interface MediaConversion {
  path: string
  url: string
  width: number
  height: number
  size_bytes: number
}

export interface MediaConversions {
  thumbnail?: MediaConversion  // 300×200
  card?: MediaConversion       // 640×427
  medium?: MediaConversion     // 960×640
  large?: MediaConversion      // 1280×853
  hero?: MediaConversion       // 1920×1080
  og?: MediaConversion         // 1200×630
}

export interface Media {
  id: number
  uuid: string
  site_id: number
  uploaded_by: number

  filename: string
  original_name: string | null
  mime_type: string
  file_size: number
  disk: StorageDisk
  path: string

  // URL de la imagen original procesada
  url: string

  // Metadatos visuales
  width: number | null
  height: number | null
  alt_text: string | null
  caption: string | null
  photographer: string | null
  copyright: string | null

  // Conversiones generadas
  conversions: MediaConversions

  // Legado WordPress
  legacy_source: string | null
  legacy_id: string | null
  legacy_url: string | null

  created_at: string
  updated_at: string
}

export interface MediaUploadPayload {
  file: File
  alt_text?: string
  caption?: string
  photographer?: string
  copyright?: string
}

