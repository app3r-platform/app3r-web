// ── Part — D52 verbatim (App3R-Advisor Gen 19) ────────────────────────────────

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

// ── StockMovement — D53 verbatim ───────────────────────────────────────────────

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

// ── parts_used unified — D55 (additive — ไม่ break Repair/Maintain) ───────────

export interface PartsUsedItem {
  partId?: string;   // optional — เชื่อม catalog
  name: string;
  qty: number;
  unitPrice?: number;
}

// ── Display helpers ────────────────────────────────────────────────────────────

export const CONDITION_LABEL: Record<Part["condition"], string> = {
  new:         "ใหม่",
  used:        "มือสอง",
  refurbished: "Refurb",
};

export const CONDITION_COLOR: Record<Part["condition"], string> = {
  new:         "bg-green-100 text-green-700",
  used:        "bg-yellow-100 text-yellow-700",
  refurbished: "bg-blue-100 text-blue-700",
};

export const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  STOCK_IN:         "รับเข้า",
  STOCK_OUT:        "จ่ายออก",
  STOCK_ADJUSTMENT: "ปรับแต่ง",
};

export const MOVEMENT_TYPE_COLOR: Record<StockMovementType, string> = {
  STOCK_IN:         "bg-green-100 text-green-700",
  STOCK_OUT:        "bg-red-100 text-red-600",
  STOCK_ADJUSTMENT: "bg-yellow-100 text-yellow-700",
};

export const REASON_LABEL: Record<StockMovementReason, string> = {
  purchase:                "ซื้อเข้า",
  receive_from_disassembly: "แยกจากซาก",
  sell:                    "ขายออก",
  use_for_repair:          "ใช้ซ่อม",
  use_for_maintain:        "ใช้ล้าง",
  scrap:                   "ทิ้ง",
  manual:                  "ปรับ Manual",
};
