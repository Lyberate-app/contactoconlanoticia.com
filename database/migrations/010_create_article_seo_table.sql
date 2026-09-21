-- ==============================================================================
-- Migration: 010_create_article_seo_table.sql
-- Description: Creates the article_seo table for search engine and Open Graph metadata
-- ==============================================================================

CREATE TABLE IF NOT EXISTS article_seo (
    article_uuid CHAR(36) NOT NULL,
    meta_title VARCHAR(255) NULL DEFAULT NULL,
    meta_description VARCHAR(500) NULL DEFAULT NULL,
    canonical_url VARCHAR(500) NULL DEFAULT NULL,
    og_title VARCHAR(255) NULL DEFAULT NULL,
    og_description VARCHAR(500) NULL DEFAULT NULL,
    og_image_media_uuid CHAR(36) NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (article_uuid),
    CONSTRAINT fk_article_seo_article FOREIGN KEY (article_uuid)
        REFERENCES articles (article_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_article_seo_media FOREIGN KEY (og_image_media_uuid)
        REFERENCES media (media_uuid)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

