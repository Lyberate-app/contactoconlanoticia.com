-- ==============================================================================
-- Migration: 001_create_tenants_table.sql
-- Description: Creates the tenants table representing organizations/clients
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    tenant_uuid CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_uuid),
    UNIQUE KEY uq_tenants_slug (slug),
    KEY idx_tenants_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

