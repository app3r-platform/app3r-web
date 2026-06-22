// ── Scrap Module Types (Phase C-3.2 + 2.3 mockup additions) ─────────────────
// D62 verbatim — ScrapItem (pre-sale entity) + ScrapJob (post-purchase pipeline)

// ── ScrapItem ─────────────────────────────────────────────────────────────
export type ConditionGrade = "grade_A" | "grade_B" | "grade_C";
// S5 (R-S3): "expired" — ประกาศซากหมดอายุ/ปิดแล้ว (passive visual · timer auto-remove = backend defer)
export type ScrapItemStatus = "available" | "sold" | "removed" | "expired";

export interface ScrapItem {
  id: string;
  sellerId: string;
  sellerType: "WeeeU";
  applianceId?: string;
  applianceName?: string;      // denormalized display name
  applianceBrand?: string;
  applianceType?: string;      // e.g. "washing_machine" / "ac" / "notebook"
  conditionGrade: ConditionGrade;
  workingParts: string[];
  description: string;
  photos: string[];
  price: number;
  isFree?: boolean;            // S2b: ซากแบบทิ้งฟรี — ซ่อนช่องราคา
  status: ScrapItemStatus;
  fromRepairJobId?: string;    // S12: ซากมาจากงาน Repair
  expiresAt?: string;          // S5: กำหนดหมดอายุประกาศ (มี = แสดง badge/นับถอยหลังแบบ passive)
  createdAt: string;
  updatedAt: string;
}

export const CONDITION_GRADE_LABEL: Record<ConditionGrade, string> = {
  grade_A: "เกรด A",
  grade_B: "เกรด B",
  grade_C: "เกรด C",
};

export const CONDITION_GRADE_COLOR: Record<ConditionGrade, string> = {
  grade_A: "bg-green-100 text-green-700",
  grade_B: "bg-yellow-100 text-yellow-700",
  grade_C: "bg-red-100 text-red-700",
};

export const SCRAP_ITEM_STATUS_LABEL: Record<ScrapItemStatus, string> = {
  available: "พร้อมขาย",
  sold: "ขายแล้ว",
  removed: "ถอดออก",
  expired: "หมดอายุ/ปิดแล้ว",   // S5
};

export const SCRAP_ITEM_STATUS_COLOR: Record<ScrapItemStatus, string> = {
  available: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-500",
  removed: "bg-red-100 text-red-500",
  expired: "bg-gray-100 text-gray-500",   // S5: greyed/disabled
};

// ── ScrapJob ──────────────────────────────────────────────────────────────
export type ScrapJobOption =
  | "resell_parts"
  | "repair_and_sell"
  | "resell_as_scrap"
  | "dispose";

export type ScrapJobStatus =
  | "pending_decision"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "withdrawn"       // S7 (R-S4): WeeeR ถอนงาน — escrow R→U unlock
  | "disputed";       // S11(ii) (R-S6): escrow ค้าง/พิพาท

// ── S7 (R-S4): WithdrawReason enum — mirror Maintain M6 (D91 audit log ต้องเป็น enum) ──
export type ScrapWithdrawReason = "shop_fault" | "customer_fault" | "force_majeure";

export const SCRAP_WITHDRAW_REASON_LABEL: Record<ScrapWithdrawReason, string> = {
  shop_fault:     "ร้านยกเลิก (ความผิดร้าน)",
  customer_fault: "ลูกค้ายกเลิก (ความผิดลูกค้า)",
  force_majeure:  "เหตุสุดวิสัย",
};

export const SCRAP_WITHDRAW_REASON_DESC: Record<ScrapWithdrawReason, string> = {
  shop_fault:     "ร้านเป็นผู้ยกเลิก — escrow ที่ WeeeR ล็อกไว้ unlock คืน WeeeU เต็มจำนวน + อาจมีค่าปรับ",
  customer_fault: "WeeeU เป็นผู้ยกเลิก — escrow unlock คืน WeeeU, WeeeR ไม่เสียค่าปรับ",
  force_majeure:  "เหตุสุดวิสัย — escrow unlock คืน WeeeU, ไม่มีค่าปรับ settle ตาม policy",
};

