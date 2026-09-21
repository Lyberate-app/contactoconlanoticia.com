-- ==============================================================================
-- Migration: 014_create_site_settings_table.sql
-- Description: Creates the site_settings table for key-value site configurations
-- ==============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
    setting_id INT AUTO_INCREMENT NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value LONGTEXT NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (setting_id),
    UNIQUE KEY uq_settings_site_key (site_uuid, setting_key),
    CONSTRAINT fk_settings_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

