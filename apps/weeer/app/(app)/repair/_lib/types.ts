export type RepairJobStatus =
  | "assigned" | "traveling" | "arrived" | "awaiting_entry"
  | "inspecting" | "awaiting_decision" | "awaiting_user"
  | "in_progress" | "completed" | "awaiting_review"
  | "closed" | "cancelled" | "converted_scrap";

export type DecisionBranch = "B1.1" | "B1.2" | "B2.1" | "B2.2";

export interface RepairJob {
  id: string;
  announcement_id: string;
  weeeu_id: string;
  weeet_id: string;
  weeet_name: string;
  appliance_name: string;
  service_type: "on_site";
  status: RepairJobStatus;
  scheduled_at: string;
  arrived_at?: string;
  entry_approved_at?: string;
  weeer_approval_at?: string;
  completed_at?: string;
  closed_at?: string;
  departure_location?: { lat: number; lng: number };
  arrival_location?: { lat: number; lng: number };
  decision_branch?: DecisionBranch;
  decision_notes?: string;
  original_price: number;
  proposed_price?: number;
  final_price?: number;
  parts_added?: { name: string; qty: number; price: number }[];
  scrap_agreed_price?: number;
  deposit_amount?: number;
  deposit_policy_unrepairable?: "free" | "forfeit" | "refund";
  arrival_files?: string[];
  pre_inspection_files?: string[];
  post_repair_files?: string[];
  customer_address: string;
  customer_name: string;
  // D64 RepairJob source additive (Phase C-3.3)
  source?: {
    type: "customer" | "purchased_scrap";
    refId?: string;  // scrapJobId เมื่อ type = "purchased_scrap"
  };
}

// ─── REP-C07: B2.5 PackageOffer (WeeeR → WeeeU) — SoT Gen 55/56 ───────────────
// "WeeeR จัด 2 packages: A อะไหล่แท้ (รับประกัน 90 วัน, badge แนะนำ) / B มือสอง (รับประกัน 30 วัน)"
// แต่ละ package รวม: ค่าอะไหล่ + ค่าแรง + ค่าเดินทาง (ตามทางเลือก a/b) + เวลาเสร็จ + รับประกัน
// NOT a bid-list — 2 packages พร้อมกัน, WeeeU เลือก 1 หรือ "ไม่ตกลงราคา → ยุติ".
// Mock-level only — settle/escrow = backend (deferred).
export type PackageKind = "genuine" | "used"; // A=อะไหล่แท้ / B=อะไหล่มือสอง

// ค่ารับประกันมาตรฐานตาม SoT: แท้ 90 วัน / มือสอง 30 วัน
export const PACKAGE_WARRANTY_DAYS: Record<PackageKind, number> = {
  genuine: 90,
  used: 30,
};

export const PACKAGE_KIND_META: Record<
  PackageKind,
  { label: string; partsLabel: string; recommended: boolean }
> = {
  genuine: { label: "Package A", partsLabel: "อะไหล่แท้ (มือหนึ่ง)", recommended: true },
  used: { label: "Package B", partsLabel: "อะไหล่มือสอง", recommended: false },
};

// 1 รายการอะไหล่ใน package (WeeeR breakdown — WeeeU เห็นได้)
export interface PackagePartLine {
  name: string;
  qty: number;
  unit: string;
  price: number;          // ราคารวม (qty × unit price) ใน package นั้น
  genuine_only?: boolean; // part ที่ไม่มีเวอร์ชั่นมือสอง (เช่น น้ำยา/สารเคมี) → footnote *
}

export interface RepairPackage {
  kind: PackageKind;
  parts: PackagePartLine[];
  parts_cost: number;     // รวมค่าอะไหล่
  labor_cost: number;     // ค่าแรง
  travel_cost: number;    // ค่าเดินทาง (ตามทางเลือก awaiting_parts a/b)
  total: number;          // รวมทั้งสิ้น
  warranty_days: number;  // 90 (แท้) / 30 (มือสอง)
  duration_days: number;  // เวลาเสร็จ (ประมาณ)
}

export interface PackageOffer {
  job_id: string;
  appliance_name: string;
  packages: RepairPackage[]; // เสมอ 2: [genuine, used]
  note_to_customer?: string; // หมายเหตุถึงลูกค้า
  deposit_amount?: number;   // มัดจำเดิม (เตือนตอน WeeeU ยุติ)
  travel_fee_on_cancel?: number; // ค่าเดินทางตาม offer เดิม (เตือนตอนยุติ)
  status: "draft" | "sent";
}