export interface ScrapJob {
  id: string;
  scrapItemId: string;
  buyerId: string;
  buyerType: "WeeeR";
  decision: ScrapJobOption;
  decisionAt?: string;
  status: ScrapJobStatus;
  partsCreatedIds?: string[];
  newListingId?: string;
  certificateId?: string;
  repairJobId?: string;
  createdAt: string;
  updatedAt: string;

  // denormalized for display
  scrapItemDescription?: string;
  conditionGrade?: ConditionGrade;

  // 2.3 additions (mockup)
  offerPrice?: number;         // ราคาที่ WeeeR จ่าย (0 = ฟรี)
  isFree?: boolean;            // ซากแบบทิ้งฟรี
  weeeTId?: string;            // S6: WeeeT technician assigned
  weeeTName?: string;
  escrowStatus?: "locked" | "released" | "refunded";   // escrow กลับทิศ WeeeR→WeeeU
  withdrawReason?: ScrapWithdrawReason;  // S7 (R-S4): enum (เดิม string · mock backfill)
  reOfferReason?: string;      // S8: T แจ้งซากไม่ตรง
  disputeReason?: string;      // S11
  disputeServiceType?: "B";    // S11(ii) (R-S6): dispute initiate carries service_type=B (scrap)
  feeSettled?: boolean;        // Fee Settle
  fromRepairJobId?: string;    // S12 denorm
}

// ── ScrapOffer ────────────────────────────────────────────────────────────
export type ScrapOfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface ScrapOffer {
  id: string;
  scrapItemId: string;
  buyerId: string;
  offerPrice: number;
  isFree: boolean;
  message?: string;
  status: ScrapOfferStatus;
  createdAt: string;
}

export const SCRAP_OFFER_STATUS_LABEL: Record<ScrapOfferStatus, string> = {
  pending:   "รอตอบ",
  accepted:  "ตอบรับแล้ว",
  rejected:  "ถูกปฏิเสธ",
  withdrawn: "ถอนแล้ว",
};

export const SCRAP_OFFER_STATUS_COLOR: Record<ScrapOfferStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  accepted:  "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-600",
  withdrawn: "bg-gray-100 text-gray-500",
};

export const SCRAP_JOB_OPTION_LABEL: Record<ScrapJobOption, string> = {
  resell_parts:    "แยกอะไหล่",
  repair_and_sell: "ซ่อมขาย (รอ C-3.3)",
  resell_as_scrap: "ขายต่อซาก",
  dispose:         "รีไซเคิล",
};

export const SCRAP_JOB_STATUS_LABEL: Record<ScrapJobStatus, string> = {
  pending_decision: "รอตัดสินใจ",
  in_progress:      "กำลังดำเนินการ",
  completed:        "เสร็จสิ้น",
  cancelled:        "ยกเลิก",
  withdrawn:        "ถอนงานแล้ว",   // S7
  disputed:         "พิพาท/escrow ค้าง",   // S11(ii)
};

export const SCRAP_JOB_STATUS_COLOR: Record<ScrapJobStatus, string> = {
  pending_decision: "bg-yellow-100 text-yellow-700",
  in_progress:      "bg-blue-100 text-blue-700",
  completed:        "bg-green-100 text-green-700",
  cancelled:        "bg-gray-100 text-gray-500",
  withdrawn:        "bg-gray-100 text-gray-500",   // S7
  disputed:         "bg-red-100 text-red-600",      // S11(ii)
};

// ── EWasteCertificate ─────────────────────────────────────────────────────
export type CertStatus = "pending" | "issued" | "rejected";

export interface EWasteCertificate {
  id: string;
  scrapJobId: string;
  issuedById: string;
  issuedAt: string;
  certNumber: string;
  itemDescription: string;
  status: CertStatus;
  htmlUrl?: string;
}

export const CERT_STATUS_LABEL: Record<CertStatus, string> = {
  pending:  "รอออกใบรับรอง",
  issued:   "ออกแล้ว",
  rejected: "ปฏิเสธ",
};

export const CERT_STATUS_COLOR: Record<CertStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  issued:   "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
