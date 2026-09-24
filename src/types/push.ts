/**
 * LYBERATE — WEB PUSH & PWA TYPES
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

