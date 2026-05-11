// Phase C-5 — Service Progress Tracker types (per-app root, D79 verbatim)

export type MainStage = "posted" | "offer_accepted" | "in_progress" | "completed" | "reviewed";

// --- Sub-stages per Service Type (D79) ---
export type OnSiteSubStage =
  | "technician_assigned"
  | "technician_dispatched"
  | "technician_arrived"
  | "inspection_started"
  | "inspection_logged"
  | "repair_pre_check"
  | "repair_in_progress"
  | "repair_finished"
  | "handover";

export type PickupSubStage =
  | "pickup_scheduled"
  | "pickup_in_transit"
  | "picked_up"
  | "in_shop_inspection"
  | "in_shop_repair"
  | "repair_finished"
  | "delivery_scheduled"
  | "delivery_in_transit"
  | "delivered";

export type WalkInSubStage =
  | "dropped_off"
  | "in_shop_inspection"
  | "in_shop_repair"
  | "repair_finished"
  | "ready_for_pickup"
  | "picked_up_by_customer";

export type ParcelSubStage =
  | "courier_to_pickup"
  | "courier_pickup_done"
  | "arrived_at_shop"
  | "in_shop_inspection"
  | "in_shop_repair"
  | "repair_finished"
  | "courier_to_delivery"
  | "delivered_to_customer";

export type AnySubStage = OnSiteSubStage | PickupSubStage | WalkInSubStage | ParcelSubStage;

// Discriminated union
export type ServiceTypeProgress =
  | { serviceType: "on_site"; subStage: OnSiteSubStage }
  | { serviceType: "pickup"; subStage: PickupSubStage }
  | { serviceType: "walk_in"; subStage: WalkInSubStage }
  | { serviceType: "parcel"; subStage: ParcelSubStage };

// Ordered sub-stage lists
export const ON_SITE_SUB_STAGES: OnSiteSubStage[] = [
  "technician_assigned","technician_dispatched","technician_arrived",
  "inspection_started","inspection_logged","repair_pre_check",
  "repair_in_progress","repair_finished","handover",
];
export const PICKUP_SUB_STAGES: PickupSubStage[] = [
  "pickup_scheduled","pickup_in_transit","picked_up",
  "in_shop_inspection","in_shop_repair","repair_finished",
  "delivery_scheduled","delivery_in_transit","delivered",
];
export const WALK_IN_SUB_STAGES: WalkInSubStage[] = [
  "dropped_off","in_shop_inspection","in_shop_repair",
  "repair_finished","ready_for_pickup","picked_up_by_customer",
];
export const PARCEL_SUB_STAGES: ParcelSubStage[] = [
  "courier_to_pickup","courier_pickup_done","arrived_at_shop",
  "in_shop_inspection","in_shop_repair","repair_finished",
  "courier_to_delivery","delivered_to_customer",
];

// Sub-stage labels (Thai)
export const SUB_STAGE_LABELS: Record<string, string> = {
  // On-site
  technician_assigned: "รับมอบหมายงาน",
  technician_dispatched: "ออกจากร้านแล้ว",
  technician_arrived: "ถึงหน้างาน",
  inspection_started: "เริ่มสำรวจสภาพ",
  inspection_logged: "บันทึกผลสำรวจ",
  repair_pre_check: "ยืนยันก่อนซ่อม",
  repair_in_progress: "กำลังซ่อม",
  repair_finished: "ซ่อมเสร็จ",
  handover: "ส่งมอบงาน",
  // Pickup
  pickup_scheduled: "นัดเวลารับเครื่อง",
  pickup_in_transit: "เดินทางไปรับ",
  picked_up: "รับเครื่องแล้ว",
  in_shop_inspection: "สำรวจที่ร้าน",
  in_shop_repair: "กำลังซ่อม",
  delivery_scheduled: "นัดส่งคืน",
  delivery_in_transit: "เดินทางส่งคืน",
  delivered: "ส่งคืนแล้ว",
  // Walk-in
  dropped_off: "ลูกค้านำมาถึงร้าน",
  ready_for_pickup: "พร้อมให้มารับ",
  picked_up_by_customer: "ลูกค้ามารับแล้ว",
  // Parcel
  courier_to_pickup: "ขนส่งออกไปรับ (tracking #1)",
  courier_pickup_done: "ขนส่งรับแล้ว กำลังส่งมาร้าน",
  arrived_at_shop: "ถึงร้านแล้ว",
  courier_to_delivery: "ขนส่งออกไปส่งคืน (tracking #2)",
  delivered_to_customer: "ส่งถึงลูกค้าแล้ว",
};

// Main stage labels
export const MAIN_STAGE_LABELS: Record<MainStage, string> = {
  posted: "ลงประกาศ",
  offer_accepted: "ตกลงข้อเสนอ",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  reviewed: "รีวิวแล้ว",
};

export function getSubStageList(serviceType: string): string[] {
  switch (serviceType) {
    case "on_site": return ON_SITE_SUB_STAGES;
    case "pickup": return PICKUP_SUB_STAGES;
    case "walk_in": return WALK_IN_SUB_STAGES;
    case "parcel": return PARCEL_SUB_STAGES;
    default: return [];
  }
}

export function getNextSubStage(serviceType: string, current: string): string | null {
  const list = getSubStageList(serviceType);
  const idx = list.indexOf(current);
  if (idx === -1 || idx >= list.length - 1) return null;
  return list[idx + 1];
}

export function isLastSubStage(serviceType: string, subStage: string): boolean {
  const list = getSubStageList(serviceType);
  return list[list.length - 1] === subStage;
}

export interface ProgressStepMedia {
  images: Array<{
    id: string;
    url: string;
    caption?: string;
    uploaded_by: "weeeu" | "weeer" | "weeet";
    uploaded_at: string;
  }>;
  videos: Array<{
    id: string;
    url: string;
    duration_seconds?: number;
    caption?: string;
    uploaded_by: "weeeu" | "weeer" | "weeet";
    uploaded_at: string;
  }>;
}

export interface ProgressStep {
  id: string;
  stage: MainStage;
  subStage?: string;
  label: string;
  completedAt?: string;
  completedBy?: string;
  completedByRole?: "weeeu" | "weeer" | "weeet";
  notes?: string;
  media?: ProgressStepMedia;
  extraFields?: Record<string, string>; // tracking numbers, etc.
}

export interface ServiceProgress {
  jobId: string;
  jobNo: string;
  serviceType: "on_site" | "pickup" | "walk_in" | "parcel";
  currentStage: MainStage;
  currentSubStage?: string;
  technicianId?: string;
  technicianName?: string;
  shopId?: string;
  shopName?: string;
  customerName?: string;
  applianceName?: string;
  scheduledAt?: string;
  steps: ProgressStep[];
  serviceFee?: number;
  serviceFeeRounded?: number;
  createdAt: string;
  updatedAt: string;
}
