// ── Resell Module Types (Phase C-3.1) ──────────────────────────────────────
// UsedAppliance: separated from Parts inventory (different domain)
// Listing: D59 verbatim (Unified + Additive — used_appliance fields for C-3.1)
// Offer: D61 verbatim (Unified + Dual-layer Validation)

// ── UsedAppliance ──────────────────────────────────────────────────────────
export type ApplianceCondition = "like_new" | "good" | "fair";
export type ApplianceStatus = "in_stock" | "listed" | "sold";

export interface UsedAppliance {
  id: string;
  shopId: string;
  name: string;
  brand?: string;
  model?: string;
  category: string;
  condition: ApplianceCondition;
  costPrice: number;
  suggestedPrice: number;
  imageUrl?: string;
  sku?: string;
  status: ApplianceStatus;
  source?: { type: "purchased" | "acquired" | "manual"; orderId?: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const CONDITION_LABEL: Record<ApplianceCondition, string> = {
  like_new: "เหมือนใหม่",
  good: "สภาพดี",
  fair: "พอใช้",
};

export const CONDITION_COLOR: Record<ApplianceCondition, string> = {
  like_new: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-yellow-100 text-yellow-700",
};

export const APPLIANCE_STATUS_LABEL: Record<ApplianceStatus, string> = {
  in_stock: "ในสต๊อก",
  listed: "ประกาศอยู่",
  sold: "ขายแล้ว",
};

export const APPLIANCE_STATUS_COLOR: Record<ApplianceStatus, string> = {
  in_stock: "bg-gray-100 text-gray-600",
  listed: "bg-blue-100 text-blue-700",
  sold: "bg-green-100 text-green-700",
};

// ── Listing — D59 verbatim ─────────────────────────────────────────────────
export type ListingStatus =
  | "announced"
  | "receiving_offers"
  | "offer_selected"
  | "buyer_confirmed"
  | "in_progress"
  | "delivered"
  | "inspection_period"
  | "completed"
  | "cancelled"
  | "disputed";

export interface Listing {
  id: string;
  sellerId: string;
  sellerType: "WeeeU" | "WeeeR";
  listingType: "used_appliance" | "scrap";

  // used_appliance fields (C-3.1)
  applianceId?: string;
  applianceName?: string;     // denormalized for display
  applianceBrand?: string;
  applianceModel?: string;
  warranty?: { sourceWarranty: number; additionalWarranty: number };

  // scrap fields (C-3.2 — additive, not used yet)
  scrapItemId?: string;
  conditionGrade?: "grade_A" | "grade_B" | "grade_C";
  workingParts?: string[];

  // shared
  price: number;
  deliveryMethods: string[];
  status: ListingStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;

  // metadata
  offerCount?: number;
  viewCount?: number;
  imageUrl?: string;
  description?: string;
}

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  announced: "ประกาศแล้ว",
  receiving_offers: "รับข้อเสนอ",
  offer_selected: "เลือกข้อเสนอแล้ว",
  buyer_confirmed: "ผู้ซื้อยืนยัน",
  in_progress: "กำลังดำเนินการ",
  delivered: "ส่งมอบแล้ว",
  inspection_period: "ช่วงตรวจสอบ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  disputed: "พิพาท",
};

export const LISTING_STATUS_COLOR: Record<ListingStatus, string> = {
  announced:        "bg-blue-100 text-blue-700",
  receiving_offers: "bg-indigo-100 text-indigo-700",
  offer_selected:   "bg-purple-100 text-purple-700",
  buyer_confirmed:  "bg-cyan-100 text-cyan-700",
  in_progress:      "bg-yellow-100 text-yellow-700",
  delivered:        "bg-orange-100 text-orange-700",
  inspection_period:"bg-amber-100 text-amber-700",
  completed:        "bg-green-100 text-green-700",
  cancelled:        "bg-gray-100 text-gray-500",
  disputed:         "bg-red-100 text-red-700",
};

// Terminal states — can't transition from these
export const LISTING_TERMINAL: ListingStatus[] = ["completed", "cancelled", "disputed"];

// ── Offer — D61 verbatim ───────────────────────────────────────────────────
export type OfferStatus = "pending" | "selected" | "rejected" | "withdrawn";

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerType: "WeeeU" | "WeeeR";
  offerPrice: number;
  deliveryMethod: string;
  message?: string;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;

  // denormalized for display
  listingTitle?: string;
  buyerName?: string;
}

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  pending: "รอการตอบ",
  selected: "ถูกเลือก",
  rejected: "ถูกปฏิเสธ",
  withdrawn: "ถอนข้อเสนอ",
};

export const OFFER_STATUS_COLOR: Record<OfferStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  selected:  "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-500",
};

// ── Transaction (IN_PROGRESS → COMPLETED view) ────────────────────────────
export interface ResellTransaction {
  id: string;           // same as listingId
  listingId: string;
  applianceName: string;
  sellerName: string;
  buyerName: string;
  price: number;
  status: ListingStatus;
  deliveryMethod: string;
  createdAt: string;
  updatedAt: string;
}
