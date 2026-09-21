-- ==============================================================================
-- Migration: 018_create_push_subscriptions_table.sql
-- Description: Creates the push_subscriptions table for Web Push notifications
-- ==============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    subscription_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    endpoint VARCHAR(1000) NOT NULL,
    endpoint_hash CHAR(64) NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth_token VARCHAR(255) NOT NULL,
    topics JSON NULL,
    user_agent VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (subscription_uuid),
    UNIQUE KEY uq_push_endpoint_hash (site_uuid, endpoint_hash),
    KEY idx_push_sub_tenant_site (tenant_uuid, site_uuid, is_active),
    CONSTRAINT fk_push_sub_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

