"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
// D15 wire: render ผ่าน shared <ScreenIdBadge> จาก @app3r/ui (roleTheme navy Admin)
// — registry (SCREEN_MAP) ด้านล่างเป็น source of truth: pathname → เลข A-xx
// Gen 109 งาน B: ขยาย registry ครอบ route จริงทั้งหมด (apps/admin/app/**/page.tsx)
//   กฎ: หน้าหลัก=เดี่ยว · dynamic [id]/[module]=1 template · variant/state=ฐานเดิม+ตัวอักษร (b/c)
//   A-01..A-20 (+A-08b/A-11b) = เลขเดิม ห้ามเปลี่ยน · ใหม่ไล่จาก A-21
// RC6 (CMD #115-V): เพิ่ม label ไทย (th) อธิบายคำย่อ A-xx + แสดงพิลล์ไทยใต้ badge เลข
import { usePathname } from "next/navigation";
import { ScreenIdBadge } from "@app3r/ui";

// Admin brand navy — ส่งเป็น roleTheme.primary ให้ badge กลาง (#2C5E8C)
const ADMIN_PRIMARY = "#2C5E8C";

type ScreenInfo = { num: string; code: string; th: string };

const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  // ── Core ──
  { pattern: "/",                        info: { num: "A-01",  code: "DASHBOARD", th: "แดชบอร์ดภาพรวม" } },

  // ── Repair ──
  { pattern: "/repair/jobs",                       info: { num: "A-02",  code: "REPAIR-JOBS", th: "รายการงานซ่อม" } },
  { pattern: "/repair/jobs/[id]",                  info: { num: "A-03",  code: "REPAIR-JOB-DETAIL", th: "รายละเอียดงานซ่อม" } },
  { pattern: "/repair/jobs/[id]/manual-override",  info: { num: "A-03c", code: "REPAIR-JOB-OVERRIDE", th: "แทรกแซงงานซ่อม (Super Admin)" } },
  { pattern: "/repair/disputes",                   info: { num: "A-04",  code: "REPAIR-DISPUTES", th: "ข้อพิพาทงานซ่อม" } },
  { pattern: "/repair/disputes/[id]",              info: { num: "A-05",  code: "REPAIR-C9-INTERVENE", th: "ตัดสินข้อพิพาทซ่อม (C9)" } },
  { pattern: "/repair/analytics",                  info: { num: "A-21",  code: "REPAIR-ANALYTICS", th: "สถิติการซ่อมหน้าร้าน" } },
  { pattern: "/repair/parcel/queue",               info: { num: "A-22",  code: "REPAIR-PARCEL-QUEUE", th: "คิวงานซ่อมส่งพัสดุ" } },
  { pattern: "/repair/parcel/[id]",                info: { num: "A-22b", code: "REPAIR-PARCEL-DETAIL", th: "รายละเอียดงานพัสดุ" } },
  { pattern: "/repair/parcel/disputes",            info: { num: "A-23",  code: "REPAIR-PARCEL-DISPUTES", th: "ข้อพิพาทพัสดุ" } },
  { pattern: "/repair/parcel/analytics",           info: { num: "A-24",  code: "REPAIR-PARCEL-ANALYTICS", th: "สถิติงานพัสดุ" } },
  { pattern: "/repair/pickup/queue",               info: { num: "A-25",  code: "REPAIR-PICKUP-QUEUE", th: "คิวงานรับ-ส่งถึงบ้าน" } },
  { pattern: "/repair/pickup/[id]",                info: { num: "A-25b", code: "REPAIR-PICKUP-DETAIL", th: "รายละเอียดงานรับ-ส่ง" } },
  { pattern: "/repair/pickup/dispatch-monitor",    info: { num: "A-26",  code: "REPAIR-PICKUP-DISPATCH", th: "ติดตามขนส่งเรียลไทม์" } },
  { pattern: "/repair/pickup/analytics",           info: { num: "A-27",  code: "REPAIR-PICKUP-ANALYTICS", th: "สถิติงานรับ-ส่ง" } },
  { pattern: "/repair/walk-in/queue",              info: { num: "A-28",  code: "REPAIR-WALKIN-QUEUE", th: "คิวงานซ่อมหน้าร้าน" } },
  { pattern: "/repair/walk-in/[id]",               info: { num: "A-28b", code: "REPAIR-WALKIN-DETAIL", th: "รายละเอียดงานหน้าร้าน" } },
  { pattern: "/repair/walk-in/abandoned",          info: { num: "A-29",  code: "REPAIR-WALKIN-ABANDONED", th: "เครื่องตกค้างหน้าร้าน" } },
  { pattern: "/repair/walk-in/analytics",          info: { num: "A-30",  code: "REPAIR-WALKIN-ANALYTICS", th: "สถิติงานหน้าร้าน" } },

  // ── Maintain ──
  { pattern: "/maintain/jobs",                            info: { num: "A-06",  code: "MAINTAIN-JOBS", th: "รายการงานบำรุงรักษา" } },
  { pattern: "/maintain/jobs/[id]",                       info: { num: "A-07",  code: "MAINTAIN-JOB-DETAIL", th: "รายละเอียดงานบำรุงรักษา" } },
  { pattern: "/maintain/jobs/[id]/mockup/m9-cancelled",   info: { num: "A-07c", code: "MAINTAIN-JOB-M9-CANCELLED", th: "งานบำรุงรักษาที่ยกเลิก (M9)" } },
  { pattern: "/maintain/analytics",                       info: { num: "A-31",  code: "MAINTAIN-ANALYTICS", th: "สถิติงานบำรุงรักษา" } },
  { pattern: "/maintain/recurring",                       info: { num: "A-32",  code: "MAINTAIN-RECURRING", th: "งานบำรุงรักษาประจำ" } },

  // ── Scrap ──
  { pattern: "/scrap/jobs",                info: { num: "A-08",  code: "SCRAP-JOBS", th: "งานรับซาก" } },
  { pattern: "/scrap/jobs/[id]",           info: { num: "A-08b", code: "SCRAP-JOB-DETAIL", th: "รายละเอียดงานรับซาก" } },
  { pattern: "/scrap/disputes",            info: { num: "A-09",  code: "SCRAP-DISPUTES", th: "ข้อพิพาทการรับซาก" } },
  { pattern: "/scrap/disputes/[id]",       info: { num: "A-10",  code: "SCRAP-S11-RULING", th: "ตัดสินข้อพิพาทซาก (S11)" } },
  { pattern: "/scrap/certificates",        info: { num: "A-11",  code: "SCRAP-CERTS", th: "ใบรับรอง E-Waste" } },
  { pattern: "/scrap/certificates/[id]",   info: { num: "A-11b", code: "SCRAP-CERT-DETAIL", th: "รายละเอียดใบรับรอง" } },
  { pattern: "/scrap/listings",            info: { num: "A-33",  code: "SCRAP-LISTINGS", th: "รายการประกาศซาก" } },
  { pattern: "/scrap/listings/[id]",       info: { num: "A-33b", code: "SCRAP-LISTING-DETAIL", th: "รายละเอียดประกาศซาก" } },

  // ── Resell ──
  { pattern: "/resell/listings",           info: { num: "A-12",  code: "RESELL-LISTINGS", th: "ประกาศขายต่อ" } },
  { pattern: "/resell/listings/[id]",      info: { num: "A-12b", code: "RESELL-LISTING-DETAIL", th: "รายละเอียดประกาศขายต่อ" } },
  { pattern: "/resell/disputes",           info: { num: "A-13",  code: "RESELL-DISPUTES", th: "ข้อพิพาทการขายต่อ" } },
  { pattern: "/resell/disputes/[id]",      info: { num: "A-14",  code: "RESELL-DISPUTE-RULING", th: "ตัดสินข้อพิพาทขายต่อ" } },
  { pattern: "/resell/offers",             info: { num: "A-34",  code: "RESELL-OFFERS", th: "ข้อเสนอซื้อ" } },
  { pattern: "/resell/jobs",               info: { num: "A-35",  code: "RESELL-JOBS", th: "งานขายต่อ" } },
  { pattern: "/resell/jobs/[id]",          info: { num: "A-35b", code: "RESELL-JOB-DETAIL", th: "รายละเอียดงานขายต่อ" } },
  { pattern: "/resell/fees",               info: { num: "A-36",  code: "RESELL-FEES", th: "ค่าธรรมเนียมขายต่อ" } },
  { pattern: "/resell/lifecycle",          info: { num: "A-37",  code: "RESELL-LIFECYCLE", th: "วงจรชีวิตประกาศขายต่อ" } },
  { pattern: "/resell/analytics",          info: { num: "A-38",  code: "RESELL-ANALYTICS", th: "สถิติการขายต่อ" } },

  // ── Parts ──
  { pattern: "/parts/orders",              info: { num: "A-15",  code: "PARTS-ORDERS", th: "คำสั่งซื้ออะไหล่" } },
  { pattern: "/parts/orders/[id]",         info: { num: "A-16",  code: "PARTS-ORDER-DETAIL", th: "รายละเอียดคำสั่งซื้ออะไหล่" } },
  { pattern: "/parts",                     info: { num: "A-39",  code: "PARTS-CATALOG", th: "คลังอะไหล่" } },
  { pattern: "/parts/[id]",                info: { num: "A-39b", code: "PARTS-DETAIL", th: "รายละเอียดอะไหล่" } },
  { pattern: "/parts/analytics",           info: { num: "A-40",  code: "PARTS-ANALYTICS", th: "สถิติการใช้อะไหล่" } },
  { pattern: "/parts/movements",           info: { num: "A-41",  code: "PARTS-MOVEMENTS", th: "ความเคลื่อนไหวอะไหล่" } },
  { pattern: "/parts/movements/[id]",      info: { num: "A-41b", code: "PARTS-MOVEMENT-DETAIL", th: "รายละเอียดความเคลื่อนไหว" } },

  // ── Parts disputes (top-level /disputes) ──
  { pattern: "/disputes",                  info: { num: "A-17",  code: "PARTS-DISPUTES", th: "ข้อพิพาทอะไหล่" } },
  { pattern: "/disputes/[id]",             info: { num: "A-18",  code: "PARTS-P7-DISPUTE", th: "ตัดสินข้อพิพาทอะไหล่ (P7)" } },

  // ── KYC ──
  { pattern: "/kyc",                       info: { num: "A-19",  code: "KYC-LIST", th: "ตรวจ KYC (รายการ)" } },
  { pattern: "/kyc/[id]",                  info: { num: "A-20",  code: "KYC-DETAIL", th: "รายละเอียด KYC" } },

  // ── Users ──
  { pattern: "/users",                     info: { num: "A-42",  code: "USERS", th: "จัดการผู้ใช้งาน" } },
  { pattern: "/users/weeer/[id]/kyc",      info: { num: "A-43",  code: "USER-WEEER-KYC", th: "KYC ของ WeeeR" } },

  // ── Points / Platform / Transfers ──
  { pattern: "/points",                    info: { num: "A-44",  code: "POINTS", th: "บัญชี Point (Ledger)" } },
  { pattern: "/points/manual-adjust",      info: { num: "A-45",  code: "POINTS-MANUAL-ADJUST", th: "ปรับยอด Point ด้วยมือ" } },
  { pattern: "/platform/balances",         info: { num: "A-46",  code: "PLATFORM-BALANCES", th: "ยอดคงเหลือแพลตฟอร์ม" } },
  { pattern: "/platform/gold-management",  info: { num: "A-47",  code: "PLATFORM-GOLD-MGMT", th: "จัดการ Gold Point" } },
  { pattern: "/platform/reconciliation",   info: { num: "A-48",  code: "PLATFORM-RECON", th: "กระทบยอด Point ทอง" } },
  { pattern: "/platform/silver",           info: { num: "A-49",  code: "PLATFORM-SILVER", th: "จัดการ Silver Point" } },
  { pattern: "/platform/transactions",     info: { num: "A-50",  code: "PLATFORM-TRANSACTIONS", th: "บันทึกตรวจสอบธุรกรรม" } },
  { pattern: "/topup",                     info: { num: "A-51",  code: "TOPUP", th: "อนุมัติเติม Point" } },
  { pattern: "/withdrawal",                info: { num: "A-52",  code: "WITHDRAWAL", th: "อนุมัติถอนเงิน" } },
  { pattern: "/transfers/deposits",        info: { num: "A-53",  code: "TRANSFERS-DEPOSITS", th: "ตรวจสลิปโอนเงิน" } },
  { pattern: "/transfers/withdrawals",     info: { num: "A-54",  code: "TRANSFERS-WITHDRAWALS", th: "คำขอถอนเงิน" } },
  { pattern: "/reconciliation",            info: { num: "A-55",  code: "RECONCILIATION", th: "กระทบยอด Settlement" } },

  // ── Config / System / Reference / Catalog ──
  { pattern: "/config",                    info: { num: "A-56",  code: "CONFIG", th: "ตั้งค่าระบบ" } },
  { pattern: "/reference",                 info: { num: "A-57",  code: "REFERENCE-DATA", th: "ข้อมูลอ้างอิง" } },
  { pattern: "/audit",                     info: { num: "A-58",  code: "AUDIT-LOG", th: "บันทึกระบบ (Audit Log)" } },
  { pattern: "/system/storage",            info: { num: "A-59",  code: "SYSTEM-STORAGE", th: "พื้นที่จัดเก็บไฟล์" } },
  { pattern: "/pricing",                   info: { num: "A-60",  code: "PRICING", th: "ราคารับซื้อซาก" } },
  { pattern: "/services",                  info: { num: "A-61",  code: "SERVICES", th: "งานบริการรวม" } },
  { pattern: "/promotions",                info: { num: "A-62",  code: "PROMOTIONS", th: "โปรโมชัน/โบนัสสมัคร" } },
  { pattern: "/products",                  info: { num: "A-63",  code: "PRODUCTS", th: "จัดการสินค้า" } },

  // ── CMS / Content / Contact / Testimonials / Ads ──
  { pattern: "/content",                   info: { num: "A-64",  code: "CONTENT", th: "จัดการเนื้อหาเว็บไซต์" } },
  { pattern: "/content/new",               info: { num: "A-64c", code: "CONTENT-NEW", th: "เพิ่มเนื้อหาใหม่" } },
  { pattern: "/content/[id]",              info: { num: "A-64b", code: "CONTENT-EDIT", th: "แก้ไขเนื้อหา" } },
  { pattern: "/articles",                  info: { num: "A-65",  code: "ARTICLES", th: "บทความ (AI Assist)" } },
  { pattern: "/contact",                   info: { num: "A-66",  code: "CONTACT-INBOX", th: "กล่องข้อความติดต่อ" } },
  { pattern: "/contact/[id]",              info: { num: "A-66b", code: "CONTACT-MESSAGE", th: "รายละเอียดข้อความ" } },
  { pattern: "/contact/info",              info: { num: "A-67",  code: "CONTACT-INFO", th: "ตั้งค่าข้อมูลติดต่อ" } },
  { pattern: "/testimonials",              info: { num: "A-68",  code: "TESTIMONIALS", th: "รีวิวลูกค้า" } },
  { pattern: "/testimonials/new",          info: { num: "A-68c", code: "TESTIMONIAL-NEW", th: "เพิ่มรีวิวลูกค้า" } },
  { pattern: "/testimonials/[id]",         info: { num: "A-68b", code: "TESTIMONIAL-EDIT", th: "แก้ไขรีวิวลูกค้า" } },
  { pattern: "/ads",                       info: { num: "A-69",  code: "ADS", th: "จัดการโฆษณา" } },
  { pattern: "/notifications/download",    info: { num: "A-70",  code: "NOTIFY-DOWNLOAD", th: "แจ้งเตือนดาวน์โหลดแอป" } },

  // ── อื่นๆ ──
  { pattern: "/listings",                  info: { num: "A-71",  code: "LISTINGS-INDEX", th: "ประกาศขายรวม" } },
  { pattern: "/modules/[module]",          info: { num: "A-72",  code: "MODULE-TEMPLATE", th: "จัดการโมดูลบริการ" } },
  { pattern: "/login",                     info: { num: "A-73",  code: "LOGIN", th: "เข้าสู่ระบบ" } },
];

