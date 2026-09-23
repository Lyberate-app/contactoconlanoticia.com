/**
 * LYBERATE — CITIZEN JOURNALISM SUBMISSION TYPES (FASE 12)
 */

import { PaginationMeta } from './api';

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

export type SubmissionPagination = PaginationMeta;

export interface SubmissionsResponse {
  items: CitizenSubmission[];
  pagination: SubmissionPagination;
}

export interface ConvertSubmissionPayload {
  title?: string;
  subtitle?: string;
  excerpt?: string;
  author_uuid?: string;
  category_uuid?: string;
}

