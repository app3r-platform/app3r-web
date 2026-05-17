/**
 * content.types.ts — Phase D-4 Sub-3: Platform Content CMS shared types
 *
 * ★ SOURCE-OF-TRUTH (Lesson #34 / memory #26)
 *   WeeeR + WeeeT + WeeeU + Admin + Website import จาก ที่นี่เท่านั้น
 *   ห้าม import จาก backend src โดยตรง
 *
 * Tables: content_pages + content_images + content_versions
 * CMD: 362813ec-7277-8145-8148-ddd74c4222d2
 * Schema Plan: 362813ec-7277-81be-b041-e669c1b24b77
 */

// ── Status & Type ──────────────────────────────────────────────────────────────
export type ContentType = 'hero' | 'about' | 'faq' | 'static'
export type ContentStatus = 'draft' | 'published'

// ── Image DTO ──────────────────────────────────────────────────────────────────
export interface ContentImageDto {
  id: string
  contentPageId: string
  url: string           // public R2 URL
  r2Key: string
  alt: string | null
  caption: string | null
  order: number
  createdAt: string     // ISO-8601
}

// ── Version DTO ────────────────────────────────────────────────────────────────
export interface ContentVersionDto {
  id: string
  contentPageId: string
  version: number
  body: Record<string, unknown>
  publishedAt: string | null
  authorId: string | null
  createdAt: string     // ISO-8601
}

// ── Page DTO (list / detail without images) ────────────────────────────────────
export interface ContentPageDto {
  id: string
  slug: string
  type: ContentType
  title: string
  body: Record<string, unknown>
  status: ContentStatus
  version: number
  authorId: string | null
  publishedAt: string | null  // ISO-8601
  createdAt: string
  updatedAt: string
}

// ── Page Detail DTO (includes images) ─────────────────────────────────────────
export interface ContentPageDetailDto extends ContentPageDto {
  images: ContentImageDto[]
}

// ── Create / Update Inputs ─────────────────────────────────────────────────────
export interface CreateContentPageInput {
  slug: string
  type: ContentType
  title: string
  body: Record<string, unknown>
}

export interface UpdateContentPageInput {
  title?: string
  body?: Record<string, unknown>
  slug?: string
}

// ── Upload Image Input ─────────────────────────────────────────────────────────
export interface UploadContentImageInput {
  contentPageId: string
  alt?: string
  caption?: string
  order?: number
}

// ── Preview Token DTO (in-memory TTL 24h) ──────────────────────────────────────
export interface ContentPreviewTokenDto {
  token: string
  contentPageId: string
  expiresAt: string   // ISO-8601
}
