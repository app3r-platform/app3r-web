// TODO: REMOVE BEFORE PROD — dev-only junction popup data (TD-07)
// Source: 🌳 Screen Linkage Tree Junction v2 · Advisor Gen 115 · 2026-06-08
// 6 modules: Admin(7) · Repair(8) · Maintain(9) · Resell(8) · Scrap(3) · Parts(6)

export interface JunctionEntry {
  screenCode: string;
  screenTitle: string;
  role: string;           // 📋 หน้าที่
  origins: string[];      // ◀ มาจาก
  destinations: string[]; // ▶ ไปต่อ
}

// Admin app screen → route mapping (used by matchScreenId)
const ROUTE_MAP: Record<string, string> = {
  "A-01": "/", "A-02": "/repair/jobs", "A-03": "/repair/jobs/[id]",
  "A-03c": "/repair/jobs/[id]/manual-override", "A-04": "/repair/disputes",
  "A-05": "/repair/disputes/[id]", "A-06": "/maintain/jobs",
  "A-07": "/maintain/jobs/[id]", "A-07c": "/maintain/jobs/[id]/mockup/m9-cancelled",
  "A-08": "/scrap/jobs", "A-08b": "/scrap/jobs/[id]", "A-09": "/scrap/disputes",
  "A-10": "/scrap/disputes/[id]", "A-11": "/scrap/certificates",
  "A-11b": "/scrap/certificates/[id]", "A-12": "/resell/listings",
  "A-12b": "/resell/listings/[id]", "A-13": "/resell/disputes",
  "A-14": "/resell/disputes/[id]", "A-15": "/parts/orders",
  "A-16": "/parts/orders/[id]", "A-17": "/disputes", "A-18": "/disputes/[id]",
  "A-19": "/kyc", "A-20": "/kyc/[id]",
  "A-21": "/repair/analytics", "A-37": "/resell/lifecycle",
  "A-43": "/users/weeer/[id]/kyc", "A-45": "/points/manual-adjust",
  "A-46": "/platform/balances", "A-47": "/platform/gold-management",
  "A-48": "/platform/reconciliation", "A-49": "/platform/silver",
  "A-50": "/platform/transactions", "A-52": "/withdrawal",
  "A-56": "/config", "A-57": "/reference",
  "A-59": "/system/storage", "A-67": "/contact/info",
  "A-68": "/testimonials", "A-69": "/ads",
};

/** Match pathname → Admin screen ID (longest-match first) */
export function matchScreenId(pathname: string): string | null {
  const sorted = Object.entries(ROUTE_MAP).sort(
    (a, b) => b[1].length - a[1].length
  );
  for (const [id, pattern] of sorted) {
    const re = new RegExp(
      "^" +
        pattern
          .replace(/\[[^\]]+\]/g, "[^/]+")
          .replace(/\//g, "\\/") +
        "$"
    );
    if (re.test(pathname)) return id;
  }
  return null;
}

