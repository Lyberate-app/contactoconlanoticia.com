/**
 * LYBERATE — MEDIA LIBRARY CLIENT SERVICE
 *
 * Implements the contract defined in docs/API.md (Fase 7).
 * Provides access to the digital asset management system for the newsroom.
 * Supports mock development mode when VITE_DATA_MODE=mock.
 */

import { apiClient, ApiError } from './apiClient';
import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import { compressAndResizeImage } from '../utils/imageCompressor';
import type {
  MediaItem,
  MediaUploadPayload,
  MediaUpdatePayload,
  MediaListResponse,
} from '../types/media';

export interface MediaQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  mime_type?: string;
}

export const mediaService = {
  /**
   * Retrieves a paginated list of media assets from the library.
   */
  async getMedia(params: MediaQueryParams = {}): Promise<MediaListResponse> {
    if (isMockMode()) {
      return mockStorage.getMedia(params);
    }

    const queryParams: Record<string, string | number> = {};
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.search) queryParams.search = params.search;
    if (params.mime_type) queryParams.mime_type = params.mime_type;

    const res = await apiClient.get<MediaListResponse>('/admin/media', {
      params: queryParams,
    });
    return res.data || { items: [], pagination: { total: 0, page: 1, limit: 16, total_pages: 0 } };
  },

  /**
   * Retrieves details of a specific media asset by its UUID.
   */
  async getMediaById(uuid: string): Promise<MediaItem | null> {
    if (isMockMode()) {
      return mockStorage.getMediaByUuid(uuid);
    }

    try {
      const res = await apiClient.get<{ media: MediaItem }>(`/admin/media/${encodeURIComponent(uuid)}`);
      return res.data?.media || null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Uploads a new media asset (file or URL) with optional editorial metadata.
   */
  async uploadMedia(payload: MediaUploadPayload): Promise<{
    success: boolean;
    data?: { media: MediaItem };
    error?: { code: string; message: string };
  }> {
    const uploadPayload = payload.file && payload.file.type.startsWith('image/')
      ? { ...payload, file: (await compressAndResizeImage(payload.file, 1200, 0.82)).file }
      : payload;

    if (isMockMode()) {
      const resolvedPayload = { ...uploadPayload };
      if (uploadPayload.file && !uploadPayload.url) {
        if (typeof window !== 'undefined' && typeof FileReader !== 'undefined' && uploadPayload.file.size < 2 * 1024 * 1024) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(uploadPayload.file!);
            });
            resolvedPayload.url = dataUrl;
          } catch {
            // Non-blocking fallback
          }
        }
      }
      const media = mockStorage.saveMedia(resolvedPayload);
      return { success: true, data: { media } };
    }

    try {
      let body: FormData | MediaUploadPayload;
      if (uploadPayload.file) {
        const formData = new FormData();
        formData.append('file', uploadPayload.file);
        if (uploadPayload.title) formData.append('title', uploadPayload.title);
        if (uploadPayload.alt_text) formData.append('alt_text', uploadPayload.alt_text);
        if (uploadPayload.caption) formData.append('caption', uploadPayload.caption);
        if (uploadPayload.credit) formData.append('credit', uploadPayload.credit);
        body = formData;
      } else {
        body = uploadPayload;
      }

      const res = await apiClient.post<{ media: MediaItem }>('/admin/media/upload', body);
      return { success: true, data: res.data };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: { code: err.code, message: err.message } };
      }
      throw err;
    }
  },

  /**
   * Updates metadata (title, alt_text, caption, credit) of a media asset.
   */
  async updateMedia(
    uuid: string,
    payload: MediaUpdatePayload
  ): Promise<{
    success: boolean;
    data?: { media: MediaItem };
    error?: { code: string; message: string };
  }> {
    if (isMockMode()) {
      const updated = mockStorage.updateMedia(uuid, payload);
      if (!updated) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Elemento multimedia no encontrado.' } };
      }
      return { success: true, data: { media: updated } };
    }

    try {
      const res = await apiClient.put<{ media: MediaItem }>(`/admin/media/${encodeURIComponent(uuid)}`, payload);
      return { success: true, data: res.data };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: { code: err.code, message: err.message } };
      }
      throw err;
    }
  },

  /**
   * Deletes a media asset from the system.
   */
  async deleteMedia(uuid: string): Promise<void> {
    if (isMockMode()) {
      mockStorage.deleteMedia(uuid);
      return;
    }

    await apiClient.delete(`/admin/media/${encodeURIComponent(uuid)}`);
  },
};
