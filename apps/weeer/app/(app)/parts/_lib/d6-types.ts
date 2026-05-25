// ── D-6 Parts B2B Frontend Types ─────────────────────────────────────────────
// ใช้คู่กับ backend schema: 0021_d6_parts_b2b.sql

export interface D6Listing {
  id: string;
  weeerUserId: string;      // seller (ร้านที่ลงขาย)
  sellerName: string;       // display name
  partName: string;
  partNumber?: string;
  manufacturer?: string;
  conditionScore: number;   // 1-10
  sourceType: "new" | "used" | "disassembled";
  unitPrice: number;
  tierPricing: TierPricingRule[];
  qtyAvailable: number;
  warrantyDays: number;
  photos: string[];
  status: "active" | "inactive" | "sold_out" | "deleted";
  createdAt: string;
}

export interface TierPricingRule {
  minQty: number;
  maxQty: number;
  discount: number; // 0.05 = 5%
}

export interface D6CartItem {
  id: string;
  listingId: string;
  listing: D6Listing;
  qty: number;
  buyerRole: "weeer" | "weeet";
  expiresAt: string; // ISO
}

export interface D6CartGroup {
  sellerUserId: string;
  sellerName: string;
  items: D6CartItem[];
  subtotal: number;
}

export interface D6PartsRequest {
  id: string;
  requesterWeeerUserId: string;
  requesterName: string;
  applianceBrand: string;
  applianceModel: string;
  partName: string;
  partNumber?: string;
  qtyNeeded: number;
  urgency: "normal" | "urgent" | "emergency";
  neededBy?: string;
  preferredCondition?: string;
  maxPricePerUnit?: number;
  broadcastScope: "nearby" | "all" | "specific";
  status: "open" | "quoted" | "matched" | "expired";
  expiresAt: string;
  createdAt: string;
  quoteCount?: number;
}

