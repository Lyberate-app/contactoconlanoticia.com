-- ==============================================================================
-- Migration: 011_create_ad_campaigns_table.sql
-- Description: Creates the ad_campaigns table for managing advertising placements
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
    campaign_uuid CHAR(36) NOT NULL,
    tenant_uuid CHAR(36) NOT NULL,
    site_uuid CHAR(36) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    ad_type ENUM('BANNER', 'SPONSORED', 'POPUP') NOT NULL DEFAULT 'BANNER',
    location ENUM(
        'HEADER_BANNER',
        'TOP_NEWS',
        'SIDEBAR',
        'ARTICLE_TOP',
        'ARTICLE_MIDDLE',
        'ARTICLE_BOTTOM',
        'FOOTER'
    ) NOT NULL,
    start_at TIMESTAMP NULL DEFAULT NULL,
    end_at TIMESTAMP NULL DEFAULT NULL,
    target_url VARCHAR(1000) NOT NULL,
    media_uuid CHAR(36) NULL DEFAULT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (campaign_uuid),
    KEY idx_ads_site_active (site_uuid, active),
    KEY idx_ads_location_active (location, active),
    CONSTRAINT fk_ads_site FOREIGN KEY (tenant_uuid, site_uuid)
        REFERENCES sites (tenant_uuid, site_uuid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_ads_media FOREIGN KEY (media_uuid)
        REFERENCES media (media_uuid)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

