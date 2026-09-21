-- ==============================================================================
-- Migration: 019_add_tracking_to_ad_campaigns_table.sql
-- Description: Adds atomic impressions and clicks tracking to ad_campaigns
-- ==============================================================================

ALTER TABLE ad_campaigns
    ADD COLUMN impressions_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER active,
    ADD COLUMN clicks_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER impressions_count,
    ADD INDEX idx_ads_vigencia (site_uuid, location, active, start_at, end_at);

