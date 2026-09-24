/**
 * Submission API Service for Citizen Journalism (Fase 12)
 * Supports mock development mode when VITE_DATA_MODE=mock.
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import type {
  SubmissionStatus,
  SubmissionAttachment,
  CitizenSubmission,
  SubmissionPagination,
  SubmissionsResponse,
  ConvertSubmissionPayload,
} from '../types/submission';
import type { ArticleDetail } from '../types/article';

export type {
  SubmissionStatus,
  SubmissionAttachment,
  CitizenSubmission,
  SubmissionPagination,
  SubmissionsResponse,
  ConvertSubmissionPayload,
};

/**
 * Public: Send news report with optional photos
 */
export async function submitCitizenNews(formData: FormData): Promise<CitizenSubmission> {
  if (isMockMode()) {
    const newSub = mockStorage.addSubmission({
      submitter_name: (formData.get('name') as string) || 'Ciudadano',
      contact_email: (formData.get('email') as string) || null,
      contact_phone: (formData.get('phone') as string) || null,
      location: (formData.get('location') as string) || 'Localidad',
      title: (formData.get('title') as string) || 'Reporte ciudadano',
      description: (formData.get('description') as string) || '',
      message: (formData.get('message') as string) || null,
      video_url: (formData.get('video_url') as string) || null,
    });
    return newSub;
  }

  const res = await apiClient.post<CitizenSubmission>('/public/submissions', formData);
  return res.data;
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
  if (isMockMode()) {
    let list = mockStorage.getSubmissions();
    if (filters?.status) list = list.filter((s) => s.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    const page = filters?.page || 1;
    const limit = filters?.limit || 15;
    return {
      items: list,
      pagination: { total: list.length, page, limit, total_pages: 1 },
    };
  }

  const res = await apiClient.get<CitizenSubmission[]>('/admin/submissions', {
    params: {
      status: filters?.status,
      search: filters?.search,
      page: filters?.page,
      limit: filters?.limit,
    },
  });

  return {
    items: res.data || [],
    pagination: (res.meta?.pagination as SubmissionPagination) || { total: 0, page: 1, limit: 20, total_pages: 1 },
  };
}

/**
 * Admin: Get single submission
 */
export async function getAdminSubmission(uuid: string): Promise<CitizenSubmission> {
  if (isMockMode()) {
    const sub = mockStorage.getSubmissionById(uuid);
    if (!sub) throw new Error('Reporte no encontrado.');
    return sub;
  }

  const res = await apiClient.get<CitizenSubmission>(`/admin/submissions/${encodeURIComponent(uuid)}`);
  return res.data;
}

/**
 * Admin: Reject submission with reason
 */
export async function rejectAdminSubmission(uuid: string, reason: string): Promise<CitizenSubmission> {
  if (isMockMode()) {
    const sub = mockStorage.rejectSubmission(uuid, reason);
    if (!sub) throw new Error('Reporte no encontrado.');
    return sub;
  }

  const res = await apiClient.post<CitizenSubmission>(`/admin/submissions/${encodeURIComponent(uuid)}/reject`, { reason });
  return res.data;
}

/**
 * Admin: Convert submission into draft article
 */
export async function convertAdminSubmission(
  uuid: string,
  overrides?: ConvertSubmissionPayload
): Promise<{ submission: CitizenSubmission; article: ArticleDetail }> {
  if (isMockMode()) {
    return mockStorage.convertSubmission(uuid, overrides);
  }

  const res = await apiClient.post<{ submission: CitizenSubmission; article: ArticleDetail }>(
    `/admin/submissions/${encodeURIComponent(uuid)}/convert`,
    overrides || {}
  );
  return res.data;
}
