// ── Parts Escrow — D81 (Phase C-6) ───────────────────────────────────────────
// ระบบพักเงิน/คะแนนระหว่างกลาง (escrow) + D75 roundPoint() + audit log
// D75 = กฎการปัดเศษ: Math.round() — ≥0.5 ปัดขึ้น, <0.5 ปัดลง

import type { EscrowRecord, FeeAuditEntry } from "../../app/(app)/parts/_lib/types";
import { PLATFORM_FEE_RATE } from "../../app/(app)/parts/_lib/types";
import { PARTS_STORAGE_KEYS } from "./parts-sync";

const isBrowser = typeof window !== "undefined";

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ── D75 roundPoint() ──────────────────────────────────────────────────────────
// ปัดเศษค่าคะแนนเป็น integer ตามกฎ D75
// (ใช้ Math.round — ≥0.5 ปัดขึ้น, <0.5 ปัดลง)
export function roundPoint(value: number): number {
  return Math.round(value);
}

// ── คำนวณค่าธรรมเนียม (Platform Fee) ─────────────────────────────────────────
export function calcFee(totalPoints: number): {
  rawFee: number;
  roundedFee: number;
  netToSeller: number;
  direction: FeeAuditEntry["direction"];
} {
  const rawFee = totalPoints * PLATFORM_FEE_RATE;
  const roundedFee = roundPoint(rawFee);
  const netToSeller = totalPoints - roundedFee;
  const diff = roundedFee - rawFee;
  const direction: FeeAuditEntry["direction"] =
    diff > 0 ? "up" : diff < 0 ? "down" : "exact";
  return { rawFee, roundedFee, netToSeller, direction };
}

// ── Fee Audit Log (D75 บันทึกการปัดเศษ) ──────────────────────────────────────

export function getAuditLog(): FeeAuditEntry[] {
  return readJSON<FeeAuditEntry[]>(PARTS_STORAGE_KEYS.FEE_LOG, []);
}

function appendAuditLog(entry: FeeAuditEntry): void {
  const log = getAuditLog();
  log.push(entry);
  writeJSON(PARTS_STORAGE_KEYS.FEE_LOG, log);
}

// ── Escrow Records ─────────────────────────────────────────────────────────────

export function getEscrowRecords(): EscrowRecord[] {
  return readJSON<EscrowRecord[]>(PARTS_STORAGE_KEYS.ESCROW, []);
}

function saveEscrowRecords(records: EscrowRecord[]): void {
  writeJSON(PARTS_STORAGE_KEYS.ESCROW, records);
}

// ── Hold (พักคะแนน): เรียกตอน placed order ──────────────────────────────────
export function escrowHold(
  orderId: string,
  buyerShopId: string,
  amount: number,
): EscrowRecord {
  const record: EscrowRecord = {
    orderId,
    buyerShopId,
    amount,
    heldAt: new Date().toISOString(),
  };
  const records = getEscrowRecords();
  records.push(record);
  saveEscrowRecords(records);
  return record;
}

// ── Release (โอนคะแนนให้ผู้ขาย): เรียกตอน received ─────────────────────────
export function escrowRelease(orderId: string): {
  success: boolean;
  netToSeller: number;
  fee: number;
} {
  const records = getEscrowRecords();
  const rec = records.find((r) => r.orderId === orderId && !r.releasedAt);
  if (!rec) return { success: false, netToSeller: 0, fee: 0 };

  const { roundedFee, netToSeller, rawFee, direction } = calcFee(rec.amount);

  rec.releasedAt = new Date().toISOString();
  saveEscrowRecords(records);

  // บันทึก D75 audit log
  appendAuditLog({
    orderId,
    totalPoints: rec.amount,
    rawFee,
    roundedFee,
    direction,
    timestamp: rec.releasedAt,
  });

  return { success: true, netToSeller, fee: roundedFee };
}

// ── Refund (คืนคะแนน): เรียกตอน cancelled ───────────────────────────────────
export function escrowRefund(orderId: string): {
  success: boolean;
  refundAmount: number;
} {
  const records = getEscrowRecords();
  const rec = records.find((r) => r.orderId === orderId && !r.releasedAt && !r.refundedAt);
  if (!rec) return { success: false, refundAmount: 0 };

  rec.refundedAt = new Date().toISOString();
  saveEscrowRecords(records);

  return { success: true, refundAmount: rec.amount };
}

// ── ตรวจสอบยอดคะแนนเพียงพอ (Balance Check) ─────────────────────────────────
export function hasEnoughBalance(shopPoints: number, orderTotal: number): boolean {
  return shopPoints >= orderTotal;
}

// ── คำนวณ escrow held ทั้งหมดของร้าน ────────────────────────────────────────
export function getEscrowHeldByShop(buyerShopId: string): number {
  return getEscrowRecords()
    .filter((r) => r.buyerShopId === buyerShopId && !r.releasedAt && !r.refundedAt)
    .reduce((sum, r) => sum + r.amount, 0);
}
