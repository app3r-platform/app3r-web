// REP-C09 — B4 job-completion OTP (seed · WeeeU side).
// Mirror ของ apps/weeet/lib/mock-data/repair-bforms.ts SEED_JOB_COMPLETION_OTP
// (import ข้ามแอปไม่ได้ — Lesson #34). WeeeT generate ค่านี้ตอนปิดงาน,
// WeeeU กรอกตอนรับเครื่อง → mock match เทียบกับค่านี้. verify จริง = backend (deferred).
export const SEED_JOB_COMPLETION_OTP = "482913";

export const JOB_COMPLETION_OTP_LENGTH = 6;

// ─── REP-C07: B2.5 PackageOffer (WeeeU side · mirror ของ weeer _lib/types+mock) ──
// import ข้ามแอปไม่ได้ (Lesson #34) → mirror type + seed ที่นี่. SoT Gen 55/56:
// 2 packages — A อะไหล่แท้ รับประกัน 90 วัน (แนะนำ) / B มือสอง รับประกัน 30 วัน.
// WeeeU เลือก 1 หรือ "ไม่ตกลงราคา → ยุติงานซ่อม" (เตือนมัดจำ + ค่าเดินทาง). Mock-level.
export type PackageKind = "genuine" | "used";

export const PACKAGE_KIND_META: Record<
  PackageKind,
  { label: string; partsLabel: string; recommended: boolean }
> = {
  genuine: { label: "Package A", partsLabel: "อะไหล่แท้ (มือหนึ่ง)", recommended: true },
  used: { label: "Package B", partsLabel: "อะไหล่มือสอง", recommended: false },
};

export interface PackagePartLine {
  name: string;
  qty: number;
  unit: string;
  price: number;
  genuine_only?: boolean;
}

export interface RepairPackage {
  kind: PackageKind;
  parts: PackagePartLine[];
  parts_cost: number;
  labor_cost: number;
  travel_cost: number;
  total: number;
  warranty_days: number;
  duration_days: number;
}

export interface PackageOffer {
  job_id: string;
  appliance_name: string;
  packages: RepairPackage[];
  note_to_customer?: string;
  deposit_amount?: number;
  travel_fee_on_cancel?: number;
}

// mirror ของ weeer MOCK_PACKAGE_OFFER (สถานะ sent → WeeeU เห็น)
export const SEED_PACKAGE_OFFER: PackageOffer = {
  job_id: "job-001",
  appliance_name: "แอร์ Daikin 12000 BTU",
  deposit_amount: 200,
  travel_fee_on_cancel: 100,
  note_to_customer: "แนะนำ Package A — อะไหล่แท้ทนกว่า รับประกันนานกว่า (90 วัน)",
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
      warranty_days: 90,
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
      warranty_days: 30,
      duration_days: 2,
    },
  ],
};

// ─── REP-C08: awaiting_parts binary choice + per-option price (WeeeU side) ──────
// mirror ของ weeer AWAITING_PARTS_OPTION_META + MOCK_AWAITING_PARTS_PRICING.
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

export const SEED_AWAITING_PARTS_PRICING: Record<
  AwaitingPartsOption,
  { price: number; note?: string }
> = {
  take_back: { price: 0, note: "ไม่มีค่าเดินทางเพิ่ม — ช่างยกเครื่องกลับร้านเอง" },
  return_visit: { price: 350, note: "ค่าเดินทางกลับมา 250 + ค่าแรงเดินทาง 100" },
};
