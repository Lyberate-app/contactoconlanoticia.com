/**
 * LYBERATE — WEB PUSH & SMART PUSH TYPES
 */

export interface PushTopic {
  id: string;
  name: string;
}

export interface PushConfig {
  enabled: boolean;
  public_key: string | null;
  available_topics: PushTopic[];
}

export interface SubscribePushPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  topics?: string[];
}

export type PushMode = 'editorial_breaking' | 'editorial_smart_trend' | 'scheduled' | 'manual';

export type PushDeliveryStatus = 'queued' | 'processing' | 'sent' | 'failed' | 'dismissed';

export interface PushCandidate {
  candidate_id: string;
  article_uuid: string;
  title: string;
  slug: string;
  category_name: string;
  trend_score: number;
  views_total: number;
  views_recent_3h: number;
  growth_rate_percent: number;
  reason: string;
  suggested_title: string;
  suggested_message: string;
  topic_id: string;
  created_at: string;
}

export interface PushCampaign {
  campaign_uuid: string;
  article_uuid: string;
  title: string;
  message: string;
  topic_id: string;
  mode: PushMode;
  status: PushDeliveryStatus;
  recipients_count: number;
  clicks_count: number;
  ctr: number;
  sent_at: string;
  reason?: string;
}

export interface SendPushPayload {
  article_uuid: string;
  title: string;
  message: string;
  topic_id: string;
  mode: PushMode;
}

export interface PushAnalyticsOverview {
  total_sent: number;
  total_delivered: number;
  total_clicks: number;
  avg_ctr: number;
  last_campaign_at: string | null;
  global_cooldown_remaining_minutes: number;
  recent_campaigns: PushCampaign[];
}
