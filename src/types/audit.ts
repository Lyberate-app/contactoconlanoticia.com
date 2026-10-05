/**
 * LYBERATE — AUDIT LOG & COMPLIANCE CONTRACTS
 */

export type AuditAction =
  | 'ARTICLE_CREATE'
  | 'ARTICLE_UPDATE'
  | 'ARTICLE_PUBLISH'
  | 'ARTICLE_RETURN_REVISION'
  | 'ARTICLE_SUBMIT_REVIEW'
  | 'ARTICLE_SCHEDULE'
  | 'ARTICLE_ARCHIVE'
  | 'ARTICLE_DELETE'
  | 'ARTICLE_RESTORE'
  | 'MEDIA_UPLOAD'
  | 'MEDIA_DELETE'
  | 'MEDIA_UPDATE'
  | 'AD_CREATE'
  | 'AD_UPDATE'
  | 'AD_DELETE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_ROLE_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SETTINGS_UPDATE';

export type AuditModule =
  | 'ARTICLES'
  | 'MEDIA'
  | 'ADS'
  | 'USERS'
  | 'SECURITY'
  | 'SETTINGS'
  | 'INTEGRATIONS';

export interface AuditEntry {
  id: string;
  user_uuid: string;
  user_name: string;
  user_email: string;
  action: AuditAction;
  module: AuditModule;
  entity_id?: string;
  entity_name?: string;
  description: string;
  ip_address?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AuditFilterParams {
  page?: number;
  limit?: number;
  user_uuid?: string;
  module?: AuditModule;
  action?: AuditAction;
  search?: string;
  startDate?: string;
  endDate?: string;
}

