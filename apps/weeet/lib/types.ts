export type JobStatus = "assigned" | "in_progress" | "completed" | "cancelled";

// --- Repair Module (Phase C-1.1) ---
export type RepairJobStatus =
  // On-site states
  | "assigned"
  | "traveling"
  | "arrived"
  | "awaiting_entry"
  | "inspecting"
  | "awaiting_decision"
  | "awaiting_user"
  | "in_progress"
  | "completed"
  | "awaiting_review"
  | "closed"
  | "cancelled"
  | "converted_scrap"
  // Pickup states (Phase C-1.3)
  | "en_route_pickup"
  | "picked_up"
  | "appliance_at_shop"
  | "tested_ok"
  | "en_route_delivery"
  | "delivered"
  // Parcel states (Phase C-1.4)
  | "handed_off_to_weeer";

// --- Pickup Module (Phase C-1.3) ---
export const PICKUP_CONDITION_ITEMS = [
  "ไม่มีรอยแตก / บุบ",
  "ไม่มีรอยไหม้",
  "อุปกรณ์ครบตามที่ระบุ",
  "ปลั๊กและสายไฟสมบูรณ์",
] as const;

export type PickupConditionItem = typeof PICKUP_CONDITION_ITEMS[number];

export interface PickupReceiptPayload {
  serial_number?: string;
  accessories: string[];
  tech_signature: string; // base64 data URL
  customer_signature: string; // base64 data URL
  condition_check: string[];
  notes?: string;
}

export interface DeliveryReceiptPayload {
  post_photos?: string[]; // filenames after upload
  tech_signature: string;
  customer_signature: string;
  notes?: string;
}

export type RepairBranch = "B1.1" | "B1.2" | "B2.1" | "B2.2";

export interface RepairJob {
  id: string;
  job_no: string;
  service_type: "on_site" | "walk_in" | "pickup" | "parcel";
  status: RepairJobStatus;
  scheduled_at: string;
  departed_at?: string;
  arrived_at?: string;
  entry_approved_at?: string;
  weeer_approval_at?: string;
  user_approval_at?: string;
  completed_at?: string;
  closed_at?: string;
  departure_location?: { lat: number; lng: number };
  arrival_location?: { lat: number; lng: number };
  decision_branch?: RepairBranch;
  decision_notes?: string;
  original_price?: number;
  proposed_price?: number;
  final_price?: number;
  parts_added?: Array<{ name: string; qty: number; price: number }>;
  parts_used?: Array<{ partId?: string; name: string; qty: number; unitPrice?: number }>;
  scrap_agreed_price?: number;
  arrival_files?: string[];
  pre_inspection_files?: string[];
  post_repair_files?: string[];
  deposit_amount?: number;
  deposit_action?: string;
  inspection_fee_charged?: number;
  // Display / denormalized
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_lat?: number;
  customer_lng?: number;
  appliance_name?: string;
  problem_description?: string;
  weeer_shop_name?: string;
  // --- C-3.3 / D64: source of appliance ---
  source?: {
    type: "customer" | "purchased_scrap";
    refId?: string; // scrapJobId when type = "purchased_scrap"
  };
  // --- Sub-4 Wave 2: Services table expand fields ---
  title?: string;           // ชื่อ service (ALTER ADD COLUMN)
  description?: string;     // รายละเอียดงาน (ต่างจาก problem_description ที่เป็นปัญหาลูกค้า)
  point_amount?: number;    // มูลค่างาน (points) — รายได้ช่าง
  deadline?: string;        // กำหนดเสร็จงาน (ISO timestamptz)
}

export interface DiagnosePayload {
  branch: RepairBranch;
  notes: string;
  // B1.2 fields
  parts_added?: Array<{ name: string; qty: number; price: number }>;
  proposed_price?: number;
  // B2.1 fields
  cancel_reason?: string;
  cancel_category?: string;
  // B2.2 fields
  scrap_price?: number;
  scrap_weight_kg?: number;
}

export interface Job {
  id: string;
  jobNo: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  serviceType: string;
  module: string;
  scheduledAt: string;
  status: JobStatus;
  notes?: string;
  photos: { type: "before" | "after"; url: string; caption?: string }[];
  steps: { id: string; label: string; done: boolean }[];
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  shopName: string;
  shopId: string;
  avatarUrl?: string;
  specialties: string[];
  // Extended profile fields (R-02)
  birthDate?: string;
  address?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  educationLevel?: string;
  certificates?: string[]; // file names
}

export type AccountType = "default" | "rented";

export interface AuthState {
  isAuthenticated: boolean;
  technician: Technician | null;
  isImpersonated: boolean; // WeeeR logged in as this WeeeT
  impersonatedByShop?: string;
  accountType?: AccountType;
  forceChangePassword?: boolean; // rented only — must change on first login
  token?: string; // JWT from backend (null in mock/dev-bypass mode)
}

