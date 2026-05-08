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
  parts_used?: Array<{ partId?: string; name: string; qty: number; unitPrice?: number }>;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// D52 verbatim — Part type (Phase C-2.2)
// Source: CMD-022h Master CMD — ทุก chat copy ลงไฟล์นี้

export interface Part {
  id: string;
  shopId: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  condition: "new" | "used" | "refurbished";
  stockQty: number;
  reservedQty: number;
  unitPrice: number;
  imageUrl?: string;
  source?: { type: "purchase" | "disassembly"; refId?: string };
  createdAt: string;
  updatedAt: string;
}

// D53 verbatim — StockMovement type (Phase C-2.2)
// Source: CMD-022h Master CMD — ทุก chat copy ลงไฟล์นี้

export type StockMovementType = "STOCK_IN" | "STOCK_OUT" | "STOCK_ADJUSTMENT";
export type StockMovementReason =
  | "purchase" | "receive_from_disassembly"
  | "sell" | "use_for_repair" | "use_for_maintain" | "scrap"
  | "manual";

export interface StockMovement {
  id: string;
  partId: string;
  type: StockMovementType;
  qty: number;
  reason: StockMovementReason;
  refId?: string;
  note?: string;
  performedBy: string;
  performedAt: string;
  balanceAfter: number;
}