// ─── REP-C08: awaiting_parts binary choice + per-option price — SoT Gen 55 ─────
// "WeeeT ถามลูกค้าหน้างาน: (a) ยกเครื่องกลับร้าน หรือ (b) ช่างกลับมาใหม่+ค่าเดินทาง
//  → WeeeR คำนวณราคาตามทางเลือก". WeeeR sets price/option · WeeeT/WeeeU see+choose.
// ค่าเดียวกันต้อง mirror ใน weeet/weeeu (import ข้ามแอปไม่ได้ — Lesson #34).
export type AwaitingPartsOption = "take_back" | "return_visit";

export const AWAITING_PARTS_OPTION_META: Record<
  AwaitingPartsOption,
  { label: string; desc: string; icon: string }
> = {
  take_back: {
    label: "ยกเครื่องกลับร้าน",
    desc: "ช่างยกเครื่องไปซ่อมที่ร้าน แล้วนำกลับมาคืนเมื่อเสร็จ",
    icon: "🏠",
  },
  return_visit: {
    label: "ช่างกลับมาใหม่ + ค่าเดินทาง",
    desc: "รออะไหล่พร้อม ช่างเดินทางกลับมาซ่อมที่บ้านอีกครั้ง",
    icon: "🚐",
  },
};

// ราคาต่อทางเลือก — WeeeR ตั้งราคา (mock seed)
export interface AwaitingPartsPricing {
  job_id: string;
  options: Record<AwaitingPartsOption, { price: number; note?: string }>;
  selected?: AwaitingPartsOption; // ทางเลือกที่ลูกค้าเลือก (mock)
}

export interface RepairAnnouncement {
  id: string;
  weeeu_id: string;
  customer_name: string;
  appliance_name: string;
  problem_description: string;
  service_type: "on_site";
  preferred_datetime: string;
  budget_max?: number;
  offer_count: number;
  created_at: string;
  address: string;
  photos?: string[];
}

export interface RepairDashboard {
  active_jobs: number;
  jobs_this_month: number;
  earnings_this_month: number;
  avg_rating: number;
  pending_approvals: number;
  weeet_utilization: number;
  recent_jobs: RepairJob[];
}

export const STATUS_LABEL: Record<RepairJobStatus, string> = {
  assigned: "มอบหมายแล้ว",
  traveling: "ช่างกำลังเดินทาง",
  arrived: "ช่างถึงแล้ว",
  awaiting_entry: "รอ WeeeU อนุมัติเข้า",
  inspecting: "กำลังตรวจสภาพ",
  awaiting_decision: "รออนุมัติจากร้าน",
  awaiting_user: "รอ WeeeU ตัดสิน",
  in_progress: "กำลังซ่อม",
  completed: "ซ่อมเสร็จแล้ว",
  awaiting_review: "รอ WeeeU ตรวจรับ",
  closed: "ปิดงานแล้ว",
  cancelled: "ยกเลิก",
  converted_scrap: "โอนไป Scrap",
};

export const STATUS_COLOR: Record<RepairJobStatus, string> = {
  assigned: "bg-blue-100 text-blue-700",
  traveling: "bg-[#FFE0D6] text-[#D63B12]",
  arrived: "bg-cyan-100 text-cyan-700",
  awaiting_entry: "bg-yellow-100 text-yellow-700",
  inspecting: "bg-[#FFE0D6] text-[#D63B12]",
  awaiting_decision: "bg-orange-100 text-orange-700",
  awaiting_user: "bg-amber-100 text-amber-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  awaiting_review: "bg-teal-100 text-teal-700",
  closed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
  converted_scrap: "bg-lime-100 text-lime-700",
};

export const BRANCH_LABEL: Record<DecisionBranch, string> = {
  "B1.1": "ซ่อมได้ตามเงื่อนไขเดิม",
  "B1.2": "ซ่อมได้ แต่ต้องเพิ่มอะไหล่",
  "B2.1": "ซ่อมไม่ได้ — ยกเลิกงาน",
  "B2.2": "ซ่อมไม่ได้ — เสนอซื้อซาก",
};

