/**
 * junction-data.ts — WeeeT Screen Junction Map v2.4
 * แผนผังเชื่อมต่อหน้าจอ WeeeT ↔ แอปอื่น (WeeeR / WeeeU / Admin)
 *
 * โครงสร้าง 3 ส่วนต่อ junction node:
 *  📋 role  — หน้าที่ของหน้าจอนี้ในระบบ
 *  ◀ from   — หน้าจอที่นำมาสู่หน้านี้
 *  ▶ to     — หน้าจอถัดไปที่เชื่อมออก
 *
 * WeeeT Junction v2 · Advisor Gen 115 · 2026-06-08
 */

export interface JunctionEntry {
  screenId: string;         // T-xx or route label
  label: string;            // ชื่อหน้าจอ
  route: string;            // route pattern
  role: string;             // 📋 หน้าที่
  from: string[];           // ◀ มาจาก
  to: string[];             // ▶ ไปต่อ
  xapp?: string[];          // cross-app connections
}

// ── Repair Flow Junctions ──────────────────────────────────────────────────────

export const REPAIR_JUNCTIONS: JunctionEntry[] = [
  {
    screenId: "T-11",
    label: "Job Detail",
    route: "/jobs/[id]",
    role: "📋 ช่างดูรายละเอียดงาน — ยืนยันรับ/ปฏิเสธ",
    from: ["T-01 /jobs (รายการงาน)", "T-18 /dashboard (คิวหน้า)"],
    to: ["T-02 /diagnose (วินิจฉัย)", "T-34 /depart (ออกเดินทาง)"],
    xapp: ["WeeeR R-11: job detail ร้าน", "WeeeU U-04: ติดตามสถานะ"],
  },
  {
    screenId: "T-02",
    label: "วินิจฉัย / เลือกสาขา",
    route: "/jobs/[id]/diagnose",
    role: "📋 ช่างวินิจฉัยและเลือกเส้นทางซ่อม (C1/C2/C3/C4/C6)",
    from: ["T-08 /inspect (หลังตรวจสภาพ)", "T-11 /jobs/[id] (job detail)"],
    to: [
      "T-03 /repair (C1 ซ่อมได้)",
      "T-04 /pickup (C2 ยกเครื่อง)",
      "T-05 /schedule (C3 รออะไหล่)",
      "T-06 /scrap-offer (C4 เสนอซาก)",
      "T-01 /jobs (C6 ปฏิเสธ)",
    ],
    xapp: ["WeeeR R-11: รับผลวินิจฉัย", "WeeeU U-05: notification ผลวินิจฉัย"],
  },
  {
    screenId: "T-38",
    label: "บันทึกหลังซ่อม",
    route: "/jobs/[id]/post-repair",
    role: "📋 บันทึกผลซ่อม + รูปหลังซ่อม ก่อนส่งมอบ",
    from: ["T-03 /repair (repair step)", "T-08 /inspect (บางกรณี)"],
    to: ["T-03 /repair/success (ส่งมอบ + OTP)", "T-07 /complete (จบงาน)"],
    xapp: ["WeeeU U-52a: รับ notification ซ่อมเสร็จ", "WeeeR R-11: อัพ job status"],
  },
];

// ── Maintain Flow Junctions ── ลบ A3 Gen121: /maintain/* orphan ลบแล้ว · canonical = /jobs (type=maintain)
export const MAINTAIN_JUNCTIONS: JunctionEntry[] = [];

// ── Scrap Flow Junctions ───────────────────────────────────────────────────────

export const SCRAP_JUNCTIONS: JunctionEntry[] = [
  {
    screenId: "T-22",
    label: "รายการงานรับซาก",
    route: "/scrap",
    role: "📋 รายการงาน pickup ซาก ที่ร้านมอบหมาย",
    from: ["T-01 /jobs (nav)", "T-18 /dashboard (quick action)"],
    to: ["T-23 /scrap/[id] (รายละเอียด verify)"],
    xapp: ["WeeeR R-29: assign scrap pickup job", "WeeeU U-02: ส่งคำขอขายซาก"],
  },
  {
    screenId: "T-23",
    label: "Verify ซากหน้างาน",
    route: "/scrap/[id]",
    role: "📋 ตรวจซาก S8/S9 — ยืนยัน / รายงานไม่ตรง / no-show",
    from: ["T-22 /scrap (รายการ)"],
    to: ["T-22 /scrap (กลับ)", "/jobs/[id]/mismatch (S8 ไม่ตรง)"],
    xapp: ["WeeeR R-30: ดู verify result", "WeeeU U-04: รับ notification ผล"],
  },
];

// ── Parts B2B Junctions ────────────────────────────────────────────────────────

export const PARTS_JUNCTIONS: JunctionEntry[] = [
  {
    screenId: "T-24",
    label: "Parts Hub",
    route: "/parts",
    role: "📋 เมนูหลักอะไหล่ — catalog, orders, requests",
    from: ["BottomNav (อะไหล่)", "T-18 /dashboard (quick action)"],
    to: ["T-26 /parts/catalog", "T-30 /parts/orders", "T-32 /parts/requests"],
    xapp: ["WeeeR R-33: ขายอะไหล่ B2B", "Admin: อนุมัติ order"],
  },
  {
    screenId: "T-26",
    label: "Parts Catalog",
    route: "/parts/catalog",
    role: "📋 เรียกดูอะไหล่ที่มี — ค้นหา / กรอง / เพิ่มตะกร้า",
    from: ["T-24 /parts", "T-27 /parts/catalog/[id]"],
    to: ["T-27 /parts/catalog/[id] (รายละเอียด)", "T-28 /parts/cart (ตะกร้า)"],
    xapp: ["WeeeR R-29c: catalog feed จากร้าน"],
  },
  {
    screenId: "T-29",
    label: "Parts Checkout",
    route: "/parts/checkout",
    role: "📋 ยืนยันสั่งซื้อ + ชำระด้วยพอยต์ทอง (fee = 100 Gold)",
    from: ["T-28 /parts/cart"],
    to: ["T-30 /parts/orders/[id] (ติดตาม order)"],
    xapp: ["WeeeR R-34: รับออเดอร์ B2B", "Admin: audit trail payment"],
  },
];

// ── All junctions combined ────────────────────────────────────────────────────

export const ALL_JUNCTIONS: JunctionEntry[] = [
  ...REPAIR_JUNCTIONS,
  ...MAINTAIN_JUNCTIONS,
  ...SCRAP_JUNCTIONS,
  ...PARTS_JUNCTIONS,
];

/** หา junction entry จาก screenId หรือ route */
export function findJunction(screenIdOrRoute: string): JunctionEntry | undefined {
  return ALL_JUNCTIONS.find(
    (j) => j.screenId === screenIdOrRoute || j.route === screenIdOrRoute
  );
}
