/**
 * LYBERATE — EDITORIAL NOTIFICATION CONTRACTS
 */

export type EditorialNotificationType =
  | 'ARTICLE_SUBMITTED'
  | 'ARTICLE_RETURNED'
  | 'ARTICLE_APPROVED'
  | 'ARTICLE_PUBLISHED'
  | 'BROKEN_LINK_DETECTED'
  | 'AD_EXPIRING'
  | 'SYSTEM_ALERT';

export interface EditorialNotification {
  id: string;
  type: EditorialNotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link_url?: string;
  link?: string;
  recipient_role?: string;
  recipient_uuid?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

