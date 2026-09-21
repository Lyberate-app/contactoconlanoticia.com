/**
 * LYBERATE — AUTHENTICATION CLIENT SERVICE
 *
 * CRITICAL RULE: Never store passwords, tokens, or credentials in localStorage/sessionStorage.
 * Authentication relies strictly on HttpOnly, SameSite cookies via credentials: 'include'.
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

export interface LoginResponse {
  success: boolean;
  data?: {
    requires_2fa: boolean;
    ticket?: string;
    user?: AuthUser;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp?: string;
    message?: string;
  };
}

const API_BASE = '/api/v1/auth';

export const authService = {
  /**
   * Submit credentials for authentication.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    return response.json();
  },

  /**
   * Submit 2FA TOTP or recovery code using temporary ticket.
   */
  async verify2fa(ticket: string, code: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ ticket, code }),
    });

    return response.json();
  },

  /**
   * Fetch authenticated user details and permissions.
   */
  async getMe(): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      credentials: 'include',
    });

    return response.json();
  },

  /**
   * Terminate active server-side session and expire cookie.
   */
  async logout(): Promise<void> {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },
};

