/**
 * LYBERATE — EDITORIAL ANALYTICS & TELEMETRY SERVICE
 *
 * Privacy-First, non-blocking telemetry engine for digital newspapers.
 * Uses sendBeacon / keepalive fetch.
 * Manages ephemeral session identifiers without aggressive fingerprinting.
 */

import { isMockMode } from '../config/env';
import { apiClient } from './apiClient';
import { mockStorage } from '../mocks/mockStorage';
import type {
  ArticleEvent,
  DeviceType,
  GlobalAnalyticsOverview,
  ArticleAnalytics,
  TrendingArticle,
  MostReadArticle,
} from '../types/analytics';

const SESSION_KEY = 'lyberate_analytics_sid';
const viewedInSession = new Set<string>();

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'sess-' + Math.random().toString(36).substring(2, 12);
      window.sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'fallback-session';
  }
}

function detectDevice(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function sendTelemetryBeacon(event: ArticleEvent): void {
  if (typeof window === 'undefined') return;

  const url = '/api/v1/analytics/events';
  const payload = JSON.stringify(event);

  if (isMockMode()) {
    try {
      mockStorage.saveEvent(event);
    } catch {
      // Non-blocking
    }
    return;
  }

  // 1. Try navigator.sendBeacon
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const queued = navigator.sendBeacon(url, blob);
      if (queued) return;
    } catch {
      // Fallback to fetch keepalive
    }
  }

  // 2. Fallback to keepalive fetch
  try {
    window.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

export const analyticsService = {
  trackPageView(path: string, source: string = 'direct'): void {
    const event: ArticleEvent = {
      event_type: 'page_view',
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      source,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      device_type: detectDevice(),
      metadata: { path },
    };
    sendTelemetryBeacon(event);
  },

  trackArticleView(articleUuid: string, source: string = 'portal'): void {
    // Session deduplication: prevent F5 refreshes from inflating unique article views
    const dedupeKey = `view:${articleUuid}`;
    if (viewedInSession.has(dedupeKey)) return;
    viewedInSession.add(dedupeKey);

    const event: ArticleEvent = {
      article_uuid: articleUuid,
      event_type: 'article_view',
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      source,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      device_type: detectDevice(),
    };
    sendTelemetryBeacon(event);
  },

  trackArticleRead(articleUuid: string, dwellSeconds: number, scrollDepthPercent: number): void {
    const dedupeKey = `read:${articleUuid}`;
    if (viewedInSession.has(dedupeKey)) return;
    viewedInSession.add(dedupeKey);

    const event: ArticleEvent = {
      article_uuid: articleUuid,
      event_type: 'article_read',
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      device_type: detectDevice(),
      metadata: {
        dwell_seconds: dwellSeconds,
        scroll_depth: scrollDepthPercent,
      },
    };
    sendTelemetryBeacon(event);
  },

  trackShare(articleUuid: string, channel: 'whatsapp' | 'x' | 'facebook' | 'telegram' | 'native' | 'clipboard'): void {
    const event: ArticleEvent = {
      article_uuid: articleUuid,
      event_type: 'share',
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      device_type: detectDevice(),
      metadata: { channel },
    };
    sendTelemetryBeacon(event);
  },

  trackPushClick(articleUuid: string, campaignUuid?: string): void {
    const event: ArticleEvent = {
      article_uuid: articleUuid,
      event_type: 'push_click',
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      source: 'webpush',
      device_type: detectDevice(),
      metadata: { campaign_uuid: campaignUuid },
    };
    sendTelemetryBeacon(event);
  },

  async getOverview(period: 'today' | '24h' | '7d' | '30d' = '24h'): Promise<GlobalAnalyticsOverview> {
    if (isMockMode()) {
      return mockStorage.getGlobalAnalyticsOverview(period);
    }
    const res = await apiClient.get<GlobalAnalyticsOverview>('/admin/analytics/overview', {
      params: { period },
    });
    return res.data;
  },

  async getArticleAnalytics(articleUuid: string): Promise<ArticleAnalytics> {
    if (isMockMode()) {
      return mockStorage.getArticleAnalytics(articleUuid);
    }
    const res = await apiClient.get<ArticleAnalytics>(`/admin/analytics/articles/${articleUuid}`);
    return res.data;
  },

  async getTrendingArticles(limit: number = 5): Promise<TrendingArticle[]> {
    if (isMockMode()) {
      return mockStorage.getTrendingArticles(limit);
    }
    const res = await apiClient.get<TrendingArticle[]>('/public/trending', {
      params: { limit },
    });
    return res.data || [];
  },

  async getMostReadArticles(limit: number = 5): Promise<MostReadArticle[]> {
    if (isMockMode()) {
      return mockStorage.getMostReadArticles(limit);
    }
    const res = await apiClient.get<MostReadArticle[]>('/public/most-read', {
      params: { limit },
    });
    return res.data || [];
  },
};

