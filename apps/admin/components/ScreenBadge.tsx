"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
// D15 wire: render ผ่าน shared <ScreenIdBadge> จาก @app3r/ui (roleTheme navy Admin)
// — registry (SCREEN_MAP) ด้านล่างเป็น source of truth: pathname → เลข A-xx
// Gen 109 งาน B: ขยาย registry ครอบ route จริงทั้งหมด (apps/admin/app/**/page.tsx)
//   กฎ: หน้าหลัก=เดี่ยว · dynamic [id]/[module]=1 template · variant/state=ฐานเดิม+ตัวอักษร (b/c)
//   A-01..A-20 (+A-08b/A-11b) = เลขเดิม ห้ามเปลี่ยน · ใหม่ไล่จาก A-21
import { usePathname } from "next/navigation";
import { ScreenIdBadge } from "@app3r/ui";

// Admin brand navy — ส่งเป็น roleTheme.primary ให้ badge กลาง (#2C5E8C)
const ADMIN_PRIMARY = "#2C5E8C";

type ScreenInfo = { num: string; code: string };

const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  // ── Core (เลขเดิม A-01) — dashboard จริงอยู่ที่ root "/" (เดิม map ผิดเป็น /dashboard) ──
  { pattern: "/",                        info: { num: "A-01",  code: "DASHBOARD" } },

  // ── Repair (เลขเดิม A-02..A-05) ──────────────────────────────────────────────
  { pattern: "/repair/jobs",                       info: { num: "A-02",  code: "REPAIR-JOBS" } },
  { pattern: "/repair/jobs/[id]",                  info: { num: "A-03",  code: "REPAIR-JOB-DETAIL" } },
  { pattern: "/repair/jobs/[id]/manual-override",  info: { num: "A-03c", code: "REPAIR-JOB-OVERRIDE" } },
  { pattern: "/repair/disputes",                   info: { num: "A-04",  code: "REPAIR-DISPUTES" } },
  { pattern: "/repair/disputes/[id]",              info: { num: "A-05",  code: "REPAIR-C9-INTERVENE" } },
  // Repair ส่วนขยาย (ใหม่)
  { pattern: "/repair/analytics",                  info: { num: "A-21",  code: "REPAIR-ANALYTICS" } },
  { pattern: "/repair/parcel/queue",               info: { num: "A-22",  code: "REPAIR-PARCEL-QUEUE" } },
  { pattern: "/repair/parcel/[id]",                info: { num: "A-22b", code: "REPAIR-PARCEL-DETAIL" } },
  { pattern: "/repair/parcel/disputes",            info: { num: "A-23",  code: "REPAIR-PARCEL-DISPUTES" } },
  { pattern: "/repair/parcel/analytics",           info: { num: "A-24",  code: "REPAIR-PARCEL-ANALYTICS" } },
  { pattern: "/repair/pickup/queue",               info: { num: "A-25",  code: "REPAIR-PICKUP-QUEUE" } },
  { pattern: "/repair/pickup/[id]",                info: { num: "A-25b", code: "REPAIR-PICKUP-DETAIL" } },
  { pattern: "/repair/pickup/dispatch-monitor",    info: { num: "A-26",  code: "REPAIR-PICKUP-DISPATCH" } },
  { pattern: "/repair/pickup/analytics",           info: { num: "A-27",  code: "REPAIR-PICKUP-ANALYTICS" } },
  { pattern: "/repair/walk-in/queue",              info: { num: "A-28",  code: "REPAIR-WALKIN-QUEUE" } },
  { pattern: "/repair/walk-in/[id]",               info: { num: "A-28b", code: "REPAIR-WALKIN-DETAIL" } },
  { pattern: "/repair/walk-in/abandoned",          info: { num: "A-29",  code: "REPAIR-WALKIN-ABANDONED" } },
  { pattern: "/repair/walk-in/analytics",          info: { num: "A-30",  code: "REPAIR-WALKIN-ANALYTICS" } },

  // ── Maintain (เลขเดิม A-06..A-07) ────────────────────────────────────────────
  { pattern: "/maintain/jobs",                            info: { num: "A-06",  code: "MAINTAIN-JOBS" } },
  { pattern: "/maintain/jobs/[id]",                       info: { num: "A-07",  code: "MAINTAIN-JOB-DETAIL" } },
  { pattern: "/maintain/jobs/[id]/mockup/m9-cancelled",   info: { num: "A-07c", code: "MAINTAIN-JOB-M9-CANCELLED" } },
  { pattern: "/maintain/analytics",                       info: { num: "A-31",  code: "MAINTAIN-ANALYTICS" } },
  { pattern: "/maintain/recurring",                       info: { num: "A-32",  code: "MAINTAIN-RECURRING" } },

  // ── Scrap (เลขเดิม A-08..A-11b) ──────────────────────────────────────────────
  { pattern: "/scrap/jobs",                info: { num: "A-08",  code: "SCRAP-JOBS" } },
  { pattern: "/scrap/jobs/[id]",           info: { num: "A-08b", code: "SCRAP-JOB-DETAIL" } },
  { pattern: "/scrap/disputes",            info: { num: "A-09",  code: "SCRAP-DISPUTES" } },
  { pattern: "/scrap/disputes/[id]",       info: { num: "A-10",  code: "SCRAP-S11-RULING" } },
  { pattern: "/scrap/certificates",        info: { num: "A-11",  code: "SCRAP-CERTS" } },
  { pattern: "/scrap/certificates/[id]",   info: { num: "A-11b", code: "SCRAP-CERT-DETAIL" } },
  { pattern: "/scrap/listings",            info: { num: "A-33",  code: "SCRAP-LISTINGS" } },
  { pattern: "/scrap/listings/[id]",       info: { num: "A-33b", code: "SCRAP-LISTING-DETAIL" } },

  // ── Resell (เลขเดิม A-12..A-14) ──────────────────────────────────────────────
  { pattern: "/resell/listings",           info: { num: "A-12",  code: "RESELL-LISTINGS" } },
  { pattern: "/resell/listings/[id]",      info: { num: "A-12b", code: "RESELL-LISTING-DETAIL" } },
  { pattern: "/resell/disputes",           info: { num: "A-13",  code: "RESELL-DISPUTES" } },
  { pattern: "/resell/disputes/[id]",      info: { num: "A-14",  code: "RESELL-DISPUTE-RULING" } },
  { pattern: "/resell/offers",             info: { num: "A-34",  code: "RESELL-OFFERS" } },
  { pattern: "/resell/jobs",               info: { num: "A-35",  code: "RESELL-JOBS" } },
  { pattern: "/resell/jobs/[id]",          info: { num: "A-35b", code: "RESELL-JOB-DETAIL" } },
  { pattern: "/resell/fees",               info: { num: "A-36",  code: "RESELL-FEES" } },
  { pattern: "/resell/lifecycle",          info: { num: "A-37",  code: "RESELL-LIFECYCLE" } },
  { pattern: "/resell/analytics",          info: { num: "A-38",  code: "RESELL-ANALYTICS" } },

  // ── Parts (เลขเดิม A-15..A-16) ───────────────────────────────────────────────
  { pattern: "/parts/orders",              info: { num: "A-15",  code: "PARTS-ORDERS" } },
  { pattern: "/parts/orders/[id]",         info: { num: "A-16",  code: "PARTS-ORDER-DETAIL" } },
  { pattern: "/parts",                     info: { num: "A-39",  code: "PARTS-CATALOG" } },
  { pattern: "/parts/[id]",                info: { num: "A-39b", code: "PARTS-DETAIL" } },
  { pattern: "/parts/analytics",           info: { num: "A-40",  code: "PARTS-ANALYTICS" } },
  { pattern: "/parts/movements",           info: { num: "A-41",  code: "PARTS-MOVEMENTS" } },
  { pattern: "/parts/movements/[id]",      info: { num: "A-41b", code: "PARTS-MOVEMENT-DETAIL" } },

  // ── Parts disputes (เลขเดิม A-17..A-18 — top-level /disputes) ─────────────────
  { pattern: "/disputes",                  info: { num: "A-17",  code: "PARTS-DISPUTES" } },
  { pattern: "/disputes/[id]",             info: { num: "A-18",  code: "PARTS-P7-DISPUTE" } },

  // ── KYC (เลขเดิม A-19..A-20) ─────────────────────────────────────────────────
  { pattern: "/kyc",                       info: { num: "A-19",  code: "KYC-LIST" } },
  { pattern: "/kyc/[id]",                  info: { num: "A-20",  code: "KYC-DETAIL" } },

  // ── Users (ใหม่) ─────────────────────────────────────────────────────────────
  { pattern: "/users",                     info: { num: "A-42",  code: "USERS" } },
  { pattern: "/users/weeer/[id]/kyc",      info: { num: "A-43",  code: "USER-WEEER-KYC" } },

  // ── Points / Platform / Transfers (ใหม่) ─────────────────────────────────────
  { pattern: "/points",                    info: { num: "A-44",  code: "POINTS" } },
  { pattern: "/points/manual-adjust",      info: { num: "A-45",  code: "POINTS-MANUAL-ADJUST" } },
  { pattern: "/platform/balances",         info: { num: "A-46",  code: "PLATFORM-BALANCES" } },
  { pattern: "/platform/gold-management",  info: { num: "A-47",  code: "PLATFORM-GOLD-MGMT" } },
  { pattern: "/platform/reconciliation",   info: { num: "A-48",  code: "PLATFORM-RECON" } },
  { pattern: "/platform/silver",           info: { num: "A-49",  code: "PLATFORM-SILVER" } },
  { pattern: "/platform/transactions",     info: { num: "A-50",  code: "PLATFORM-TRANSACTIONS" } },
  { pattern: "/topup",                     info: { num: "A-51",  code: "TOPUP" } },
  { pattern: "/withdrawal",                info: { num: "A-52",  code: "WITHDRAWAL" } },
  { pattern: "/transfers/deposits",        info: { num: "A-53",  code: "TRANSFERS-DEPOSITS" } },
  { pattern: "/transfers/withdrawals",     info: { num: "A-54",  code: "TRANSFERS-WITHDRAWALS" } },
  { pattern: "/reconciliation",            info: { num: "A-55",  code: "RECONCILIATION" } },

  // ── Config / System / Reference / Catalog (ใหม่) ─────────────────────────────
  { pattern: "/config",                    info: { num: "A-56",  code: "CONFIG" } },
  { pattern: "/reference",                 info: { num: "A-57",  code: "REFERENCE-DATA" } },
  { pattern: "/audit",                     info: { num: "A-58",  code: "AUDIT-LOG" } },
  { pattern: "/system/storage",            info: { num: "A-59",  code: "SYSTEM-STORAGE" } },
  { pattern: "/pricing",                   info: { num: "A-60",  code: "PRICING" } },
  { pattern: "/services",                  info: { num: "A-61",  code: "SERVICES" } },
  { pattern: "/promotions",                info: { num: "A-62",  code: "PROMOTIONS" } },
  { pattern: "/products",                  info: { num: "A-63",  code: "PRODUCTS" } },

  // ── CMS / Content / Contact / Testimonials / Ads (ใหม่) ──────────────────────
  { pattern: "/content",                   info: { num: "A-64",  code: "CONTENT" } },
  { pattern: "/content/new",               info: { num: "A-64c", code: "CONTENT-NEW" } },
  { pattern: "/content/[id]",              info: { num: "A-64b", code: "CONTENT-EDIT" } },
  { pattern: "/articles",                  info: { num: "A-65",  code: "ARTICLES" } },
  { pattern: "/contact",                   info: { num: "A-66",  code: "CONTACT-INBOX" } },
  { pattern: "/contact/[id]",              info: { num: "A-66b", code: "CONTACT-MESSAGE" } },
  { pattern: "/contact/info",              info: { num: "A-67",  code: "CONTACT-INFO" } },
  { pattern: "/testimonials",              info: { num: "A-68",  code: "TESTIMONIALS" } },
  { pattern: "/testimonials/new",          info: { num: "A-68c", code: "TESTIMONIAL-NEW" } },
  { pattern: "/testimonials/[id]",         info: { num: "A-68b", code: "TESTIMONIAL-EDIT" } },
  { pattern: "/ads",                       info: { num: "A-69",  code: "ADS" } },
  { pattern: "/notifications/download",    info: { num: "A-70",  code: "NOTIFY-DOWNLOAD" } },

  // ── อื่นๆ (ใหม่) ─────────────────────────────────────────────────────────────
  { pattern: "/listings",                  info: { num: "A-71",  code: "LISTINGS-INDEX" } },
  { pattern: "/modules/[module]",          info: { num: "A-72",  code: "MODULE-TEMPLATE" } },
  { pattern: "/login",                     info: { num: "A-73",  code: "LOGIN" } },
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
  return (
    <ScreenIdBadge
      screenId={info.num}
      roleTheme={{ primary: ADMIN_PRIMARY }}
      position="top-left"
    />
  );
}
