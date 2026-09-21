-- ==============================================================================
-- Migration: 016_create_media_variants_table.sql
-- Description: Creates the media_variants table for adaptive responsive image sizes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS media_variants (
    variant_uuid CHAR(36) NOT NULL,
    media_uuid CHAR(36) NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    format VARCHAR(20) NOT NULL,
    width INT UNSIGNED NOT NULL,
    height INT UNSIGNED NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (variant_uuid),
    UNIQUE KEY uq_media_variant_format (media_uuid, variant_name, format),
    KEY idx_media_variants_media (media_uuid),
    CONSTRAINT fk_media_variants_media FOREIGN KEY (media_uuid)
        REFERENCES media (media_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

