/**
 * LYBERATE — AUTHENTICATION & IDENTITY TYPES
 *
 * Session state is maintained strictly via server-side HttpOnly cookies.
 * No sensitive authentication tokens or credentials in client-side storage.
 */

export interface AuthUser {
  user_uuid: string;
  tenant_uuid: string;
  site_uuid: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponseData {
  requires_2fa: boolean;
  ticket?: string;
  user?: AuthUser;
}

export interface LoginResponse {
  success: boolean;
  data?: LoginResponseData;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp?: string;
    message?: string;
    [key: string]: unknown;
  };
}

