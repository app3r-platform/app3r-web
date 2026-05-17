/**
 * services/content-service.ts — Phase D-4 Sub-3: Platform Content CMS
 *
 * Business rules (HUB approved D4-Sub3 T+0.5):
 *   Rule #1: slug → Global unique across all pages
 *   Rule #2: DELETE → Hard delete; reject if status = 'published' (409)
 *   Rule #3: Preview token → In-memory Map, TTL 24h (no DB table)
 *   Rule #4: Version history → Save body to content_versions on every PUT
 *   Rule #5: Seed data → draft status
 *
 * Public endpoints (no auth):
 *   - listPublishedPages(type): published only, by type
 *   - getPageBySlug(slug, token?): published OR valid preview token
 *
 * Admin endpoints (auth required):
 *   - listAllPages(): all statuses
 *   - createPage(): slug unique → 409 on conflict
 *   - updatePage(): saves version first, then updates
 *   - deletePage(): hard delete, reject if published
 *   - publishPage(): status = published, publishedAt = now
 *   - createPreviewToken(): in-memory Map, TTL 24h
 *   - addImage(): store ContentImageDto after R2 upload
 *
 * CMD: 362813ec-7277-8145-8148-ddd74c4222d2
 * Schema Plan: 362813ec-7277-81be-b041-e669c1b24b77
 */
import { db } from '../db/client'
import { contentPages, contentImages, contentVersions } from '../db/schema/content'
import { eq, and, desc, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type {
  ContentPageDto,
  ContentPageDetailDto,
  ContentImageDto,
  ContentVersionDto,
  ContentPreviewTokenDto,
  CreateContentPageInput,
  UpdateContentPageInput,
  UploadContentImageInput,
  DeletePageResult,
} from '../types/content'

// ── In-memory Preview Token Map (Rule #3) ─────────────────────────────────────
interface PreviewTokenEntry {
  contentPageId: string
  expiresAt: Date
}
const previewTokenMap = new Map<string, PreviewTokenEntry>()

// ── Mappers ───────────────────────────────────────────────────────────────────
function mapPageToDto(row: typeof contentPages.$inferSelect): ContentPageDto {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type as ContentPageDto['type'],
    title: row.title,
    body: row.body as Record<string, unknown>,
    status: row.status as ContentPageDto['status'],
    version: row.version,
    authorId: row.authorId ?? null,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapImageToDto(row: typeof contentImages.$inferSelect): ContentImageDto {
  return {
    id: row.id,
    contentPageId: row.contentPageId,
    url: row.url,
    r2Key: row.r2Key,
    alt: row.alt ?? null,
    caption: row.caption ?? null,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
  }
}

async function fetchImages(contentPageId: string): Promise<ContentImageDto[]> {
  const rows = await db
    .select()
    .from(contentImages)
    .where(eq(contentImages.contentPageId, contentPageId))
    .orderBy(contentImages.order)
  return rows.map(mapImageToDto)
}

// ── Public: list published pages by type ──────────────────────────────────────
export async function listPublishedPages(type: string): Promise<ContentPageDto[]> {
  const rows = await db
    .select()
    .from(contentPages)
    .where(and(
      eq(contentPages.status, 'published'),
      eq(contentPages.type, type),
    ))
    .orderBy(desc(contentPages.publishedAt))
  return rows.map(mapPageToDto)
}

// ── Public: get page by slug (published OR valid preview token) ───────────────
export async function getPageBySlug(
  slug: string,
  previewToken?: string,
): Promise<ContentPageDetailDto | null> {
  const [page] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.slug, slug))
  if (!page) return null

  if (page.status !== 'published') {
    // Check in-memory preview token (Rule #3)
    if (!previewToken) return null
    const entry = previewTokenMap.get(previewToken)
    if (!entry || entry.contentPageId !== page.id || entry.expiresAt < new Date()) return null
  }

  const images = await fetchImages(page.id)
  return { ...mapPageToDto(page), images }
}

