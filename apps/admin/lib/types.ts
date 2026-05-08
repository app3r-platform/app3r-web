// D48 verbatim — MaintainJob type (Phase C-2.1)
// Source: CMD-022g Master CMD — ทุก chat copy ลงไฟล์นี้

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