// ── Walk-in types ──────────────────────────────────────────────────────────────

export type WalkInStatus =
  | "waiting"       // รอรับเครื่อง
  | "received"      // รับเครื่องแล้ว รอตรวจ
  | "inspecting"    // กำลังตรวจสภาพ
  | "in_progress"   // กำลังซ่อม
  | "ready"         // ซ่อมเสร็จ รอลูกค้ามารับ
  | "closed"        // ปิดงาน (ลูกค้ารับไปแล้ว)
  | "abandoned";    // ไม่มารับ — Abandoned Device Protocol

export interface WalkInJob {
  id: string;
  receipt_code: string;           // รหัส 8 หลัก เช่น WI-A3F9K2
  customer_name: string;
  customer_phone: string;
  appliance_name: string;
  problem_description: string;
  status: WalkInStatus;
  received_at?: string;
  inspected_at?: string;
  started_at?: string;
  ready_at?: string;
  closed_at?: string;
  abandoned_at?: string;
  estimated_price?: number;
  final_price?: number;
  parts_added?: { name: string; qty: number; price: number }[];
  intake_files?: string[];        // รูปถ่ายตอนรับเครื่อง
  diagnosis_notes?: string;
  storage_fee_rate?: number;      // pts/วัน หลังจาก ready_at
  storage_fee_accrued?: number;   // ยอดสะสมปัจจุบัน
  storage_fee_days?: number;      // จำนวนวันที่ค้างอยู่
  abandoned_notified_at?: string; // วันที่แจ้งลูกค้า
  abandoned_grace_days?: number;  // 7 / 14 / 30 วัน
  abandoned_action?: "scrap" | "disposal" | "pending";
  created_at: string;
}

export interface WalkInQueue {
  items: WalkInJob[];
  total: number;
  waiting: number;
  ready_for_pickup: number;
  storage_fee_total: number;
}

export const WALKIN_STATUS_LABEL: Record<WalkInStatus, string> = {
  waiting: "รอรับเครื่อง",
  received: "รับเครื่องแล้ว",
  inspecting: "กำลังตรวจ",
  in_progress: "กำลังซ่อม",
  ready: "พร้อมรับคืน",
  closed: "ปิดงาน",
  abandoned: "ไม่มารับ",
};

export const WALKIN_STATUS_COLOR: Record<WalkInStatus, string> = {
  waiting: "bg-gray-100 text-gray-600",
  received: "bg-blue-100 text-blue-700",
  inspecting: "bg-[#FFE0D6] text-[#D63B12]",
  in_progress: "bg-green-100 text-green-700",
  ready: "bg-teal-100 text-teal-700",
  closed: "bg-emerald-100 text-emerald-700",
  abandoned: "bg-red-100 text-red-600",
};

// ── Pickup types ───────────────────────────────────────────────────────────────

export type PickupStatus =
  | "pending_dispatch"   // รอมอบหมายช่าง
  | "dispatched"         // มอบหมายแล้ว รอช่างออกรับ
  | "en_route"           // ช่างกำลังเดินทางรับ
  | "at_customer"        // ช่างถึงบ้านลูกค้า
  | "appliance_at_shop"  // เครื่องถึงร้านแล้ว
  | "diagnosing"         // กำลังวินิจฉัย
  | "repairing"          // กำลังซ่อม
  | "ready"              // ซ่อมเสร็จ รอส่งคืน
  | "out_for_delivery"   // ช่างกำลังส่งคืน
  | "delivered"          // ส่งคืนแล้ว ปิดงาน
  | "cancelled";

export interface PickupJob {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  appliance_name: string;
  problem_description: string;
  status: PickupStatus;
  weeet_id?: string;
  weeet_name?: string;
  scheduled_pickup_time?: string;
  scheduled_delivery_time?: string;
  picked_up_at?: string;
  arrived_at_shop_at?: string;
  diagnosis_notes?: string;
  estimated_price?: number;
  final_price?: number;
  parts_added?: { name: string; qty: number; price: number }[];
  intake_photos?: string[];
  condition_notes?: string;
  gps_track?: { lat: number; lng: number; timestamp: string }[];
  created_at: string;
}

export interface PickupQueue {
  items: PickupJob[];
  total: number;
  pending_dispatch: number;
  in_transit: number;
  at_shop: number;
  ready: number;
}

