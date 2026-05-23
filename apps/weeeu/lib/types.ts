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

// ─── MaintainJob (D48 verbatim — App3R-Advisor Gen 18, extended Blueprint 2.1) ─

export interface MaintainJob {
  id: string;
  serviceCode: string;             // "M-2026-001"
  customerId: string;
  shopId?: string;
  technicianId?: string;
  /**
   * awaiting_offer  — จองแล้ว รอ WeeeR ส่งข้อเสนอ (Blueprint 2.1)
   * offer_expired   — M2: หมดเวลายื่นข้อเสนอ ไม่มีร้านรับ → WeeeU จองใหม่ได้
   * weeer_withdrawn — M6: WeeeR ถอนงานหลังยืนยัน → รอ WeeeU ตัดสินใจ (reroute/dispute)
   * terminated      — M9: WeeeU ยุติงานระหว่าง in_progress → WeeeR รับแจ้งประสาน
   * closed_for_repair — WeeeR พบความเสียหาย → ปิด Maintain, แจ้ง WeeeU ซ่อม (D-M-2)
   */
  status:
    | "awaiting_offer"
    | "offer_expired"
    | "pending"
    | "assigned"
    | "departed"
    | "arrived"
    | "in_progress"
    | "terminated"
    | "completed"
    | "cancelled"
    | "weeer_withdrawn"
    | "closed_for_repair";
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

// ─── MaintainOffer (Blueprint 2.1 — Offer=SoT, Decision กลาง) ────────────────

export interface MaintainOfferTerms {
  deposit?: number;                // มัดจำ (บาท)
  deposit_refundable?: boolean;    // คืนมัดจำเมื่องานเสร็จ
  travel_fee?: number;             // ค่าเดินทาง (บาท)
  inspection_fee?: number;         // ค่าตรวจ (ถ้ามี)
  warranty_days?: number;          // รับประกัน (วัน)
  no_show_fee?: number;            // ค่าฝาก/no-show (บาท)
  liability_cap?: number;          // วงเงินความรับผิด (บาท)
  notes?: string;                  // หมายเหตุเพิ่มเติม
}

export interface MaintainOffer {
  id: string;
  jobId: string;
  shopId: string;
  shopName: string;
  shopRating: number;              // 0-5
  shopReviewCount: number;
  price: number;                   // ค่าบริการรวม (บาท)
  terms: MaintainOfferTerms;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  acknowledgedAt?: string;         // WeeeU กดรับทราบ (ก่อนยืนยัน)
  expiresAt: string;
  createdAt: string;
}
