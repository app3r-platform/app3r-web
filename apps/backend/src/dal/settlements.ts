/**
 * dal/settlements.ts — Sub-CMD-6 Wave 2: Settlement DAL
 *
 * Security Rule #5: ทุก operation ต้องเรียก appendAuditLog()
 * ห้าม update settlements โดยไม่มี audit trail
 */
import { db } from '../db/client'
import { settlements, settlementAuditLog } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getBankAdapter } from '../lib/bank-adapter'
import type {
  SettlementDto,
  SettlementDetailDto,
  SettlementAuditLogDto,
  SettlementListDto,
  CreateSettlementDto,
  SettlementStatus,
  AuditAction,
} from '../types/settlement'

// ── Mappers ───────────────────────────────────────────────────────────────────
export function mapSettlementToDto(row: typeof settlements.$inferSelect): SettlementDto {
  return {
    id: row.id,
    serviceId: row.serviceId,
    weeerUserId: row.weeerUserId,
    amountThb: String(row.amountThb),
    status: row.status as SettlementStatus,
    bankAdapter: row.bankAdapter as SettlementDto['bankAdapter'],
    bankRef: row.bankRef ?? null,
    initiatedBy: row.initiatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapAuditToDto(row: typeof settlementAuditLog.$inferSelect): SettlementAuditLogDto {
  return {
    id: row.id,
    settlementId: row.settlementId,
    action: row.action as AuditAction,
    actorId: row.actorId ?? null,
    oldStatus: row.oldStatus ?? null,
    newStatus: row.newStatus ?? null,
    detail: row.detail ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

// ── Audit log helper (Security Rule #5) ──────────────────────────────────────
async function appendAuditLog(params: {
  settlementId: string
  action: AuditAction
  actorId?: string | null
  oldStatus?: string | null
  newStatus?: string | null
  detail?: unknown
}): Promise<void> {
  await db.insert(settlementAuditLog).values({
    settlementId: params.settlementId,
    action: params.action,
    actorId: params.actorId ?? null,
    oldStatus: params.oldStatus ?? null,
    newStatus: params.newStatus ?? null,
    detail: params.detail ? JSON.stringify(params.detail) : null,
  })
}

// ── Create settlement + initiate bank transfer ────────────────────────────────
export async function createSettlement(
  initiatedBy: string,
  input: CreateSettlementDto,
): Promise<SettlementDto> {
  const adapterName = input.bankAdapter ?? 'mock'

  // 1. Insert settlement record (status: pending)
  const [row] = await db
    .insert(settlements)
    .values({
      serviceId: input.serviceId,
      weeerUserId: input.weeerUserId,
      amountThb: String(input.amountThb),
      status: 'pending',
      bankAdapter: adapterName,
      initiatedBy,
    })
    .returning()

  // 2. Audit: created (Security Rule #5)
  await appendAuditLog({
    settlementId: row.id,
    action: 'created',
    actorId: initiatedBy,
    newStatus: 'pending',
    detail: { serviceId: input.serviceId, amountThb: input.amountThb, adapter: adapterName },
  })

  // 3. Initiate bank transfer
  const adapter = getBankAdapter(adapterName)
  let bankResult
  try {
    // Update status → processing before bank call
    await db.update(settlements).set({ status: 'processing', updatedAt: new Date() }).where(eq(settlements.id, row.id))
    await appendAuditLog({ settlementId: row.id, action: 'status_changed', actorId: null, oldStatus: 'pending', newStatus: 'processing' })

    bankResult = await adapter.initiateTransfer({
      ref: row.id,
      weeerBankAccount: input.weeerBankAccount,
      amountThb: input.amountThb,
      recipientName: input.weeerBankName,
    })
  } catch (error) {
    // Bank call threw — mark failed
    await db.update(settlements).set({ status: 'failed', updatedAt: new Date() }).where(eq(settlements.id, row.id))
    await appendAuditLog({ settlementId: row.id, action: 'error', actorId: null, oldStatus: 'processing', newStatus: 'failed', detail: { error: String(error) } })
    const [failed] = await db.select().from(settlements).where(eq(settlements.id, row.id))
    return mapSettlementToDto(failed)
  }

  // 4. Update with bank result
  const newStatus: SettlementStatus = bankResult.success ? 'completed' : 'failed'
  const [updated] = await db
    .update(settlements)
    .set({
      status: newStatus,
      bankRef: bankResult.bankRef,
      bankResponse: bankResult.rawResponse,
      updatedAt: new Date(),
    })
    .where(eq(settlements.id, row.id))
    .returning()

  await appendAuditLog({
    settlementId: row.id,
    action: 'bank_response',
    actorId: null,
    oldStatus: 'processing',
    newStatus,
    detail: { bankRef: bankResult.bankRef, success: bankResult.success, error: bankResult.errorMessage },
  })

  return mapSettlementToDto(updated)
}

// ── Get settlement by ID (with audit log) ────────────────────────────────────
export async function getSettlementById(id: string): Promise<SettlementDetailDto | null> {
  const [row] = await db.select().from(settlements).where(eq(settlements.id, id))
  if (!row) return null

  const auditRows = await db
    .select()
    .from(settlementAuditLog)
    .where(eq(settlementAuditLog.settlementId, id))
    .orderBy(settlementAuditLog.createdAt)

  return {
    ...mapSettlementToDto(row),
    auditLog: auditRows.map(mapAuditToDto),
  }
}

// ── List settlements (WeeeR sees own) ────────────────────────────────────────
export async function listSettlements(filters: {
  weeerUserId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<SettlementListDto> {
  const whereClause = filters.weeerUserId
    ? eq(settlements.weeerUserId, filters.weeerUserId)
    : undefined

  const rows = await db
    .select()
    .from(settlements)
    .where(whereClause)
    .orderBy(desc(settlements.createdAt))
    .limit(filters.limit ?? 20)
    .offset(filters.offset ?? 0)

  const all = await db.select({ id: settlements.id }).from(settlements).where(whereClause)

  return {
    items: rows.map(mapSettlementToDto),
    total: all.length,
  }
}