// ── Admin: list ALL pages (all statuses) ──────────────────────────────────────
export async function listAllPages(): Promise<ContentPageDto[]> {
  const rows = await db
    .select()
    .from(contentPages)
    .orderBy(desc(contentPages.createdAt))
  return rows.map(mapPageToDto)
}

// ── Admin: create page (slug unique — null on conflict) ───────────────────────
export async function createPage(
  authorId: string,
  input: CreateContentPageInput,
): Promise<ContentPageDto | 'conflict'> {
  const [page] = await db
    .insert(contentPages)
    .values({
      slug: input.slug,
      type: input.type,
      title: input.title,
      body: input.body,
      status: 'draft',   // Rule #5: always draft
      authorId,
    })
    .onConflictDoNothing()
    .returning()

  if (!page) return 'conflict'   // slug conflict → caller returns 409
  return mapPageToDto(page)
}

// ── Admin: update page (save version first — Rule #4) ─────────────────────────
export async function updatePage(
  pageId: string,
  input: UpdateContentPageInput,
): Promise<ContentPageDto | null> {
  const [existing] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.id, pageId))
  if (!existing) return null

  // Save current body to content_versions (Rule #4)
  await db.insert(contentVersions).values({
    contentPageId: existing.id,
    version: existing.version,
    body: existing.body as Record<string, unknown>,
    publishedAt: existing.publishedAt ?? null,
    authorId: existing.authorId ?? null,
  })

  const setClauses: Record<string, unknown> = {
    version: existing.version + 1,
    updatedAt: new Date(),
  }
  if (input.title !== undefined) setClauses.title = input.title
  if (input.body !== undefined) setClauses.body = input.body
  if (input.slug !== undefined) setClauses.slug = input.slug

  const [updated] = await db
    .update(contentPages)
    .set(setClauses as any)
    .where(eq(contentPages.id, pageId))
    .returning()

  if (!updated) return null
  return mapPageToDto(updated)
}

// ── Admin: delete page (Rule #2: hard delete, reject if published → 409) ──────
export async function deletePage(pageId: string): Promise<DeletePageResult> {
  const [page] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.id, pageId))
  if (!page) return 'not_found'
  if (page.status === 'published') return 'published'

  await db.delete(contentPages).where(eq(contentPages.id, pageId))
  return 'ok'
}

// ── Admin: publish page ───────────────────────────────────────────────────────
export async function publishPage(pageId: string): Promise<ContentPageDto | null> {
  const [updated] = await db
    .update(contentPages)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() } as any)
    .where(eq(contentPages.id, pageId))
    .returning()
  if (!updated) return null
  return mapPageToDto(updated)
}

// ── Admin: create preview token (in-memory, TTL 24h — Rule #3) ───────────────
export async function createPreviewToken(
  pageId: string,
): Promise<ContentPreviewTokenDto | null> {
  const [page] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.id, pageId))
  if (!page) return null

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)  // +24h

  // Remove any existing token for this page
  for (const [t, entry] of previewTokenMap.entries()) {
    if (entry.contentPageId === pageId) previewTokenMap.delete(t)
  }
  previewTokenMap.set(token, { contentPageId: pageId, expiresAt })

  return {
    token,
    contentPageId: pageId,
    expiresAt: expiresAt.toISOString(),
  }
}

// ── Admin: add image to page (after R2 upload) ────────────────────────────────
export async function addImage(
  r2Key: string,
  publicUrl: string,
  input: UploadContentImageInput,
): Promise<ContentImageDto | null> {
  // Verify page exists
  const [page] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.id, input.contentPageId))
  if (!page) return null

  const [img] = await db
    .insert(contentImages)
    .values({
      contentPageId: input.contentPageId,
      url: publicUrl,
      r2Key,
      alt: input.alt ?? null,
      caption: input.caption ?? null,
      order: input.order ?? 0,
    })
    .returning()

  return mapImageToDto(img)
}

// ── Export preview token map for testing ──────────────────────────────────────
export { previewTokenMap }
