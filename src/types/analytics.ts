/**
 * LYBERATE — EDITORIAL ANALYTICS & TELEMETRY TYPES
 */

export type EventType =
  | 'page_view'
  | 'article_view'
  | 'article_read'
  | 'share'
  | 'push_click';

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export interface ArticleEvent {
  event_uuid?: string;
  article_uuid?: string;
  event_type: EventType;
  timestamp: string; // ISO 8601
  session_id: string; // Ephemeral hashed session identifier
  source?: string;
  referrer?: string;
  device_type: DeviceType;
  metadata?: Record<string, unknown>;
}

export interface TrafficSourceItem {
  source: string;
  count: number;
  percentage: number;
}

export interface DeviceTrafficItem {
  device: DeviceType;
  count: number;
  percentage: number;
}

export interface ArticleAnalytics {
  article_uuid: string;
  title: string;
  slug: string;
  views_total: number;
  views_24h: number;
  views_7d: number;
  unique_visitors_24h: number;
  reads_count: number; // Effective reads (>= 15s or 50% scroll)
  read_ratio: number;
  avg_read_time_seconds: number;
  shares_count: number;
  push_clicks_count: number;
  trend_score: number;
  growth_rate_percent: number;
  top_sources: TrafficSourceItem[];
  top_devices: DeviceTrafficItem[];
  last_calculated_at: string;
}

export interface CategoryAnalyticsItem {
  category_name: string;
  slug: string;
  views_count: number;
  growth_percent: number;
  articles_count: number;
}

export interface AuthorAnalyticsItem {
  author_name: string;
  slug: string;
  articles_count: number;
  total_views: number;
  avg_views: number;
}

export interface AnalyticsHistoryPoint {
  label: string;
  views: number;
  reads: number;
  push_clicks: number;
}

export interface HourlyTrafficPoint {
  hour: string; // "00h", "01h", ..., "23h"
  views: number;
}

export interface GlobalAnalyticsOverview {
  period: 'today' | '24h' | '7d' | '30d';
  views_today: number;
  views_today_growth: number;
  views_24h: number;
  views_24h_growth: number;
  unique_visitors_today: number;
  reads_count: number;
  read_ratio: number;
  articles_viewed_count: number;
  published_articles_count: number;
  trending_articles_count: number;
  push_total_clicks: number;
  push_avg_ctr: number;
  top_categories: CategoryAnalyticsItem[];
  top_authors: AuthorAnalyticsItem[];
  recent_history: AnalyticsHistoryPoint[];
  hourly_traffic: HourlyTrafficPoint[];
  device_breakdown: DeviceTrafficItem[];
}

export interface TrendingArticle {
  article_uuid: string;
  title: string;
  slug: string;
  category_name: string;
  category_slug: string;
  author_name: string;
  views_count: number;
  views_recent_3h: number;
  trend_score: number;
  published_at: string | null;
  featured_media?: {
    url: string;
    alt_text?: string | null;
  };
}

export interface MostReadArticle {
  article_uuid: string;
  title: string;
  slug: string;
  category_name: string;
  category_slug: string;
  author_name: string;
  views_count: number;
  published_at: string | null;
  featured_media?: {
    url: string;
    alt_text?: string | null;
  };
}

export interface EditorialInsight {
  type: 'trending_spike' | 'high_engagement' | 'push_opportunity' | 'decay_alert';
  title: string;
  description: string;
  metric_value: string;
  article_uuid?: string;
  slug?: string;
}