// --- Parts Module (Phase C-2.2 — D52 verbatim) ---
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

export interface LoginLockout {
  count: number;
  lockedUntil?: number; // epoch ms
}

// ─── Sub-8 Wave 3: Parts B2B Marketplace types ────────────────────────────────
// Mirror จาก apps/backend/src/types/parts-b2b.ts (Lesson #34 — ไม่ import ข้ามแอป)
// Source-of-truth: Backend. TODO: Sub-8 — refactor ถ้า Backend export shared pkg

export type PartsOrderStatus =
  | 'pending'   // สร้างแล้ว รอ escrow hold
  | 'held'      // escrow ถือเงินแล้ว
  | 'fulfilled' // seller ส่งของแล้ว
  | 'closed'    // buyer ยืนยันรับของ
  | 'disputed'  // มีข้อพิพาท
  | 'resolved'  // admin แก้ไขแล้ว
  | 'refunded'  // คืนเงิน
  | 'cancelled';

export type PartsOrderEventType =
  | 'created' | 'held' | 'fulfilled' | 'closed'
  | 'disputed' | 'resolved_buyer' | 'resolved_seller'
  | 'refunded' | 'rated' | 'cancelled';

export type PartsDisputeStatus =
  | 'open' | 'admin_reviewing'
  | 'resolved_buyer' | 'resolved_seller' | 'withdrawn';

export interface PartsOrderEventDto {
  id: string;
  orderId: string;
  eventType: PartsOrderEventType;
  actorId: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  detail: string | null;
  createdAt: string;
}

export interface PartsDisputeDto {
  id: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  status: PartsDisputeStatus;
  resolution: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface PartsRatingDto {
  id: string;
  orderId: string;
  ratedBy: string;
  sellerId: string;
  score: number; // 1–5
  comment: string | null;
  createdAt: string;
}

export interface PartsOrderDto {
  id: string;
  partId: string;
  buyerId: string;
  serviceId: string | null;
  quantity: number;
  unitPriceThb: string; // numeric as string (JSON safe)
  totalThb: string;
  status: PartsOrderStatus;
  fulfillmentNote: string | null;
  trackingNumber: string | null;
  fulfilledAt: string | null;
  closedAt: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartsOrderDetailDto extends PartsOrderDto {
  events: PartsOrderEventDto[];
  dispute: PartsDisputeDto | null;
  rating: PartsRatingDto | null;
}

// --- Maintain Module (Phase C-2.1) ---
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
  // Display / denormalized
  customer_name?: string;
  customer_phone?: string;
}

export const CLEANING_TYPE_LABELS: Record<MaintainJob["cleaningType"], string> = {
  general: "ล้างทั่วไป",
  deep: "ล้างลึก",
  sanitize: "ล้าง+ฆ่าเชื้อ",
};

export const APPLIANCE_TYPE_LABELS: Record<MaintainJob["applianceType"], string> = {
  AC: "เครื่องปรับอากาศ",
  WashingMachine: "เครื่องซักผ้า",
};

export const MAINTAIN_CHECKLIST_ITEMS: Record<MaintainJob["cleaningType"], string[]> = {
  general: [
    "ถอดและล้างแผ่นกรองอากาศ",
    "ทำความสะอาดคอยล์เย็น (ฉีดน้ำ)",
    "ทำความสะอาดถาดน้ำทิ้ง",
    "ตรวจท่อน้ำทิ้ง",
    "ทดสอบการทำงานหลังล้าง",
  ],
  deep: [
    "ถอดและล้างแผ่นกรองอากาศ",
    "ฉีดน้ำยาล้างคอยล์เย็น (แรงดันสูง)",
    "ทำความสะอาดคอยล์ร้อน (outdoor)",
    "ทำความสะอาดถาดน้ำทิ้ง + ล้างท่อ",
    "ตรวจน้ำยาแอร์ (เติมถ้าน้อย)",
    "ทดสอบการทำงานและวัดอุณหภูมิ",
  ],
  sanitize: [
    "ถอดและล้างแผ่นกรองอากาศ",
    "ฉีดน้ำยาล้างคอยล์เย็น (แรงดันสูง)",
    "ฉีดน้ำยาฆ่าเชื้อ (ทุกพื้นผิว)",
    "ทำความสะอาดคอยล์ร้อน (outdoor)",
    "ทำความสะอาดถาดน้ำทิ้ง + ล้างท่อ",
    "ตรวจน้ำยาแอร์ (เติมถ้าน้อย)",
    "ทดสอบการทำงานและวัดอุณหภูมิ",
  ],
};
