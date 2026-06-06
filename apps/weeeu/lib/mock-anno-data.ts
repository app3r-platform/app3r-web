/**
 * mock-anno-data.ts — annotation data สำหรับ P2 mockup review
 * ข้อมูล §5 origin + §6 nav + §8 cross-app ต่อ route
 *
 * กฎ: ทุก entry ใช้ class "mock-anno" → grep -r "mock-anno" ลบทีเดียวตอนโค้ดจริง
 * อ้างอิง: P0 Advisor Specs §3 + §5 + §6 + §8 · Annotation Spec Gen 113
 */

export interface XAppLink {
  app: "WeeeR" | "WeeeT" | "Admin" | "Website";
  screenId: string;
  label: string;
  port: number;
  path: string;
}

export interface NavTarget {
  id: string;       // Screen ID ปลายทาง
  label: string;    // คำอธิบาย
  branch?: string;  // [A] / [B] / [C] ถ้ามีหลาย branch
}

export interface MockAnnoEntry {
  screenId: string;
  from: string[];      // Screen IDs ที่นำมาถึงจอนี้ ("จอแรก" ถ้าเป็น entry point)
  to: NavTarget[];     // ปุ่ม/ลิงก์ที่ออกไป
  xapp?: XAppLink[];   // แอพฯอื่นที่เห็นพร้อมกัน ณ จังหวะนี้
}

