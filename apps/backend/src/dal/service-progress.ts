/**
 * dal/service-progress.ts — Sub-CMD-5 Wave 2: Service Progress Tracker DAL
 *
 * Separated DB logic for testability + reusability (WS broadcast, cron, etc.)
 * All functions return DTOs — no raw DB rows leak to routes
 */
import { db } from '../db/client'
import { serviceProgress, services } from '../db/schema'
import { eq, asc } from 'drizzle-orm'
import type {
  ServiceProgressDto,
  ServiceProgressTimelineDto,
  CreateServiceProgressDto,
  UpdateServiceProgressDto,
  ServiceProgressStatus,
} from '../types/service-progress'

// ── Helper: DB row → DTO ─────────────────────────────────────────────────────
export function mapProgressToDto(row: typeof serviceProgress.$inferSelect): ServiceProgressDto {
  return {
    id: row.id,
    serviceId: row.serviceId,
    status: row.status as ServiceProgressStatus,
    progressPercent: row.progressPercent,
    note: row.note ?? null,
    photoR2Key: row.photoR2Key ?? null,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
  }
}

// ── Get timeline for a service ────────────────────────────────────────────────
export async function getServiceTimeline(
  serviceId: string,
): Promise<ServiceProgressTimelineDto> {
  const rows = await db
    .select()
    .from(serviceProgress)
    .where(eq(serviceProgress.serviceId, serviceId))
    .orderBy(asc(serviceProgress.createdAt))

  const entries = rows.map(mapProgressToDto)
  const latest = entries[entries.length - 1] ?? null

  return {
    serviceId,
    entries,
    latestStatus: latest?.status ?? null,
    latestPercent: latest?.progressPercent ?? 0,
  }
}

// ── Get single progress entry ─────────────────────────────────────────────────
export async function getProgressById(id: string): Promise<ServiceProgressDto | null> {
  const [row] = await db
    .select()
    .from(serviceProgress)
    .where(eq(serviceProgress.id, id))
  return row ? mapProgressToDto(row) : null
}

// ── Create progress entry ─────────────────────────────────────────────────────
export async function createProgressEntry(
  updatedBy: string,
  input: CreateServiceProgressDto,
): Promise<ServiceProgressDto> {
  const [row] = await db
    .insert(serviceProgress)
    .values({
      serviceId: input.serviceId,
      status: input.status,
      progressPercent: input.progressPercent,
      note: input.note ?? null,
      photoR2Key: input.photoR2Key ?? null,
      updatedBy,
    })
    .returning()

  return mapProgressToDto(row)
}

// ── Update progress entry ─────────────────────────────────────────────────────
export async function updateProgressEntry(
  id: string,
  updatedBy: string,
  input: UpdateServiceProgressDto,
): Promise<ServiceProgressDto | null> {
  const setValues: Partial<typeof serviceProgress.$inferInsert> = {}
  if (input.status !== undefined) setValues.status = input.status
  if (input.progressPercent !== undefined) setValues.progressPercent = input.progressPercent
  if (input.note !== undefined) setValues.note = input.note
  if (input.photoR2Key !== undefined) setValues.photoR2Key = input.photoR2Key

  if (Object.keys(setValues).length === 0) {
    return getProgressById(id)
  }

  const [row] = await db
    .update(serviceProgress)
    .set(setValues)
    .where(eq(serviceProgress.id, id))
    .returning()

  return row ? mapProgressToDto(row) : null
}

// ── Get service owner (for WS broadcast target) ───────────────────────────────
export async function getServiceOwnerId(serviceId: string): Promise<string | null> {
  const [row] = await db
    .select({ ownerId: services.ownerId })
    .from(services)
    .where(eq(services.id, serviceId))
  return row?.ownerId ?? null
}
