-- ==============================================================================
-- Migration: 006_create_authors_table.sql
-- Description: Creates the authors table representing public editorial identities
-- ==============================================================================

CREATE TABLE IF NOT EXISTS authors (
    author_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    user_uuid CHAR(36) NULL DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    bio TEXT NULL DEFAULT NULL,
    photo_media_uuid CHAR(36) NULL DEFAULT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (author_uuid),
    UNIQUE KEY uq_authors_tenant_site_slug (tenant_uuid, site_uuid, slug),
    UNIQUE KEY uq_authors_tenant_site_author (tenant_uuid, site_uuid, author_uuid),
    KEY idx_authors_status (status),
    CONSTRAINT fk_authors_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_authors_user FOREIGN KEY (user_uuid)
        REFERENCES users (user_uuid)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_authors_photo FOREIGN KEY (photo_media_uuid)
        REFERENCES media (media_uuid)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

