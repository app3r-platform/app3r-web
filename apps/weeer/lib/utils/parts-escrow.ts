// ── Parts Escrow — D81 (Phase D-2 Migration Markers) ─────────────────────────
// ระบบพักเงิน/คะแนนระหว่างกลาง (escrow) + D75 roundPoint() + audit log
// D75 = กฎการปัดเศษ: Math.round() — ≥0.5 ปัดขึ้น, <0.5 ปัดลง
//
// ────────────────────────────────────────────────────────────────────────────
// MIGRATION STATUS (Phase D-2):
//   - BUSINESS LOGIC (roundPoint, calcFee, hasEnoughBalance) คงอยู่ใน frontend เสมอ
//     → UI ต้องแสดง fee calculation แบบ real-time ก่อนยืนยัน order
//   - STORAGE LAYER สถานะ: @needs-backend-sync (Backend Sub-CMD-P1 ยังไม่ expose)
//     → escrowHold, escrowRelease, escrowRefund, getEscrowRecords, appendAuditLog
//     → Target: POST /api/parts/order (hold), POST /api/parts/order/:id/confirm (release),
//              POST /api/parts/order/:id/refund (refund)
//   - getEscrowHeldByShop → API call /api/v1/parts/escrow?shopId= (pending)
//   - roundPoint() และ calcFee() คงอยู่ทุก phase (frontend display + validation)
//   - Migration script: migrateEscrowToBackend() — @needs-backend-sync
// ────────────────────────────────────────────────────────────────────────────

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

// ── D75 roundPoint() — STAYS IN FRONTEND (ทุก phase) ─────────────────────────
// ปัดเศษค่าคะแนนเป็น integer ตามกฎ D75
// (ใช้ Math.round — ≥0.5 ปัดขึ้น, <0.5 ปัดลง)
export function roundPoint(value: number): number {
  return Math.round(value);
}

// ── calcFee — STAYS IN FRONTEND (ทุก phase) ───────────────────────────────────
// UI ต้องแสดง fee preview ก่อน confirm order
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

// ── hasEnoughBalance — STAYS IN FRONTEND ──────────────────────────────────────
export function hasEnoughBalance(shopPoints: number, orderTotal: number): boolean {
  return shopPoints >= orderTotal;
}

// ── Fee Audit Log (D75 บันทึกการปัดเศษ) ──────────────────────────────────────
// @needs-backend-sync: D-2 จะ save ไป backend audit log
// ปัจจุบัน: localStorage (Phase C behavior)

export function getAuditLog(): FeeAuditEntry[] {
  return readJSON<FeeAuditEntry[]>(PARTS_STORAGE_KEYS.FEE_LOG, []);
}

/**
 * @needs-backend-sync POST /api/v1/parts/audit-log
 * ปัจจุบัน: localStorage — D-2 จะ wire ไป backend audit service
 */
function appendAuditLog(entry: FeeAuditEntry): void {
  const log = getAuditLog();
  log.push(entry);
  writeJSON(PARTS_STORAGE_KEYS.FEE_LOG, log);
}

// ── Escrow Records ─────────────────────────────────────────────────────────────

/**
 * @needs-backend-sync GET /api/v1/parts/escrow
 * ปัจจุบัน: localStorage — D-2 จะ replace ด้วย getAdapter().parts.getEscrowRecords()
 */
export function getEscrowRecords(): EscrowRecord[] {
  return readJSON<EscrowRecord[]>(PARTS_STORAGE_KEYS.ESCROW, []);
}

/**
 * @needs-backend-sync POST /api/v1/parts/escrow
 * ปัจจุบัน: localStorage — D-2 จะ replace ด้วย getAdapter().parts.saveEscrowRecord()
 */
function saveEscrowRecords(records: EscrowRecord[]): void {
  writeJSON(PARTS_STORAGE_KEYS.ESCROW, records);
}

// ── Hold (พักคะแนน): เรียกตอน placed order ──────────────────────────────────

/**
 * escrowHold — พักคะแนนไว้ระหว่างรอ seller confirm
 *
 * @needs-backend-sync POST /api/parts/order (create + hold — atomic backend transaction D-2)
 * ปัจจุบัน: localStorage — Phase C behavior intact
 * D-2 target: backend atomic (create order + hold escrow ใน 1 transaction)
 */
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

/**
 * escrowRelease — โอนคะแนนหลังผู้ซื้อยืนยันรับของ
 *
 * @needs-backend-sync POST /api/parts/order/:id/confirm (release — atomic D-2)
 * ปัจจุบัน: localStorage — Phase C behavior intact
 * D-2 target: backend atomic (release + D75 fee + credit seller + audit log)
 */
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

/**
 * escrowRefund — คืนคะแนนเมื่อ order ถูกยกเลิก
 *
 * @needs-backend-sync POST /api/parts/order/:id/refund (refund hold — atomic D-2)
 * ปัจจุบัน: localStorage — Phase C behavior intact
 * D-2 target: backend atomic (refund + unhold + credit buyer ใน 1 transaction)
 */
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

// ── getEscrowHeldByShop ──────────────────────────────────────────────────────

/**
 * @needs-backend-sync GET /api/v1/parts/escrow?shopId= (aggregate total held)
 * ปัจจุบัน: คำนวณ client-side จาก localStorage
 * D-2: API จะ return ยอดรวมโดยตรง (atomic, consistent กับ backend state)
 */
export function getEscrowHeldByShop(buyerShopId: string): number {
  return getEscrowRecords()
    .filter((r) => r.buyerShopId === buyerShopId && !r.releasedAt && !r.refundedAt)
    .reduce((sum, r) => sum + r.amount, 0);
}

// ── Migration Script: Escrow localStorage → Backend ──────────────────────────

/**
 * migrateEscrowToBackend — ย้าย ongoing escrow records ไป backend
 *
 * @needs-backend-sync POST /api/v1/parts/escrow/migrate
 * เรียกครั้งเดียวตอนเปิด NEXT_PUBLIC_USE_API_PARTS=true
 * Phase D-2 status: PLACEHOLDER — backend endpoint ยังไม่พร้อม
 */
export async function migrateEscrowToBackend(): Promise<{
  ok: boolean;
  message: string;
  activeRecordsMigrated: number;
}> {
  if (!isBrowser) return { ok: false, message: "SSR — skip", activeRecordsMigrated: 0 };

  const records = getEscrowRecords();
  const active = records.filter((r) => !r.releasedAt && !r.refundedAt);

  if (active.length === 0) {
    return { ok: true, message: "No active escrow records to migrate", activeRecordsMigrated: 0 };
  }

  // @needs-backend-sync: implement จริงเมื่อ Backend Sub-CMD-P1 expose /api/v1/parts/escrow/migrate
  // const { apiFetch } = await import("../api-client");
  // const res = await apiFetch("/api/v1/parts/escrow/migrate", {
  //   method: "POST",
  //   body: JSON.stringify({ records: active }),
  // });
  // if (!res.ok) throw new Error(`Migration failed: HTTP ${res.status}`);
  // return { ok: true, message: "Escrow migration complete", activeRecordsMigrated: active.length };

  return {
    ok: false,
    message: `@needs-backend-sync — ${active.length} active records pending (Backend Sub-CMD-P1 pending)`,
    activeRecordsMigrated: 0,
  };
}
