// ── MaintainJob — D48 verbatim (App3R-Advisor Gen 18) ─────────────────────────

export interface MaintainJob {
  id: string;
  serviceCode: string;             // "M-2026-001"
  customerId: string;
  shopId?: string;
  technicianId?: string;
  status: "pending" | "assigned" | "departed" | "arrived" | "in_progress" | "completed" | "cancelled";
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
  createdAt: string;
  updatedAt: string;
}

// ── Display helpers ────────────────────────────────────────────────────────────

export type MaintainStatus = MaintainJob["status"];

export const MAINTAIN_STATUS_LABEL: Record<MaintainStatus, string> = {
  pending:     "รอรับงาน",
  assigned:    "มอบหมายช่างแล้ว",
  departed:    "ช่างออกเดินทาง",
  arrived:     "ช่างถึงแล้ว",
  in_progress: "กำลังล้าง",
  completed:   "เสร็จแล้ว",
  cancelled:   "ยกเลิก",
};

export const MAINTAIN_STATUS_COLOR: Record<MaintainStatus, string> = {
  pending:     "bg-orange-100 text-orange-700",
  assigned:    "bg-blue-100 text-blue-700",
  departed:    "bg-indigo-100 text-indigo-700",
  arrived:     "bg-cyan-100 text-cyan-700",
  in_progress: "bg-green-100 text-green-700",
  completed:   "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-red-100 text-red-600",
};

export const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC:            "แอร์",
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
