-- ==============================================================================
-- Migration: 020_create_news_submissions_table.sql
-- Description: Creates the news_submissions table for citizen reports (Fase 12)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS news_submissions (
    submission_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    submitter_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,
    location VARCHAR(200) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    message TEXT NULL,
    video_url VARCHAR(500) NULL,
    attachments JSON NULL,
    status ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CONVERTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    rejection_reason TEXT NULL,
    reviewed_by_user_uuid CHAR(36) NULL,
    reviewed_at DATETIME NULL,
    converted_article_uuid CHAR(36) NULL,
    assigned_author_uuid CHAR(36) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (submission_uuid),
    KEY idx_submissions_status (status),
    KEY idx_submissions_tenant_site (tenant_uuid, site_uuid),
    KEY idx_submissions_ip_created (ip_address, created_at),
    CONSTRAINT fk_submissions_tenant FOREIGN KEY (tenant_uuid)
        REFERENCES tenants (tenant_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_submissions_site FOREIGN KEY (site_uuid)
        REFERENCES sites (site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

