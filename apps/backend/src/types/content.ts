/**
 * types/content.ts — Phase D-4 Sub-3: Content CMS types (Backend local mirror)
 *
 * ★ Backend uses this file (rootDir: src prevents importing from packages/)
 *   FE chats (WeeeR/WeeeT/WeeeU/Admin/Website) import จาก
 *   packages/shared/dal/content.types.ts เท่านั้น
 *
 * Tables: content_pages + content_images + content_versions
 * CMD: 362813ec-7277-8145-8148-ddd74c4222d2
 * Schema Plan: 362813ec-7277-81be-b041-e669c1b24b77
 *
 * Business rules (HUB approved D4-Sub3 T+0.5):
 *   #1 slug → Global unique
 *   #2 DELETE → Hard delete; reject if published (409)
 *   #3 Preview token → In-memory Map, TTL 24h
 *   #4 Version history → Save body to content_versions on every PUT
 *   #5 Seed → draft status
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

// ── Page DTO ──────────────────────────────────────────────────────────────────
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

// ── Delete result ─────────────────────────────────────────────────────────────
export type DeletePageResult = 'ok' | 'not_found' | 'published'
