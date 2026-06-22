/**
 * mock-anno-data.ts — Mockup Annotation Data (P2 · Admin)
 * ใช้คู่กับ MockAnno component · ลบไฟล์นี้ตอนเขียนโค้ดจริง
 * §5 origin: มาจากจอไหน · §6 destinations: ปุ่ม/ลิงก์ไปไหน · §8 xapp: จอแอพฯอื่นที่เห็นพร้อมกัน
 * grep mock-anno → ลบทั้งหมดทีเดียวตอน Phase 4
 */

export interface MockAnnoData {
  /** §5 จอต้นทาง (origin) — มาจากจอไหน (ID · ชื่อ) */
  origins: { id: string; label: string }[];
  /** §6 จอปลายทาง (destinations) — ปุ่ม/ลิงก์นี้ไปจอไหน */
  destinations: { buttonLabel: string; targetId: string; targetLabel: string }[];
  /** §8 cross-app — แอพฯอื่นเห็นจอไหน ณ จังหวะนี้ */
  xapp: { app: string; port: number; screenId: string; label: string }[];
  /** §D D-refs — Design Rule refs ที่ใช้ในจอนี้ (dev overlay · ลบตอน Phase 4) */
  drefs?: { id: string; desc: string }[];
}

/**
 * ADMIN_ANNO_MAP: key = Screen ID (A-xx / A-xxb / A-xxc)
 */
