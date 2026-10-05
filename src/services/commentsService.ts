/**
 * LYBERATE — CITIZEN COMMENTS & SENTIMENT REACTIONS SERVICE
 */

import { isMockMode } from '../config/env';
import { mockStorage } from '../mocks/mockStorage';
import { apiClient } from './apiClient';
import type { ArticleComment, NewCommentPayload } from '../types/comments';

export const commentsService = {
  async getComments(articleUuid: string): Promise<ArticleComment[]> {
    if (isMockMode()) {
      return mockStorage.getComments(articleUuid);
    }
    const res = await apiClient.get<ArticleComment[]>(`/public/articles/${articleUuid}/comments`);
    return res.data || [];
  },

  async addComment(payload: NewCommentPayload): Promise<ArticleComment> {
    if (isMockMode()) {
      return mockStorage.addComment(payload);
    }
    const res = await apiClient.post<ArticleComment>(`/public/articles/${payload.article_uuid}/comments`, payload);
    return res.data;
  },

  async likeComment(commentUuid: string): Promise<{ likes_count: number; user_liked: boolean }> {
    if (isMockMode()) {
      return mockStorage.likeComment(commentUuid);
    }
    const res = await apiClient.post<{ likes_count: number; user_liked: boolean }>(`/public/comments/${commentUuid}/like`);
    return res.data;
  },

  async getAllAdminComments(): Promise<ArticleComment[]> {
    if (isMockMode()) {
      return mockStorage.getAllCommentsAdmin();
    }
    const res = await apiClient.get<ArticleComment[]>('/admin/comments');
    return res.data || [];
  },

  async moderateComment(commentUuid: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    if (isMockMode()) {
      mockStorage.moderateComment(commentUuid, status);
      return;
    }
    await apiClient.patch(`/admin/comments/${commentUuid}/status`, { status });
  },

  async getReactions(articleUuid: string): Promise<Record<string, number>> {
    if (isMockMode()) {
      return mockStorage.getReactions(articleUuid);
    }
    const res = await apiClient.get<Record<string, number>>(`/public/articles/${articleUuid}/reactions`);
    return res.data || {};
  },

  async addReaction(articleUuid: string, reactionType: string): Promise<Record<string, number>> {
    if (isMockMode()) {
      return mockStorage.addReaction(articleUuid, reactionType);
    }
    const res = await apiClient.post<Record<string, number>>(`/public/articles/${articleUuid}/reactions`, { reactionType });
    return res.data || {};
  },
};
