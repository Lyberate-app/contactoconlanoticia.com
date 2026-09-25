/**
 * LYBERATE — LOCAL STORAGE ADAPTER FOR DEVELOPMENT MOCK
 *
 * NOTE: Used strictly during development on PC when VITE_DATA_MODE=mock.
 * Pages NEVER access this directly; all interaction goes through services.
 */

import {
  MOCK_CATEGORIES,
  MOCK_AUTHOR,
  MOCK_ARTICLES,
  MOCK_TAGS,
  MOCK_ADS,
  MOCK_SUBMISSIONS,
  MOCK_MEDIA,
} from './mockData';
import type { AuthUser } from '../types/auth';
import type { PublicCategory } from '../types/category';
import type { PublicAuthor } from '../types/author';
import type { ArticleDetail, Tag, CreateArticlePayload, UpdateArticlePayload, DashboardStats } from '../types/article';
import type { AdCampaign } from '../types/ads';
import type { CitizenSubmission, ConvertSubmissionPayload } from '../types/submission';
import type { MediaItem, MediaUploadPayload, MediaUpdatePayload, MediaListResponse } from '../types/media';
import type { PushConfig, SubscribePushPayload, PushCandidate, PushCampaign, SendPushPayload, PushAnalyticsOverview } from '../types/push';
import type { ArticleEvent, GlobalAnalyticsOverview, ArticleAnalytics, TrendingArticle, MostReadArticle } from '../types/analytics';
import type { WhiteLabelConfig } from '../types/settings';
import { DEFAULT_WHITE_LABEL_CONFIG } from '../config/whiteLabelDefaults';

const KEYS = {
  AUTH_USER: 'lyberate_mock_auth_user',
  ARTICLES: 'lyberate_mock_articles',
  CATEGORIES: 'lyberate_mock_categories',
  AUTHOR: 'lyberate_mock_author',
  TAGS: 'lyberate_mock_tags',
  ADS: 'lyberate_mock_ads',
  SUBMISSIONS: 'lyberate_mock_submissions',
  MEDIA: 'lyberate_mock_media',
  PUSH_SUBSCRIPTIONS: 'lyberate_mock_push_subs',
  SETTINGS: 'lyberate_mock_settings',
  EVENTS: 'lyberate_mock_analytics_events',
  PUSH_CAMPAIGNS: 'lyberate_mock_push_campaigns',
  PUSH_CANDIDATES_DISMISSED: 'lyberate_mock_push_dismissed',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Non-blocking quota error in dev
  }
}

function removeItem(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Non-blocking
  }
}

// ---------------------------------------------------------------------------
// Auth Mock
// ---------------------------------------------------------------------------

