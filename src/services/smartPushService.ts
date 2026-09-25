/**
 * LYBERATE — SMART PUSH & EDITORIAL ENGAGEMENT SERVICE
 *
 * Implements anti-spam push notification rules:
 * - Cooldown enforcement (24h/4h)
 * - Push candidates based on traffic velocity and reader interest
 * - Decoupled push titles from article titles
 * - Campaign performance tracking
 */

import { isMockMode } from '../config/env';
import { apiClient } from './apiClient';
import { mockStorage } from '../mocks/mockStorage';
import type {
  PushCandidate,
  PushCampaign,
  SendPushPayload,
  PushAnalyticsOverview,
} from '../types/push';

export const smartPushService = {
  /**
   * Fetch currently active push candidates detected by acceleration algorithms.
   */
  async getCandidates(): Promise<PushCandidate[]> {
    if (isMockMode()) {
      return mockStorage.getPushCandidates();
    }
    const res = await apiClient.get<PushCandidate[]>('/admin/push/candidates');
    return res.data;
  },

  /**
   * Dispatch a push notification campaign with validation and anti-spam checks.
   */
  async sendPush(payload: SendPushPayload): Promise<{ success: boolean; campaign?: PushCampaign; error?: string }> {
    if (isMockMode()) {
      return mockStorage.dispatchPushCampaign(payload);
    }

    try {
      const res = await apiClient.post<PushCampaign>('/admin/push/send', payload);
      return {
        success: true,
        campaign: res.data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al despachar la notificación push.',
      };
    }
  },

  /**
   * Dismiss a candidate so it stops appearing in editorial suggestions.
   */
  async dismissCandidate(candidateId: string): Promise<boolean> {
    if (isMockMode()) {
      return mockStorage.dismissPushCandidate(candidateId);
    }

    try {
      await apiClient.post(`/admin/push/candidates/${candidateId}/dismiss`, {});
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Fetch push campaigns and overall CTR telemetry.
   */
  async getPushAnalytics(): Promise<PushAnalyticsOverview> {
    if (isMockMode()) {
      return mockStorage.getPushAnalyticsOverview();
    }

    const res = await apiClient.get<PushAnalyticsOverview>('/admin/push/analytics');
    return res.data;
  },
};