// Junction map — screens with entries show [↔] icon · unlisted → hide
export const JUNCTION_MAP: Record<string, JunctionEntry> = {

  // ── Admin Module — 7 จอตัดสินใจ ──────────────────────────────────────────
  "A-01": {
    screenCode: "A-01",
    screenTitle: "ภาพรวมระบบ (Admin Dashboard)",
    role: "หน้าหลักของแอดมิน แสดงสรุปงานที่ต้องจัดการ (ข้อพิพาทรอตัดสิน / KYC รออนุมัติ / คำขอเติม-ถอนเงิน / settle M9) — เป็นจุดเริ่มต้นของแอดมินทุกฟีเจอร์ลึก",
    origins: [
      "หลัง login (A-73) — ระบบพามาหน้านี้เป็นจุดเริ่มต้น",
      "จากหน้าอื่นๆ — กด logo ใน navigation",
    ],
    destinations: [
      "[ซ่อม] → งานซ่อม on-site (A-02) / Parcel (A-22) / ข้อพิพาท (A-04)",
      "[บำรุง] → งานบำรุง (A-06)",
      "[ซาก/E-Waste] → งานซาก (A-08) / ข้อพิพาท (A-09) / ใบรับรอง (A-11)",
      "[ขายต่อ] → listings audit (A-12) / disputes (A-13)",
      "[อะไหล่] → orders (A-15) / inventory (A-39)",
      "[KYC/ผู้ใช้] → ตรวจ KYC (A-19) / รายชื่อผู้ใช้ (A-42)",
      "[การเงิน] → Gold (A-47) / Topup (A-51) / Withdrawal (A-52)",
      "[ตั้งค่าระบบ] → Config (A-56) / ราคารับซื้อ (A-60)",
      "[เนื้อหา/CMS] → Content (A-64) / รีวิว (A-68) / โฆษณา (A-69)",
    ],
  },

  "A-03": {
    screenCode: "A-03",
    screenTitle: "รายละเอียดงานซ่อม (ฝั่งแอดมิน)",
    role: "แอดมินตรวจสอบรายละเอียดงานซ่อมรายหนึ่ง — ดูว่าอยู่สถานะไหน มีปัญหาไหม ต้องแทรกของ admin หรือไม่",
    origins: [
      "จากรายการงานซ่อม (A-02) — คลิก row งาน",
      "จากหน้าข้อพิพาท (A-05) — หลังตัดสิน ลิงก์ย้อนมาดูงาน",
    ],
    destinations: [
      "[ปรับสถานะ Manual Override] → A-03c — admin บังคับเปลี่ยน state หลังตัดสินข้อพิพาท",
      "[ไปข้อพิพาท] (ถ้ามี) → A-05 ตัดสิน C9",
      "[ดูในร้าน WeeeR] → cross-app localhost:3001/repair/jobs (port 3001)",
    ],
  },

  "A-05": {
    screenCode: "A-05",
    screenTitle: "ตัดสินข้อพิพาท Repair (C9) — ตัวแทน 4 โมดูล",
    role: "จอตัดสินข้อพิพาทระหว่างลูกค้ากับร้าน รูปแบบเดียวกัน 4 โมดูล (Repair A-05 · Resell A-14 · Scrap A-10 · Parts A-18) — แอดมินอ่านประวัติ/สอบสวน แล้วตัดสินว่าจะเข้าข้างฝ่ายไหน หรือแบ่งชำระ (offer = SoT)",
    origins: [
      "จากรายการข้อพิพาท (A-04/A-13/A-09/A-17) — admin คลิกรายการ",
      "จาก notification แจ้งข้อพิพาทใหม่",
    ],
    destinations: [
      "[เข้าข้างผู้ร้อง] → escrow คืน Gold ไปผู้ซื้อ/ลูกค้า → ปิดงาน cancelled",
      "[เข้าข้างผู้ถูกร้อง] → escrow จ่าย Gold ไปร้าน/ผู้ขาย → completed",
      "[แบ่งชำระตามสัดส่วน] → แบ่ง escrow ตามจำนวนที่ระบุ เช่น 70/30",
      "[บันทึกผลตัดสิน] → เขียนลง audit log (A-58) → notification ทั้งสองฝ่าย",
    ],
  },

  "A-43": {
    screenCode: "A-43",
    screenTitle: "ตรวจ KYC ร้าน",
    role: "ตรวจเอกสารยืนยันตัวตนของร้าน (KYC) — สำเนาบัตรประชาชน / บัตรผู้เสียภาษี / หนังสือจดทะเบียน — แล้วอนุมัติหรือปฏิเสธร้าน",
    origins: [
      "จากรายการตรวจ KYC (A-19) หรือ KYC detail (A-20) — admin คลิก row ร้านที่รอตรวจ",
      "จากรายชื่อผู้ใช้งาน (A-42) กดร้าน",
    ],
    destinations: [
      "[อนุมัติ] → ร้านได้สถานะ active ลงประกาศได้ → notification ไปร้าน → กลับ A-19",
      "[ขอข้อมูลเพิ่ม] → notification ระบุเอกสารที่ต้อง → รอรอบถัดไป",
      "[ปฏิเสธ] → บัญชีร้านถูก reject → notification ปฏิเสธ + เหตุผลไปร้าน",
    ],
  },

  "A-47": {
    screenCode: "A-47",
    screenTitle: "จัดการ Gold (Gold Management)",
    role: "จัดการ Gold Point รวมระบบ — ดูยอด Gold active ในระบบ / Gold ที่ล็อกอยู่ / Gold รอส่ง — จุดติดตามสุขภาพเงินระบบ และปรับ manual ถ้ามี reconciliation issue",
    origins: [
      "จากยอดรวมแพลตฟอร์ม (A-46) — admin เห็นไม่สมดุล",
      "จากงาน reconciliation (A-48) — มี issue ต้องปรับ",
    ],
    destinations: [
      "[ปรับยอด manual] → A-45 Manual Adjust → บันทึกลง audit log (A-58) พร้อมเหตุผล",
      "[ดู audit Gold] → A-50 รายการธุรกรรม",
      "[ตรวจ Silver] → A-49 Silver Point",
      "[รีคอนซิลสลิป] → A-55 จับคู่รายการธนาคารกับระบบ",
    ],
  },

  "A-52": {
    screenCode: "A-52",
    screenTitle: "อนุมัติถอนเงิน (Withdrawal)",
    role: "ตรวจคำขอถอนเงิน Gold Point ออกเข้าบัญชีธนาคาร — ตรวจสิทธิ์ถอน (KYC ผ่าน / บัญชีตรงชื่อ / ยอดเงินพอ) — ถ้าอนุมัติ ระบบส่งคำสั่งโอนเงินไปธนาคาร (payout)",
    origins: [
      "จากคำขอถอนของผู้ใช้ (A-54)",
      "จาก Gold Mgmt (A-47) เห็นยอด Gold รวมระบบ",
    ],
    destinations: [
      "[อนุมัติถอน] → หัก Gold จากผู้ใช้ → ส่งคำสั่งโอนเงินไปธนาคาร (payout) → notification",
      "[ปฏิเสธ — ขอข้อมูลเพิ่ม] → notification ขอหลักฐาน → รอตรวจอีกรอบ",
      "[ปฏิเสธ — ยกเลิกคำขอ] → ยกเลิก → Gold คืนเข้ากระเป๋าผู้ใช้ → notification",
    ],
  },

  // ── Maintain Module — Admin screens ──────────────────────────────────────
  "A-07c": {
    screenCode: "A-07c",
    screenTitle: "ตรวจ settle งานบำรุงยุติกลางคัน (เคส M9)",
    role: "แอดมินตรวจยอดเงิน settle ของงานบำรุงที่ลูกค้ายุติกลางคัน — มี escrow ครึ่งทางต้องตัดสินใจ: อนุมัติตามสัดส่วน / ปรับตัวเลข / ยกระดับข้อพิพาท (Source: Maintain Junction #9)",
    origins: [
      "จากงานบำรุงทั้งหมด (A-06) — แอดมินเห็นงานสถานะ cancelled_inprogress รอ settle",
      "จาก R-14 อัตโนมัติหลังร้านคำนวณ settle",
    ],
    destinations: [
      "[อนุมัติตามที่ร้านเสนอ] → escrow จ่ายร้าน settle ปิดงาน → กลับ A-06",
      "[ปรับยอดขึ้นลง] → admin แก้ settle มือ → จ่ายตามยอดใหม่ → กลับ A-06",
      "[ยกระดับข้อพิพาท (escalate)] → ส่งไปจอข้อพิพาท ร้าน/ลูกค้าส่งหลักฐานเพิ่ม",
    ],
  },

  // ── Scrap Module — Admin screens ─────────────────────────────────────────
  "A-10": {
    screenCode: "A-10",
    screenTitle: "ตัดสินข้อพิพาท Scrap (เคส S11)",
    role: "แอดมินสอบสวนและตัดสินข้อพิพาทซาก — ตัดสินใจว่าจะคืนเงินผู้ร้อง (ผู้รับซากหรือเจ้าของซาก) หรือปล่อยตามสัญญา",
    origins: [
      "จากรายการข้อพิพาท Scrap (A-09) — admin คลิกรายการ",
    ],
    destinations: [
      "[คืนเงินผู้ร้อง] → escrow คืน Gold → ปิดงาน cancelled",
      "[เข้าข้างร้านรับซาก] → escrow จ่าย Gold ไปร้าน → completed",
      "[บันทึกผลตัดสิน] → audit log (A-58) + notification ทั้งสองฝ่าย",
    ],
  },

  // ── Resell Module — Admin screens ────────────────────────────────────────
  "A-14": {
    screenCode: "A-14",
    screenTitle: "ตัดสินข้อพิพาท Resell (เคส R9)",
    role: "แอดมินสอบสวนและตัดสินข้อพิพาทระหว่างผู้ซื้อกับผู้ขาย — อ้างอิง offer = SoT เทียบกับสินค้าจริงที่ผู้ซื้อได้รับ ตัดสินว่าจะคืนเงินผู้ซื้อ หรือปล่อยตามประกาศ",
    origins: [
      "จากรายการข้อพิพาท Resell (A-13) — admin เห็นข้อพิพาทจากผู้ซื้อ (R8) หรือ escalate ของผู้ซื้อ (R6)",
    ],
    destinations: [
      "[คืนเงินผู้ซื้อ] → escrow คืน Gold ไปผู้ซื้อ → ผลไปที่ U-26 + R-22 → cancelled ที่ U-19c",
      "[ปล่อยตามประกาศ] → escrow จ่าย Gold ไปผู้ขาย → completed (U-19c)",
      "[แบ่งชำระ (partial)] → escrow แบ่งตามสัดส่วน → ผลไปทั้งสองฝ่าย (U-26 + R-22)",
    ],
  },

};
