// TODO: REMOVE BEFORE PROD — dev-only junction popup data (TD-07)
// Source: 🌳 Screen Linkage Tree Junction v2 · Advisor Gen 115 · 2026-06-08
// Website module: 6 decision screens (W-01, W-06, W-08/W-10, W-12/W-14, W-18, W-19)

export interface JunctionEntry {
  screenCode: string;
  screenTitle: string;
  role: string;           // 📋 หน้าที่
  origins: string[];      // ◀ มาจาก
  destinations: string[]; // ▶ ไปต่อ
}

// Website app screen → route mapping (used by matchScreenId)
const ROUTE_MAP: Record<string, string> = {
  "W-01":  "/",
  "W-02":  "/about",
  "W-03":  "/contact",
  "W-04":  "/download",
  "W-05":  "/faq",
  "W-06":  "/listings",
  "W-07":  "/listings/repair",
  "W-08":  "/listings/repair/[id]",
  "W-09":  "/listings/maintain",
  "W-10":  "/listings/maintain/[id]",
  "W-11":  "/listings/resell",
  "W-12b": "/listings/resell/[id]/suspended",
  "W-12":  "/listings/resell/[id]",
  "W-13":  "/listings/scrap",
  "W-14":  "/listings/scrap/[id]",
  "W-15":  "/articles",
  "W-16":  "/articles/[id]",
  "W-17":  "/products",
  "W-18":  "/register/weeer",
  "W-19":  "/preview/[token]",
  "W-20":  "/[id]",
  "W-21":  "/products/[id]",
  "W-22":  "/listings/[id]",
  "W-23":  "/owners/[id]",
  "W-24":  "/legal/[slug]",
};

