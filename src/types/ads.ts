/**
 * LYBERATE — ADVERTISING & COMMERCIAL TYPES
 */

import { PaginationMeta } from './api';

export type AdType = 'BANNER' | 'SPONSORED' | 'POPUP';

export interface PublicAd {
  campaign_uuid: string;
  company_name: string;
  campaign_name: string;
  ad_type: AdType;
  location: string;
  target_url: string;
  media_url: string | null;
  media_alt: string | null;
}

export interface AdCampaign {
  campaign_uuid: string;
  tenant_uuid: string;
  site_uuid: string;
  company_name: string;
  campaign_name: string;
  ad_type: AdType;
  location: string;
  start_at: string | null;
  end_at: string | null;
  target_url: string;
  media_uuid: string | null;
  media_url: string | null;
  media_alt?: string | null;
  active: boolean;
  impressions_count: number;
  clicks_count: number;
  ctr: number;
  created_at: string;
  updated_at: string;
}

export type AdPagination = PaginationMeta;

export interface AdminCampaignsResponse {
  items: AdCampaign[];
  pagination: AdPagination;
}

