// ── settlement-api.ts — Sub-CMD-6 Wave 2: Settlement API Integration ─────────
// Types ตรงกับ Backend SettlementDto (apps/backend/src/types/settlement.ts)
// SOURCE-OF-TRUTH: Backend Sub-CMD-6 type exports
//
// Settlement flow:
//   service completed → WeeeR กรอก serviceId + ข้อมูลบัญชี + จำนวนบาท
//   → POST /api/v1/settlements/ — Backend ตัดแต้ม + audit log + Mock bank adapter
//   → status: pending → processing → completed/failed
//
// Security Rule #5: audit log บังคับทุกรายการ (Backend ดูแล — FE แสดงผลเท่านั้น)

import { apiFetch } from "./api-client";

// ── Types (aligned กับ Backend SettlementDto) ──────────────────────────────────

/** ตรงกับ Backend: 'pending' | 'processing' | 'completed' | 'failed' */
export type SettlementStatus = "pending" | "processing" | "completed" | "failed";

export type BankAdapterName = "mock" | "scb" | "kbank";

export type AuditAction = "created" | "status_changed" | "bank_response" | "error";

/** Settlement DTO — ตรงกับ Backend SettlementDto */
export interface SettlementDto {
  id: string;
  serviceId: string;
  weeerUserId: string;
  amountThb: string;          // numeric → string (JSON safe, ตรงกับ Backend)
  status: SettlementStatus;
  bankAdapter: BankAdapterName;
  bankRef: string | null;
  initiatedBy: string;
  createdAt: string;           // ISO-8601
  updatedAt: string;           // ISO-8601
}

/** Audit log entry — ตรงกับ Backend SettlementAuditLogDto */
export interface SettlementAuditLogDto {
  id: string;
  settlementId: string;
  action: AuditAction;
  actorId: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  detail: string | null;
  createdAt: string;
}

/** Settlement detail (GET /:id/) — includes audit log */
export interface SettlementDetailDto extends SettlementDto {
  auditLog: SettlementAuditLogDto[];
}

/** List response */
export interface SettlementListDto {
  items: SettlementDto[];
  total: number;
}

/**
 * Payload สำหรับสร้าง settlement (POST /api/v1/settlements/)
 * ตรงกับ Backend CreateSettlementDto
 */
export interface CreateSettlementPayload {
  serviceId: string;          // UUID ของ service ที่ถอน (บังคับ)
  weeerUserId: string;        // UUID ของ WeeeR user (จาก auth context)
  amountThb: number;          // จำนวนเงินบาท (FE ส่ง number → Backend เก็บ numeric)
  weeerBankAccount: string;   // เลขบัญชีธนาคาร
  weeerBankName: string;      // ชื่อบัญชีธนาคาร
  bankAdapter?: BankAdapterName; // default: 'mock' (Sub-6 R1 Mitigation)
}

// ── Display helpers ────────────────────────────────────────────────────────────

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  pending:    "รอตรวจสอบ",
  processing: "กำลังโอนเงิน",
  completed:  "โอนสำเร็จ",
  failed:     "โอนล้มเหลว",
};

export const SETTLEMENT_STATUS_COLOR: Record<SettlementStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  completed:  "bg-green-100 text-green-700",
  failed:     "bg-red-100 text-red-600",
};

// ── API functions ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/settlements/ — สร้าง settlement + initiate bank transfer
 * Returns SettlementDetailDto (includes audit log)
 */
export async function createSettlement(
  payload: CreateSettlementPayload,
): Promise<SettlementDetailDto> {
  const res = await apiFetch("/api/v1/settlements/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `สร้าง settlement ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<SettlementDetailDto>;
}

/**
 * GET /api/v1/settlements/:id/ — get settlement detail (includes audit log)
 */
export async function getSettlement(id: string): Promise<SettlementDetailDto> {
  const res = await apiFetch(`/api/v1/settlements/${encodeURIComponent(id)}/`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `ไม่พบ settlement (HTTP ${res.status})`);
  }
  return res.json() as Promise<SettlementDetailDto>;
}

/**
 * GET /api/v1/settlements/ — list settlements ของ WeeeR (Backend กรอง weeerUserId จาก JWT)
 */
export async function listSettlements(params?: {
  status?: SettlementStatus;
  limit?: number;
  offset?: number;
}): Promise<SettlementListDto> {
  const qs = new URLSearchParams();
  if (params?.status)         qs.set("status", params.status);
  if (params?.limit  != null) qs.set("limit",  String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));

  const url = `/api/v1/settlements/${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `โหลด settlements ล้มเหลว (HTTP ${res.status})`);
  }
  return res.json() as Promise<SettlementListDto>;
}
