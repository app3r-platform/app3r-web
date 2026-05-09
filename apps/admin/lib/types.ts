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

// D59 verbatim — Listing type (Phase C-3.1)
// Source: CMD-022i Master CMD — ทุก chat copy ลงไฟล์นี้

export interface Listing {
  id: string;
  sellerId: string;
  sellerType: "WeeeU" | "WeeeR";
  listingType: "used_appliance" | "scrap";

  // used_appliance fields (C-3.1)
  applianceId?: string;
  warranty?: { sourceWarranty: number; additionalWarranty: number };

  // scrap fields (C-3.2 — additive, ยังไม่สร้างใน C-3.1)
  scrapItemId?: string;
  conditionGrade?: "grade_A" | "grade_B" | "grade_C";
  workingParts?: string[];

  // shared
  price: number;
  deliveryMethods: string[];
  status: "announced" | "receiving_offers" | "offer_selected" | "buyer_confirmed" | "in_progress" | "delivered" | "inspection_period" | "completed" | "cancelled" | "disputed";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// D61 verbatim — Offer type (Phase C-3.1)
// Source: CMD-022i Master CMD — ทุก chat copy ลงไฟล์นี้

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerType: "WeeeU" | "WeeeR";
  offerPrice: number;
  deliveryMethod: string;
  message?: string;
  status: "pending" | "selected" | "rejected" | "withdrawn";
  expiresAt: string;
  createdAt: string;
}

// D62 verbatim — ScrapItem / ScrapJob / ScrapJobOption / EWasteCertificate (Phase C-3.2)
// Source: CMD-022j Master CMD — ทุก chat copy ลงไฟล์นี้

export interface ScrapItem {
  id: string;
  sellerId: string;
  sellerType: "WeeeU";
  applianceId?: string;
  conditionGrade: "grade_A" | "grade_B" | "grade_C";
  workingParts: string[];
  description: string;
  photos: string[];
  price: number;
  status: "available" | "sold" | "removed";
  createdAt: string;
  updatedAt: string;
}

export interface ScrapJob {
  id: string;
  scrapItemId: string;
  buyerId: string;
  buyerType: "WeeeR";
  decision: ScrapJobOption;
  decisionAt?: string;
  status: "pending_decision" | "in_progress" | "completed" | "cancelled";
  partsCreatedIds?: string[];
  newListingId?: string;
  certificateId?: string;
  repairJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScrapJobOption =
  | "resell_parts"
  | "repair_and_sell"
  | "resell_as_scrap"
  | "dispose";

export interface EWasteCertificate {
  id: string;
  scrapJobId: string;
  issuedById: string;
  issuedAt: string;
  certNumber: string;
  itemDescription: string;
  status: "pending" | "issued" | "rejected";
  htmlUrl?: string;
}
