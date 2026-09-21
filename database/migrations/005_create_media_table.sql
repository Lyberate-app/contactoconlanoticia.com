-- ==============================================================================
-- Migration: 005_create_media_table.sql
-- Description: Creates the media table for uploaded and optimized media assets
-- ==============================================================================

CREATE TABLE IF NOT EXISTS media (
    media_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    width INT UNSIGNED NULL DEFAULT NULL,
    height INT UNSIGNED NULL DEFAULT NULL,
    alt_text VARCHAR(255) NULL DEFAULT NULL,
    caption TEXT NULL DEFAULT NULL,
    credit VARCHAR(255) NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (media_uuid),
    UNIQUE KEY uq_media_tenant_site_media (tenant_uuid, site_uuid, media_uuid),
    KEY idx_media_site_created (site_uuid, created_at),
    CONSTRAINT fk_media_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

