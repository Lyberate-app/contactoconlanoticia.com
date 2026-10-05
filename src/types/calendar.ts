/**
 * LYBERATE — EDITORIAL CALENDAR CONTRACTS
 */

export type CalendarItemType =
  | 'SCHEDULED_ARTICLE'
  | 'PENDING_REVIEW'
  | 'PUBLISHED_ARTICLE'
  | 'AD_CAMPAIGN_START'
  | 'AD_CAMPAIGN_END';

export interface CalendarItem {
  id: string;
  title: string;
  type: CalendarItemType;
  date: string;
  status: string;
  category_name?: string;
  author_name?: string;
  advertiser_name?: string;
  article_uuid?: string;
  campaign_uuid?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export type CalendarViewMode = 'month' | 'week' | 'list';

