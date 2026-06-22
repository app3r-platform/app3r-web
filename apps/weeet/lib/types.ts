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
  // B2.1 fields (decline → 3-group modal · REP-C10)
  cancel_reason?: string;
  cancel_category?: string;
  decline_group?: WeeeTDeclineGroup; // 1 ใน 3 กลุ่ม (SoT Gen 55 "ปฏิเสธรับซ่อม")
  decline_photo_count?: number;       // จำนวนรูปประกอบ (≤3) — mock-level, นับไฟล์เท่านั้น
  // B2.2 fields
  scrap_price?: number;
  scrap_weight_kg?: number;
}

// ─── REP-C10: WeeeT ปฏิเสธรับซ่อม — Modal เหตุผล 3 กลุ่ม (SoT Gen 55) ──────────
// "กดปุ่ม ปฏิเสธรับซ่อม → modal เปิด → เลือก 1 กลุ่ม + textarea + รูปประกอบ optional (≤3)"
// audit log สำหรับ dispute resolution. Mock-level — ไม่มี backend.
export type WeeeTDeclineGroup =
  | "customer_uncooperative" // 1. ลูกค้าไม่ให้ความร่วมมือ / สภาพแวดล้อมไม่อำนวย
  | "unrepairable"           // 2. เครื่องใช้ไฟฟ้าซ่อมไม่ได้
  | "symptom_mismatch";      // 3. อาการไม่ตรงกับที่ลูกค้าแจ้ง + ซ่อมไม่ได้

export const WEEET_DECLINE_GROUPS: Array<{
  key: WeeeTDeclineGroup;
  title: string;
  examples: string;
}> = [
  {
    key: "customer_uncooperative",
    title: "ลูกค้าไม่ให้ความร่วมมือ / สภาพแวดล้อมไม่อำนวย",
    examples: "ไม่ให้เข้าสถานที่, ไม่อยู่บ้าน, ไฟดับ, ไม่มีน้ำ, พื้นที่อันตราย",
  },
  {
    key: "unrepairable",
    title: "เครื่องใช้ไฟฟ้าซ่อมไม่ได้",
    examples: "เสียหายเกินซ่อม, ไม่มีอะไหล่ในตลาด, ต้นทุนสูงกว่าซื้อใหม่",
  },
  {
    key: "symptom_mismatch",
    title: "อาการไม่ตรงกับที่ลูกค้าแจ้ง + ซ่อมไม่ได้",
    examples: "พบปัญหาคนละจุด + เกินขอบเขตข้อเสนอ",
  },
];

export const DECLINE_MAX_PHOTOS = 3;

// ─── REP-C09: B4 ปิดงาน + OTP (แทนลายเซ็น · SoT Gen 57) ───────────────────────
// "ซ่อมเสร็จ → B4 report ปิดงาน + OTP → WeeeU ยืนยันรับ → เสร็จสิ้น + settle"
// ลายเซ็นถูกตัดออก (Gen 57); OTP เฉพาะ B4 + ปฏิเสธ. Mock-level — verify จริง = backend (deferred).
export interface B4CloseJobPayload {
  job_completion_otp: string; // OTP ที่ WeeeT generate ให้ WeeeU กรอกตอนรับเครื่อง
  notes?: string;
}

// ─── Repair B-forms (SoT Gen 55 · Phase D-6) ──────────────────────────────────
// Source of Truth: Notion page 364813ec-7277-811c-9d31-f34abb7021fe (Workflow Gen 55)
// Mock/localStorage-level only — settle/verify computation stays backend (deferred).

// Roles ที่ดู B-forms (สำหรับ role-based visibility per SoT "Role-based Visibility")
export type RepairViewRole = "weeet" | "weeer" | "weeeu";

export const REPAIR_VIEW_ROLE_LABELS: Record<RepairViewRole, string> = {
  weeet: "ช่าง (WeeeT)",
  weeer: "ร้าน (WeeeR)",
  weeeu: "ลูกค้า (WeeeU)",
};

// --- B2: ฟอร์มประเมินก่อนซ่อม (WeeeT · rough estimate) — v3.2 RECONCILED Gen 58 ---
// 10-field spec ตาม SoT. field #9 (เสนอซื้อซาก) DEPRECATED Gen 58 (ย้ายไป B3 section 6).
export type B2SymptomConfirm = "match" | "not_found";

