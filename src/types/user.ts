export type EditorialRole =
  | 'SUPER_ADMIN'
  | 'SITE_ADMIN'
  | 'EDITOR'
  | 'JOURNALIST'
  | 'AD_MANAGER'
  | 'TENANT_ADMIN'
  | 'MODERATOR';

export type EditorialUserStatus = 'ACTIVE' | 'INACTIVE';

export type PermissionName =
  | 'articles.create'
  | 'articles.edit'
  | 'articles.delete'
  | 'articles.review'
  | 'articles.publish'
  | 'articles.schedule'
  | 'media.upload'
  | 'media.delete'
  | 'ads.manage'
  | 'analytics.view'
  | 'settings.manage'
  | 'users.manage'
  | 'integrations.manage';

export interface EditorialUser {
  user_uuid: string;
  name: string;
  email: string;
  roles: EditorialRole[];
  status: EditorialUserStatus;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  last_login_at?: string;
}

export interface EditorialUserInput {
  name: string;
  email: string;
  role: EditorialRole;
  status: EditorialUserStatus;
  bio?: string;
  avatar_url?: string;
}

export interface JournalistProfile {
  author_uuid: string;
  name: string;
  slug: string;
  email: string;
  role: EditorialRole;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  social_twitter?: string;
  social_linkedin?: string;
  joined_date: string;
  metrics: {
    published_count: number;
    drafts_count: number;
    pending_count: number;
    total_views: number;
    avg_reading_time_seconds: number;
    effective_read_ratio: number;
  };
}

export const ROLE_PERMISSIONS: Record<EditorialRole, PermissionName[]> = {
  SUPER_ADMIN: [
    'articles.create',
    'articles.edit',
    'articles.delete',
    'articles.review',
    'articles.publish',
    'articles.schedule',
    'media.upload',
    'media.delete',
    'ads.manage',
    'analytics.view',
    'settings.manage',
    'users.manage',
    'integrations.manage',
  ],
  SITE_ADMIN: [
    'articles.create',
    'articles.edit',
    'articles.delete',
    'articles.review',
    'articles.publish',
    'articles.schedule',
    'media.upload',
    'media.delete',
    'ads.manage',
    'analytics.view',
    'settings.manage',
    'users.manage',
    'integrations.manage',
  ],
  TENANT_ADMIN: [
    'articles.create',
    'articles.edit',
    'articles.delete',
    'articles.review',
    'articles.publish',
    'articles.schedule',
    'media.upload',
    'media.delete',
    'ads.manage',
    'analytics.view',
    'settings.manage',
    'users.manage',
    'integrations.manage',
  ],
  EDITOR: [
    'articles.create',
    'articles.edit',
    'articles.delete',
    'articles.review',
    'articles.publish',
    'articles.schedule',
    'media.upload',
    'media.delete',
    'analytics.view',
  ],
  JOURNALIST: [
    'articles.create',
    'articles.edit',
    'media.upload',
    'analytics.view',
  ],
  AD_MANAGER: [
    'ads.manage',
    'media.upload',
    'analytics.view',
  ],
  MODERATOR: [
    'articles.review',
    'analytics.view',
  ],
};

export function hasPermission(
  roles: EditorialRole | EditorialRole[] | undefined,
  permission: PermissionName
): boolean {
  if (!roles) return false;
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}
