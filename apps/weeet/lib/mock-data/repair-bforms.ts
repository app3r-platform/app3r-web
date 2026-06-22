// Repair B-forms mock seed (SoT Gen 55 · Phase D-6 · mockup level)
// Source of Truth: Notion 364813ec-7277-811c-9d31-f34abb7021fe (Workflow Gen 55)
// Mock/localStorage-level only — no backend. WeeeT filters by technicianId === "tech-001".

import type {
  B2PriceBreakdown,
  SmartPickerPartCard,
} from "../types";

// REP-C09 — B4 job-completion OTP (seed). WeeeT generate/display ตอนปิดงาน,
// WeeeU กรอกตอนรับเครื่อง. Mock match เทียบกับค่านี้ (verify จริง = backend deferred).
// ค่าเดียวกันต้อง mirror ใน apps/weeeu mock (ข้ามแอป import ไม่ได้ — Lesson #34).
export const SEED_JOB_COMPLETION_OTP = "482913";

// อาการที่ WeeeU แจ้งใน B1 (auto จาก B1 → ใช้ใน B2 section #3 ยืนยันต่อข้อ)
export const SEED_B1_SYMPTOMS: string[] = [
  "แอร์ไม่เย็น",
  "มีน้ำหยดจากคอยล์เย็น",
  "มีเสียงดังผิดปกติ",
];

// อาการที่ WeeeT เลือกเพิ่ม (B2 #4 multi-chips · filter by category)
export const SEED_B2_EXTRA_SYMPTOM_OPTIONS: string[] = [
  "คอมเพรสเซอร์ทำงานหนัก",
  "น้ำยาแอร์รั่ว",
  "แผงควบคุมเสีย",
  "มอเตอร์พัดลมเสีย",
  "ตันท่อน้ำทิ้ง",
];

// B2 #10 — mock price breakdown (WeeeT เห็นแค่ total / WeeeR+WeeeU เห็นทุก breakdown)
export const SEED_B2_PRICE_BREAKDOWN: B2PriceBreakdown = {
  parts_cost: 1850,
  labor_cost: 600,
  travel_cost: 250,
  total: 2700,
};

// ─── REP-C08: awaiting_parts per-option price (WeeeR ตั้งราคา · WeeeT/WeeeU เห็น) ──
// "WeeeT ถามลูกค้าหน้างาน: (a) ยกเครื่องกลับร้าน หรือ (b) ช่างกลับมาใหม่+ค่าเดินทาง
//  → WeeeR คำนวณราคาตามทางเลือก". ราคามาจาก WeeeR (mock seed). ช่างแสดงให้ลูกค้าเลือก.
// mirror ของ weeer MOCK_AWAITING_PARTS_PRICING (import ข้ามแอปไม่ได้ — Lesson #34).
export const SEED_AWAITING_PARTS_PRICING: Record<
  "take_back" | "return_visit",
  { price: number; note: string }
> = {
  take_back: { price: 0, note: "ไม่มีค่าเดินทางเพิ่ม — ช่างยกเครื่องกลับร้านเอง" },
  return_visit: { price: 350, note: "ค่าเดินทางกลับมา 250 + ค่าแรงเดินทาง 100" },
};

// B3.5 — part cards mock (auto-load จาก B2 + check WeeeR inventory)
export const SEED_SMARTPICKER_PARTS: SmartPickerPartCard[] = [
  {
    id: "sp-part-001",
    name: "คาปาซิเตอร์คอมเพรสเซอร์ 35µF",
    fromB2: true,
    code: "CAP-35UF",
    price_genuine: 450,
    price_used: 220,
    qty: 1,
    unit: "ตัว",
    stock: "IN_VAN",
    worktypes: ["replace"],
  },
  {
    id: "sp-part-002",
    name: "มอเตอร์พัดลมคอยล์เย็น",
    fromB2: true,
    code: "FAN-MTR-CL",
    price_genuine: 1200,
    price_used: 650,
    qty: 1,
    unit: "ตัว",
    stock: "IN_SHOP",
    worktypes: ["replace"],
  },
  {
    id: "sp-part-003",
    name: "น้ำยาแอร์ R32 (เติม)",
    fromB2: true,
    code: "GAS-R32",
    price_genuine: 800,
    price_used: 0,
    qty: 1,
    unit: "ชุด",
    stock: "NEED_ORDER",
    worktypes: ["refill"],
  },
];
