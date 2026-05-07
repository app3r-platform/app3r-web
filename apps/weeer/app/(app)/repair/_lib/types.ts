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