export interface WeeeTStaff {
  id: string;
  name: string;
  phone: string;
  available: boolean;
  active_jobs: number;
  distance_km?: number;
}

export const PICKUP_STATUS_LABEL: Record<PickupStatus, string> = {
  pending_dispatch: "รอมอบหมายช่าง",
  dispatched: "มอบหมายแล้ว",
  en_route: "ช่างเดินทางรับ",
  at_customer: "ช่างถึงบ้านลูกค้า",
  appliance_at_shop: "เครื่องถึงร้าน",
  diagnosing: "กำลังวินิจฉัย",
  repairing: "กำลังซ่อม",
  ready: "พร้อมส่งคืน",
  out_for_delivery: "กำลังส่งคืน",
  delivered: "ส่งคืนแล้ว",
  cancelled: "ยกเลิก",
};

export const PICKUP_STATUS_COLOR: Record<PickupStatus, string> = {
  pending_dispatch: "bg-orange-100 text-orange-700",
  dispatched: "bg-blue-100 text-blue-700",
  en_route: "bg-[#FFE0D6] text-[#D63B12]",
  at_customer: "bg-cyan-100 text-cyan-700",
  appliance_at_shop: "bg-yellow-100 text-yellow-700",
  diagnosing: "bg-[#FFE0D6] text-[#D63B12]",
  repairing: "bg-green-100 text-green-700",
  ready: "bg-teal-100 text-teal-700",
  out_for_delivery: "bg-emerald-100 text-emerald-700",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

// ── Parcel types ───────────────────────────────────────────────────────────────

export type ParcelStatus =
  | "awaiting_shipping_details"  // รอตกลง shipping
  | "in_transit_to_shop"         // พัสดุกำลังส่งมาร้าน
  | "received"                   // รับพัสดุแล้ว
  | "inspecting"                 // กำลังตรวจสภาพ
  | "repairing"                  // กำลังซ่อม
  | "ready_to_ship_back"         // พร้อมส่งคืน
  | "in_transit_to_customer"     // ส่งคืนแล้ว อยู่ระหว่างทาง
  | "completed";                 // ปิดงาน

export interface ParcelJob {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  appliance_name: string;
  problem_description: string;
  status: ParcelStatus;
  service_type: "parcel";
  // Shipping
  courier?: string;
  cost_split?: "customer" | "shop" | "split";
  shop_address?: string;
  inbound_tracking?: string;
  return_tracking?: string;
  // Tech
  weeet_id?: string;
  weeet_name?: string;
  // Inspection / Repair
  condition_notes?: string;
  diagnosis_notes?: string;
  estimated_price?: number;
  final_price?: number;
  parts_added?: { name: string; qty: number; price: number }[];
  // Photos
  receive_photos?: string[];
  inspect_photos?: string[];
  post_photos?: string[];
  packing_photos?: string[];
  // Timestamps
  received_at?: string;
  inspected_at?: string;
  shipped_back_at?: string;
  created_at: string;
}

export interface ParcelQueue {
  items: ParcelJob[];
  total: number;
  awaiting_shipping: number;
  in_transit_in: number;
  at_shop: number;
  ready_to_ship: number;
}

export const PARCEL_STATUS_LABEL: Record<ParcelStatus, string> = {
  awaiting_shipping_details: "รอตกลง Shipping",
  in_transit_to_shop:        "พัสดุกำลังมา",
  received:                  "รับพัสดุแล้ว",
  inspecting:                "กำลังตรวจสภาพ",
  repairing:                 "กำลังซ่อม",
  ready_to_ship_back:        "พร้อมส่งคืน",
  in_transit_to_customer:    "กำลังส่งคืน",
  completed:                 "ปิดงานแล้ว",
};

export const PARCEL_STATUS_COLOR: Record<ParcelStatus, string> = {
  awaiting_shipping_details: "bg-orange-100 text-orange-700",
  in_transit_to_shop:        "bg-[#FFE0D6] text-[#D63B12]",
  received:                  "bg-blue-100 text-blue-700",
  inspecting:                "bg-[#FFE0D6] text-[#D63B12]",
  repairing:                 "bg-green-100 text-green-700",
  ready_to_ship_back:        "bg-teal-100 text-teal-700",
  in_transit_to_customer:    "bg-emerald-100 text-emerald-700",
  completed:                 "bg-gray-100 text-gray-600",
};
