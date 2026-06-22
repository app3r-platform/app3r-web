// RC-1: Mock fallback data สำหรับ repair API (dev/offline)
// ใช้เมื่อ Backend ไม่ตอบ — ให้ clickthrough ผ่าน flow ได้ครบ

import type {
  RepairJob,
  RepairAnnouncement,
  RepairDashboard,
  WalkInJob,
  WalkInQueue,
  PickupJob,
  PickupQueue,
  WeeeTStaff,
  ParcelJob,
  ParcelQueue,
  PackageOffer,
  AwaitingPartsPricing,
} from "./types";
import { PACKAGE_WARRANTY_DAYS } from "./types";

const MOCK_JOB: RepairJob = {
  id: "mock-rjob-001",
  announcement_id: "mock-ann-001",
  weeeu_id: "mock-u-001",
  weeet_id: "mock-t-001",
  weeet_name: "ช่างสมชาย ดีมาก",
  appliance_name: "แอร์ Daikin 12000 BTU",
  service_type: "on_site",
  status: "in_progress",
  scheduled_at: new Date(Date.now() + 2 * 3600000).toISOString(),
  original_price: 1200,
  customer_address: "234/5 ถ.รัชดาภิเษก กรุงเทพฯ 10310",
  customer_name: "คุณสมหญิง ดีใจ",
};

export const MOCK_REPAIR_JOBS: RepairJob[] = [
  MOCK_JOB,
  {
    ...MOCK_JOB,
    id: "mock-rjob-002",
    announcement_id: "mock-ann-002",
    weeet_name: "ช่างวิทยา เก่งซ่อม",
    appliance_name: "ทีวี Samsung 55\" Smart TV",
    status: "awaiting_decision",
    original_price: 3500,
    customer_name: "คุณประยุทธ์ ใจดี",
  },
];

export const MOCK_REPAIR_DASHBOARD: RepairDashboard = {
  active_jobs: 2,
  jobs_this_month: 37,
  earnings_this_month: 28500,
  avg_rating: 4.8,
  pending_approvals: 1,
  weeet_utilization: 0.75,
  recent_jobs: MOCK_REPAIR_JOBS,
};

export const MOCK_REPAIR_ANNOUNCEMENTS: RepairAnnouncement[] = [
  {
    id: "mock-ann-001",
    weeeu_id: "u-mock-001",
    customer_name: "ไม่แสดง (รอยืนยัน)",
    appliance_name: "แอร์ Daikin Inverter 18000 BTU",
    problem_description: "เย็นน้อยลง น่าจะต้องเติมน้ำยา",
    service_type: "on_site",
    preferred_datetime: new Date(Date.now() + 48 * 3600000).toISOString(),
    budget_max: 1500,
    offer_count: 0,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    address: "ลาดพร้าว กรุงเทพฯ",
  },
  {
    id: "mock-ann-002",
    weeeu_id: "u-mock-002",
    customer_name: "ไม่แสดง (รอยืนยัน)",
    appliance_name: "เครื่องซักผ้า LG ฝาหน้า 9 กก.",
    problem_description: "Error E4 น้ำระบายไม่ออก ปั๊มอาจเสีย",
    service_type: "on_site",
    preferred_datetime: new Date(Date.now() + 72 * 3600000).toISOString(),
    budget_max: 800,
    offer_count: 2,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    address: "บางนา กรุงเทพฯ",
  },
];