function matchScreen(pathname: string): ScreenInfo | null {
  const sorted = [...SCREEN_MAP].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const { pattern, info } of sorted) {
    const regexStr =
      "^" +
      pattern
        // รองรับ dynamic segment ทุกแบบ ([id], [module], ฯลฯ) ไม่ใช่แค่ [id]
        .replace(/\[[^\]]+\]/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$";
    if (new RegExp(regexStr).test(pathname)) return info;
  }
  return null;
}

export function ScreenBadge() {
  const pathname = usePathname();
  // dev-gate align ข้ามแอป: รับทั้ง "true" และ "1" (เหมือน app3r/website) — กัน badge ไม่ขึ้นเมื่อ อ.PP ตั้ง DEV_NAV=1
  const flag = process.env.NEXT_PUBLIC_DEV_NAV;
  if (flag !== "true" && flag !== "1") return null;
  const info = matchScreen(pathname);
  if (!info) return null;

  // shared commons — มุมจอ (top-left) · roleTheme navy Admin
  // RC6: เพิ่มพิลล์ label ไทยใต้ badge เลข เพื่ออธิบายว่าแต่ละหน้าทำอะไร (อธิบายคำย่อ A-xx)
  return (
    <>
      <ScreenIdBadge
        screenId={info.num}
        roleTheme={{ primary: ADMIN_PRIMARY }}
        position="top-left"
      />
      <span
        className="fixed z-50 pointer-events-none select-none rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none text-white opacity-70 shadow-sm"
        style={{ backgroundColor: ADMIN_PRIMARY, top: "1.65rem", left: "0.5rem" }}
        aria-hidden
        data-screen-th={info.th}
      >
        {info.th}
      </span>
    </>
  );
}
