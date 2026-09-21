-- ==============================================================================
-- Migration: 008_create_articles_table.sql
-- Description: Creates the core articles table with strict multi-tenant integrity
-- ==============================================================================

CREATE TABLE IF NOT EXISTS articles (
    article_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    author_uuid CHAR(36) NOT NULL,
    category_uuid CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500) NULL DEFAULT NULL,
    excerpt TEXT NULL DEFAULT NULL,
    content LONGTEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    featured_media_uuid CHAR(36) NULL DEFAULT NULL,
    status ENUM('DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'TRASH') NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP NULL DEFAULT NULL,
    modified_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (article_uuid),
    UNIQUE KEY uq_articles_tenant_site_slug (tenant_uuid, site_uuid, slug),
    UNIQUE KEY uq_articles_tenant_site_article (tenant_uuid, site_uuid, article_uuid),
    KEY idx_articles_site_status (site_uuid, status),
    KEY idx_articles_site_published (site_uuid, published_at),
    KEY idx_articles_site_slug (site_uuid, slug),
    KEY idx_articles_author (author_uuid),
    KEY idx_articles_category (category_uuid),
    KEY idx_articles_modified (modified_at),
    CONSTRAINT fk_articles_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_articles_author FOREIGN KEY (tenant_uuid, site_uuid, author_uuid)
        REFERENCES authors (tenant_uuid, site_uuid, author_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_articles_category FOREIGN KEY (tenant_uuid, site_uuid, category_uuid)
        REFERENCES categories (tenant_uuid, site_uuid, category_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_articles_featured_media FOREIGN KEY (featured_media_uuid)
        REFERENCES media (media_uuid)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

