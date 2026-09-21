/**
 * Submission API Service for Citizen Journalism (Fase 12)
 */

export type SubmissionStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface SubmissionAttachment {
  name: string;
  path: string;
  mime: string;
  size: number;
}

export interface CitizenSubmission {
  submission_uuid: string;
  tenant_uuid: string;
  site_uuid: string;
  submitter_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  location: string;
  title: string;
  description: string;
  message: string | null;
  video_url: string | null;
  attachments: SubmissionAttachment[];
  status: SubmissionStatus;
  rejection_reason: string | null;
  reviewed_by_user_uuid: string | null;
  reviewed_at: string | null;
  reviewer_name?: string | null;
  converted_article_uuid: string | null;
  converted_article_title?: string | null;
  converted_article_slug?: string | null;
  assigned_author_uuid: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SubmissionsResponse {
  items: CitizenSubmission[];
  pagination: SubmissionPagination;
}

/**
 * Public: Send news report with optional photos
 */
export async function submitCitizenNews(formData: FormData): Promise<CitizenSubmission> {
  const res = await fetch('/api/v1/public/submissions', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al enviar el reporte ciudadano.');
  }

  return json.data;
}

/**
 * Admin: List submissions with filters
 */
export async function getAdminSubmissions(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<SubmissionsResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/v1/admin/submissions${qs}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al cargar los reportes.');
  }

  return {
    items: json.data || [],
    pagination: json.meta?.pagination || { total: 0, page: 1, limit: 20, total_pages: 1 },
  };
}

/**
 * Admin: Get single submission
 */
export async function getAdminSubmission(uuid: string): Promise<CitizenSubmission> {
  const res = await fetch(`/api/v1/admin/submissions/${encodeURIComponent(uuid)}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Reporte no encontrado.');
  }

  return json.data;
}

/**
 * Admin: Reject submission with reason
 */
export async function rejectAdminSubmission(uuid: string, reason: string): Promise<CitizenSubmission> {
  const res = await fetch(`/api/v1/admin/submissions/${encodeURIComponent(uuid)}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al rechazar el reporte.');
  }

  return json.data;
}

/**
 * Admin: Convert submission into draft article
 */
export async function convertAdminSubmission(
  uuid: string,
  overrides?: {
    title?: string;
    subtitle?: string;
    excerpt?: string;
    author_uuid?: string;
    category_uuid?: string;
  }
): Promise<{ submission: CitizenSubmission; article: any }> {
  const res = await fetch(`/api/v1/admin/submissions/${encodeURIComponent(uuid)}/convert`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(overrides || {}),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al convertir el reporte en artículo.');
  }

  return json.data;
}