export interface D6PartsReturn {
  id: string;
  orderId: string;
  reason: "defective" | "wrong_part" | "mismatch" | "quality";
  defectDescription: string;
  evidencePhotos: string[];
  status: "pending" | "approved" | "rejected" | "completed";
  resolutionType?: "refund" | "replace" | "credit";
  resolvedAt?: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTierDiscount(tierPricing: TierPricingRule[], qty: number): number {
  for (const tier of tierPricing) {
    if (qty >= tier.minQty && qty <= tier.maxQty) return tier.discount;
  }
  if (qty >= 6) return 0.10;
  if (qty >= 2) return 0.05;
  return 0;
}

export function getDiscountedPrice(unitPrice: number, tierPricing: TierPricingRule[], qty: number): number {
  const discount = getTierDiscount(tierPricing, qty);
  return unitPrice * (1 - discount);
}

export const URGENCY_LABEL: Record<D6PartsRequest["urgency"], string> = {
  normal:    "ปกติ (24h)",
  urgent:    "เร่งด่วน (12h)",
  emergency: "ฉุกเฉิน (2h)",
};

export const URGENCY_COLOR: Record<D6PartsRequest["urgency"], string> = {
  normal:    "bg-gray-100 text-gray-700",
  urgent:    "bg-orange-100 text-orange-700",
  emergency: "bg-red-100 text-red-700",
};

export const RETURN_REASON_LABEL: Record<D6PartsReturn["reason"], string> = {
  defective:   "สินค้าชำรุด",
  wrong_part:  "ผิดรุ่น/อะไหล่",
  mismatch:    "ไม่ตรงสเปค",
  quality:     "คุณภาพต่ำกว่าที่ระบุ",
};

export const RESOLUTION_LABEL: Record<NonNullable<D6PartsReturn["resolutionType"]>, string> = {
  refund:  "คืนเงิน",
  replace: "เปลี่ยนสินค้า",
  credit:  "ให้เครดิต",
};

// ── Mock seed data ─────────────────────────────────────────────────────────────

export const D6_LISTINGS_MOCK: D6Listing[] = [
  {
    id: "LST-001", weeerUserId: "usr-weeer-s002", sellerName: "ช่างไฟฟ้า XYZ",
    partName: "แผงวงจร PCB แอร์ Mitsubishi", partNumber: "PCB-MSZ-001",
    manufacturer: "Mitsubishi", conditionScore: 7, sourceType: "used",
    unitPrice: 1200, tierPricing: [{ minQty: 3, maxQty: 10, discount: 0.08 }],
    qtyAvailable: 3, warrantyDays: 14,
    photos: ["https://picsum.photos/400/300?seed=LST001"],
    status: "active", createdAt: "2026-05-20T08:00:00Z",
  },
  {
    id: "LST-002", weeerUserId: "usr-weeer-s003", sellerName: "อะไหล่เครื่องใช้ไฟฟ้า ดี",
    partName: "เซ็นเซอร์อุณหภูมิ NTC 10K", partNumber: "NTC-10K",
    manufacturer: "Generic", conditionScore: 9, sourceType: "new",
    unitPrice: 150, tierPricing: [{ minQty: 6, maxQty: 50, discount: 0.12 }],
    qtyAvailable: 20, warrantyDays: 30,
    photos: ["https://picsum.photos/400/300?seed=LST002"],
    status: "active", createdAt: "2026-05-21T09:00:00Z",
  },
  {
    id: "LST-003", weeerUserId: "usr-weeer-s006", sellerName: "เทคนิค เครื่องเย็น PRO",
    partName: "มอเตอร์พัดลม Indoor 25W", partNumber: "FAN-25W",
    manufacturer: "Midea", conditionScore: 10, sourceType: "new",
    unitPrice: 450, tierPricing: [],
    qtyAvailable: 6, warrantyDays: 90,
    photos: ["https://picsum.photos/400/300?seed=LST003"],
    status: "active", createdAt: "2026-05-22T10:00:00Z",
  },
  {
    id: "LST-004", weeerUserId: "usr-weeer-s005", sellerName: "อะไหล่ราคาถูก เชียงใหม่",
    partName: "น้ำยาแอร์ R32 กระป๋อง 1kg", partNumber: "R32-1KG",
    manufacturer: "Honeywell", conditionScore: 10, sourceType: "new",
    unitPrice: 550, tierPricing: [{ minQty: 2, maxQty: 5, discount: 0.05 }, { minQty: 6, maxQty: 50, discount: 0.10 }],
    qtyAvailable: 12, warrantyDays: 7,
    photos: ["https://picsum.photos/400/300?seed=LST004"],
    status: "active", createdAt: "2026-05-23T11:00:00Z",
  },
  {
    id: "LST-005", weeerUserId: "usr-weeer-s001", sellerName: "ร้านซ่อมแอร์ ABC",
    partName: "Capacitor 450V 35uF", partNumber: "CAP-450-35",
    manufacturer: "Epcos", conditionScore: 10, sourceType: "new",
    unitPrice: 220, tierPricing: [],
    qtyAvailable: 15, warrantyDays: 30,
    photos: ["https://picsum.photos/400/300?seed=LST005"],
    status: "active", createdAt: "2026-05-24T08:00:00Z",
  },
];

export const D6_CART_MOCK: D6CartItem[] = [
  {
    id: "CART-001", listingId: "LST-002",
    listing: D6_LISTINGS_MOCK[1]!,
    qty: 5, buyerRole: "weeer",
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "CART-002", listingId: "LST-003",
    listing: D6_LISTINGS_MOCK[2]!,
    qty: 2, buyerRole: "weeer",
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
  },
];

export const D6_REQUESTS_MOCK: D6PartsRequest[] = [
  {
    id: "REQ-001",
    requesterWeeerUserId: "usr-weeer-s004",
    requesterName: "ซ่อมแอร์ นครปฐม",
    applianceBrand: "Daikin",
    applianceModel: "FTXS25",
    partName: "บอร์ดควบคุม Daikin FTXS",
    partNumber: "CTR-FTXS25",
    qtyNeeded: 1,
    urgency: "urgent",
    maxPricePerUnit: 2000,
    broadcastScope: "all",
    status: "open",
    expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    quoteCount: 0,
  },
  {
    id: "REQ-002",
    requesterWeeerUserId: "usr-weeer-s002",
    requesterName: "ช่างไฟฟ้า XYZ",
    applianceBrand: "Samsung",
    applianceModel: "WW75J5",
    partName: "มอเตอร์ปั่นแห้ง",
    qtyNeeded: 1,
    urgency: "normal",
    broadcastScope: "all",
    status: "open",
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    quoteCount: 1,
  },
];

// ── localStorage helpers ───────────────────────────────────────────────────────

const CART_KEY = "d6_cart_items";

export function getCartItems(): D6CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? "null") ?? D6_CART_MOCK;
  } catch {
    return D6_CART_MOCK;
  }
}

export function saveCartItems(items: D6CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function groupCartByShop(items: D6CartItem[]): D6CartGroup[] {
  const map: Record<string, D6CartGroup> = {};
  for (const item of items) {
    const sid = item.listing.weeerUserId;
    if (!map[sid]) {
      map[sid] = { sellerUserId: sid, sellerName: item.listing.sellerName, items: [], subtotal: 0 };
    }
    const discounted = getDiscountedPrice(item.listing.unitPrice, item.listing.tierPricing, item.qty);
    map[sid]!.items.push(item);
    map[sid]!.subtotal += discounted * item.qty;
  }
  return Object.values(map);
}
