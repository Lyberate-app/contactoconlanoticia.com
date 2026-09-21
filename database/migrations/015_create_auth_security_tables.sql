-- ==============================================================================
-- Migration: 015_create_auth_security_tables.sql
-- Description: Creates 2FA, recovery codes, passkeys and rate limiting tables
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_two_factor (
    user_uuid CHAR(36) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uuid),
    CONSTRAINT fk_two_factor_user FOREIGN KEY (user_uuid)
        REFERENCES users (user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_recovery_codes (
    code_uuid CHAR(36) NOT NULL,
    user_uuid CHAR(36) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (code_uuid),
    KEY idx_recovery_codes_user (user_uuid),
    CONSTRAINT fk_recovery_codes_user FOREIGN KEY (user_uuid)
        REFERENCES users (user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_passkeys (
    passkey_uuid CHAR(36) NOT NULL,
    user_uuid CHAR(36) NOT NULL,
    credential_id VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    counter INT UNSIGNED NOT NULL DEFAULT 0,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (passkey_uuid),
    UNIQUE KEY uq_passkeys_credential_id (credential_id),
    KEY idx_passkeys_user (user_uuid),
    CONSTRAINT fk_passkeys_user FOREIGN KEY (user_uuid)
        REFERENCES users (user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
    rate_key VARCHAR(191) NOT NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 1,
    reset_at INT UNSIGNED NOT NULL,
    PRIMARY KEY (rate_key),
    KEY idx_rate_limits_reset_at (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

