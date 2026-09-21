-- ==============================================================================
-- Migration: 003_create_users_table.sql
-- Description: Creates the users table with tenant/site isolation
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    user_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uuid),
    UNIQUE KEY uq_users_tenant_email (tenant_uuid, email),
    UNIQUE KEY uq_users_tenant_site_user (tenant_uuid, site_uuid, user_uuid),
    KEY idx_users_site_status (site_uuid, status),
    CONSTRAINT fk_users_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

