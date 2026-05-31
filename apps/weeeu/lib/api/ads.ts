import { apiFetch } from "@/lib/api-client";

// C12 Ads API client — Hono /api/v1/ads (camelCase · Backend ads.ts)
// Gold Point debit (D75) handled server-side ใน POST /ads (calcAdCost → debitGold)

export type AdPosition = "home_first_row" | "module_first_row" | "sidebar";

// อัตรา default (Gold Point/วัน) — admin override ผ่าน admin_config 'ad_rates' (server authoritative)
// ใช้ฝั่ง client เพื่อ "ประมาณการ" ก่อนยืนยัน · ยอดจริงที่ตัด = goldCost ที่ POST /ads คืนกลับ
export const AD_DEFAULT_RATES: Record<AdPosition, number> = {
  home_first_row: 5,
  module_first_row: 3,
  sidebar: 3,
};

// D75 — Math.round (estimate ฝั่ง client; server เป็นตัวตัดจริง)
export function estimateAdCost(position: AdPosition, durationDays: number): number {
  return Math.round(AD_DEFAULT_RATES[position] * Math.max(0, durationDays));
}

export interface AdDto {
  id: string;
  adType: string;
  listingId: string | null;
  position: AdPosition;
  goldCost: number;
  durationDays: number;
  status: "pending" | "active" | "rejected" | "cancelled" | "expired";
  rejectReason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
}

export interface AdBuyResult {
  id: string;
  goldCost: number;
  status: string;
}

export const adsApi = {
  // POST /api/v1/ads → คำนวณ D75 → debit Gold → status pending (201)
  buy: (body: { listingId: string; position: AdPosition; durationDays: number }) =>
    apiFetch("/api/v1/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // GET /api/v1/ads?position= → โฆษณาของฉัน
  mine: (position?: AdPosition) => {
    const q = position ? `?position=${position}` : "";
    return apiFetch(`/api/v1/ads${q}`).then((r) => r.json()) as Promise<{ items: AdDto[] }>;
  },

  // POST /api/v1/ads/{id}/cancel → refund Gold (pending=full · active=proportional D75)
  cancel: (id: string) =>
    apiFetch(`/api/v1/ads/${id}/cancel`, { method: "POST" }),
};