/** Match pathname → Website screen ID (longest-match first, static before dynamic) */
export function matchScreenId(pathname: string): string | null {
  const sorted = Object.entries(ROUTE_MAP).sort((a, b) => {
    const aDyn = a[1].includes("[");
    const bDyn = b[1].includes("[");
    if (aDyn !== bDyn) return aDyn ? 1 : -1;
    return b[1].length - a[1].length;
  });
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

  // ── W-01 Home ──────────────────────────────────────────────────────────────
  "W-01": {
    screenCode: "W-01",
    screenTitle: "จอประตูสู่ระบบ App3R (Home)",
    role: "หน้าแรกของ Website — แสดง value proposition + 4 ตลาด (ซ่อม/บำรุง/มือสอง/ซาก) + CTA สมัคร WeeeR และดาวน์โหลด WeeeU — เป็นจุดเริ่มต้นของทุก flow ผู้ใช้ใหม่",
    origins: [
      "เปิด URL โดยตรง / กด logo ใน Navbar",
      "จากหน้าอื่นๆ ใน Website — กดปุ่ม 'กลับหน้าหลัก'",
      "Redirect หลัง logout หรือ session หมดอายุ",
    ],
    destinations: [
      "[สมัคร WeeeR] → W-18 /register/weeer (CTA หลักในหน้าแรก)",
      "[ดาวน์โหลด WeeeU] → W-04 /download",
      "[ดูตลาด] → W-06 /listings (ดูประกาศทั้งหมด)",
      "[ซ่อม] → W-07 /listings/repair",
      "[บำรุง] → W-09 /listings/maintain",
      "[ขายมือสอง] → W-11 /listings/resell",
      "[ซาก] → W-13 /listings/scrap",
    ],
  },

  // ── W-06 Listings Hub ──────────────────────────────────────────────────────
  "W-06": {
    screenCode: "W-06",
    screenTitle: "จอ 4 ตลาด (Listings Hub)",
    role: "หน้ารวมประกาศทุกประเภท — กรองได้ด้วยประเภท/จังหวัด/ราคา — เป็น junction ที่แยกผู้ใช้ไปยังตลาดที่ต้องการ",
    origins: [
      "จาก W-01 Home — กด Navbar 'ประกาศ' หรือ hero CTA",
      "เข้าโดยตรง /listings",
    ],
    destinations: [
      "[ซ่อม] → W-07 /listings/repair (กด tab ซ่อม)",
      "[บำรุง] → W-09 /listings/maintain (กด tab บำรุง)",
      "[ขายมือสอง] → W-11 /listings/resell (กด tab มือสอง)",
      "[ซาก] → W-13 /listings/scrap (กด tab ซาก)",
    ],
  },

  // ── W-08/W-10 Repair / Maintain Detail ────────────────────────────────────
  "W-08": {
    screenCode: "W-08/W-10",
    screenTitle: "รายละเอียดงานซ่อม/บำรุง (D71-limited)",
    role: "รายละเอียดงานซ่อมหรือบำรุงรักษาสำหรับ buyer (WeeeU) — แสดงข้อมูลจำกัดตาม D71 (ซ่อนรายละเอียดเต็มไว้สำหรับ WeeeR) — ปุ่ม CTA พาไปยื่นข้อเสนอหรือสมัคร WeeeR",
    origins: [
      "จาก W-07/W-09 รายการซ่อม/บำรุง — คลิก card งาน",
      "เข้าโดยตรงจาก share link หรือ cross-app link",
    ],
    destinations: [
      "[WeeeR ยื่นข้อเสนอ] → localhost:3001/repair/offers/new (cross-app WeeeR)",
      "[WeeeU จองบริการ] → localhost:3002/repair/new (cross-app WeeeU)",
      "[ไม่มีบัญชี] → W-18 /register/weeer (CTA สมัคร WeeeR)",
      "[กลับรายการ] → W-07 /listings/repair หรือ W-09 /listings/maintain",
    ],
  },

  "W-10": {
    screenCode: "W-08/W-10",
    screenTitle: "รายละเอียดงานซ่อม/บำรุง (D71-limited)",
    role: "รายละเอียดงานซ่อมหรือบำรุงรักษาสำหรับ buyer (WeeeU) — แสดงข้อมูลจำกัดตาม D71 (ซ่อนรายละเอียดเต็มไว้สำหรับ WeeeR) — ปุ่ม CTA พาไปยื่นข้อเสนอหรือสมัคร WeeeR",
    origins: [
      "จาก W-07/W-09 รายการซ่อม/บำรุง — คลิก card งาน",
      "เข้าโดยตรงจาก share link หรือ cross-app link",
    ],
    destinations: [
      "[WeeeR ยื่นข้อเสนอ] → localhost:3001/maintain/offers/new (cross-app WeeeR)",
      "[WeeeU จองบริการ] → localhost:3002/maintain/new (cross-app WeeeU)",
      "[ไม่มีบัญชี] → W-18 /register/weeer (CTA สมัคร WeeeR)",
      "[กลับรายการ] → W-07 /listings/repair หรือ W-09 /listings/maintain",
    ],
  },

  // ── W-12/W-14 Resell / Scrap Detail ───────────────────────────────────────
  "W-12": {
    screenCode: "W-12/W-14",
    screenTitle: "รายละเอียดสินค้ามือสอง/ซาก (D71-full)",
    role: "รายละเอียดประกาศขายมือสองหรือซาก — แสดงข้อมูลเต็มตาม D71 (รูป/คำอธิบาย/ราคา/ผู้ขาย) — ปุ่ม CTA พา WeeeU ซื้อหรือ WeeeR ยื่นข้อเสนอ — Escrow คุ้มครองทุกธุรกรรม",
    origins: [
      "จาก W-11/W-13 รายการมือสอง/ซาก — คลิก card",
      "เข้าโดยตรงจาก share link / ads (W-22 listing UUID entry)",
      "จาก cross-app WeeeU/WeeeR link",
    ],
    destinations: [
      "[WeeeU สนใจสินค้า] → localhost:3002/listings/{id} (cross-app WeeeU ซื้อ)",
      "[WeeeR ยื่นข้อเสนอซื้อ] → localhost:3001/buy-offers/new (cross-app WeeeR)",
      "[ดูประวัติผู้ขาย] → W-23 /owners/{id} (ดูความน่าเชื่อถือ)",
      "[listing ถูก suspend] → W-12b /listings/resell/{id}/suspended",
      "[กลับรายการ] → W-11 /listings/resell หรือ W-13 /listings/scrap",
    ],
  },

  "W-14": {
    screenCode: "W-12/W-14",
    screenTitle: "รายละเอียดสินค้ามือสอง/ซาก (D71-full)",
    role: "รายละเอียดประกาศขายมือสองหรือซาก — แสดงข้อมูลเต็มตาม D71 (รูป/คำอธิบาย/ราคา/ผู้ขาย) — ปุ่ม CTA พา WeeeU ซื้อหรือ WeeeR ยื่นข้อเสนอ — Escrow คุ้มครองทุกธุรกรรม",
    origins: [
      "จาก W-11/W-13 รายการมือสอง/ซาก — คลิก card",
      "เข้าโดยตรงจาก share link / ads (W-22 listing UUID entry)",
      "จาก cross-app WeeeU/WeeeR link",
    ],
    destinations: [
      "[WeeeU สนใจสินค้า] → localhost:3002/listings/{id} (cross-app WeeeU ซื้อ)",
      "[WeeeR ยื่นข้อเสนอซื้อ] → localhost:3001/buy-offers/new (cross-app WeeeR)",
      "[ดูประวัติผู้ขาย] → W-23 /owners/{id} (ดูความน่าเชื่อถือ)",
      "[กลับรายการ] → W-11 /listings/resell หรือ W-13 /listings/scrap",
    ],
  },

  // ── W-18 Register WeeeR ────────────────────────────────────────────────────
  "W-18": {
    screenCode: "W-18",
    screenTitle: "สมัคร WeeeR (Register)",
    role: "หน้าสมัครสมาชิก WeeeR — ค่าเริ่มต้น redirect ไป WeeeR app (localhost:3001/register) — มี fallback 4-step form เมื่อ WeeeR app ไม่พร้อม — ผู้สมัครต้องไม่เป็น WeeeU/WeeeR/WeeeT อยู่แล้ว",
    origins: [
      "จาก W-01 Home — CTA 'สมัครเป็นร้าน WeeeR'",
      "จาก W-04 /download — ลิงก์สมัคร WeeeR",
      "จาก W-08/W-10/W-12/W-14 detail pages — ปุ่มสมัครสำหรับ anonymous",
      "เข้าโดยตรง /register/weeer",
    ],
    destinations: [
      "[Primary CTA] → localhost:3001/register (WeeeR app form สมัครเต็ม)",
      "[Fallback form ส่งใบสมัคร] → หน้า submitted ใน W-18 เอง (รอ 3-5 วัน)",
      "[เข้าสู่ระบบ WeeeR] → localhost:3001/login",
      "[กลับหน้าแรก] → W-01 /",
    ],
  },

  // ── W-19 Preview Token ─────────────────────────────────────────────────────
  "W-19": {
    screenCode: "W-19",
    screenTitle: "พรีวิว token (Preview Listing)",
    role: "หน้า preview ประกาศก่อน publish — ใช้ token ชั่วคราวจาก WeeeU draft — แสดง listing preview แบบ read-only — WeeeR เห็นแบบ draft เพื่อตัดสินใจยื่นข้อเสนอล่วงหน้า",
    origins: [
      "จาก WeeeU draft editor — กด 'Preview' สร้าง token",
      "จาก share link ที่ WeeeU ส่งให้ WeeeR ตรวจสอบ",
    ],
    destinations: [
      "[token ยังใช้ได้] → localhost:3002/listings/draft/{id} (WeeeU แก้ไข/publish ต่อ)",
      "[WeeeR ดูเสร็จ] → localhost:3001/repair/offers (กลับดูงานใหม่ที่ WeeeR)",
      "[token หมดอายุ] → แสดง expired message ใน W-19 เอง + link กลับ W-01",
    ],
  },
};
