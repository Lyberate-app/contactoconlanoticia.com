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
  if (isMockMode()) {
    mockStorage.recordAdImpression(campaignUuid);
    return;
  }

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
    return mockStorage.recordAdClick(campaignUuid);
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
    const total = list.length;
    const total_pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    return {
      items: list.slice(offset, offset + limit),
      pagination: { total, page, limit, total_pages },
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
    const ad = mockStorage.getAdById(uuid);
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
    return mockStorage.saveAd(data);
  }

  const res = await apiClient.post<AdCampaign>('/admin/ads', data);
  return res.data;
}

/**
 * Admin: Update campaign.
 */
export async function updateAdminCampaign(uuid: string, data: Partial<AdCampaign>): Promise<AdCampaign> {
  if (isMockMode()) {
    const updated = mockStorage.updateAd(uuid, data);
    if (!updated) throw new Error('Campaña no encontrada.');
    return updated;
  }

  const res = await apiClient.put<AdCampaign>(`/admin/ads/${encodeURIComponent(uuid)}`, data);
  return res.data;
}

/**
 * Admin: Delete campaign.
 */
export async function deleteAdminCampaign(uuid: string): Promise<void> {
  if (isMockMode()) {
    mockStorage.deleteAd(uuid);
    return;
  }
  await apiClient.delete(`/admin/ads/${encodeURIComponent(uuid)}`);
}
