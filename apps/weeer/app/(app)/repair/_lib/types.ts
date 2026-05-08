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
  traveling: "bg-indigo-100 text-indigo-700",
  arrived: "bg-cyan-100 text-cyan-700",
  awaiting_entry: "bg-yellow-100 text-yellow-700",
  inspecting: "bg-purple-100 text-purple-700",
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
  inspecting: "bg-purple-100 text-purple-700",
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
  en_route: "bg-indigo-100 text-indigo-700",
  at_customer: "bg-cyan-100 text-cyan-700",
  appliance_at_shop: "bg-yellow-100 text-yellow-700",
  diagnosing: "bg-purple-100 text-purple-700",
  repairing: "bg-green-100 text-green-700",
  ready: "bg-teal-100 text-teal-700",
  out_for_delivery: "bg-emerald-100 text-emerald-700",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};