// field #5 — อะไหล่ที่ต้องใช้ + worktype (multi-row) — rough draft (B3.5 override ทีหลัง)
export interface B2PartRow {
  name: string;
  worktype: RepairWorktype;     // ซ่อม/เปลี่ยน/ทำความสะอาด/เติม
  inStock: boolean;             // field #6 — สถานะ part ในสต๊อก WeeeR (auto badge)
}

export interface B2EstimatePayload {
  // #3 — ยืนยันอาการ WeeeU แจ้ง ต่อข้อ (radio: ตรง/ไม่พบ)
  symptom_confirms: Record<string, B2SymptomConfirm>;
  // #4 — อาการที่ WeeeT พบเพิ่ม (multi-chips)
  extra_symptoms: string[];
  // #5 + #6 — อะไหล่ + worktype + stock
  parts: B2PartRow[];
  // #8 — ข้อเสนอค่าใช้จ่ายจากช่าง (ค่าแรงเพิ่ม + ค่าเดินทางกลับ-มาใหม่)
  tech_fee_offer?: number;
  notes?: string;
}

// #10 สรุปยอด — role-based breakdown. WeeeT เห็นแค่ total / WeeeR+WeeeU เห็นทุก breakdown.
export interface B2PriceBreakdown {
  parts_cost: number;     // ค่าอะไหล่ (รายตัวรวม)
  labor_cost: number;     // ค่าแรง
  travel_cost: number;    // ค่าเดินทาง
  total: number;          // รวมทั้งสิ้น
}

// --- B3: ใบตรวจสอบงานซ่อมก่อนซ่อม (Pre-repair Checklist · 7 sections) — v4 Gen 58 ---
export type B3CheckState = "ok" | "abnormal" | "unset";

export interface B3InspectItem {
  label: string;
  std?: string;            // ค่ามาตรฐาน (section 4/5)
  state: B3CheckState;
  note?: string;
}

// section 2 — ตรวจสอบเบื้องต้น (4 รายการ default)
export const B3_BASIC_INSPECTION: string[] = [
  "สภาพภายนอก/ภายใน",
  "การทำงาน (เปิด-ปิด)",
  "สายไฟ/รีโมท/ปลั๊ก",
  "เสียงผิดปกติ",
];

// section 4 — ตรวจวัดค่าทางไฟฟ้า (3 รายการ default + ค่ามาตรฐาน)
export const B3_ELECTRICAL_MEASURES: Array<{ label: string; std: string }> = [
  { label: "แรงดันไฟฟ้า", std: "198-253V ±10%" },
  { label: "กระแสไฟฟ้า", std: "ตาม Product std." },
  { label: "แรงดันน้ำยา (แอร์/ตู้เย็น)", std: "เช่น R32 = 120-160 psi" },
];

// section 5 — ตรวจสอบชิ้นส่วน (template per appliance) — โหลด auto จาก checklist_templates
export const B3_PARTS_TEMPLATES: Record<string, string[]> = {
  แอร์: [
    "แหล่งจ่ายไฟ", "แผงคอยล์", "มอเตอร์พัดลม", "แผ่นกรอง", "ท่อ-ถาดน้ำทิ้ง",
    "รีโมท", "มอเตอร์สวิง", "คาปาซิเตอร์", "แผงควบคุม (คอยล์เย็น)",
    "คาปาซิเตอร์คอม", "คาปาซิเตอร์มอเตอร์", "คอมเพรสเซอร์", "ใบพัดมอเตอร์",
    "คอนเดนเซอร์", "อุปกรณ์ลดแรงดัน", "แมกเนติก", "หัวคอยล์อิเล็กฯ", "โครงและฝาครอบ",
  ],
  ตู้เย็น: [
    "คอมเพรสเซอร์", "คอนเดนเซอร์", "อีแวปปอเรเตอร์", "เอกซ์แพนชันวาล์ว", "ดรายเออร์",
    "แหล่งจ่ายไฟ+แผงควบคุม", "เทอร์โมสตัท", "เทอร์โมฟิวส์", "ฮีตเตอร์", "พัดลม",
    "สวิตช์ประตู", "หลอดไฟ", "ขอบยาง",
  ],
  เครื่องซักผ้า: [
    "แหล่งจ่ายไฟ+แผงควบคุม", "มอเตอร์", "คาปาซิเตอร์", "สายพาน", "ปั๊มระบายน้ำ",
    "ชุดครัช", "โช๊ค", "ชุดถังซัก", "สวิตช์ประตู+เซฟตี้", "โซลินอยด์วาล์ว", "เพลสเชอร์สวิทซ์",
  ],
  ทีวี: [
    "แหล่งจ่ายไฟ+แผงควบคุม", "แบ็คไลท์", "จอภาพ", "ลำโพง", "รีโมท",
    "แผงปุ่ม", "แผ่นกระจายแสง", "T-con",
  ],
  // Fallback (เตารีด/อื่นๆ) — Generic ตาม SoT
  อื่นๆ: ["แหล่งจ่ายไฟ", "ฮีตเตอร์", "เทอร์โมสตัท", "สายไฟ"],
};

