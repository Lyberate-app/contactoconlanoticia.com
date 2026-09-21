/**
 * Advertising & Commercial API Client
 */

export interface PublicAd {
  campaign_uuid: string;
  company_name: string;
  campaign_name: string;
  ad_type: 'BANNER' | 'SPONSORED' | 'POPUP';
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
  ad_type: 'BANNER' | 'SPONSORED' | 'POPUP';
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

export interface AdPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Fetch active ads for public display, optionally filtered by slot location.
 */
export async function getActiveAds(location?: string): Promise<PublicAd[]> {
  const url = location ? `/api/v1/public/ads?location=${encodeURIComponent(location)}` : '/api/v1/public/ads';
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    return [];
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Record an impression for a displayed ad.
 */
export async function recordAdImpression(campaignUuid: string): Promise<void> {
  try {
    await fetch(`/api/v1/public/ads/${encodeURIComponent(campaignUuid)}/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Record a click and retrieve target URL.
 */
export async function recordAdClick(campaignUuid: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/v1/public/ads/${encodeURIComponent(campaignUuid)}/click`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.target_url || null;
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
  const params = new URLSearchParams();
  if (filters.location) params.set('location', filters.location);
  if (filters.active !== undefined && filters.active !== '') params.set('active', String(filters.active));
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await fetch(`/api/v1/admin/ads?${params.toString()}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Error al listar campañas publicitarias.');
  }

  const json = await res.json();
  return {
    items: json.data || [],
    pagination: json.meta?.pagination || { total: 0, page: 1, limit, total_pages: 0 },
  };
}

/**
 * Admin: Get single campaign detail.
 */
export async function getAdminCampaign(uuid: string): Promise<AdCampaign> {
  const res = await fetch(`/api/v1/admin/ads/${encodeURIComponent(uuid)}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Campaña no encontrada.');
  }

  const json = await res.json();
  return json.data;
}

/**
 * Admin: Create campaign.
 */
export async function createAdminCampaign(data: Partial<AdCampaign>): Promise<AdCampaign> {
  const res = await fetch('/api/v1/admin/ads', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al crear la campaña.');
  }

  return json.data;
}

/**
 * Admin: Update campaign.
 */
export async function updateAdminCampaign(uuid: string, data: Partial<AdCampaign>): Promise<AdCampaign> {
  const res = await fetch(`/api/v1/admin/ads/${encodeURIComponent(uuid)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al actualizar la campaña.');
  }

  return json.data;
}

/**
 * Admin: Delete campaign.
 */
export async function deleteAdminCampaign(uuid: string): Promise<void> {
  const res = await fetch(`/api/v1/admin/ads/${encodeURIComponent(uuid)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al eliminar la campaña.');
  }
}