export const MOCK_WALKIN_QUEUE: WalkInQueue = {
  items: [
    {
      id: "wi-mock-001",
      receipt_code: "WI-A3F9K2",
      customer_name: "คุณสมหมาย รักสะอาด",
      customer_phone: "081-234-5678",
      appliance_name: "ไมโครเวฟ Panasonic 25L",
      problem_description: "เปิดไม่ติด ไฟ standby ดับ",
      status: "received",
      received_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      estimated_price: 650,
      storage_fee_rate: 0,
      storage_fee_accrued: 0,
      storage_fee_days: 0,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
    {
      id: "wi-mock-002",
      receipt_code: "WI-B7G4L8",
      customer_name: "คุณประยุทธ์ ดีงาม",
      customer_phone: "089-876-5432",
      appliance_name: "พัดลม Hatari 16\" ตั้งพื้น",
      problem_description: "หมุนช้า มีเสียงดัง",
      status: "ready",
      received_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      ready_at: new Date(Date.now() - 1 * 3600000).toISOString(),
      final_price: 280,
      storage_fee_rate: 5,
      storage_fee_accrued: 0,
      storage_fee_days: 0,
      created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    } as WalkInJob,
  ],
  total: 2,
  waiting: 0,
  ready_for_pickup: 1,
  storage_fee_total: 0,
};

const MOCK_PICKUP_JOB: PickupJob = {
  id: "pj-mock-001",
  customer_name: "คุณวิไล รักช่าง",
  customer_phone: "082-111-2222",
  customer_address: "456 ถ.รามคำแหง กรุงเทพฯ",
  appliance_name: "ตู้เย็น Hitachi 2 ประตู 14 คิว",
  problem_description: "ไม่เย็น คอมเพรสเซอร์ดัง",
  status: "pending_dispatch",
  created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
};

export const MOCK_PICKUP_QUEUE: PickupQueue = {
  items: [MOCK_PICKUP_JOB],
  total: 1,
  pending_dispatch: 1,
  in_transit: 0,
  at_shop: 0,
  ready: 0,
};

export const MOCK_WEEET_STAFF: WeeeTStaff[] = [
  { id: "t-mock-001", name: "ช่างสมชาย ดีมาก",  phone: "081-001-0001", available: true,  active_jobs: 1, distance_km: 3.2 },
  { id: "t-mock-002", name: "ช่างวิทยา เก่งซ่อม", phone: "081-001-0002", available: false, active_jobs: 2 },
];

const MOCK_PARCEL_JOB: ParcelJob = {
  id: "par-mock-001",
  customer_name: "คุณสมศรี ส่งพัสดุ",
  customer_phone: "083-333-4444",
  customer_address: "789 ถ.สุขุมวิท กรุงเทพฯ",
  appliance_name: "เครื่องดูดฝุ่น Dyson V11",
  problem_description: "แบตเสื่อม ใช้ได้แค่ 5 นาที",
  status: "awaiting_shipping_details",
  service_type: "parcel",
  created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
};

export const MOCK_PARCEL_QUEUE: ParcelQueue = {
  items: [MOCK_PARCEL_JOB],
  total: 1,
  awaiting_shipping: 1,
  in_transit_in: 0,
  at_shop: 0,
  ready_to_ship: 0,
};

// ─── REP-C07: B2.5 PackageOffer seed (auto-load จาก B3.5 SmartPicker) ──────────
// WeeeR ใช้ part list จากช่าง (B3.5) → จัด 2 packages (แท้/มือสอง) ก่อนส่ง WeeeU.
export const MOCK_PACKAGE_OFFER: PackageOffer = {
  job_id: "mock-rjob-001",
  appliance_name: "แอร์ Daikin 12000 BTU",
  deposit_amount: 200,
  travel_fee_on_cancel: 100,
  status: "draft",
  note_to_customer: "",
  packages: [
    {
      kind: "genuine",
      parts: [
        { name: "คาปาซิเตอร์คอมเพรสเซอร์ 35µF", qty: 1, unit: "ตัว", price: 450 },
        { name: "มอเตอร์พัดลมคอยล์เย็น", qty: 1, unit: "ตัว", price: 1200 },
        { name: "น้ำยาแอร์ R32 (เติม)", qty: 1, unit: "ชุด", price: 800, genuine_only: true },
      ],
      parts_cost: 2450,
      labor_cost: 600,
      travel_cost: 250,
      total: 3300,
      warranty_days: PACKAGE_WARRANTY_DAYS.genuine, // 90
      duration_days: 1,
    },
    {
      kind: "used",
      parts: [
        { name: "คาปาซิเตอร์คอมเพรสเซอร์ 35µF (มือสอง)", qty: 1, unit: "ตัว", price: 220 },
        { name: "มอเตอร์พัดลมคอยล์เย็น (มือสอง)", qty: 1, unit: "ตัว", price: 650 },
        { name: "น้ำยาแอร์ R32 (เติม)", qty: 1, unit: "ชุด", price: 800, genuine_only: true },
      ],
      parts_cost: 1670,
      labor_cost: 600,
      travel_cost: 250,
      total: 2520,
      warranty_days: PACKAGE_WARRANTY_DAYS.used, // 30
      duration_days: 2,
    },
  ],
};

// ─── REP-C08: awaiting_parts per-option pricing seed (WeeeR ตั้งราคา) ──────────
// take_back = ยกกลับร้าน (ไม่มีค่าเดินทางเพิ่ม) / return_visit = ช่างกลับมา (+ค่าเดินทาง+แรง)
export const MOCK_AWAITING_PARTS_PRICING: AwaitingPartsPricing = {
  job_id: "mock-rjob-001",
  options: {
    take_back: { price: 0, note: "ไม่มีค่าเดินทางเพิ่ม — ช่างยกเครื่องกลับร้านเอง" },
    return_visit: { price: 350, note: "ค่าเดินทางกลับมา 250 + ค่าแรงเดินทาง 100" },
  },
};
