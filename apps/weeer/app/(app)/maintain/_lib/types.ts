// ── MaintainJob — D48 + ขั้น 2.1 Blueprint WeeeR Maintain ─────────────────────

// ── Offer payload (ขั้น 2.1 · 5 แกน) ─────────────────────────────────────────
export interface MaintainOfferPayload {
  deposit: {
    required: boolean;
    amount?: number;
    refundCondition?: string;
  };
  travelFee: {
    required: boolean;
    amount?: number;
    condition?: string;
  };
  warranty: {
    days: number;
    scope: string;
  };
  noShow: {
    fee: number;
    condition: string;
  };
  damagePolicy: "none" | "no_service_fee" | "up_to_service_fee";
  damagePolicyNote?: string;
}

// ── Withdrawal payload (M6 · ถอนหลังยืนยัน) ──────────────────────────────────
export type WithdrawReason = "shop_fault" | "customer_fault" | "force_majeure";

export const WITHDRAW_REASON_LABEL: Record<WithdrawReason, string> = {
  shop_fault:      "ร้านเอง (ติดธุระ/ช่างไม่ว่าง)",
  customer_fault:  "ลูกค้าผิด (ยกเลิกเอง/ไม่ยืนยัน)",
  force_majeure:   "สุดวิสัย (ภัยธรรมชาติ/เหตุฉุกเฉิน)",
};

export interface MaintainJob {
  id: string;
  serviceCode: string;             // "M-2026-001"
  customerId: string;
  shopId?: string;
  technicianId?: string;
  status:
    | "pending"
    | "awaiting_offer"      // ขั้น 2.1: ยื่นข้อเสนอแล้ว รอ WeeeU ตอบรับ
    | "offer_expired"       // M2: หมดเวลายื่น — งานหลุดออก queue อัตโนมัติ
    | "assigned"
    | "departed"
    | "arrived"
    | "in_progress"
    | "risk_reported"       // M3: ช่างพบความเสี่ยง → รอลูกค้าตัดสินใจ
    | "no_show"             // M7: ลูกค้าไม่อยู่ — WeeeT รายงาน → settle No-show
    | "terminated_by_customer" // M9: WeeeU ยุติระหว่างล้าง → WeeeR ตอบสนอง
    | "terminated_after_risk"  // M4: WeeeU ยุติหลังตรวจพบความเสี่ยง (ก่อนล้าง) → WeeeR รับ settle ค่าบริการ
    | "completed"
    | "cancelled"
    | "withdrawn"           // M6: WeeeR ถอนงานหลังยืนยัน
    | "closed_for_repair";  // GAP D-M-2: ปิดงาน Maintain → ส่งต่อซ่อม
  applianceType: "AC" | "WashingMachine";
  cleaningType: "general" | "deep" | "sanitize";
  serviceMethod: "on_site";
  scheduledAt: string;             // ISO datetime
  estimatedDuration: number;       // 2-4 hours
  address: { lat: number; lng: number; address: string; };
  recurring?: {
    enabled: boolean;
    interval: "3_months" | "6_months" | "12_months";
    nextScheduledAt: string;
  };
  parts_used?: Array<{ name: string; qty: number }>;
  totalPrice: number;
  offerData?: MaintainOfferPayload;  // lock เมื่อ WeeeU ยืนยันข้อเสนอ
  offerDeadlineAt?: string;          // M2: วันหมดอายุยื่นข้อเสนอ (ISO datetime)
  withdrawal?: {                     // M6: ข้อมูลการถอน
    reason: WithdrawReason;
    evidence?: string;               // URL รูปหลักฐาน
    withdrawnAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ── Display helpers ────────────────────────────────────────────────────────────

export type MaintainStatus = MaintainJob["status"];

export const MAINTAIN_STATUS_LABEL: Record<MaintainStatus, string> = {
  pending:                "รอรับงาน",
  awaiting_offer:         "รอลูกค้าตอบรับ",
  offer_expired:          "หมดอายุ",
  assigned:               "มอบหมายช่างแล้ว",
  departed:               "ช่างออกเดินทาง",
  arrived:                "ช่างถึงแล้ว",
  in_progress:            "กำลังล้าง",
  risk_reported:          "พบความเสี่ยง",
  no_show:                "ลูกค้าไม่อยู่",
  terminated_by_customer: "ลูกค้ายุติ",
  terminated_after_risk:  "ยุติหลังพบเสี่ยง",
  completed:              "เสร็จแล้ว",
  cancelled:              "ยกเลิก",
  withdrawn:              "ถอนงาน",
  closed_for_repair:      "ปิด→ซ่อม",
};

export const MAINTAIN_STATUS_COLOR: Record<MaintainStatus, string> = {
  pending:                "bg-orange-100 text-orange-700",
  awaiting_offer:         "bg-yellow-100 text-yellow-700",
  offer_expired:          "bg-gray-100 text-gray-500",
  assigned:               "bg-blue-100 text-blue-700",
  departed:               "bg-[#FFE0D6] text-[#D63B12]",
  arrived:                "bg-cyan-100 text-cyan-700",
  in_progress:            "bg-green-100 text-green-700",
  risk_reported:          "bg-amber-100 text-amber-800",
  no_show:                "bg-orange-100 text-orange-700",
  terminated_by_customer: "bg-red-100 text-red-700",
  terminated_after_risk:  "bg-rose-100 text-rose-700",
  completed:              "bg-emerald-100 text-emerald-700",
  cancelled:              "bg-red-100 text-red-600",
  withdrawn:              "bg-red-100 text-red-600",
  closed_for_repair:      "bg-gray-100 text-gray-600",
};

export const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC:             "แอร์",
  WashingMachine: "เครื่องซักผ้า",
};

export const CLEANING_LABEL: Record<MaintainJob["cleaningType"], string> = {
  general:  "ล้างทั่วไป",
  deep:     "ล้างลึก",
  sanitize: "ล้าง + ฆ่าเชื้อ",
};

export const RECURRING_LABEL: Record<NonNullable<MaintainJob["recurring"]>["interval"], string> = {
  "3_months":  "ทุก 3 เดือน",
  "6_months":  "ทุก 6 เดือน",
  "12_months": "ทุก 12 เดือน",
};
