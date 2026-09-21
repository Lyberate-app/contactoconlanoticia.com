-- ==============================================================================
-- Migration: 007_create_categories_tags_tables.sql
-- Description: Creates categories and tags tables with multi-tenant isolation
-- ==============================================================================

CREATE TABLE IF NOT EXISTS categories (
    category_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT NULL DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_uuid),
    UNIQUE KEY uq_categories_tenant_site_slug (tenant_uuid, site_uuid, slug),
    UNIQUE KEY uq_categories_tenant_site_category (tenant_uuid, site_uuid, category_uuid),
    KEY idx_categories_site_status (site_uuid, status),
    CONSTRAINT fk_categories_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
    tag_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tag_uuid),
    UNIQUE KEY uq_tags_tenant_site_slug (tenant_uuid, site_uuid, slug),
    UNIQUE KEY uq_tags_tenant_site_tag (tenant_uuid, site_uuid, tag_uuid),
    CONSTRAINT fk_tags_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

