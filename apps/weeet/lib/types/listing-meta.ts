/**
 * WeeeT — W-Round-1 Wave 2: service listing (FK → listing_meta) + D83 + Escrow
 *
 * Contract mirror (ห้ามแก้ฝั่ง schema — consume เท่านั้น):
 *   - B2 listing_meta contract: 36f813ec-7277-81d8-a50b-c012f1ced65f
 *   - Backend: apps/backend/src/routes/listings.ts
 *              apps/backend/src/lib/listing-state.ts (D83)
 *   - Website canonical types: apps/app3r/lib/types/listing-meta.ts
 *
 * บทบาท WeeeT (ช่าง): รับงานบริการ (repair/maintain) ที่จับคู่แล้ว (matched)
 *   → ยืนยันส่งมอบงาน = transition matched → completed
 *   → ปล่อยเงินที่พักไว้ในระบบพักเงินกลาง (Escrow) ให้เจ้าของงาน
 */

export type ListingType = "repair" | "maintain" | "resell" | "scrap" | "parts";

/** D83 listing state machine (single source of truth = backend listing-state.ts) */
export type ListingState =
  | "draft"
  | "published"
  | "has_offer"
  | "matched"
  | "completed"
  | "cancelled";

/** GET /api/v1/listings/{id} response (camelCase) */
export interface ListingMetaDto {
  listingId: string;
  listingType: ListingType;
  state: ListingState;
  ownerId: string;
  tambonId: number | null;
  viewCount: number;
  /** GR-8 — null = ซ่อน (matched + คนนอก) */
  offerCount: number | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/v1/listings/{id}/transition request body */
export interface TransitionRequest {
  to: ListingState;
  /** ผู้ซื้อ/ผู้ชนะ offer — จำเป็นเมื่อ to=matched (ผู้ถูก hold point) */
  buyerUserId?: string;
  /** จำนวน Gold Point ที่ lock/release (เต็มมูลค่างาน) */
  pointAmount?: number;
}

/** POST /api/v1/listings/{id}/transition response */
export interface TransitionResult {
  listingId: string;
  state: ListingState;
}

/**
 * Escrow (ระบบพักเงินกลาง) — สถานะการพักเงินตาม D83 state
 *   matched   → held    (พักเงินผู้ซื้อไว้)
 *   completed → released (ปล่อยให้เจ้าของงาน)
 *   cancelled → refunded (คืนผู้ซื้อ)
 *   อื่น ๆ    → none
 * NOTE: ledger จริงเป็นของ App3R-Point (D75) — WeeeT แสดงผลอย่างเดียว
 */
export type EscrowPhase = "none" | "held" | "released" | "refunded";

export interface EscrowStatus {
  phase: EscrowPhase;
  /** มูลค่า Gold Point ที่พัก/ปล่อย (mock-first; จริงมาจาก Point ledger) */
  pointAmount: number;
}

/** ป้ายกำกับสถานะ D83 (ไทย + อังกฤษในวงเล็บ ตาม GR-1/A3) */
export const LISTING_STATE_LABELS: Record<ListingState, string> = {
  draft: "ฉบับร่าง (draft)",
  published: "เผยแพร่แล้ว (published)",
  has_offer: "มีผู้ยื่นข้อเสนอ (has offer)",
  matched: "จับคู่แล้ว (matched)",
  completed: "เสร็จสมบูรณ์ (completed)",
  cancelled: "ยกเลิก (cancelled)",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  repair: "งานซ่อม (repair)",
  maintain: "งานบำรุงรักษา (maintain)",
  resell: "ขายมือสอง (resell)",
  scrap: "ขาย-ทิ้งซาก (scrap)",
  parts: "ขายอะไหล่ (parts)",
};

/** transition ที่อนุญาตฝั่งช่าง (WeeeT) — mirror backend TRANSITIONS forward */
export const WEEET_TRANSITIONS: Record<ListingState, ListingState[]> = {
  draft: [],
  published: [],
  has_offer: [],
  matched: ["completed", "cancelled"], // ช่างยืนยันส่งมอบ หรือ ยกเลิก (refund)
  completed: [],
  cancelled: [],
};

export function escrowFromState(state: ListingState, pointAmount: number): EscrowStatus {
  switch (state) {
    case "matched":
      return { phase: "held", pointAmount };
    case "completed":
      return { phase: "released", pointAmount };
    case "cancelled":
      return { phase: "refunded", pointAmount };
    default:
      return { phase: "none", pointAmount: 0 };
  }
}