// section 6 — สรุปผล + 3 ทางเลือก
export type B3Decision = "repairable" | "scrap_offer" | "decline";

export const B3_DECISION_LABELS: Record<B3Decision, string> = {
  repairable: "✅ ซ่อมได้",
  scrap_offer: "💰 เสนอซื้อซาก",
  decline: "🚫 ปฏิเสธรับซ่อม",
};

export interface B3ChecklistPayload {
  basic_inspection: B3InspectItem[];   // section 2
  symptom_text: string;                // section 3
  electrical: B3InspectItem[];         // section 4
  parts_inspection: B3InspectItem[];   // section 5
  summary: string;                     // section 6 textarea
  decision: B3Decision;                // section 6 badge
}

// B3 acknowledge — mock real-time รับทราบ จาก WeeeR/WeeeU
export interface B3Acknowledge {
  role: Exclude<RepairViewRole, "weeet">;
  acknowledged: boolean;
  at?: string;
}

// --- B3.5: Smart Picker ระบุรายละเอียดอะไหล่ (final override ของ B2) — Gen 58 ---
export type RepairWorktype = "replace" | "clean" | "repair" | "refill";

export const REPAIR_WORKTYPE_LABELS: Record<RepairWorktype, string> = {
  replace: "เปลี่ยนใหม่",
  clean: "ทำความสะอาด",
  repair: "ซ่อมแซม",
  refill: "เติม",
};

// 3 status pills — IN_VAN / IN_SHOP / NEED_ORDER (active เพียง 1 ต่อการ์ด)
export type PartStockStatus = "IN_VAN" | "IN_SHOP" | "NEED_ORDER";

export const PART_STOCK_STATUS_META: Record<
  PartStockStatus,
  { label: string; icon: string; sub: string; cls: string }
> = {
  IN_VAN: {
    label: "ในรถช่าง",
    icon: "🚐",
    sub: "มีพร้อมหน้างาน",
    cls: "bg-green-900/40 text-green-300 border-green-600",
  },
  IN_SHOP: {
    label: "ที่ร้าน",
    icon: "🏪",
    sub: "ในสต๊อก WeeeR",
    cls: "bg-blue-900/40 text-blue-300 border-blue-600",
  },
  NEED_ORDER: {
    label: "ต้องสั่ง",
    icon: "📦",
    sub: "B2B 1-2 วัน",
    cls: "bg-amber-900/40 text-amber-300 border-amber-600",
  },
};

export interface SmartPickerPartCard {
  id: string;
  name: string;
  fromB2: boolean;            // [tag จาก B2] หรือ เพิ่มนอก B2
  code?: string;
  price_genuine: number;      // ราคาแท้ default
  price_used: number;         // ราคามือสอง default
  qty: number;
  unit: string;
  stock: PartStockStatus;     // 1 ใน 3 pills
  worktypes: RepairWorktype[]; // multi-select chips
}

// section 5 — ทางเลือกการดำเนินงาน (แสดงเฉพาะมี IN_SHOP หรือ NEED_ORDER)
export type AwaitingPartsChoice = "take_back" | "return_visit" | null;

export interface SmartPickerPayload {
  parts: SmartPickerPartCard[];
  awaiting_choice: AwaitingPartsChoice;
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

// Sub-9: Buyer Order List (GET /api/v1/parts/orders/)
export interface PartsOrderListDto {
  items: PartsOrderDto[];
  total: number;
  limit: number;
  offset: number;
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
