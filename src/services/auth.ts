/**
 * LYBERATE — AUTHENTICATION CLIENT SERVICE
 *
 * CRITICAL RULE: Never store passwords, tokens, or credentials in localStorage/sessionStorage in production.
 * In live API mode, authentication relies strictly on HttpOnly, SameSite cookies via credentials: 'include'.
 * In mock mode (VITE_DATA_MODE=mock), local development state is emulated via mockStorage.
 */

import { apiClient, ApiError } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import { MOCK_USER } from '../mocks/mockData';
import type { AuthUser, LoginResponse, LoginResponseData } from '../types/auth';

export type { AuthUser, LoginResponse, LoginResponseData };

export const authService = {
  /**
   * Submit credentials for authentication.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    if (isMockMode()) {
      if (!email.trim() || !password.trim()) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Debe ingresar correo electrónico y contraseña.',
          },
        };
      }

      const user: AuthUser = {
        ...MOCK_USER,
        email: email.trim(),
      };
      mockStorage.setAuthUser(user);

      return {
        success: true,
        data: {
          requires_2fa: false,
          user,
        },
      };
    }

    try {
      const response = await apiClient.post<LoginResponseData>('/auth/login', { email, password });
      return {
        success: true,
        data: response.data,
        meta: response.meta,
      };
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        };
      }
      throw err;
    }
  },

  /**
   * Submit 2FA TOTP or recovery code using temporary ticket.
   */
  async verify2fa(ticket: string, code: string): Promise<LoginResponse> {
    if (isMockMode()) {
      const user = mockStorage.getAuthUser() || MOCK_USER;
      mockStorage.setAuthUser(user);
      return {
        success: true,
        data: {
          requires_2fa: false,
          user,
        },
      };
    }

    try {
      const response = await apiClient.post<LoginResponseData>('/auth/2fa/verify', { ticket, code });
      return {
        success: true,
        data: response.data,
        meta: response.meta,
      };
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        };
      }
      throw err;
    }
  },

  /**
   * Fetch authenticated user details and permissions.
   */
  async getMe(): Promise<LoginResponse> {
    if (isMockMode()) {
      const user = mockStorage.getAuthUser();
      if (!user) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No hay una sesión activa.',
          },
        };
      }
      return {
        success: true,
        data: {
          requires_2fa: false,
          user,
        },
      };
    }

    try {
      const response = await apiClient.get<LoginResponseData>('/auth/me');
      return {
        success: true,
        data: response.data,
        meta: response.meta,
      };
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        };
      }
      throw err;
    }
  },

  /**
   * Terminate active session.
   */
  async logout(): Promise<void> {
    if (isMockMode()) {
      mockStorage.setAuthUser(null);
      return;
    }

    await apiClient.post('/auth/logout');
  },
};
