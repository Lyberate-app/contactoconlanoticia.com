-- ==============================================================================
-- Migration: 002_create_sites_table.sql
-- Description: Creates the sites table belonging to tenants
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sites (
    site_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (site_uuid),
    UNIQUE KEY uq_sites_tenant_slug (tenant_uuid, slug),
    UNIQUE KEY uq_sites_tenant_site (tenant_uuid, site_uuid),
    KEY idx_sites_domain (domain),
    KEY idx_sites_status (status),
    CONSTRAINT fk_sites_tenant FOREIGN KEY (tenant_uuid)
        REFERENCES tenants (tenant_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

