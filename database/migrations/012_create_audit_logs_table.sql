-- ==============================================================================
-- Migration: 012_create_audit_logs_table.sql
-- Description: Creates the audit_logs table for recording critical system events
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    user_uuid CHAR(36) NULL DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_uuid CHAR(36) NULL DEFAULT NULL,
    ip_address VARCHAR(45) NULL DEFAULT NULL,
    user_agent VARCHAR(500) NULL DEFAULT NULL,
    metadata JSON NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_id),
    KEY idx_audit_tenant_created (tenant_uuid, created_at),
    KEY idx_audit_site_created (site_uuid, created_at),
    KEY idx_audit_user_created (user_uuid, created_at),
    KEY idx_audit_action (action),
    CONSTRAINT fk_audit_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_uuid)
        REFERENCES users (user_uuid)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

