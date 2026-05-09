// ─── Appliance ────────────────────────────────────────────────────────────────

export interface Appliance {
  id: string;
  name: string;
  brand: string;
  model: string;
}

// ─── Listing (D59 verbatim — App3R-Advisor Gen 18) ────────────────────────────

export interface Listing {
  id: string;
  sellerId: string;
  sellerType: "WeeeU" | "WeeeR";
  listingType: "used_appliance" | "scrap";
  applianceId?: string;
  warranty?: { sourceWarranty: number; additionalWarranty: number };
  scrapItemId?: string;
  conditionGrade?: "grade_A" | "grade_B" | "grade_C";
  workingParts?: string[];
  price: number;
  deliveryMethods: string[];
  status:
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
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Offer (D61 verbatim — App3R-Advisor Gen 18) ─────────────────────────────

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

// ─── ScrapItem (D62 verbatim — App3R-Advisor Gen 20) ─────────────────────────

export interface ScrapItem {
  id: string;
  sellerId: string;
  sellerType: "WeeeU";              // C-3.2: WeeeU ขายเท่านั้น — ซื้อไม่ได้
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

// ─── ScrapJobOption (D62 verbatim — App3R-Advisor Gen 20) ────────────────────

export type ScrapJobOption =
  | "resell_parts"      // แยกอะไหล่ → STOCK_IN entries (D54 swap)
  | "repair_and_sell"   // ซ่อมขาย → disabled UI (C-3.3 placeholder)
  | "resell_as_scrap"   // ขายต่อซาก → relist whole unit
  | "dispose";          // รีไซเคิล → e-waste cert (HTML mock)

// ─── EWasteCertificate (D62 verbatim — App3R-Advisor Gen 20) ─────────────────

export interface EWasteCertificate {
  id: string;
  scrapJobId: string;
  issuedById: string;               // Admin user id
  issuedAt: string;
  certNumber: string;
  itemDescription: string;
  status: "pending" | "issued" | "rejected";
  htmlUrl?: string;                 // C-3.2 = HTML mock | Phase D = real PDF
}

// ─── MaintainJob (D48 verbatim — App3R-Advisor Gen 18) ───────────────────────

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
