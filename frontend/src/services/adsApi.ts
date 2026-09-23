/**
 * Advertising & Commercial API Client
 * Supports mock development mode when VITE_DATA_MODE=mock.
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import type { PublicAd, AdCampaign, AdPagination, AdType } from '../types/ads';

export type { PublicAd, AdCampaign, AdPagination, AdType };

/**
 * Fetch active ads for public display, optionally filtered by slot location.
 */
export async function getActiveAds(location?: string): Promise<PublicAd[]> {
  if (isMockMode()) {
    const list = mockStorage.getAds().filter((a) => a.active);
    const filtered = location ? list.filter((a) => a.location === location) : list;
    return filtered.map((a) => ({
      campaign_uuid: a.campaign_uuid,
      company_name: a.company_name,
      campaign_name: a.campaign_name,
      ad_type: a.ad_type,
      location: a.location,
      target_url: a.target_url,
      media_url: a.media_url,
      media_alt: a.media_alt || a.company_name,
    }));
  }

  try {
    const res = await apiClient.get<PublicAd[]>('/public/ads', {
      params: location ? { location } : undefined,
    });
    return res.data || [];
  } catch {
    return [];
  }
}

/**
 * Record an impression for a displayed ad.
 */
export async function recordAdImpression(campaignUuid: string): Promise<void> {
  if (isMockMode()) return;

  try {
    await apiClient.post(`/public/ads/${encodeURIComponent(campaignUuid)}/impression`);
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Record a click and retrieve target URL.
 */
export async function recordAdClick(campaignUuid: string): Promise<string | null> {
  if (isMockMode()) {
    const ad = mockStorage.getAds().find((a) => a.campaign_uuid === campaignUuid);
    return ad?.target_url || null;
  }

  try {
    const res = await apiClient.get<{ target_url: string }>(`/public/ads/${encodeURIComponent(campaignUuid)}/click`);
    return res.data?.target_url || null;
  } catch {
    return null;
  }
}

/**
 * Admin: List campaigns with pagination and filters.
 */
export async function listAdminCampaigns(
  filters: { location?: string; active?: string | number } = {},
  page = 1,
  limit = 20
): Promise<{ items: AdCampaign[]; pagination: AdPagination }> {
  if (isMockMode()) {
    let list = mockStorage.getAds();
    if (filters.location) list = list.filter((a) => a.location === filters.location);
    if (filters.active !== undefined && filters.active !== '') {
      const isActive = String(filters.active) === '1' || String(filters.active) === 'true';
      list = list.filter((a) => a.active === isActive);
    }
    return {
      items: list,
      pagination: { total: list.length, page, limit, total_pages: 1 },
    };
  }

  const params: Record<string, string | number | undefined> = {
    location: filters.location,
    active: filters.active !== undefined && filters.active !== '' ? filters.active : undefined,
    page,
    limit,
  };

  const res = await apiClient.get<AdCampaign[]>('/admin/ads', { params });
  return {
    items: res.data || [],
    pagination: (res.meta?.pagination as AdPagination) || { total: 0, page: 1, limit, total_pages: 0 },
  };
}

/**
 * Admin: Get single campaign detail.
 */
export async function getAdminCampaign(uuid: string): Promise<AdCampaign> {
  if (isMockMode()) {
    const ad = mockStorage.getAds().find((a) => a.campaign_uuid === uuid);
    if (!ad) throw new Error('Campaña no encontrada.');
    return ad;
  }

  const res = await apiClient.get<AdCampaign>(`/admin/ads/${encodeURIComponent(uuid)}`);
  return res.data;
}

/**
 * Admin: Create campaign.
 */
export async function createAdminCampaign(data: Partial<AdCampaign>): Promise<AdCampaign> {
  if (isMockMode()) {
    const newAd: AdCampaign = {
      campaign_uuid: 'cmp-' + Math.random().toString(36).substring(2, 9),
      tenant_uuid: 'ten-001',
      site_uuid: 'ste-001',
      company_name: data.company_name || 'Compañía',
      campaign_name: data.campaign_name || 'Campaña',
      ad_type: data.ad_type || 'BANNER',
      location: data.location || 'HEADER_BANNER',
      start_at: data.start_at || null,
      end_at: data.end_at || null,
      target_url: data.target_url || '#',
      media_uuid: data.media_uuid || null,
      media_url: data.media_url || null,
      active: data.active ?? true,
      impressions_count: 0,
      clicks_count: 0,
      ctr: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return newAd;
  }

  const res = await apiClient.post<AdCampaign>('/admin/ads', data);
  return res.data;
}

/**
 * Admin: Update campaign.
 */
export async function updateAdminCampaign(uuid: string, data: Partial<AdCampaign>): Promise<AdCampaign> {
  if (isMockMode()) {
    const ad = mockStorage.getAds().find((a) => a.campaign_uuid === uuid);
    if (!ad) throw new Error('Campaña no encontrada.');
    return { ...ad, ...data, updated_at: new Date().toISOString() };
  }

  const res = await apiClient.put<AdCampaign>(`/admin/ads/${encodeURIComponent(uuid)}`, data);
  return res.data;
}

/**
 * Admin: Delete campaign.
 */
export async function deleteAdminCampaign(uuid: string): Promise<void> {
  if (isMockMode()) return;
  await apiClient.delete(`/admin/ads/${encodeURIComponent(uuid)}`);
}
