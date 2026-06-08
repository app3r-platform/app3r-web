/**
 * junction-data.ts — JUNCTION 2.4 screen-to-screen flow map
 * ─────────────────────────────────────────────────────────
 * ข้อมูล junction (◀ มาจาก / → ไปต่อ) สำหรับ [↔] popup ใน MockAnnoBar
 * แหล่งที่มา: Notion WeeeU app-level + Resell + Scrap junction pages
 *
 * กฎ: ไฟล์นี้ใช้เฉพาะ mockup dev · ลบพร้อม mock-anno เมื่อใช้โค้ดจริง
 * อ้างอิง: JUNCTION 2.4 · CMD #115-L · Advisor Gen 113
 */

export interface JunctionTo {
  id: string;     // Screen ID ปลายทาง เช่น "U-02"
  label: string;  // action ที่ทำให้เปลี่ยนหน้า เช่น "แจ้งซ่อม"
  note?: string;  // เงื่อนไข/round เช่น "R4", "R8"
}

export interface JunctionEntry {
  screenId: string;  // Screen ID หลักของจอนี้
  title: string;     // ชื่อจอภาษาไทย
  from: string[];    // มาจาก (Screen IDs หรือ origin text)
  to: JunctionTo[];  // ปลายทางที่ไปได้
}

