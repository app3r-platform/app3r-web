// ── C12 Ads API client (WeeeR) ───────────────────────────────────────────────
// Backend: POST /api/v1/ads (own_listing) → debit Gold (D75) → status pending
//          → เข้าคิวให้ผู้ดูแล (Admin) อนุมัติ (approve→active / reject→refund)
// Contract = camelCase (Ruling 36f813ec-7277-81c4-a73f-c46d364a2334)
// Spec: Ad System Gen 100 — home_first_row=5 / module_first_row=3 / sidebar=3 Gold/วัน
// ⚠️ ไม่แตะ point ledger เอง — Backend ตัด Gold ผ่าน debitGold ใน buyRoute (D75)
import { apiPost } from "./api-client";

export type AdPosition = "home_first_row" | "module_first_row" | "sidebar";

export interface AdPositionOption {
  value: AdPosition;
  label: string;
  rate: number; // Gold/วัน (default — admin ปรับได้ฝั่ง backend ผ่าน admin_config 'ad_rates')
}

export const AD_POSITION_OPTIONS: AdPositionOption[] = [
  { value: "home_first_row", label: "แถวแรกหน้าแรก", rate: 5 },
  { value: "module_first_row", label: "แถวแรกของโมดูล (หน้า listing)", rate: 3 },
  { value: "sidebar", label: "ด้านข้างจอ (sidebar)", rate: 3 },
];

// D75 ปัดจำนวนเต็ม — estimate ฝั่ง UI (เลขจริงคำนวณ+ตัดฝั่ง backend ตอน buy)
export function estimateGoldCost(position: AdPosition, durationDays: number): number {
  const rate = AD_POSITION_OPTIONS.find((p) => p.value === position)?.rate ?? 3;
  return Math.round(rate * Math.max(1, durationDays));
}

export interface CreateAdInput {
  listingId: string;
  position: AdPosition;
  durationDays: number;
}

// Backend POST /api/v1/ads response (201): { id, goldCost, status }
export interface CreateAdResult {
  id: string;
  goldCost: number;
  status: "pending" | "approved" | "active" | "rejected" | "expired" | "cancelled";
}

/**
 * POST /api/v1/ads — ซื้อโฆษณาประกาศของตัวเอง (own_listing)
 * Backend: ตัด Gold (D75) → สร้างสถานะ pending → เข้าคิว Admin อนุมัติ
 * @returns Result<CreateAdResult> (api-client wrapper — ok/error)
 */
export function createAd(input: CreateAdInput) {
  return apiPost<CreateAdResult>("/api/v1/ads", {
    listingId: input.listingId,
    position: input.position,
    durationDays: input.durationDays,
  });
}
