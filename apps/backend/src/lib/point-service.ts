/**
 * point-service.ts — W-Round-1 Wave 1.2: central Gold Point service (D75)
 *
 * รวม logic ตัด/คืน Gold Point ที่เดียว (ลด duplicate — Eng-11):
 *   - Gold Point = เงินจริง (1 Gold = 1 บาท) → point_type 'cash' ใน ledger (ตรงกับ transfers.ts)
 *   - D75 rounding: ผลลัพธ์ % → ปัด integer (≥.5 ขึ้น / <.5 ลง = Math.round)
 *   - ทุกการเคลื่อนไหวบันทึก point_ledger (append-only) + อัพเดต wallets atomically
 *
 * ใช้โดย:
 *   - listing-state.ts (point lock: hold@matched → release@completed → refund@cancelled)
 *   - ads (ตัด Gold เมื่อ admin approve · refund เมื่อ reject)
 */
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { wallets, pointLedger } from '../db/schema'

// pointType สำหรับ Gold Point (เงินจริง) — ตรงกับ transfers.ts/settlements
export const GOLD_POINT_TYPE = 'cash' as const

/** D75: ปัดเศษ point เป็น integer (≥.5 ปัดขึ้น / <.5 ปัดลง) */
export function roundD75(raw: number): number {
  return Math.round(raw)
}

/**
 * D75: คำนวณค่าโฆษณา (rate/วัน × จำนวนวัน) → ปัด integer
 * บังคับ audit ที่ caller (insert ledger ผ่าน debitGold ก็เป็น audit ในตัว)
 */
export function calcAdCost(ratePerDay: number, days: number): number {
  return roundD75(ratePerDay * days)
}

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** อ่าน balance ปัจจุบัน (Gold/cash) ของ user — 0 ถ้าไม่มี wallet */
export async function getGoldBalance(tx: Tx, userId: string): Promise<number> {
  const [w] = await tx
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.pointType, GOLD_POINT_TYPE)))
  return w?.balance ?? 0
}

interface MoveArgs {
  userId: string
  amount: number // integer (ปัด D75 มาก่อน)
  reference: string // เช่น 'ad:<id>' | 'listing:<id>'
  idempotencyKey: string
  type: string // 'spend' | 'refund' | 'earn' | ...
  metadata?: Record<string, unknown>
}

/**
 * ตัด Gold Point (debit) — atomic: wallet -= amount, insert ledger row
 * คืน balanceAfter; throw ถ้า balance ไม่พอ
 */
export async function debitGold(tx: Tx, args: MoveArgs): Promise<number> {
  const balance = await getGoldBalance(tx, args.userId)
  if (balance < args.amount) {
    throw new Error(`INSUFFICIENT_GOLD: need ${args.amount}, have ${balance}`)
  }
  const [w] = await tx
    .update(wallets)
    .set({ balance: sql`${wallets.balance} - ${args.amount}`, updatedAt: new Date() })
    .where(and(eq(wallets.userId, args.userId), eq(wallets.pointType, GOLD_POINT_TYPE)))
    .returning({ newBalance: wallets.balance })
  const balanceAfter = w?.newBalance ?? balance - args.amount
  await tx.insert(pointLedger).values({
    userId: args.userId,
    type: args.type,
    direction: 'debit',
    pointType: GOLD_POINT_TYPE,
    amount: args.amount,
    balanceAfter,
    reference: args.reference,
    idempotencyKey: args.idempotencyKey,
    metadata: args.metadata ?? null,
  })
  return balanceAfter
}

/**
 * คืน/เพิ่ม Gold Point (credit) — atomic: wallet += amount, insert ledger row
 * upsert wallet ถ้ายังไม่มี
 */
export async function creditGold(tx: Tx, args: MoveArgs): Promise<number> {
  const existing = await getGoldBalance(tx, args.userId)
  const [w] = await tx
    .insert(wallets)
    .values({ userId: args.userId, pointType: GOLD_POINT_TYPE, balance: existing + args.amount })
    .onConflictDoUpdate({
      target: [wallets.userId, wallets.pointType],
      set: { balance: sql`${wallets.balance} + ${args.amount}`, updatedAt: new Date() },
    })
    .returning({ newBalance: wallets.balance })
  const balanceAfter = w?.newBalance ?? existing + args.amount
  await tx.insert(pointLedger).values({
    userId: args.userId,
    type: args.type,
    direction: 'credit',
    pointType: GOLD_POINT_TYPE,
    amount: args.amount,
    balanceAfter,
    reference: args.reference,
    idempotencyKey: args.idempotencyKey,
    metadata: args.metadata ?? null,
  })
  return balanceAfter
}