// ── Junction map ─────────────────────────────────────────────────────────────
const JUNCTION_MAP: Record<string, JunctionEntry> = {

  // ── WeeeU App-level ────────────────────────────────────────────────────────

  "U-67": {
    screenId: "U-67",
    title: "Welcome / Landing",
    from: ["web (ออกจากระบบ)", "logout"],
    to: [
      { id: "U-48", label: "สมัครสมาชิก" },
      { id: "U-59", label: "เข้าสู่ระบบ" },
      { id: "U-68", label: "ลืมรหัสผ่าน" },
      { id: "U-65", label: "บัญชีถูกระงับ" },
    ],
  },

  "U-01": {
    screenId: "U-01",
    title: "แดชบอร์ด",
    from: ["post-login", "กดแท็บ Home"],
    to: [
      { id: "U-02", label: "แจ้งซ่อม" },
      { id: "U-11", label: "บำรุงรักษา" },
      { id: "U-47", label: "ขาย/ประกาศ" },
      { id: "U-21", label: "ตลาด C2C (ซื้อ)" },
      { id: "U-55", label: "ซากเครื่อง" },
      { id: "U-50", label: "งานของฉัน" },
      { id: "U-57", label: "กระเป๋าพอยต์" },
      { id: "U-36", label: "การแจ้งเตือน" },
      { id: "U-35", label: "โปรไฟล์" },
      { id: "U-34", label: "เครื่องใช้ไฟฟ้า" },
    ],
  },

  "U-48": {
    screenId: "U-48",
    title: "สมัครสมาชิก",
    from: ["U-67"],
    to: [
      { id: "U-60", label: "กรอกอีเมล" },
      { id: "U-61", label: "ยืนยันอีเมล" },
      { id: "U-62", label: "ตั้งรหัสผ่าน" },
      { id: "U-63", label: "OTP โทรศัพท์" },
      { id: "U-64", label: "ข้อมูลส่วนตัว" },
      { id: "U-01", label: "OAuth (สำเร็จ)" },
    ],
  },

  "U-50": {
    screenId: "U-50",
    title: "งานของฉัน",
    from: ["U-01"],
    to: [
      { id: "U-04", label: "งานซ่อม" },
      { id: "U-16", label: "งานบำรุง" },
      { id: "U-47c", label: "ประกาศขาย" },
      { id: "U-27", label: "งานซื้อ" },
      { id: "U-33", label: "งานซาก" },
    ],
  },

  "U-57": {
    screenId: "U-57",
    title: "กระเป๋าพอยต์ (Wallet)",
    from: ["U-01"],
    to: [
      { id: "U-44", label: "เติมพอยต์" },
      { id: "U-45", label: "ถอนพอยต์" },
      { id: "U-56", label: "ประวัติพอยต์" },
      { id: "U-46", label: "ธุรกรรมทั้งหมด" },
    ],
  },

  "U-35": {
    screenId: "U-35",
    title: "โปรไฟล์",
    from: ["U-01"],
    to: [
      { id: "U-49", label: "แก้ไขโปรไฟล์" },
      { id: "U-66", label: "ตั้งค่า" },
      { id: "U-34", label: "เครื่องใช้ไฟฟ้า" },
      { id: "U-37", label: "ที่อยู่" },
      { id: "U-51", label: "บัญชีธนาคาร" },
      { id: "U-67", label: "ออกจากระบบ" },
    ],
  },

  // ── Resell ─────────────────────────────────────────────────────────────────

  "U-47": {
    screenId: "U-47",
    title: "ขายของ / ประกาศของฉัน",
    from: ["U-01", "U-50"],
    to: [
      { id: "U-47a", label: "ลงประกาศใหม่" },
      { id: "U-47c", label: "รายละเอียดประกาศ" },
    ],
  },

  "U-47c": {
    screenId: "U-47c",
    title: "รายละเอียดประกาศ (ผู้ขาย)",
    from: ["U-47", "U-50"],
    to: [
      { id: "U-47b", label: "แก้ไขประกาศ" },
      { id: "R-18", label: "ดูข้อเสนอ" },
      { id: "U-19b", label: "ยืนยันส่งมอบ", note: "R5" },
      { id: "A-12b", label: "อุทธรณ์", note: "R2" },
    ],
  },

  "U-21": {
    screenId: "U-21",
    title: "ตลาด C2C (ซื้อ)",
    from: ["U-01"],
    to: [
      { id: "U-23", label: "ดูรายละเอียดสินค้า" },
    ],
  },

  "U-23": {
    screenId: "U-23",
    title: "รายละเอียดสินค้า (ผู้ซื้อ)",
    from: ["U-21"],
    to: [
      { id: "U-22", label: "ยื่นข้อเสนอ + OTP → escrow lock" },
    ],
  },

  "R-18": {
    screenId: "R-18",
    title: "จัดการข้อเสนอ (ผู้ขาย)",
    from: ["U-47c"],
    to: [
      { id: "U-19b", label: "ยอมรับ → ออเดอร์" },
      { id: "R-18", label: "ปฏิเสธ (อยู่หน้าเดิม)" },
      { id: "R-6", label: "หมดเวลา timeout" },
    ],
  },

  "U-19c": {
    screenId: "U-19c",
    title: "สถานะออเดอร์",
    from: ["R-18", "U-22"],
    to: [
      { id: "U-44", label: "เติมพอยต์", note: "R4" },
      { id: "A-13", label: "escalate", note: "R6" },
      { id: "U-26", label: "ข้อพิพาท", note: "R11" },
      { id: "U-24", label: "ตรวจรับสินค้า" },
      { id: "R-12", label: "ยกเลิก" },
      { id: "U-RES-REV", label: "รีวิว", note: "R10" },
    ],
  },

  "U-24": {
    screenId: "U-24",
    title: "ตรวจรับสินค้า",
    from: ["U-19c"],
    to: [
      { id: "U-01", label: "ยอมรับ → พอยต์ → ผู้ขาย (เสร็จ)" },
      { id: "U-26", label: "ปฏิเสธ → ข้อพิพาท", note: "R8" },
    ],
  },

  "A-14": {
    screenId: "A-14",
    title: "ตัดสินข้อพิพาท (Admin)",
    from: ["U-26", "A-13"],
    to: [
      { id: "U-19c", label: "คืนพอยต์ผู้ซื้อ" },
      { id: "U-19c", label: "ปล่อยพอยต์ผู้ขาย" },
      { id: "U-19c", label: "แบ่งบางส่วน" },
    ],
  },

  // ── Scrap ──────────────────────────────────────────────────────────────────

  "R-28": {
    screenId: "R-28",
    title: "งานซาก (WeeeR view)",
    from: ["WeeeR workflow"],
    to: [
      { id: "R-28b", label: "ขายต่อ" },
      { id: "R-28c", label: "แยกอะไหล่" },
      { id: "R-28d", label: "ซ่อมแล้วขาย" },
      { id: "R-28e", label: "รีไซเคิล" },
      { id: "R-28", label: "ถอนตัว" },
      { id: "A-09", label: "ข้อพิพาท" },
    ],
  },

  "U-33": {
    screenId: "U-33",
    title: "รายละเอียดซาก (WeeeU)",
    from: ["U-55", "U-50"],
    to: [
      { id: "U-30", label: "ยินยอม / โต้แย้ง" },
      { id: "U-33", label: "นัดใหม่ / ยกเลิกนัด" },
      { id: "S10", label: "ยกเลิกงาน" },
    ],
  },

  "U-55": {
    screenId: "U-55",
    title: "ซากของฉัน",
    from: ["U-01", "U-50"],
    to: [
      { id: "U-29", label: "ประกาศซากใหม่" },
      { id: "U-33", label: "รายละเอียดงานซาก" },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** ดึง JunctionEntry ตาม screenId (undefined ถ้าไม่มีข้อมูล) */
export function getJunctionEntry(screenId: string): JunctionEntry | undefined {
  return JUNCTION_MAP[screenId];
}

/** ดึงทั้งหมด (สำหรับ debug / full map view) */
export function getAllJunctionEntries(): JunctionEntry[] {
  return Object.values(JUNCTION_MAP);
}
