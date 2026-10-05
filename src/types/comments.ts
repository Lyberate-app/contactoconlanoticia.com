/**
 * LYBERATE — CITIZEN COMMENTS & REACTIONS TYPES
 */

export type CommentStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface ArticleComment {
  comment_uuid: string;
  article_uuid: string;
  author_name: string;
  author_email?: string;
  location?: string;
  content: string;
  created_at: string;
  likes_count: number;
  status: CommentStatus;
  is_verified?: boolean;
  parent_uuid?: string | null;
}

export interface NewCommentPayload {
  article_uuid: string;
  author_name: string;
  author_email?: string;
  location?: string;
  content: string;
  parent_uuid?: string | null;
}