export const mockStorage = {
  getAuthUser(): AuthUser | null {
    return getItem<AuthUser | null>(KEYS.AUTH_USER, null);
  },

  setAuthUser(user: AuthUser | null): void {
    if (user) {
      setItem(KEYS.AUTH_USER, user);
    } else {
      removeItem(KEYS.AUTH_USER);
    }
  },

  // ---------------------------------------------------------------------------
  // Categories & Taxonomy Mock
  // ---------------------------------------------------------------------------

  getCategories(): PublicCategory[] {
    const stored = getItem<PublicCategory[]>(KEYS.CATEGORIES, []);
    if (!stored || stored.length === 0) {
      setItem(KEYS.CATEGORIES, MOCK_CATEGORIES);
      return MOCK_CATEGORIES;
    }
    return stored;
  },

  getAuthor(): PublicAuthor {
    const stored = getItem<PublicAuthor>(KEYS.AUTHOR, MOCK_AUTHOR);
    if (!stored || !stored.avatar_url) {
      setItem(KEYS.AUTHOR, MOCK_AUTHOR);
      return MOCK_AUTHOR;
    }
    return stored;
  },

  getTags(): Tag[] {
    return getItem<Tag[]>(KEYS.TAGS, MOCK_TAGS);
  },

  // ---------------------------------------------------------------------------
  // Articles Mock
  // ---------------------------------------------------------------------------

  getArticles(): ArticleDetail[] {
    let stored = getItem<ArticleDetail[]>(KEYS.ARTICLES, []);
    if (!stored || stored.length === 0 || !stored.some((a) => a.featured_media?.url)) {
      setItem(KEYS.ARTICLES, MOCK_ARTICLES);
      return MOCK_ARTICLES;
    }
    // Auto-sync missing seed articles if new ones were added in code
    const existingUuids = new Set(stored.map((a) => a.article_uuid));
    const missing = MOCK_ARTICLES.filter((a) => !existingUuids.has(a.article_uuid));
    if (missing.length > 0) {
      stored = [...missing, ...stored];
      setItem(KEYS.ARTICLES, stored);
    }
    return stored;
  },

  getArticleByUuid(uuid: string): ArticleDetail | null {
    const articles = this.getArticles();
    return articles.find((a) => a.article_uuid === uuid) || null;
  },

  getArticleBySlug(slug: string): ArticleDetail | null {
    const articles = this.getArticles();
    return articles.find((a) => a.slug === slug) || null;
  },

  saveArticle(data: CreateArticlePayload): ArticleDetail {
    const articles = this.getArticles();
    const categories = this.getCategories();
    const author = this.getAuthor();

    const category = categories.find((c) => c.category_uuid === data.category_uuid) || categories[0];
    const uuid = 'art-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const newArticle: ArticleDetail = {
      article_uuid: uuid,
      title: data.title,
      subtitle: data.subtitle || null,
      excerpt: data.excerpt || null,
      content: data.content || '',
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      status: data.status || 'DRAFT',
      published_at: data.status === 'PUBLISHED' ? now : data.published_at || null,
      modified_at: null,
      created_at: now,
      updated_at: now,
      author_uuid: data.author_uuid || author.author_uuid,
      author_name: author.name,
      author_slug: author.slug,
      category_uuid: category.category_uuid,
      category_name: category.name,
      category_slug: category.slug,
      featured_media_uuid: data.featured_media_uuid || null,
      tags: data.tags?.map((t, idx) => ({ tag_uuid: `tag-${idx}`, name: t, slug: t.toLowerCase() })),
      seo: data.seo,
    };

    articles.unshift(newArticle);
    setItem(KEYS.ARTICLES, articles);
    return newArticle;
  },

  updateArticle(uuid: string, data: UpdateArticlePayload): ArticleDetail | null {
    const articles = this.getArticles();
    const index = articles.findIndex((a) => a.article_uuid === uuid);
    if (index === -1) return null;

    const existing = articles[index];
    const categories = this.getCategories();
    const category = data.category_uuid
      ? categories.find((c) => c.category_uuid === data.category_uuid) || existing
      : existing;

    const updatedTags = data.tags !== undefined
      ? data.tags.map((t, idx) => ({ tag_uuid: `tag-${idx}`, name: t, slug: t.toLowerCase() }))
      : existing.tags;

    const updated: ArticleDetail = {
      ...existing,
      ...data,
      tags: updatedTags,
      subtitle: data.subtitle !== undefined ? data.subtitle : existing.subtitle,
      excerpt: data.excerpt !== undefined ? data.excerpt : existing.excerpt,
      category_uuid: 'category_uuid' in category ? category.category_uuid : existing.category_uuid,
      category_name: 'name' in category ? category.name : existing.category_name,
      category_slug: 'slug' in category ? category.slug : existing.category_slug,
      modified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seo: data.seo || existing.seo,
    };

    articles[index] = updated;
    setItem(KEYS.ARTICLES, articles);
    return updated;
  },

  deleteArticle(uuid: string, permanent: boolean): void {
    let articles = this.getArticles();
    if (permanent) {
      articles = articles.filter((a) => a.article_uuid !== uuid);
    } else {
      articles = articles.map((a) => (a.article_uuid === uuid ? { ...a, status: 'TRASH' as const } : a));
    }
    setItem(KEYS.ARTICLES, articles);
  },

  restoreArticle(uuid: string): ArticleDetail | null {
    const articles = this.getArticles();
    const index = articles.findIndex((a) => a.article_uuid === uuid);
    if (index === -1) return null;
    articles[index] = {
      ...articles[index],
      status: 'DRAFT',
      modified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItem(KEYS.ARTICLES, articles);
    return articles[index];
  },

  // ---------------------------------------------------------------------------
  // Ads Mock
  // ---------------------------------------------------------------------------

  getAds(): AdCampaign[] {
    const stored = getItem<AdCampaign[]>(KEYS.ADS, []);
    if (!stored || stored.length === 0) {
      setItem(KEYS.ADS, MOCK_ADS);
      return MOCK_ADS;
    }
    return stored;
  },

  getAdById(uuid: string): AdCampaign | null {
    const ads = this.getAds();
    return ads.find((a) => a.campaign_uuid === uuid) || null;
  },

  saveAd(data: Partial<AdCampaign>): AdCampaign {
    const list = this.getAds();
    const newAd: AdCampaign = {
      campaign_uuid: 'cmp-' + Math.random().toString(36).substring(2, 9),
      tenant_uuid: 'ten-001',
      site_uuid: 'ste-001',
      company_name: data.company_name || 'Compañía Anunciante',
      campaign_name: data.campaign_name || 'Campaña Comercial',
      ad_type: data.ad_type || 'BANNER',
      location: data.location || 'HEADER_BANNER',
      start_at: data.start_at || null,
      end_at: data.end_at || null,
      target_url: data.target_url || '#',
      media_uuid: data.media_uuid || null,
      media_url: data.media_url || null,
      media_alt: data.media_alt || data.company_name || 'Anuncio publicitario',
      active: data.active ?? true,
      impressions_count: 0,
      clicks_count: 0,
      ctr: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newAd);
    setItem(KEYS.ADS, list);
    return newAd;
  },

  updateAd(uuid: string, data: Partial<AdCampaign>): AdCampaign | null {
    const list = this.getAds();
    const index = list.findIndex((a) => a.campaign_uuid === uuid);
    if (index === -1) return null;
    const existing = list[index];
    const updated: AdCampaign = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    setItem(KEYS.ADS, list);
    return updated;
  },

  deleteAd(uuid: string): boolean {
    let list = this.getAds();
    const initialLen = list.length;
    list = list.filter((a) => a.campaign_uuid !== uuid);
    if (list.length === initialLen) return false;
    setItem(KEYS.ADS, list);
    return true;
  },

  recordAdImpression(campaignUuid: string): void {
    const list = this.getAds();
    const ad = list.find((a) => a.campaign_uuid === campaignUuid);
    if (ad) {
      ad.impressions_count = (ad.impressions_count || 0) + 1;
      ad.ctr = ad.impressions_count > 0 ? (ad.clicks_count / ad.impressions_count) * 100 : 0;
      setItem(KEYS.ADS, list);
    }
  },

  recordAdClick(campaignUuid: string): string | null {
    const list = this.getAds();
    const ad = list.find((a) => a.campaign_uuid === campaignUuid);
    if (ad) {
      ad.clicks_count = (ad.clicks_count || 0) + 1;
      ad.ctr = ad.impressions_count > 0 ? (ad.clicks_count / ad.impressions_count) * 100 : 0;
      setItem(KEYS.ADS, list);
      return ad.target_url || null;
    }
    return null;
  },

  // ---------------------------------------------------------------------------
  // Submissions Mock
  // ---------------------------------------------------------------------------

  getSubmissions(): CitizenSubmission[] {
    const stored = getItem<CitizenSubmission[]>(KEYS.SUBMISSIONS, []);
    if (!stored || stored.length === 0) {
      setItem(KEYS.SUBMISSIONS, MOCK_SUBMISSIONS);
      return MOCK_SUBMISSIONS;
    }
    return stored;
  },

  getSubmissionById(uuid: string): CitizenSubmission | null {
    const list = this.getSubmissions();
    return list.find((s) => s.submission_uuid === uuid) || null;
  },

  addSubmission(submission: Partial<CitizenSubmission>): CitizenSubmission {
    const list = this.getSubmissions();
    const newSub: CitizenSubmission = {
      submission_uuid: 'sub-' + Math.random().toString(36).substring(2, 9),
      tenant_uuid: 'ten-001',
      site_uuid: 'ste-001',
      submitter_name: submission.submitter_name || 'Ciudadano',
      contact_email: submission.contact_email || null,
      contact_phone: submission.contact_phone || null,
      location: submission.location || 'Local',
      title: submission.title || 'Sin título',
      description: submission.description || '',
      message: submission.message || null,
      video_url: submission.video_url || null,
      attachments: [],
      status: 'PENDING_REVIEW',
      rejection_reason: null,
      reviewed_by_user_uuid: null,
      reviewed_at: null,
      converted_article_uuid: null,
      assigned_author_uuid: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newSub);
    setItem(KEYS.SUBMISSIONS, list);
    return newSub;
  },

  rejectSubmission(uuid: string, reason: string): CitizenSubmission | null {
    const list = this.getSubmissions();
    const sub = list.find((s) => s.submission_uuid === uuid);
    if (!sub) return null;
    sub.status = 'REJECTED';
    sub.rejection_reason = reason;
    sub.reviewed_at = new Date().toISOString();
    sub.updated_at = new Date().toISOString();
    setItem(KEYS.SUBMISSIONS, list);
    return sub;
  },

  convertSubmission(
    uuid: string,
    overrides?: ConvertSubmissionPayload
  ): { submission: CitizenSubmission; article: ArticleDetail } {
    const list = this.getSubmissions();
    const sub = list.find((s) => s.submission_uuid === uuid);
    if (!sub) throw new Error('Reporte no encontrado.');

    const article = this.saveArticle({
      title: overrides?.title || sub.title,
      subtitle: overrides?.subtitle || null,
      excerpt: overrides?.excerpt || sub.description.slice(0, 150),
      content: sub.description,
      author_uuid: overrides?.author_uuid,
      category_uuid: overrides?.category_uuid,
      status: 'DRAFT',
    });

    sub.status = 'CONVERTED';
    sub.converted_article_uuid = article.article_uuid;
    sub.reviewed_at = new Date().toISOString();
    sub.updated_at = new Date().toISOString();
    setItem(KEYS.SUBMISSIONS, list);

    return { submission: sub, article };
  },

  // ---------------------------------------------------------------------------
  // Media Mock
  // ---------------------------------------------------------------------------

  getMedia(params: {
    page?: number;
    limit?: number;
    search?: string;
    mime_type?: string;
  } = {}): MediaListResponse {
    let list = getItem<MediaItem[]>(KEYS.MEDIA, []);
    if (!list || list.length === 0) {
      setItem(KEYS.MEDIA, MOCK_MEDIA);
      list = [...MOCK_MEDIA];
    }

    if (params.mime_type) {
      list = list.filter((m) => m.mime_type.toLowerCase().includes(params.mime_type!.toLowerCase()));
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.filename.toLowerCase().includes(q) ||
          (m.title && m.title.toLowerCase().includes(q)) ||
          (m.alt_text && m.alt_text.toLowerCase().includes(q)) ||
          (m.caption && m.caption.toLowerCase().includes(q)) ||
          (m.credit && m.credit.toLowerCase().includes(q))
      );
    }

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 16);
    const total = list.length;
    const total_pages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const items = list.slice(offset, offset + limit);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        total_pages,
      },
    };
  },

  getAllMedia(): MediaItem[] {
    const stored = getItem<MediaItem[]>(KEYS.MEDIA, []);
    if (!stored || stored.length === 0) {
      setItem(KEYS.MEDIA, MOCK_MEDIA);
      return MOCK_MEDIA;
    }
    return stored;
  },

  getMediaByUuid(uuid: string): MediaItem | null {
    const list = this.getAllMedia();
    return list.find((m) => m.media_uuid === uuid) || null;
  },

  saveMedia(payload: MediaUploadPayload): MediaItem {
    const list = this.getAllMedia();
    const uuid = 'med-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    let url = payload.url;
    let filename = 'subida-editorial.jpg';
    let mime_type = 'image/jpeg';
    let filesize_bytes = 450000;
    const width = 1200;
    const height = 675;

    if (payload.file) {
      filename = payload.file.name;
      mime_type = payload.file.type || 'image/jpeg';
      filesize_bytes = payload.file.size || 350000;
      try {
        url = URL.createObjectURL(payload.file);
      } catch {
        url = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';
      }
    } else if (!url) {
      url = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';
    }

    const newItem: MediaItem = {
      media_uuid: uuid,
      tenant_uuid: 'ten-001',
      site_uuid: 'ste-001',
      filename,
      title: payload.title || filename.replace(/\.[^/.]+$/, ''),
      mime_type,
      filesize_bytes,
      width,
      height,
      url,
      alt_text: payload.alt_text || payload.title || 'Imagen editorial de Contacto con la Noticia',
      caption: payload.caption || null,
      credit: payload.credit || 'Redacción / Contacto con la Noticia',
      created_at: now,
      updated_at: null,
    };

    list.unshift(newItem);
    setItem(KEYS.MEDIA, list);
    return newItem;
  },

  updateMedia(uuid: string, data: MediaUpdatePayload): MediaItem | null {
    const list = this.getAllMedia();
    const index = list.findIndex((m) => m.media_uuid === uuid);
    if (index === -1) return null;

    const existing = list[index];
    const updated: MediaItem = {
      ...existing,
      title: data.title !== undefined ? data.title : existing.title,
      alt_text: data.alt_text !== undefined ? data.alt_text : existing.alt_text,
      caption: data.caption !== undefined ? data.caption : existing.caption,
      credit: data.credit !== undefined ? data.credit : existing.credit,
      updated_at: new Date().toISOString(),
    };

    list[index] = updated;
    setItem(KEYS.MEDIA, list);
    return updated;
  },

  deleteMedia(uuid: string): boolean {
    let list = this.getAllMedia();
    const initialLen = list.length;
    list = list.filter((m) => m.media_uuid !== uuid);
    if (list.length === initialLen) return false;
    setItem(KEYS.MEDIA, list);
    return true;
  },

  // ---------------------------------------------------------------------------
  // Dashboard Stats
  // ---------------------------------------------------------------------------

  getDashboardStats(): DashboardStats {
    const articles = this.getArticles();
    const media = this.getAllMedia();
    const ads = this.getAds();
    const submissions = this.getSubmissions();

    return {
      total_articles: articles.length,
      published_articles: articles.filter((a) => a.status === 'PUBLISHED').length,
      draft_articles: articles.filter((a) => a.status === 'DRAFT').length,
      pending_review_articles: articles.filter((a) => a.status === 'PENDING_REVIEW').length,
      scheduled_articles: articles.filter((a) => a.status === 'SCHEDULED').length,
      archived_articles: articles.filter((a) => a.status === 'ARCHIVED').length,
      trash_articles: articles.filter((a) => a.status === 'TRASH').length,
      total_media: media.length,
      total_ads: ads.length,
      pending_submissions: submissions.filter((s) => s.status === 'PENDING_REVIEW').length,
    };
  },

  // ---------------------------------------------------------------------------
  // Push Notification Mock
  // ---------------------------------------------------------------------------

  getPushConfig(): PushConfig {
    return {
      enabled: true,
      public_key: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxTuT1uvV22Bl5gBV5iG5OJel6Aep1302U10Kss8',
      available_topics: [
        { id: 'breaking', name: 'Última Hora' },
        { id: 'regionales', name: 'Noticias Regionales' },
        { id: 'sucesos', name: 'Sucesos' },
        { id: 'comunidades', name: 'Comunidades' },
      ],
    };
  },

  subscribePush(payload: SubscribePushPayload): void {
    const list = getItem<SubscribePushPayload[]>(KEYS.PUSH_SUBSCRIPTIONS, []);
    const filtered = list.filter((s) => s.endpoint !== payload.endpoint);
    filtered.push(payload);
    setItem(KEYS.PUSH_SUBSCRIPTIONS, filtered);
  },

  unsubscribePush(endpoint: string): void {
    const list = getItem<SubscribePushPayload[]>(KEYS.PUSH_SUBSCRIPTIONS, []);
    const filtered = list.filter((s) => s.endpoint !== endpoint);
    setItem(KEYS.PUSH_SUBSCRIPTIONS, filtered);
  },

  updatePushPreferences(endpoint: string, topics: string[]): void {
    const list = getItem<SubscribePushPayload[]>(KEYS.PUSH_SUBSCRIPTIONS, []);
    const sub = list.find((s) => s.endpoint === endpoint);
    if (sub) {
      sub.topics = topics;
      setItem(KEYS.PUSH_SUBSCRIPTIONS, list);
    }
  },

  // ---------------------------------------------------------------------------
  // White-Label & System Branding Settings Mock
  // ---------------------------------------------------------------------------

  getSettings(): WhiteLabelConfig {
    const stored = getItem<WhiteLabelConfig | null>(KEYS.SETTINGS, null);
    if (!stored) {
      setItem(KEYS.SETTINGS, DEFAULT_WHITE_LABEL_CONFIG);
      return DEFAULT_WHITE_LABEL_CONFIG;
    }
    // Deep merge with defaults to ensure schema migrations don't break existing local storage
    return {
      ...DEFAULT_WHITE_LABEL_CONFIG,
      ...stored,
      identity: { ...DEFAULT_WHITE_LABEL_CONFIG.identity, ...stored.identity },
      logos: { ...DEFAULT_WHITE_LABEL_CONFIG.logos, ...stored.logos },
      colors: { ...DEFAULT_WHITE_LABEL_CONFIG.colors, ...stored.colors },
      typography: { ...DEFAULT_WHITE_LABEL_CONFIG.typography, ...stored.typography },
      pwa: { ...DEFAULT_WHITE_LABEL_CONFIG.pwa, ...stored.pwa },
      social: { ...DEFAULT_WHITE_LABEL_CONFIG.social, ...stored.social },
      features: { ...DEFAULT_WHITE_LABEL_CONFIG.features, ...stored.features },
    };
  },

  updateSettings(partial: Partial<WhiteLabelConfig>): WhiteLabelConfig {
    const current = this.getSettings();
    const updated: WhiteLabelConfig = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
      identity: partial.identity ? { ...current.identity, ...partial.identity } : current.identity,
      logos: partial.logos ? { ...current.logos, ...partial.logos } : current.logos,
      colors: partial.colors ? { ...current.colors, ...partial.colors } : current.colors,
      typography: partial.typography ? { ...current.typography, ...partial.typography } : current.typography,
      pwa: partial.pwa ? { ...current.pwa, ...partial.pwa } : current.pwa,
      social: partial.social ? { ...current.social, ...partial.social } : current.social,
      features: partial.features ? { ...current.features, ...partial.features } : current.features,
    };
    setItem(KEYS.SETTINGS, updated);
    return updated;
  },

  resetSettings(): WhiteLabelConfig {
    setItem(KEYS.SETTINGS, DEFAULT_WHITE_LABEL_CONFIG);
    return DEFAULT_WHITE_LABEL_CONFIG;
  },

  // ---------------------------------------------------------------------------
  // Analytics & Telemetry Methods
  // ---------------------------------------------------------------------------

  saveEvent(event: ArticleEvent): void {
    const events = getItem<ArticleEvent[]>(KEYS.EVENTS, []);
    events.push({
      ...event,
      event_uuid: event.event_uuid || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    });
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    setItem(KEYS.EVENTS, events);

    if (event.event_type === 'article_view' && event.article_uuid) {
      const articles = this.getArticles();
      const idx = articles.findIndex((a) => a.article_uuid === event.article_uuid);
      if (idx !== -1) {
        (articles[idx] as any).views_count = ((articles[idx] as any).views_count || 0) + 1;
        setItem(KEYS.ARTICLES, articles);
      }
    }
  },

  getGlobalAnalyticsOverview(period: 'today' | '24h' | '7d' | '30d' = '24h'): GlobalAnalyticsOverview {
    const articles = this.getArticles();
    const categories = this.getCategories();
    const totalViews = articles.reduce((acc, a) => acc + ((a as any).views_count || 120), 0);

    return {
      period,
      views_today: Math.round(totalViews * 0.35) + 1420,
      views_today_growth: 14.8,
      views_24h: totalViews || 48392,
      views_24h_growth: 18.2,
      unique_visitors_today: Math.round(totalViews * 0.22) + 980,
      reads_count: Math.round(totalViews * 0.68),
      read_ratio: 68.4,
      articles_viewed_count: articles.length,
      published_articles_count: articles.filter((a) => a.status === 'PUBLISHED').length,
      trending_articles_count: Math.min(articles.length, 5),
      push_total_clicks: 1840,
      push_avg_ctr: 8.6,
      top_categories: categories.slice(0, 5).map((c, i) => ({
        category_name: c.name,
        slug: c.slug,
        views_count: Math.round(totalViews * (0.35 / (i + 1))),
        growth_percent: +(12.5 - i * 1.8).toFixed(1),
        articles_count: articles.filter((a) => a.category_slug === c.slug).length || 3,
      })),
      top_authors: [
        {
          author_name: 'Carlos Mendoza',
          slug: 'carlos-mendoza',
          articles_count: 14,
          total_views: 24500,
          avg_views: 1750,
        },
        {
          author_name: 'Elena Rodríguez',
          slug: 'elena-rodriguez',
          articles_count: 9,
          total_views: 18200,
          avg_views: 2022,
        },
      ],
      recent_history: [
        { label: '00:00', views: 320, reads: 210, push_clicks: 14 },
        { label: '04:00', views: 180, reads: 110, push_clicks: 5 },
        { label: '08:00', views: 1840, reads: 1250, push_clicks: 110 },
        { label: '12:00', views: 3420, reads: 2410, push_clicks: 340 },
        { label: '16:00', views: 2890, reads: 1980, push_clicks: 220 },
        { label: '20:00', views: 4120, reads: 2950, push_clicks: 410 },
      ],
      hourly_traffic: [
        { hour: '06h', views: 820 },
        { hour: '08h', views: 2150 },
        { hour: '10h', views: 3400 },
        { hour: '12h', views: 4200 },
        { hour: '14h', views: 3100 },
        { hour: '16h', views: 3890 },
        { hour: '18h', views: 4600 },
        { hour: '20h', views: 5120 },
        { hour: '22h', views: 2800 },
      ],
      device_breakdown: [
        { device: 'mobile', count: Math.round(totalViews * 0.72), percentage: 72 },
        { device: 'desktop', count: Math.round(totalViews * 0.22), percentage: 22 },
        { device: 'tablet', count: Math.round(totalViews * 0.06), percentage: 6 },
      ],
    };
  },

  getArticleAnalytics(articleUuid: string): ArticleAnalytics {
    const article = this.getArticleByUuid(articleUuid);
    const views = (article as any)?.views_count || 1250;

    return {
      article_uuid: articleUuid,
      title: article?.title || 'Artículo periodístico',
      slug: article?.slug || 'articulo-periodistico',
      views_total: views,
      views_24h: Math.round(views * 0.45),
      views_7d: Math.round(views * 0.85),
      unique_visitors_24h: Math.round(views * 0.38),
      reads_count: Math.round(views * 0.65),
      read_ratio: 65,
      avg_read_time_seconds: 142,
      shares_count: Math.round(views * 0.08),
      push_clicks_count: Math.round(views * 0.12),
      trend_score: 87,
      growth_rate_percent: 24.5,
      top_sources: [
        { source: 'Directo / Portada', count: Math.round(views * 0.42), percentage: 42 },
        { source: 'Web Push', count: Math.round(views * 0.28), percentage: 28 },
        { source: 'Redes Sociales', count: Math.round(views * 0.18), percentage: 18 },
        { source: 'Búsqueda Orgánica', count: Math.round(views * 0.12), percentage: 12 },
      ],
      top_devices: [
        { device: 'mobile', count: Math.round(views * 0.74), percentage: 74 },
        { device: 'desktop', count: Math.round(views * 0.21), percentage: 21 },
        { device: 'tablet', count: Math.round(views * 0.05), percentage: 5 },
      ],
      last_calculated_at: new Date().toISOString(),
    };
  },

  getTrendingArticles(limit: number = 5): TrendingArticle[] {
    const articles = this.getArticles().filter((a) => a.status === 'PUBLISHED');
    const sorted = [...articles].sort((a, b) => ((b as any).views_count || 0) - ((a as any).views_count || 0));

    return sorted.slice(0, limit).map((a, i) => ({
      article_uuid: a.article_uuid,
      title: a.title,
      slug: a.slug,
      category_name: a.category_name || 'General',
      category_slug: a.category_slug || 'general',
      author_name: a.author_name || 'Redacción',
      views_count: (a as any).views_count || 1200 - i * 150,
      views_recent_3h: 340 - i * 45,
      trend_score: Math.max(95 - i * 8, 40),
      published_at: a.published_at || new Date().toISOString(),
      featured_media: a.featured_media ? {
        url: a.featured_media.url,
        alt_text: a.featured_media.alt_text,
      } : undefined,
    }));
  },

  getMostReadArticles(limit: number = 5): MostReadArticle[] {
    const articles = this.getArticles().filter((a) => a.status === 'PUBLISHED');
    const sorted = [...articles].sort((a, b) => ((b as any).views_count || 0) - ((a as any).views_count || 0));

    return sorted.slice(0, limit).map((a, i) => ({
      article_uuid: a.article_uuid,
      title: a.title,
      slug: a.slug,
      category_name: a.category_name || 'General',
      category_slug: a.category_slug || 'general',
      author_name: a.author_name || 'Redacción',
      views_count: (a as any).views_count || 3400 - i * 400,
      published_at: a.published_at || new Date().toISOString(),
      featured_media: a.featured_media ? {
        url: a.featured_media.url,
        alt_text: a.featured_media.alt_text,
      } : undefined,
    }));
  },

  // ---------------------------------------------------------------------------
  // Smart Push & Engagement Methods
  // ---------------------------------------------------------------------------

  getPushCandidates(): PushCandidate[] {
    const dismissed = getItem<string[]>(KEYS.PUSH_CANDIDATES_DISMISSED, []);
    const articles = this.getArticles().filter((a) => a.status === 'PUBLISHED');

    const defaultCandidates: PushCandidate[] = [
      {
        candidate_id: 'cand-1',
        article_uuid: articles[0]?.article_uuid || 'art-001',
        title: articles[0]?.title || 'Avanza el plan de infraestructura vial regional',
        slug: articles[0]?.slug || 'infraestructura-vial',
        category_name: articles[0]?.category_name || 'Región',
        trend_score: 94,
        views_total: 4820,
        views_recent_3h: 890,
        growth_rate_percent: 180,
        reason: 'Aceleración inusual de lecturas en los últimos 45 minutos (+180%).',
        suggested_title: '🔴 ÚLTIMA HORA: Novedades clave en vialidad regional',
        suggested_message: 'Conoce los detalles de las obras anunciadas para este mes.',
        topic_id: 'breaking',
        created_at: new Date().toISOString(),
      },
      {
        candidate_id: 'cand-2',
        article_uuid: articles[1]?.article_uuid || 'art-002',
        title: articles[1]?.title || 'Nuevas medidas para el sector comercial en el centro',
        slug: articles[1]?.slug || 'medidas-comercio',
        category_name: articles[1]?.category_name || 'Economía',
        trend_score: 82,
        views_total: 3120,
        views_recent_3h: 540,
        growth_rate_percent: 95,
        reason: 'Alto ratio de lectura completa (>74%) y compartidos en WhatsApp.',
        suggested_title: 'Comercio central: Nuevas pautas operativas confirmadas',
        suggested_message: 'Entérate cómo afectará la nueva ordenanza a los comerciantes locales.',
        topic_id: 'economy',
        created_at: new Date().toISOString(),
      },
    ];

    return defaultCandidates.filter((c) => !dismissed.includes(c.candidate_id));
  },

  dispatchPushCampaign(payload: SendPushPayload): { success: boolean; campaign?: PushCampaign; error?: string } {
    const campaigns = getItem<PushCampaign[]>(KEYS.PUSH_CAMPAIGNS, []);

    const newCampaign: PushCampaign = {
      campaign_uuid: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      article_uuid: payload.article_uuid,
      title: payload.title,
      message: payload.message,
      topic_id: payload.topic_id,
      mode: payload.mode,
      status: 'sent',
      recipients_count: 1420,
      clicks_count: 0,
      ctr: 0,
      sent_at: new Date().toISOString(),
      reason: 'Despacho manual/inteligente aprobado por redacción',
    };

    campaigns.unshift(newCampaign);
    setItem(KEYS.PUSH_CAMPAIGNS, campaigns);

    const candidates = this.getPushCandidates();
    const match = candidates.find((c) => c.article_uuid === payload.article_uuid);
    if (match) {
      this.dismissPushCandidate(match.candidate_id);
    }

    return {
      success: true,
      campaign: newCampaign,
    };
  },

  dismissPushCandidate(candidateId: string): boolean {
    const dismissed = getItem<string[]>(KEYS.PUSH_CANDIDATES_DISMISSED, []);
    if (!dismissed.includes(candidateId)) {
      dismissed.push(candidateId);
      setItem(KEYS.PUSH_CANDIDATES_DISMISSED, dismissed);
    }
    return true;
  },

  getPushAnalyticsOverview(): PushAnalyticsOverview {
    const campaigns = getItem<PushCampaign[]>(KEYS.PUSH_CAMPAIGNS, []);

    const defaultRecent: PushCampaign[] = campaigns.length > 0 ? campaigns : [
      {
        campaign_uuid: 'camp-demo-1',
        article_uuid: 'art-demo-1',
        title: 'Alerta informativa: Actualización de transporte público',
        message: 'Conoce los nuevos horarios y frecuencias anunciados para hoy.',
        topic_id: 'breaking',
        mode: 'editorial_breaking',
        status: 'sent',
        recipients_count: 3240,
        clicks_count: 382,
        ctr: 11.8,
        sent_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];

    const totalSent = defaultRecent.reduce((acc, c) => acc + c.recipients_count, 0);
    const totalClicks = defaultRecent.reduce((acc, c) => acc + c.clicks_count, 0);
    const avgCtr = totalSent > 0 ? +((totalClicks / totalSent) * 100).toFixed(1) : 9.4;

    return {
      total_sent: totalSent || 8420,
      total_delivered: totalSent ? Math.round(totalSent * 0.96) : 8080,
      total_clicks: totalClicks || 790,
      avg_ctr: avgCtr,
      last_campaign_at: defaultRecent[0]?.sent_at || null,
      global_cooldown_remaining_minutes: 0,
      recent_campaigns: defaultRecent,
    };
  },

  // ---------------------------------------------------------------------------
  // Maintenance & Developer Reset Utility
  // ---------------------------------------------------------------------------

  resetToDefaults(): void {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((k) => removeItem(k));
    setItem(KEYS.ARTICLES, MOCK_ARTICLES);
    setItem(KEYS.CATEGORIES, MOCK_CATEGORIES);
    setItem(KEYS.AUTHOR, MOCK_AUTHOR);
    setItem(KEYS.TAGS, MOCK_TAGS);
    setItem(KEYS.ADS, MOCK_ADS);
    setItem(KEYS.SUBMISSIONS, MOCK_SUBMISSIONS);
    setItem(KEYS.MEDIA, MOCK_MEDIA);
    setItem(KEYS.SETTINGS, DEFAULT_WHITE_LABEL_CONFIG);
  },
};

// Expose dev helpers on window for interactive testing and cache refreshing
if (typeof window !== 'undefined') {
  (window as unknown as { __LYBERATE_MOCK__: unknown }).__LYBERATE_MOCK__ = {
    reset: () => {
      mockStorage.resetToDefaults();
      window.location.reload();
    },
    getStats: () => mockStorage.getDashboardStats(),
    dump: () => {
      const dumpData: Record<string, unknown> = {};
      Object.entries(KEYS).forEach(([name, key]) => {
        try {
          const raw = window.localStorage.getItem(key);
          dumpData[name] = raw ? JSON.parse(raw) : null;
        } catch {
          dumpData[name] = null;
        }
      });
      return dumpData;
    },
  };
}
