-- ==============================================================================
-- Migration: 013_create_sessions_table.sql
-- Description: Creates the sessions table for server-side session management
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    session_uuid CHAR(36) NOT NULL,
    user_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_uuid),
    KEY idx_sessions_user (user_uuid),
    KEY idx_sessions_token_hash (token_hash),
    KEY idx_sessions_expires_at (expires_at),
    KEY idx_sessions_revoked_at (revoked_at),
    CONSTRAINT fk_sessions_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_uuid)
        REFERENCES users (user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

