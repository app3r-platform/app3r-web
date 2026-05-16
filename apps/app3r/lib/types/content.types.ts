// ============================================================
// lib/types/content.types.ts — Stub mirror ของ ContentPage DTOs
// Phase D-4 Sub-3 — ห้าม import จาก packages/shared/dal/ โดยตรง (Lesson #33)
// ============================================================

export type ContentType = 'hero' | 'about' | 'faq' | 'static';
export type ContentStatus = 'draft' | 'published';

export interface ContentImageDto {
  id: string;
  contentPageId: string;
  url: string;
  r2Key: string;
  alt: string | null;
  caption: string | null;
  order: number;
  createdAt: string;
}

export interface ContentPageDto {
  id: string;
  slug: string;
  type: ContentType;
  title: string;
  body: Record<string, unknown>;
  status: ContentStatus;
  version: number;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPageDetailDto extends ContentPageDto {
  images: ContentImageDto[];
}

export interface ContentPreviewTokenDto {
  token: string;
  contentPageId: string;
  expiresAt: string;
}