export const ADMIN_ANNO_MAP: Record<string, MockAnnoData> = {

  // ── A-01 Dashboard ── ────────────────────────────────────────────────────────
  "A-01": {
    origins: [
      { id: "A-73", label: "เข้าสู่ระบบสำเร็จ" },
    ],
    destinations: [
      { buttonLabel: "Repair Jobs", targetId: "A-02", targetLabel: "จัดการงานซ่อม" },
      { buttonLabel: "Maintain Jobs", targetId: "A-06", targetLabel: "จัดการงานบำรุง" },
      { buttonLabel: "Scrap Jobs", targetId: "A-08", targetLabel: "จัดการงานซาก" },
      { buttonLabel: "Resell Listings", targetId: "A-12", targetLabel: "จัดการประกาศขาย" },
      { buttonLabel: "Parts Orders", targetId: "A-15", targetLabel: "จัดการคำสั่งอะไหล่" },
      { buttonLabel: "KYC", targetId: "A-19", targetLabel: "ตรวจสอบ KYC" },
      { buttonLabel: "Users", targetId: "A-42", targetLabel: "จัดการผู้ใช้" },
      { buttonLabel: "Points", targetId: "A-44", targetLabel: "จัดการพอยต์" },
    ],
    xapp: [],
  },

  // ── A-02 Repair Jobs ── ──────────────────────────────────────────────────────
  "A-02": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-03", label: "กลับจาก Job Detail" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-03", targetLabel: "Repair Job Detail" },
      { buttonLabel: "แท็บ Disputes", targetId: "A-04", targetLabel: "Repair Disputes" },
      { buttonLabel: "Analytics", targetId: "A-21", targetLabel: "Repair Analytics" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-04", label: "ลูกค้าดูสถานะซ่อม" },
      { app: "WeeeR", port: 3001, screenId: "R-09", label: "ร้านดูรายการงานซ่อม" },
      { app: "WeeeT", port: 3003, screenId: "T-11", label: "ช่างดูรายละเอียดงาน" },
    ],
  },

  // ── A-03 Repair Job Detail ── ────────────────────────────────────────────────
  "A-03": {
    origins: [
      { id: "A-02", label: "Repair Jobs list" },
    ],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-02", targetLabel: "Repair Jobs" },
      { buttonLabel: "ดูข้อพิพาท (C9)", targetId: "A-05", targetLabel: "Repair Dispute Detail" },
      { buttonLabel: "Manual Override", targetId: "A-03c", targetLabel: "A-03 state-c — Override งาน" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-06", label: "ลูกค้าดูความคืบหน้า" },
      { app: "WeeeR", port: 3001, screenId: "R-11", label: "ร้านดูรายละเอียดงาน" },
      { app: "WeeeT", port: 3003, screenId: "T-11", label: "ช่างดูรายละเอียดงาน" },
    ],
  },

  // ── A-03c Repair Job Override ── ─────────────────────────────────────────────
  "A-03c": {
    origins: [{ id: "A-03", label: "Repair Job Detail" }],
    destinations: [
      { buttonLabel: "ยืนยัน Override", targetId: "A-03", targetLabel: "กลับ Job Detail" },
      { buttonLabel: "ยกเลิก", targetId: "A-03", targetLabel: "กลับ Job Detail" },
    ],
    xapp: [],
  },

  // ── A-04 Repair Disputes ── ──────────────────────────────────────────────────
  "A-04": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-02", label: "แท็บ Disputes" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-05", targetLabel: "Repair Dispute Detail" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-04", label: "ลูกค้าเห็นสถานะ dispute" },
      { app: "WeeeR", port: 3001, screenId: "R-11", label: "ร้านเห็นสถานะ C9" },
    ],
  },

  // ── A-05 Repair Dispute Detail (C9 intervene) ── ────────────────────────────
  "A-05": {
    origins: [{ id: "A-04", label: "Repair Disputes list" }],
    destinations: [
      { buttonLabel: "ตัดสินใจ (Admin)", targetId: "A-04", targetLabel: "กลับรายการ" },
      { buttonLabel: "กลับ", targetId: "A-04", targetLabel: "Repair Disputes" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-04", label: "ลูกค้าเห็นผลตัดสิน C9" },
      { app: "WeeeR", port: 3001, screenId: "R-11", label: "ร้านเห็นผล intervention" },
    ],
  },

  // ── A-06 Maintain Jobs ── ────────────────────────────────────────────────────
  "A-06": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-07", label: "กลับจาก Job Detail" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-07", targetLabel: "Maintain Job Detail" },
      { buttonLabel: "Analytics", targetId: "A-31", targetLabel: "Maintain Analytics" },
      { buttonLabel: "Recurring", targetId: "A-32", targetLabel: "สัญญาบำรุงซ้ำ" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-16", label: "ลูกค้าดูรายละเอียดงานบำรุง" },
      { app: "WeeeR", port: 3001, screenId: "R-14", label: "ร้านดูรายละเอียดงานบำรุง" },
      { app: "WeeeT", port: 3003, screenId: "T-11", label: "ช่างดูงาน (M1-M9)" },
    ],
  },

  // ── A-07 Maintain Job Detail ── ──────────────────────────────────────────────
  "A-07": {
    origins: [{ id: "A-06", label: "Maintain Jobs list" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-06", targetLabel: "Maintain Jobs" },
      { buttonLabel: "M9 Cancel mockup", targetId: "A-07c", targetLabel: "A-07 state-c — M9-ยกเลิก" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-16", label: "ลูกค้าดูงานบำรุง" },
      { app: "WeeeR", port: 3001, screenId: "R-14", label: "ร้านดูงานบำรุง" },
      { app: "WeeeT", port: 3003, screenId: "T-08", label: "ช่างตรวจสอบ (M4/M7)" },
    ],
  },

  // ── A-07c M9 Cancelled ── ───────────────────────────────────────────────────
  "A-07c": {
    origins: [{ id: "A-07", label: "Maintain Job Detail" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-07", targetLabel: "Maintain Job Detail" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-16", label: "ลูกค้าเห็นงานบำรุง M9-ยกเลิก" },
      { app: "WeeeR", port: 3001, screenId: "R-14", label: "ร้านเห็นงานบำรุง M9-ยกเลิก" },
      { app: "WeeeT", port: 3003, screenId: "T-11", label: "ช่างเห็นงาน M9-ยกเลิก" },
    ],
  },

  // ── A-08 Scrap Jobs ── ──────────────────────────────────────────────────────
  "A-08": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-08b", label: "A-08 state-b — กลับจาก Job Detail" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-08b", targetLabel: "A-08 state-b — Scrap Job Detail" },
      { buttonLabel: "Disputes", targetId: "A-09", targetLabel: "Scrap Disputes" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-33", label: "ลูกค้าดูสถานะซาก" },
      { app: "WeeeR", port: 3001, screenId: "R-27", label: "ร้านดูรายการงานซาก" },
      { app: "WeeeT", port: 3003, screenId: "T-04", label: "ช่างรับงานขนส่ง" },
    ],
  },

  // ── A-08b Scrap Job Detail ── ────────────────────────────────────────────────
  "A-08b": {
    origins: [{ id: "A-08", label: "Scrap Jobs list" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-08", targetLabel: "Scrap Jobs" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-33", label: "ลูกค้าดูสถานะซาก" },
      { app: "WeeeR", port: 3001, screenId: "R-28", label: "ร้านดู job detail" },
    ],
  },

  // ── A-09 Scrap Disputes ── ──────────────────────────────────────────────────
  "A-09": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-08", label: "แท็บ Disputes" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-10", targetLabel: "Scrap Dispute Ruling" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-33", label: "ลูกค้าเห็นสถานะ S11" },
    ],
  },

  // ── A-10 Scrap S11 Ruling ── ────────────────────────────────────────────────
  "A-10": {
    origins: [{ id: "A-09", label: "Scrap Disputes list" }],
    destinations: [
      { buttonLabel: "ออกคำตัดสิน", targetId: "A-09", targetLabel: "กลับรายการ" },
      { buttonLabel: "กลับ", targetId: "A-09", targetLabel: "Scrap Disputes" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-33", label: "ลูกค้าดูผลตัดสิน S11" },
      { app: "WeeeR", port: 3001, screenId: "R-28", label: "ร้านดูผลตัดสิน" },
    ],
  },

  // ── A-11 Scrap Certificates ── ──────────────────────────────────────────────
  "A-11": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "ดูใบรับรอง", targetId: "A-11b", targetLabel: "Cert Detail" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-32", label: "ลูกค้าดูใบรับรอง S4" },
    ],
  },

  // ── A-11b Scrap Cert Detail ── ──────────────────────────────────────────────
  "A-11b": {
    origins: [{ id: "A-11", label: "Scrap Certificates" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-11", targetLabel: "Certificates" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-32", label: "ลูกค้าดูใบรับรอง (S4)" },
    ],
  },

  // ── A-12 Resell Listings ── ─────────────────────────────────────────────────
  "A-12": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-12b", label: "กลับจาก Listing Detail" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-12b", targetLabel: "Resell Listing Detail" },
      { buttonLabel: "Disputes", targetId: "A-13", targetLabel: "Resell Disputes" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-17", label: "ลูกค้าดูประกาศของตน" },
      { app: "WeeeR", port: 3001, screenId: "R-15", label: "ร้านดูประกาศ" },
    ],
  },

  // ── A-12b Resell Listing Detail ── ──────────────────────────────────────────
  "A-12b": {
    origins: [{ id: "A-12", label: "Resell Listings" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-12", targetLabel: "Resell Listings" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-20", label: "ลูกค้าดูรายละเอียดประกาศ" },
      { app: "WeeeR", port: 3001, screenId: "R-16", label: "ร้านดู listing detail" },
    ],
  },

  // ── A-13 Resell Disputes ── ─────────────────────────────────────────────────
  "A-13": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-12", label: "แท็บ Disputes" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-14", targetLabel: "Resell Dispute Ruling" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-26", label: "ลูกค้ายื่นข้อพิพาท R8" },
      { app: "WeeeR", port: 3001, screenId: "R-22", label: "ร้านรับทราบข้อพิพาท" },
    ],
  },

  // ── A-14 Resell Dispute Ruling ── ───────────────────────────────────────────
  "A-14": {
    origins: [{ id: "A-13", label: "Resell Disputes list" }],
    destinations: [
      { buttonLabel: "ออกคำตัดสิน R9", targetId: "A-13", targetLabel: "กลับรายการ" },
      { buttonLabel: "กลับ", targetId: "A-13", targetLabel: "Resell Disputes" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-26", label: "ลูกค้าดูผลตัดสิน" },
      { app: "WeeeR", port: 3001, screenId: "R-22", label: "ร้านดูผลตัดสิน R9" },
    ],
  },

  // ── A-15 Parts Orders ── ────────────────────────────────────────────────────
  "A-15": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-16", label: "กลับจาก Order Detail" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-16", targetLabel: "Parts Order Detail" },
      { buttonLabel: "Disputes", targetId: "A-17", targetLabel: "Parts Disputes" },
    ],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-31", label: "ร้านดู parts orders (seller)" },
      { app: "WeeeR", port: 3001, screenId: "R-33", label: "ร้านดู my-orders (buyer)" },
    ],
  },

  // ── A-16 Parts Order Detail ── ──────────────────────────────────────────────
  "A-16": {
    origins: [{ id: "A-15", label: "Parts Orders list" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-15", targetLabel: "Parts Orders" },
      { buttonLabel: "ดูข้อพิพาท (P7)", targetId: "A-18", targetLabel: "Parts Dispute Detail" },
    ],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-32", label: "ร้านดู order detail" },
      { app: "WeeeR", port: 3001, screenId: "R-34", label: "ผู้ซื้อดู buyer order" },
    ],
  },

  // ── A-17 Parts Disputes ── ──────────────────────────────────────────────────
  "A-17": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-15", label: "Parts Orders → Disputes" },
    ],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-18", targetLabel: "Parts Dispute Detail" },
    ],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-31", label: "ร้านเห็นสถานะ P7 dispute" },
    ],
  },

  // ── A-18 Parts P7 Dispute ── ────────────────────────────────────────────────
  "A-18": {
    origins: [{ id: "A-17", label: "Parts Disputes" }],
    destinations: [
      { buttonLabel: "ตัดสินใจ P7", targetId: "A-17", targetLabel: "กลับรายการ" },
      { buttonLabel: "กลับ", targetId: "A-17", targetLabel: "Parts Disputes" },
    ],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-32", label: "ร้านดูผล P7 ruling" },
    ],
  },

  // ── A-19 KYC List ── ────────────────────────────────────────────────────────
  "A-19": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-43", label: "กลับจาก WeeeR KYC Detail" },
    ],
    destinations: [
      { buttonLabel: "ตรวจสอบ", targetId: "A-43", targetLabel: "WeeeR KYC Detail" },
    ],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-01", label: "ร้านรอผล KYC (dashboard)" },
    ],
    drefs: [
      { id: "D24", desc: "Signed URL · TTL 1 ชม. สำหรับเอกสาร KYC" },
      { id: "D25", desc: "KYC document retention ตาม PDPA" },
    ],
  },

  // ── A-21 Repair Analytics ── ────────────────────────────────────────────────
  "A-21": {
    origins: [
      { id: "A-01", label: "Dashboard (sidebar)" },
      { id: "A-02", label: "Repair Jobs → Analytics" },
    ],
    destinations: [
      { buttonLabel: "กลับ Jobs", targetId: "A-02", targetLabel: "Repair Jobs" },
    ],
    xapp: [],
    drefs: [
      { id: "D64", desc: "Jobs by source classification (customer/walk-in/resell)" },
    ],
  },

  // ── A-22 Repair Parcel Queue ── ─────────────────────────────────────────────
  "A-22": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-22b", targetLabel: "Parcel Detail" },
    ],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-07", label: "ร้านดู parcel queue (C3)" },
      { app: "WeeeT", port: 3003, screenId: "T-05", label: "ช่างนัดเวลาส่ง (C3)" },
    ],
  },

  "A-22b": {
    origins: [{ id: "A-22", label: "Repair Parcel Queue" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-22", targetLabel: "Parcel Queue" }],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-08", label: "ร้านดู parcel detail" },
    ],
  },

  // ── A-23 Repair Parcel Disputes ── ──────────────────────────────────────────
  "A-23": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-22b", targetLabel: "Parcel Detail" },
    ],
    xapp: [],
  },

  // ── A-24 Repair Parcel Analytics ── ─────────────────────────────────────────
  "A-24": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-25 Repair Pickup Queue ── ─────────────────────────────────────────────
  "A-25": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-25b", targetLabel: "Pickup Detail" },
      { buttonLabel: "Dispatch Monitor", targetId: "A-26", targetLabel: "ติดตามรถ" },
    ],
    xapp: [
      { app: "WeeeT", port: 3003, screenId: "T-04", label: "ช่างรับงานขนส่ง (S6/S9)" },
    ],
  },

  "A-25b": {
    origins: [{ id: "A-25", label: "Repair Pickup Queue" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-25", targetLabel: "Pickup Queue" }],
    xapp: [],
  },

  // ── A-26 Repair Pickup Dispatch Monitor ── ──────────────────────────────────
  "A-26": {
    origins: [{ id: "A-25", label: "Repair Pickup Queue" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-25", targetLabel: "Pickup Queue" },
    ],
    xapp: [],
  },

  // ── A-27 Repair Pickup Analytics ── ─────────────────────────────────────────
  "A-27": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-28 Repair Walk-in Queue ── ────────────────────────────────────────────
  "A-28": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "คลิกรายการ", targetId: "A-28b", targetLabel: "Walk-in Detail" },
      { buttonLabel: "Abandoned", targetId: "A-29", targetLabel: "รายการทิ้งงาน" },
    ],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-05", label: "ร้านดู walk-in queue (C1)" },
    ],
  },

  "A-28b": {
    origins: [{ id: "A-28", label: "Walk-in Queue" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-28", targetLabel: "Walk-in Queue" }],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-06", label: "ร้านดู C1 walk-in" },
    ],
  },

  // ── A-29 Walk-in Abandoned ── ───────────────────────────────────────────────
  "A-29": {
    origins: [{ id: "A-28", label: "Walk-in Queue" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-28", targetLabel: "Walk-in Queue" }],
    xapp: [],
  },

  // ── A-30 Walk-in Analytics ── ───────────────────────────────────────────────
  "A-30": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-31 Maintain Analytics ── ──────────────────────────────────────────────
  "A-31": {
    origins: [{ id: "A-06", label: "Maintain Jobs → Analytics" }],
    destinations: [{ buttonLabel: "กลับ Jobs", targetId: "A-06", targetLabel: "Maintain Jobs" }],
    xapp: [],
  },

  // ── A-32 Maintain Recurring ── ──────────────────────────────────────────────
  "A-32": {
    origins: [{ id: "A-06", label: "Maintain Jobs → Recurring" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-06", targetLabel: "Maintain Jobs" }],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-12", label: "ลูกค้าดูสัญญาบำรุงซ้ำ" },
    ],
  },

  // ── A-33 Scrap Listings ── ──────────────────────────────────────────────────
  "A-33": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [{ buttonLabel: "คลิกรายการ", targetId: "A-33b", targetLabel: "Scrap Listing Detail" }],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-29", label: "ลูกค้าสร้างประกาศซาก" },
      { app: "WeeeR", port: 3001, screenId: "R-24", label: "ร้านดูประกาศซาก" },
    ],
  },

  "A-33b": {
    origins: [{ id: "A-33", label: "Scrap Listings" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-33", targetLabel: "Scrap Listings" }],
    xapp: [],
  },

  // ── A-34 Resell Offers ── ───────────────────────────────────────────────────
  "A-34": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "ดูประกาศ", targetId: "A-12b", targetLabel: "Resell Listing Detail" },
    ],
    xapp: [
      { app: "WeeeU", port: 3002, screenId: "U-18", label: "ลูกค้าดูข้อเสนอ" },
      { app: "WeeeR", port: 3001, screenId: "R-15", label: "ร้านดูประกาศ" },
    ],
  },

  // ── A-35 Resell Jobs ── ─────────────────────────────────────────────────────
  "A-35": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [{ buttonLabel: "คลิกรายการ", targetId: "A-35b", targetLabel: "Resell Job Detail" }],
    xapp: [],
  },

  "A-35b": {
    origins: [{ id: "A-35", label: "Resell Jobs" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-35", targetLabel: "Resell Jobs" }],
    xapp: [],
  },

  // ── A-36 Resell Fees ── ─────────────────────────────────────────────────────
  "A-36": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-37 Resell Lifecycle ── ────────────────────────────────────────────────
  "A-37": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D14", desc: "Listing Lifecycle Policy — อายุประกาศ/Offer Window/Inspection/Escrow" },
    ],
  },

  // ── A-38 Resell Analytics ── ────────────────────────────────────────────────
  "A-38": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-39 Parts Catalog ── ───────────────────────────────────────────────────
  "A-39": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [{ buttonLabel: "คลิกอะไหล่", targetId: "A-39b", targetLabel: "Parts Detail" }],
    xapp: [
      { app: "WeeeR", port: 3001, screenId: "R-30", label: "ร้านดู marketplace" },
    ],
  },

  "A-39b": {
    origins: [{ id: "A-39", label: "Parts Catalog" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-39", targetLabel: "Parts Catalog" }],
    xapp: [],
  },

  // ── A-40 Parts Analytics ── ─────────────────────────────────────────────────
  "A-40": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-41 Parts Movements ── ─────────────────────────────────────────────────
  "A-41": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [{ buttonLabel: "คลิกรายการ", targetId: "A-41b", targetLabel: "Movement Detail" }],
    xapp: [],
  },

  "A-41b": {
    origins: [{ id: "A-41", label: "Parts Movements" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-41", targetLabel: "Parts Movements" }],
    xapp: [],
  },

  // ── A-42 Users ── ───────────────────────────────────────────────────────────
  "A-42": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "ดู KYC WeeeR", targetId: "A-43", targetLabel: "WeeeR KYC" },
    ],
    xapp: [],
  },

  // ── A-43 User WeeeR KYC ── ──────────────────────────────────────────────────
  "A-43": {
    origins: [{ id: "A-42", label: "Users" }],
    destinations: [{ buttonLabel: "กลับ", targetId: "A-42", targetLabel: "Users" }],
    xapp: [],
    drefs: [
      { id: "D24", desc: "Signed URL · TTL 1 ชม. สำหรับเอกสาร KYC" },
      { id: "D15", desc: "WeeeT Auto Create Account — ใช้ phone เป็น username" },
      { id: "D16", desc: "ไม่มีระบบ SMS — WeeeR แจ้ง credentials ช่างเอง" },
    ],
  },

  // ── A-44 Points ── ──────────────────────────────────────────────────────────
  "A-44": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "Manual Adjust", targetId: "A-45", targetLabel: "ปรับพอยต์ด้วยตนเอง" },
    ],
    xapp: [],
  },

  // ── A-45 Points Manual Adjust ── ────────────────────────────────────────────
  "A-45": {
    origins: [{ id: "A-44", label: "Points" }],
    destinations: [
      { buttonLabel: "บันทึก", targetId: "A-44", targetLabel: "กลับ Points" },
      { buttonLabel: "ยกเลิก", targetId: "A-44", targetLabel: "กลับ Points" },
    ],
    xapp: [],
    drefs: [
      { id: "D27", desc: "Super Admin permission — ต้องมีสิทธิ์ Super Admin เท่านั้น" },
      { id: "D28", desc: "Manual adjust limit per transaction" },
    ],
  },

  // ── A-46 Platform Balances ── ────────────────────────────────────────────────
  "A-46": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D17", desc: "Gold Point invariant — Total Minted = Reserve + Fee Pools + Escrow + Written-Off" },
    ],
  },

  // ── A-47 Platform Gold Management ── ────────────────────────────────────────
  "A-47": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D17", desc: "Gold Point invariant — Total Minted = Reserve + Fee Pools + Escrow + Written-Off" },
    ],
  },

  // ── A-48 Platform Reconciliation ── ─────────────────────────────────────────
  "A-48": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D17", desc: "Gold Point invariant — Total Minted = Sum of all buckets" },
      { id: "D27", desc: "Super Admin permission — ต้องมีสิทธิ์ Super Admin เพื่อ Run Reconciliation" },
    ],
  },

  // ── A-49 Platform Silver ── ─────────────────────────────────────────────────
  "A-49": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D29", desc: "Silver Engagement Rewards — 8 triggers กำหนดผ่าน system_config" },
      { id: "D30", desc: "Signup Bonus — โบนัสสมัครสมาชิกครั้งแรก" },
    ],
  },

  // ── A-50 Platform Transactions ── ────────────────────────────────────────────
  "A-50": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D19", desc: "Append-only ledger — ลบหรือแก้ไข transaction ไม่ได้" },
    ],
  },

  // ── A-51 Topup ── ───────────────────────────────────────────────────────────
  "A-51": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-52 Withdrawal ── ──────────────────────────────────────────────────────
  "A-52": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D91", desc: "Gold withdrawal rules — WeeeU + WeeeR ถอน Gold ได้" },
    ],
  },

  // ── A-53 Transfers Deposits ── ──────────────────────────────────────────────
  "A-53": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-54 Transfers Withdrawals ── ───────────────────────────────────────────
  "A-54": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-55 Reconciliation ── ──────────────────────────────────────────────────
  "A-55": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-56 Config ── ──────────────────────────────────────────────────────────
  "A-56": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D84", desc: "Bad Record Policy — admin-tunable threshold/window/cool-down" },
    ],
  },

  // ── A-57 Reference Data ── ──────────────────────────────────────────────────
  "A-57": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D5",  desc: "Generic-First — architecture pattern สำหรับ appliance categories" },
      { id: "D89", desc: "asset_images schema — category/local_path/cloud_url/linked_entity" },
      { id: "D90", desc: "Soft Delete — ปิดใช้งานรายการโดยไม่ลบจริง (active flag)" },
      { id: "D92", desc: "Master 3-layer — ประเภท > ยี่ห้อ > รุ่น" },
    ],
  },

  // ── A-58 Audit Log ── ───────────────────────────────────────────────────────
  "A-58": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-59 System Storage ── ──────────────────────────────────────────────────
  "A-59": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D20", desc: "Entity storage classification — breakdown by entity type" },
      { id: "D22", desc: "Appliance ownership transfer history ผ่าน Resell flow" },
      { id: "D25", desc: "PDPA retention schedule — กำหนดการเก็บและลบข้อมูล" },
    ],
  },

  // ── A-60 Pricing ── ─────────────────────────────────────────────────────────
  "A-60": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-61 Services ── ────────────────────────────────────────────────────────
  "A-61": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-62 Promotions ── ──────────────────────────────────────────────────────
  "A-62": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-63 Products ── ────────────────────────────────────────────────────────
  "A-63": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-64 Content ── ─────────────────────────────────────────────────────────
  "A-64": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "สร้างใหม่", targetId: "A-64c", targetLabel: "Content New" },
      { buttonLabel: "คลิกแก้ไข", targetId: "A-64b", targetLabel: "Content Edit" },
    ],
    xapp: [],
  },

  "A-64c": {
    origins: [{ id: "A-64", label: "Content list" }],
    destinations: [
      { buttonLabel: "บันทึก", targetId: "A-64", targetLabel: "กลับ Content" },
      { buttonLabel: "ยกเลิก", targetId: "A-64", targetLabel: "กลับ Content" },
    ],
    xapp: [],
  },

  "A-64b": {
    origins: [{ id: "A-64", label: "Content list" }],
    destinations: [
      { buttonLabel: "บันทึก", targetId: "A-64", targetLabel: "กลับ Content" },
      { buttonLabel: "ยกเลิก", targetId: "A-64", targetLabel: "กลับ Content" },
    ],
    xapp: [],
  },

  // ── A-65 Articles ── ────────────────────────────────────────────────────────
  "A-65": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-66 Contact Inbox ── ───────────────────────────────────────────────────
  "A-66": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "คลิกข้อความ", targetId: "A-66b", targetLabel: "Contact Message" },
    ],
    xapp: [],
  },

  "A-66b": {
    origins: [{ id: "A-66", label: "Contact Inbox" }],
    destinations: [
      { buttonLabel: "กลับ", targetId: "A-66", targetLabel: "Contact Inbox" },
    ],
    xapp: [],
  },

  // ── A-67 Contact Info ── ────────────────────────────────────────────────────
  "A-67": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D78", desc: "Contact info edit spec — D78-shaped fields (phone/email/address)" },
    ],
  },

  // ── A-68 Testimonials ── ────────────────────────────────────────────────────
  "A-68": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "สร้างใหม่", targetId: "A-68c", targetLabel: "Testimonial New" },
      { buttonLabel: "แก้ไข", targetId: "A-68b", targetLabel: "Testimonial Edit" },
    ],
    xapp: [],
    drefs: [
      { id: "D86", desc: "Testimonials spec — star-sort · website-pick · ลำดับแสดงบนเว็บ" },
    ],
  },

  "A-68c": {
    origins: [{ id: "A-68", label: "Testimonials" }],
    destinations: [
      { buttonLabel: "บันทึก", targetId: "A-68", targetLabel: "กลับ" },
      { buttonLabel: "ยกเลิก", targetId: "A-68", targetLabel: "กลับ" },
    ],
    xapp: [],
  },

  "A-68b": {
    origins: [{ id: "A-68", label: "Testimonials" }],
    destinations: [
      { buttonLabel: "บันทึก", targetId: "A-68", targetLabel: "กลับ" },
      { buttonLabel: "ยกเลิก", targetId: "A-68", targetLabel: "กลับ" },
    ],
    xapp: [],
  },

  // ── A-69 Ads ── ─────────────────────────────────────────────────────────────
  "A-69": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
    drefs: [
      { id: "D75", desc: "Gold Point deduction — goldCost = Math.round(rate × วัน) ตัดล่วงหน้าตอนซื้อ" },
    ],
  },

  // ── A-70 Notify Download ── ─────────────────────────────────────────────────
  "A-70": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-71 Listings Index ── ──────────────────────────────────────────────────
  "A-71": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [
      { buttonLabel: "Resell", targetId: "A-12", targetLabel: "Resell Listings" },
      { buttonLabel: "Scrap", targetId: "A-33", targetLabel: "Scrap Listings" },
    ],
    xapp: [],
  },

  // ── A-72 Module Template ── ─────────────────────────────────────────────────
  "A-72": {
    origins: [{ id: "A-01", label: "Dashboard (sidebar)" }],
    destinations: [],
    xapp: [],
  },

  // ── A-73 Login ── ───────────────────────────────────────────────────────────
  "A-73": {
    origins: [],
    destinations: [
      { buttonLabel: "เข้าสู่ระบบสำเร็จ", targetId: "A-01", targetLabel: "Dashboard" },
    ],
    xapp: [],
  },
};
