/**
 * dal/services.ts — Data Access Layer for services (Sub-CMD-4 Wave 2)
 *
 * แยก DB logic ออกจาก route handler เพื่อ:
 *   1. Testability — test DAL ได้โดยไม่ต้อง mock HTTP
 *   2. Reusability — future WebSocket / cron jobs ใช้ DAL เดียวกัน
 *   3. Clean routes — route handler เป็นแค่ auth + input validation
 */
import { db } from '../db/client'
import { services } from '../db/schema'
import { eq, and, desc, SQL } from 'drizzle-orm'
import type { ServiceDto, CreateServiceDto, UpdateServiceDto } from '../types/services'

// ── Helper: DB row → DTO ─────────────────────────────────────────────────────
export function mapServiceToDto(row: typeof services.$inferSelect): ServiceDto {
  return {
    id: row.id,
    ownerId: row.ownerId,
    serviceType: row.serviceType as ServiceDto['serviceType'],
    status: row.status as ServiceDto['status'],
    title: row.title ?? null,
    description: row.description ?? null,
    pointAmount: row.pointAmount != null ? String(row.pointAmount) : null,
    deadline: row.deadline?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ── Create ───────────────────────────────────────────────────────────────────
export async function createService(
  ownerId: string,
  input: CreateServiceDto,
): Promise<ServiceDto> {
  const [row] = await db
    .insert(services)
    .values({
      ownerId,
      serviceType: input.serviceType,
      status: 'draft',
      title: input.title ?? null,
      description: input.description ?? null,
      pointAmount: input.pointAmount != null ? String(input.pointAmount) : null,
      deadline: input.deadline ? new Date(input.deadline) : null,
    })
    .returning()

  return mapServiceToDto(row)
}

// ── Get by ID ─────────────────────────────────────────────────────────────────
export async function getServiceById(id: string): Promise<ServiceDto | null> {
  const [row] = await db.select().from(services).where(eq(services.id, id))
  return row ? mapServiceToDto(row) : null
}

// ── Update fields (PATCH) ────────────────────────────────────────────────────
export async function updateService(
  id: string,
  ownerId: string,
  input: UpdateServiceDto,
): Promise<ServiceDto | null> {
  const setValues: Partial<typeof services.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.title !== undefined) setValues.title = input.title
  if (input.description !== undefined) setValues.description = input.description
  if (input.pointAmount !== undefined) setValues.pointAmount = String(input.pointAmount)
  if (input.deadline !== undefined) setValues.deadline = input.deadline ? new Date(input.deadline) : null

  const [row] = await db
    .update(services)
    .set(setValues)
    .where(and(eq(services.id, id), eq(services.ownerId, ownerId)))
    .returning()

  return row ? mapServiceToDto(row) : null
}

// ── Update status ─────────────────────────────────────────────────────────────
export async function updateServiceStatus(
  id: string,
  ownerId: string,
  status: ServiceDto['status'],
): Promise<boolean> {
  const [row] = await db
    .update(services)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(services.id, id), eq(services.ownerId, ownerId)))
    .returning({ id: services.id })

  return !!row
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteService(id: string, ownerId: string): Promise<boolean> {
  const [row] = await db
    .delete(services)
    .where(and(eq(services.id, id), eq(services.ownerId, ownerId)))
    .returning({ id: services.id })

  return !!row
}

// ── List (with filters) ───────────────────────────────────────────────────────
export async function listServices(filters: {
  ownerId?: string
  status?: string
  serviceType?: string
  limit?: number
  offset?: number
}): Promise<{ items: ServiceDto[]; total: number }> {
  const conditions: SQL[] = []
  if (filters.ownerId) conditions.push(eq(services.ownerId, filters.ownerId))
  if (filters.status) conditions.push(eq(services.status, filters.status))
  if (filters.serviceType) conditions.push(eq(services.serviceType, filters.serviceType))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select()
    .from(services)
    .where(whereClause)
    .orderBy(desc(services.createdAt))
    .limit(filters.limit ?? 20)
    .offset(filters.offset ?? 0)

  // total count (simple: re-query without limit)
  const allRows = await db
    .select({ id: services.id })
    .from(services)
    .where(whereClause)

  return {
    items: rows.map(mapServiceToDto),
    total: allRows.length,
  }
}