// ── Route → MockAnnoEntry map ────────────────────────────────────────────────
// key = pathname prefix (ใช้ longest-match เหมือน ScreenBadge)
const MOCK_ANNO_MAP: Record<string, MockAnnoEntry> = {

  // ── General ──────────────────────────────────────────────────────────────
  "/dashboard": {
    screenId: "U-01",
    from: ["จอแรกของแอปฯ", "U-67 (welcome → login → signup)"],
    to: [
      { id: "U-02", label: "ซ่อม" },
      { id: "U-11", label: "บำรุงรักษา" },
      { id: "U-17", label: "ซื้อ-ขาย / ดูประกาศ" },
      { id: "U-55", label: "ซากเครื่อง" },
      { id: "U-57", label: "กระเป๋าเงิน" },
      { id: "U-35", label: "โปรไฟล์" },
      { id: "U-36", label: "การแจ้งเตือน" },
    ],
  },
  "/repair": {
    screenId: "U-02",
    from: ["U-01", "U-38 (back)", "U-04 (back)"],
    to: [
      { id: "U-03", label: "แจ้งซ่อมใหม่" },
      { id: "U-04", label: "ดูงานซ่อม" },
      { id: "U-02b", label: "Walk-in เลือกร้าน", branch: "A" },
      { id: "U-02c", label: "นัด Pickup", branch: "B" },
    ],
  },
  "/repair/walk-in/select-shop": {
    screenId: "U-02b",
    from: ["U-03 (เลือก walk-in)"],
    to: [{ id: "U-03", label: "ยืนยันร้าน → กลับฟอร์ม" }],
  },
  "/repair/pickup/schedule": {
    screenId: "U-02c",
    from: ["U-03 (เลือก pickup)"],
    to: [{ id: "U-03", label: "เลือกวันนัด → กลับฟอร์ม" }],
  },
  "/repair/new": {
    screenId: "U-03",
    from: ["U-02", "U-07 (C4 scrap-offer → ซ่อมใหม่)"],
    to: [
      { id: "U-38", label: "ส่งคำขอ → สำเร็จ" },
      { id: "U-04", label: "กลับดูประกาศ" },
    ],
  },
  "/repair/new/success": {
    screenId: "U-38",
    from: ["U-03"],
    to: [
      { id: "U-02", label: "กลับหน้าซ่อม" },
      { id: "U-04", label: "ดูประกาศที่สร้าง" },
    ],
  },
  "/repair/[id]": {
    screenId: "U-04",
    from: ["U-02", "U-38", "U-01 (recent activity)"],
    to: [
      { id: "U-05", label: "ดูข้อเสนอจากช่าง" },
      { id: "U-06", label: "ดูความคืบหน้า (หลัง accept)" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-11", label: "ดูงานซ่อม (R-11)", port: 3001, path: "/repair/jobs/c001" },
    ],
  },
  "/repair/[id]/offers": {
    screenId: "U-05",
    from: ["U-04"],
    to: [
      { id: "U-06", label: "เลือกข้อเสนอ → Progress", branch: "A" },
      { id: "U-04", label: "ปฏิเสธทุกข้อเสนอ → กลับ", branch: "B" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-03", label: "ร้านยื่นข้อเสนอ (R-03)", port: 3001, path: "/repair/announcements/c001/offer" },
    ],
  },
  "/repair/[id]/progress": {
    screenId: "U-06",
    from: ["U-05 (accept offer)", "U-04"],
    to: [
      { id: "U-07", label: "C4 เสนอซาก", branch: "A" },
      { id: "U-09", label: "C1 complete → รีวิว", branch: "B" },
      { id: "U-08", label: "C5 fee-settle", branch: "C" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-11", label: "R-11 ดูงาน", port: 3001, path: "/repair/jobs/c001" },
      { app: "WeeeT", screenId: "T-02", label: "T-02 วินิจฉัย", port: 3003, path: "/jobs/c001/diagnose" },
    ],
  },
  "/repair/[id]/scrap-offer": {
    screenId: "U-07",
    from: ["U-06 (C4)"],
    to: [
      { id: "U-29", label: "ตกลงซาก → scrap/new", branch: "A" },
      { id: "U-08", label: "ปฏิเสธ → Fee Settle C5", branch: "B" },
    ],
  },
  "/repair/[id]/fee-settle": {
    screenId: "U-08",
    from: ["U-07 (ปฏิเสธซาก)", "U-06 (C5)"],
    to: [{ id: "U-02", label: "กลับหน้าซ่อม" }],
  },
  "/repair/[id]/review": {
    screenId: "U-09",
    from: ["U-06 (C1 complete)"],
    to: [{ id: "U-02", label: "ให้คะแนนแล้ว → กลับซ่อม" }],
  },
  "/repair/[id]/dispute": {
    screenId: "U-09b",
    from: ["U-09 (ไม่พอใจ)"],
    to: [{ id: "U-02", label: "dispute ส่งแล้ว" }],
    xapp: [
      { app: "Admin", screenId: "A-04", label: "Admin dispute (A-04)", port: 3000, path: "/repair/disputes" },
    ],
  },
  "/repair/[id]/approve-entry": {
    screenId: "U-09c",
    from: ["U-06 (walk-in ช่างมาถึง)"],
    to: [{ id: "U-06", label: "อนุมัติ/ปฏิเสธ" }],
  },
  "/repair/[id]/delivery-receipt": {
    screenId: "U-09d",
    from: ["U-06 (parcel ส่งกลับ)"],
    to: [{ id: "U-09", label: "ยืนยันรับ → รีวิว" }],
  },
  "/repair/[id]/decision/b1-2": {
    screenId: "U-52a",
    from: ["U-06 (C2 B1 decision)"],
    to: [{ id: "U-06", label: "ตัดสินใจ B1" }],
  },
  "/repair/[id]/decision/b2-2": {
    screenId: "U-52b",
    from: ["U-06 (C2 B2 decision)"],
    to: [{ id: "U-06", label: "ตัดสินใจ B2" }],
  },
  "/repair/[id]/parcel-receipt": {
    screenId: "U-53a",
    from: ["U-06 (parcel รับของ)"],
    to: [{ id: "U-06", label: "ยืนยันรับพัสดุ" }],
  },
  "/repair/[id]/pickup-receipt": {
    screenId: "U-53b",
    from: ["U-06 (pickup รับเครื่อง)"],
    to: [{ id: "U-06", label: "ยืนยันรับเครื่อง" }],
  },
  "/repair/[id]/ship-out": {
    screenId: "U-53c",
    from: ["U-06 (ส่งคืนลูกค้า)"],
    to: [{ id: "U-09d", label: "กรอกเลขพัสดุ → delivery-receipt" }],
  },
  "/repair/[id]/shipping-details": {
    screenId: "U-53d",
    from: ["U-06", "U-53c"],
    to: [{ id: "U-06", label: "ดูรายละเอียดการจัดส่ง" }],
  },
  "/repair/[id]/walk-in-receipt": {
    screenId: "U-53e",
    from: ["U-06 (walk-in รับเครื่อง)"],
    to: [{ id: "U-09", label: "ลูกค้ารับเครื่องคืน → รีวิว" }],
  },

  // ── Maintain ──────────────────────────────────────────────────────────────
  "/maintain/book": {
    screenId: "U-11",
    from: ["U-01", "U-12 (ดูนัด → จองใหม่)"],
    to: [{ id: "U-10", label: "ยืนยันการจอง" }],
  },
  "/maintain/book/confirm": {
    screenId: "U-10",
    from: ["U-11"],
    to: [
      { id: "U-39", label: "ยืนยัน → สำเร็จ", branch: "A" },
      { id: "U-11", label: "ยกเลิก → กลับจอง", branch: "B" },
    ],
  },
  "/maintain/book/confirm/success": {
    screenId: "U-39",
    from: ["U-10"],
    to: [{ id: "U-12", label: "ดูนัดหมาย" }],
  },
  "/maintain/jobs": {
    screenId: "U-12",
    from: ["U-01", "U-39"],
    to: [{ id: "U-16", label: "ดูรายละเอียดงาน" }],
  },
  "/maintain/jobs/[id]": {
    screenId: "U-16",
    from: ["U-12"],
    to: [
      { id: "U-15b", label: "ดูข้อเสนอ" },
      { id: "U-13", label: "เลื่อนนัด M3", branch: "A" },
      { id: "U-14", label: "ค่าใช้จ่ายเพิ่ม M4", branch: "B" },
      { id: "U-15", label: "ยุติ M9", branch: "C" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-14", label: "R-14 ดูงาน", port: 3001, path: "/maintain/jobs/m001" },
      { app: "WeeeT", screenId: "T-08", label: "T-08 ตรวจ", port: 3003, path: "/jobs/m001/inspect" },
    ],
  },
  "/maintain/jobs/[id]/offers": {
    screenId: "U-15b",
    from: ["U-16"],
    to: [{ id: "U-16", label: "ยืนยันข้อเสนอ → กลับ" }],
    xapp: [
      { app: "WeeeR", screenId: "R-13", label: "R-13 assign tech", port: 3001, path: "/maintain/jobs/m001/assign" },
    ],
  },
  "/maintain/jobs/[id]/reschedule": {
    screenId: "U-13",
    from: ["U-16 (M3)"],
    to: [{ id: "U-16", label: "บันทึก → กลับงาน" }],
    xapp: [
      { app: "WeeeR", screenId: "R-14", label: "R-14 เห็นการเลื่อน", port: 3001, path: "/maintain/jobs/m001" },
    ],
  },
  "/maintain/jobs/[id]/extra-cost": {
    screenId: "U-14",
    from: ["U-16 (M4)"],
    to: [
      { id: "U-16", label: "อนุมัติ → กลับงาน", branch: "A" },
      { id: "U-15", label: "ปฏิเสธ → ยุติ", branch: "B" },
    ],
  },
  "/maintain/jobs/[id]/cancel": {
    screenId: "U-15",
    from: ["U-16 (M9)", "U-14 (ปฏิเสธ)"],
    to: [{ id: "U-12", label: "ยุติแล้ว → กลับรายการ" }],
  },
  "/maintain/jobs/[id]/rate": {
    screenId: "U-15c",
    from: ["U-16 (งานเสร็จ)"],
    to: [{ id: "U-12", label: "ให้คะแนน → กลับรายการ" }],
  },
  "/maintain/jobs/[id]/mockup/m2-expired": {
    screenId: "U-54a",
    from: ["U-16 (M2 หมดอายุ)"],
    to: [{ id: "U-11", label: "จองใหม่" }],
  },
  "/maintain/jobs/[id]/mockup/m6-weeer-withdrew": {
    screenId: "U-54b",
    from: ["U-16 (M6 WeeeR ถอน)"],
    to: [{ id: "U-11", label: "จองใหม่" }],
  },
  "/maintain/jobs/[id]/mockup/m7-noshow": {
    screenId: "U-54c",
    from: ["U-16 (M7 ไม่มาตามนัด)"],
    to: [{ id: "U-11", label: "จองใหม่" }],
  },
  "/maintain/jobs/[id]/mockup/m9-cancel-inprogress": {
    screenId: "U-54d",
    from: ["U-16 (M9 ยุติกลางคัน)"],
    to: [{ id: "U-12", label: "กลับรายการ" }],
  },
  "/maintain/jobs/[id]/withdraw": {
    screenId: "U-16",  // same as U-16 · state = ถอนตัว
    from: ["U-16 (ถอนตัว)"],
    to: [{ id: "U-12", label: "กลับรายการ" }],
  },

  // ── Resell — Seller ────────────────────────────────────────────────────────
  "/sell": {
    screenId: "U-47",
    from: ["U-01", "U-40"],
    to: [
      { id: "U-47a", label: "ลงประกาศใหม่" },
      { id: "U-47c", label: "ดูประกาศของฉัน (detail)" },
      { id: "U-17", label: "ดูทุกประกาศ" },
    ],
  },
  "/sell/new": {
    screenId: "U-47a",
    from: ["U-47"],
    to: [{ id: "U-40", label: "ส่งประกาศ → สำเร็จ" }],
  },
  "/sell/new/success": {
    screenId: "U-40",
    from: ["U-47a"],
    to: [
      { id: "U-17", label: "ดูประกาศของฉัน" },
      { id: "U-47a", label: "ลงประกาศอีก" },
    ],
  },
  "/sell/[listingId]/edit": {
    screenId: "U-47b",
    from: ["U-47c", "U-20"],
    to: [{ id: "U-47c", label: "บันทึก → กลับ detail" }],
  },
  "/sell/[listingId]": {
    screenId: "U-47c",
    from: ["U-17", "U-47"],
    to: [
      { id: "U-47b", label: "แก้ไขประกาศ" },
      { id: "U-18", label: "ดูข้อเสนอ" },
    ],
  },
  "/listings": {
    screenId: "U-17",
    from: ["U-01", "U-40", "U-19", "U-19c"],
    to: [
      { id: "U-20", label: "ดูประกาศ detail" },
      { id: "U-47a", label: "ลงประกาศใหม่" },
    ],
  },
  "/listings/[id]": {
    screenId: "U-20",
    from: ["U-17"],
    to: [
      { id: "U-18", label: "ดูข้อเสนอ" },
      { id: "U-47b", label: "แก้ไข" },
    ],
  },
  "/listings/[id]/offers": {
    screenId: "U-18",
    from: ["U-20", "U-47c"],
    to: [
      { id: "U-19", label: "ยืนยันข้อเสนอ → R7", branch: "A" },
      { id: "U-20", label: "ปฏิเสธ → กลับ", branch: "B" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-18", label: "R-18 ยื่นข้อเสนอ", port: 3001, path: "/resell/marketplace/r001/offer" },
    ],
  },
  "/listings/[id]/confirm": {
    screenId: "U-19",
    from: ["U-18"],
    to: [
      { id: "U-19c", label: "ส่งมอบแล้ว R7 → order", branch: "A" },
      { id: "U-18", label: "seller ถอน R5", branch: "B" },
      { id: "U-17", label: "ยกเลิกร่วม R12", branch: "C" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-23", label: "R-23 purchase", port: 3001, path: "/resell/purchases/r001" },
    ],
  },
  "/resell/awaiting-payment/[id]": {
    screenId: "U-19b",
    from: ["U-19 (รอ buyer ชำระ)"],
    to: [
      { id: "U-19c", label: "ได้รับเงินแล้ว", branch: "A" },
      { id: "U-44", label: "เติม Gold ก่อน", branch: "B" },
    ],
  },
  "/resell/orders/[id]": {
    screenId: "U-19c",
    from: ["U-19"],
    to: [{ id: "U-17", label: "กลับประกาศ" }],
    xapp: [
      { app: "WeeeR", screenId: "R-23", label: "R-23 order WeeeR", port: 3001, path: "/resell/purchases/r001" },
    ],
  },

  "/resell/orders/[id]/review": {
    screenId: "U-RES-REV",
    from: ["U-19c (state = completed)"],
    to: [
      { id: "U-04", label: "กลับ /sell" },
      { id: "U-21", label: "กลับ marketplace" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-WALLET", label: "Gold เข้า wallet หลัง review", port: 3001, path: "/wallet" },
    ],
  },
  "/offers": {
    screenId: "U-17b",
    from: ["U-01 (ดูข้อเสนอที่ฉันยื่น)"],
    to: [{ id: "U-27", label: "ดู purchase detail" }],
  },

  // ── Resell — Buyer C2C ─────────────────────────────────────────────────────
  "/marketplace": {
    screenId: "U-21",
    from: ["U-01", "U-42"],
    to: [{ id: "U-23", label: "ดูสินค้า detail" }],
  },
  "/marketplace/[id]": {
    screenId: "U-23",
    from: ["U-21"],
    to: [
      { id: "U-22", label: "ยื่นข้อเสนอซื้อ" },
      { id: "U-21", label: "กลับตลาด" },
    ],
  },
  "/marketplace/[id]/offer": {
    screenId: "U-22",
    from: ["U-23"],
    to: [
      { id: "U-42", label: "ส่ง OTP สำเร็จ → success" },
      { id: "U-65", label: "OTP ผิด 3 ครั้ง → suspended" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-18", label: "R-18 seller เห็น offer", port: 3001, path: "/resell/marketplace/r001/offer" },
    ],
  },
  "/marketplace/[id]/offer/success": {
    screenId: "U-42",
    from: ["U-22"],
    to: [{ id: "U-21", label: "กลับตลาด" }],
  },
  "/purchases": {
    screenId: "U-28",
    from: ["U-01", "U-25", "U-43"],
    to: [{ id: "U-27", label: "ดู purchase detail" }],
  },
  "/purchases/[id]": {
    screenId: "U-27",
    from: ["U-28", "U-17b"],
    to: [
      { id: "U-24", label: "ตรวจสอบ R1", branch: "A" },
      { id: "U-26", label: "dispute R8/R11", branch: "B" },
    ],
  },
  "/purchases/[id]/inspect": {
    screenId: "U-24",
    from: ["U-27 (R1)"],
    to: [
      { id: "U-25", label: "ตรงปก ยืนยันรับ", branch: "A" },
      { id: "U-26", label: "ไม่ตรงปก dispute", branch: "B" },
    ],
  },
  "/purchases/[id]/complete": {
    screenId: "U-25",
    from: ["U-24"],
    to: [{ id: "U-28", label: "กลับการสั่งซื้อ" }],
  },
  "/purchases/[id]/dispute": {
    screenId: "U-26",
    from: ["U-24 (B)", "U-27 (R11)"],
    to: [{ id: "U-43", label: "dispute ส่งแล้ว → success" }],
    xapp: [
      { app: "Admin", screenId: "A-13", label: "A-13 admin dispute", port: 3000, path: "/resell/disputes" },
    ],
  },
  "/purchases/[id]/dispute/success": {
    screenId: "U-43",
    from: ["U-26"],
    to: [{ id: "U-28", label: "กลับการสั่งซื้อ" }],
  },

  // ── Scrap ──────────────────────────────────────────────────────────────────
  "/scrap": {
    screenId: "U-55",
    from: ["U-01", "U-41"],
    to: [
      { id: "U-29", label: "ลงซากใหม่" },
      { id: "U-33", label: "ดูซาก detail" },
    ],
  },
  "/scrap/new": {
    screenId: "U-29",
    from: ["U-55", "U-07 (C4 ขายซาก)"],
    to: [{ id: "U-41", label: "ส่งคำขอ → สำเร็จ" }],
  },
  "/scrap/new/success": {
    screenId: "U-41",
    from: ["U-29"],
    to: [
      { id: "U-55", label: "กลับรายการซาก" },
      { id: "U-33", label: "ดูประกาศที่สร้าง" },
    ],
  },
  "/scrap/[id]": {
    screenId: "U-33",
    from: ["U-55", "U-41"],
    to: [{ id: "U-30", label: "ดูข้อเสนอรับซาก" }],
    xapp: [
      { app: "WeeeR", screenId: "R-28", label: "R-28 scrap job", port: 3001, path: "/scrap/jobs/s001" },
    ],
  },
  "/scrap/[id]/offers": {
    screenId: "U-30",
    from: ["U-33"],
    to: [
      { id: "U-31", label: "เลือกข้อเสนอ → confirm", branch: "A" },
      { id: "U-55", label: "ไม่เลือก S5/S6", branch: "B" },
    ],
    xapp: [
      { app: "WeeeR", screenId: "R-25", label: "R-25 ยื่นราคา", port: 3001, path: "/scrap/announcements/s001/offer" },
    ],
  },
  "/scrap/[id]/confirm": {
    screenId: "U-31",
    from: ["U-30"],
    to: [{ id: "U-32", label: "ยืนยัน → รับ E-Cert" }],
    xapp: [
      { app: "WeeeR", screenId: "R-28", label: "R-28 รับซาก", port: 3001, path: "/scrap/jobs/s001" },
    ],
  },
  "/scrap/[id]/certificate": {
    screenId: "U-32",
    from: ["U-31"],
    to: [{ id: "U-55", label: "กลับรายการซาก" }],
  },

  // ── Account / Profile ──────────────────────────────────────────────────────
  "/appliances": {
    screenId: "U-34",
    from: ["U-01", "U-03 (เพิ่มเครื่องจาก repair)"],
    to: [{ id: "U-34b", label: "เพิ่มเครื่อง" }],
  },
  "/appliances/add": {
    screenId: "U-34b",
    from: ["U-34"],
    to: [{ id: "U-34", label: "บันทึก → กลับรายการ" }],
  },
  "/profile": {
    screenId: "U-35",
    from: ["U-01 (header avatar)", "U-66"],
    to: [
      { id: "U-66", label: "จัดการข้อมูลส่วนตัว" },
      { id: "U-49", label: "ตั้งค่าความปลอดภัย" },
    ],
  },
  "/notifications": {
    screenId: "U-36",
    from: ["U-01 (header bell)"],
    to: [
      { id: "U-04", label: "ดูงานซ่อม" },
      { id: "U-16", label: "ดูงานบำรุง" },
      { id: "U-33", label: "ดูซาก" },
      { id: "U-57", label: "ดู wallet" },
    ],
  },
  "/history": {
    screenId: "U-37",
    from: ["U-01"],
    to: [{ id: "U-46", label: "ดูรายละเอียดธุรกรรม" }],
  },

  // ── Wallet ─────────────────────────────────────────────────────────────────
  "/wallet": {
    screenId: "U-57",
    from: ["U-01 (gold/silver chip)", "U-56"],
    to: [
      { id: "U-44", label: "เติม Gold" },
      { id: "U-45", label: "ถอน Gold" },
      { id: "U-56", label: "ประวัติ wallet" },
    ],
  },
  "/wallet/deposit": {
    screenId: "U-44",
    from: ["U-57", "U-19b"],
    to: [{ id: "U-57", label: "เติมเรียบร้อย → กลับ" }],
  },
  "/wallet/withdraw": {
    screenId: "U-45",
    from: ["U-57"],
    to: [{ id: "U-57", label: "ถอนเรียบร้อย → กลับ" }],
  },
  "/wallet/history": {
    screenId: "U-56",
    from: ["U-57"],
    to: [{ id: "U-46", label: "ดูธุรกรรม detail" }],
  },
  "/transactions/[id]": {
    screenId: "U-46",
    from: ["U-56", "U-37"],
    to: [{ id: "U-56", label: "กลับประวัติ" }],
  },

  // ── Jobs ───────────────────────────────────────────────────────────────────
  "/jobs": {
    screenId: "U-50",
    from: ["U-01 (tab ซ่อม)"],
    to: [
      { id: "U-50a", label: "ดู job detail" },
      { id: "U-17", label: "ดูประกาศ Resell" },
    ],
  },
  "/jobs/[id]": {
    screenId: "U-50a",
    from: ["U-50"],
    to: [{ id: "U-50b", label: "ดูความคืบหน้า" }],
    xapp: [
      { app: "WeeeR", screenId: "R-09", label: "R-09 jobs list", port: 3001, path: "/repair/jobs" },
    ],
  },
  "/jobs/[id]/progress": {
    screenId: "U-50b",
    from: ["U-50a"],
    to: [{ id: "U-50a", label: "กลับ job" }],
    xapp: [
      { app: "WeeeT", screenId: "T-11", label: "T-11 job detail", port: 3003, path: "/jobs/c001" },
    ],
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  "/modules/[module]": {
    screenId: "U-51",
    from: ["U-01 (module guide link)"],
    to: [{ id: "U-01", label: "กลับ dashboard" }],
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  "/settings/security": {
    screenId: "U-49",
    from: ["U-35"],
    to: [{ id: "U-35", label: "บันทึก → กลับ profile" }],
  },
  "/settings/account": {
    screenId: "U-66",
    from: ["U-35"],
    to: [{ id: "U-35", label: "บันทึก → กลับ profile" }],
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  "/welcome": {
    screenId: "U-67",
    from: ["จอแรก (redirect /)", "ยังไม่ login"],
    to: [
      { id: "U-59", label: "เข้าสู่ระบบ", branch: "A" },
      { id: "U-60", label: "สมัครสมาชิก", branch: "B" },
    ],
  },
  "/login": {
    screenId: "U-59",
    from: ["U-67"],
    to: [
      { id: "U-01", label: "login สำเร็จ → dashboard" },
      { id: "U-68", label: "ลืมรหัสผ่าน" },
    ],
  },
  "/forgot-password": {
    screenId: "U-68",
    from: ["U-59"],
    to: [{ id: "U-59", label: "reset สำเร็จ → login" }],
  },
  "/signup/method": {
    screenId: "U-48",
    from: ["U-67 (สมัครใหม่)"],
    to: [{ id: "U-60", label: "กรอก email" }],
  },
  "/signup/email": {
    screenId: "U-60",
    from: ["U-48"],
    to: [{ id: "U-61", label: "กรอกข้อมูลส่วนตัว" }],
  },
  "/signup/personal": {
    screenId: "U-61",
    from: ["U-60"],
    to: [{ id: "U-62", label: "กรอกที่อยู่" }],
  },
  "/signup/address": {
    screenId: "U-62",
    from: ["U-61"],
    to: [{ id: "U-63", label: "ยืนยัน OTP" }],
  },
  "/signup/otp": {
    screenId: "U-63",
    from: ["U-62"],
    to: [
      { id: "U-64", label: "OTP ถูก → ยืนยัน email" },
      { id: "U-65", label: "OTP ผิด 3 ครั้ง → suspended" },
    ],
  },
  "/signup/verify-email": {
    screenId: "U-64",
    from: ["U-63"],
    to: [{ id: "U-01", label: "ยืนยัน email → dashboard" }],
  },
  "/suspended": {
    screenId: "U-65",
    from: ["U-22 (OTP ผิด 3)", "U-63 (OTP ผิด 3)"],
    to: [{ id: "U-67", label: "ติดต่อ support → welcome" }],
  },
};

/** หา annotation entry สำหรับ pathname ที่กำหนด (longest-prefix match) */
export function getMockAnnoEntry(pathname: string): MockAnnoEntry | null {
  // Normalize param segments เช่น /repair/c001/offers → /repair/[id]/offers
  const normalize = (p: string) =>
    p.replace(/\/[a-z0-9_-]{4,}(?=\/|$)/gi, (seg) => {
      // ถ้า seg ดูเหมือน ID (ไม่ใช่คำสงวน) → [id]
      const reserved = new Set([
        "new","success","offers","confirm","confirm","schedule","add","book","jobs","deposit",
        "withdraw","history","inspect","complete","dispute","cancel","reschedule","extra-cost",
        "progress","review","scrap-offer","fee-settle","approve-entry","delivery-receipt",
        "parcel-receipt","pickup-receipt","ship-out","shipping-details","walk-in-receipt",
        "select-shop","certificate","method","email","personal","address","otp","verify-email",
        "security","account","mockup","m2-expired","m6-weeer-withdrew","m7-noshow",
        "m9-cancel-inprogress","withdraw","b1-2","b2-2","module","edit","rate","assign",
      ]);
      const key = seg.slice(1);
      return reserved.has(key) ? seg : "/[id]";
    });

  const normalizedPath = normalize(pathname);

  // Sort entries by length descending (longest match first)
  const sorted = Object.entries(MOCK_ANNO_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [pattern, entry] of sorted) {
    // Convert pattern to regex: [id] → [^/]+, [module] → [^/]+
    const regexStr =
      "^" +
      pattern
        .replace(/\[[^\]]+\]/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "(\\/.*)?$";
    if (new RegExp(regexStr).test(normalizedPath)) return entry;
  }
  return null;
}

export default MOCK_ANNO_MAP;
