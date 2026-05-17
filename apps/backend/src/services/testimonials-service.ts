/**
 * services/testimonials-service.ts — Sub-2 D-4: Testimonials API
 *
 * Business logic:
 *   - listPublished(): public list (status='published', ORDER BY sort_order ASC)
 *   - listAll(): admin list (all — draft + published)
 *   - getById(): single row by id
 *   - create(): insert new testimonial (default status='draft')
 *   - update(): partial update
 *   - deleteById(): hard delete (no FK dependency)
 *   - togglePublish(): draft ↔ published; sets publishedAt = now() when publishing
 *
 * stars field: DB stores starsRating SMALLINT(1-5); service maps → "★★★★★" string
 *
 * Master CMD: 363813ec-7277-81ae-94e8-e0e79b492eb6
 * Schema Plan: 363813ec-7277-81dc-ac96-fd41d4fcdabf (T+0.6 APPROVED)
 */
import { db } from '../db/client'
import { testimonials } from '../db/schema/testimonials'
import { eq, asc, desc } from 'drizzle-orm'
import type {
  TestimonialDto,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from '../types/testimonial'

// ── Stars mapper: SMALLINT 1-5 → "★★★★★" string ──────────────────────────────
function starsString(rating: number): string {
  const r = Math.max(1, Math.min(5, rating))
  return '★'.repeat(r) + '☆'.repeat(5 - r)
}

// ── Row → DTO ─────────────────────────────────────────────────────────────────
function mapToDto(row: typeof testimonials.$inferSelect): TestimonialDto {
  return {
    id:          row.id,
    name:        row.name,
    role:        row.role,
    stars:       starsString(row.starsRating),
    starsRating: row.starsRating,
    text:        row.text,
    avatar:      row.avatar,
    sortOrder:   row.sortOrder,
    status:      row.status as TestimonialDto['status'],
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt:   row.createdAt.toISOString(),
    updatedAt:   row.updatedAt.toISOString(),
  }
}

// ── Public: list published (Website) ──────────────────────────────────────────
export async function listPublished(): Promise<TestimonialDto[]> {
  const rows = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.status, 'published'))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt))
  return rows.map(mapToDto)
}

// ── Admin: list all (draft + published) ───────────────────────────────────────
export async function listAll(): Promise<TestimonialDto[]> {
  const rows = await db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt))
  return rows.map(mapToDto)
}

// ── Admin: single ─────────────────────────────────────────────────────────────
export async function getById(id: string): Promise<TestimonialDto | null> {
  const [row] = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1)
  if (!row) return null
  return mapToDto(row)
}

// ── Admin: create ─────────────────────────────────────────────────────────────
export async function create(input: CreateTestimonialInput): Promise<TestimonialDto> {
  const [row] = await db
    .insert(testimonials)
    .values({
      name:        input.name,
      role:        input.role,
      starsRating: input.starsRating,
      text:        input.text,
      avatar:      input.avatar,
      sortOrder:   input.sortOrder ?? 0,
      status:      input.status ?? 'draft',
      publishedAt: input.status === 'published' ? new Date() : null,
    })
    .returning()
  return mapToDto(row)
}

// ── Admin: update (partial) ───────────────────────────────────────────────────
export async function update(
  id: string,
  input: UpdateTestimonialInput,
): Promise<TestimonialDto | null> {
  const now = new Date()
  const setValues: Partial<typeof testimonials.$inferInsert> & { updatedAt: Date } = {
    updatedAt: now,
  }
  if (input.name        !== undefined) setValues.name        = input.name
  if (input.role        !== undefined) setValues.role        = input.role
  if (input.starsRating !== undefined) setValues.starsRating = input.starsRating
  if (input.text        !== undefined) setValues.text        = input.text
  if (input.avatar      !== undefined) setValues.avatar      = input.avatar
  if (input.sortOrder   !== undefined) setValues.sortOrder   = input.sortOrder
  if (input.status      !== undefined) {
    setValues.status = input.status
    if (input.status === 'published') setValues.publishedAt = now
    if (input.status === 'draft')     setValues.publishedAt = null
  }

  const [row] = await db
    .update(testimonials)
    .set(setValues)
    .where(eq(testimonials.id, id))
    .returning()
  if (!row) return null
  return mapToDto(row)
}

// ── Admin: hard delete ────────────────────────────────────────────────────────
export async function deleteById(id: string): Promise<boolean> {
  const result = await db
    .delete(testimonials)
    .where(eq(testimonials.id, id))
    .returning({ id: testimonials.id })
  return result.length > 0
}

// ── Admin: toggle publish (draft ↔ published) ─────────────────────────────────
export async function togglePublish(id: string): Promise<TestimonialDto | null> {
  // Read current status first
  const [current] = await db
    .select({ status: testimonials.status })
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1)
  if (!current) return null

  const now = new Date()
  const newStatus = current.status === 'published' ? 'draft' : 'published'

  const [row] = await db
    .update(testimonials)
    .set({
      status:      newStatus,
      publishedAt: newStatus === 'published' ? now : null,
      updatedAt:   now,
    })
    .where(eq(testimonials.id, id))
    .returning()
  if (!row) return null
  return mapToDto(row)
}
