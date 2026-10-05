/**
 * LYBERATE — ARTICLE VERSION HISTORY & DIFF CONTRACTS
 */

import type { ArticleStatus } from './article';

export interface ArticleVersionSnapshot {
  version_id: string;
  article_uuid: string;
  timestamp: string;
  author_uuid: string;
  author_name: string;
  title: string;
  slug?: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content: string;
  word_count: number;
  status: ArticleStatus;
  summary_note?: string | null;
  is_autosave: boolean;
}

export interface VersionDiffResult {
  fromVersionId: string;
  toVersionId: string;
  wordDiff: number;
  titleChanged: boolean;
  contentChanged: boolean;
  timestamp: string;
}

