-- ==============================================================================
-- Migration: 009_create_article_tags_table.sql
-- Description: Creates the article_tags pivot table for tagging articles
-- ==============================================================================

CREATE TABLE IF NOT EXISTS article_tags (
    article_uuid CHAR(36) NOT NULL,
    tag_uuid CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_uuid, tag_uuid),
    CONSTRAINT fk_article_tags_article FOREIGN KEY (article_uuid)
        REFERENCES articles (article_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_article_tags_tag FOREIGN KEY (tag_uuid)
        REFERENCES tags (tag_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

