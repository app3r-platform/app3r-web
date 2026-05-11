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

// ── Parts B2B Marketplace Types — D81 (Phase C-6 additive) ───────────────────
// B2B = Business-to-Business (ร้านถึงร้าน)

export type PartCategory =
  | "electronic"    // อิเล็กทรอนิกส์
  | "mechanical"    // กลไก
  | "consumable"    // สิ้นเปลือง
  | "tool";         // เครื่องมือ

export interface PartListing {
  id: string;
  shopId: string;
  shopName: string;
  category: PartCategory;
  name: string;
  brand: string;
  condition: "new" | "used" | "refurbished";
  pricePoints: number;
  stock: number;
  images: string[];           // Lorem Picsum URLs
  description?: string;
  createdAt: string;
}

export type OrderStage =
  | "ordered"     // สั่งซื้อแล้ว
  | "shipped"     // จัดส่งแล้ว
  | "received"    // รับของแล้ว
  | "cancelled";  // ยกเลิก (เฉพาะ ordered)

export type DeliveryMethod = "self_pickup" | "courier";

export interface PartOrder {
  id: string;
  partId: string;
  partName: string;
  sellerShopId: string;
  sellerShopName: string;
  buyerShopId: string;
  buyerShopName: string;
  quantity: number;
  pricePoints: number;
  totalPoints: number;
  platformFee: number;        // 3% ปัดเศษตาม D75
  netToSeller: number;
  deliveryMethod: DeliveryMethod;
  trackingNumber?: string;
  stage: OrderStage;
  orderedAt: string;
  shippedAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
}

export interface ShopMock {
  id: string;
  name: string;
  address: string;
  pointsBalance: number;
  escrowHeld: number;
}

export interface FeeAuditEntry {
  orderId: string;
  totalPoints: number;
  rawFee: number;
  roundedFee: number;
  direction: "up" | "down" | "exact";
  timestamp: string;
}

export interface EscrowRecord {
  orderId: string;
  buyerShopId: string;
  amount: number;
  heldAt: string;
  releasedAt?: string;
  refundedAt?: string;
}

export const PLATFORM_FEE_RATE = 0.03;

export const CATEGORY_LABEL: Record<PartCategory, string> = {
  electronic: "อิเล็กทรอนิกส์",
  mechanical:  "กลไก",
  consumable:  "สิ้นเปลือง",
  tool:        "เครื่องมือ",
};

export const CATEGORY_COLOR: Record<PartCategory, string> = {
  electronic: "bg-blue-100 text-blue-700",
  mechanical:  "bg-orange-100 text-orange-700",
  consumable:  "bg-green-100 text-green-700",
  tool:        "bg-purple-100 text-purple-700",
};

export const B2B_CONDITION_LABEL: Record<PartListing["condition"], string> = {
  new:         "ใหม่",
  used:        "มือสอง",
  refurbished: "รีเฟอร์บิช",
};

export const B2B_CONDITION_COLOR: Record<PartListing["condition"], string> = {
  new:         "bg-emerald-100 text-emerald-700",
  used:        "bg-yellow-100 text-yellow-700",
  refurbished: "bg-cyan-100 text-cyan-700",
};

export const ORDER_STAGE_LABEL: Record<OrderStage, string> = {
  ordered:   "สั่งซื้อแล้ว",
  shipped:   "จัดส่งแล้ว",
  received:  "รับของแล้ว",
  cancelled: "ยกเลิก",
};

export const ORDER_STAGE_COLOR: Record<OrderStage, string> = {
  ordered:   "bg-blue-100 text-blue-700",
  shipped:   "bg-orange-100 text-orange-700",
  received:  "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  self_pickup: "รับเอง",
  courier:     "ส่งขนส่ง",
};
