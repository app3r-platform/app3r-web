"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
// D15 wire: render ผ่าน shared <ScreenIdBadge> จาก @app3r/ui (roleTheme เขียว WeeeU)
// — registry (SCREEN_MAP) ด้านล่างเป็น source of truth: pathname → เลข U-xx
import { usePathname } from "next/navigation";
import { ScreenIdBadge } from "@app3r/ui";

// WeeeU brand green — ส่งเป็น roleTheme.primary ให้ badge กลาง (#0DC36C)
const WEEEU_PRIMARY = "#0DC36C";

type ScreenInfo = { num: string; code: string };

// Route pattern → Screen ID mapping (sorted longest-first in matchScreen)
const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  { pattern: "/dashboard",                       info: { num: "U-01", code: "DASHBOARD" } },
  { pattern: "/repair/new",                      info: { num: "U-03", code: "REPAIR-CREATE" } },
  { pattern: "/repair/[id]/offers",              info: { num: "U-05", code: "REPAIR-OFFERS" } },
  { pattern: "/repair/[id]/progress",            info: { num: "U-06", code: "REPAIR-PROGRESS" } },
  { pattern: "/repair/[id]/scrap-offer",         info: { num: "U-07", code: "REPAIR-C4-SCRAP" } },
  { pattern: "/repair/[id]/fee-settle",          info: { num: "U-08", code: "REPAIR-C5-FEE" } },
  { pattern: "/repair/[id]/review",              info: { num: "U-09", code: "REPAIR-REVIEW" } },
  { pattern: "/repair/[id]/dispute",             info: { num: "U-09b", code: "REPAIR-DISPUTE" } },
  { pattern: "/repair/[id]/approve-entry",       info: { num: "U-09c", code: "REPAIR-APPROVE-ENTRY" } },
  { pattern: "/repair/[id]/delivery-receipt",    info: { num: "U-09d", code: "REPAIR-DELIVERY" } },
  { pattern: "/repair/[id]",                     info: { num: "U-04", code: "REPAIR-DETAIL" } },
  { pattern: "/repair/walk-in/select-shop",      info: { num: "U-02b", code: "REPAIR-WALKIN-SHOP" } },
  { pattern: "/repair/pickup/schedule",          info: { num: "U-02c", code: "REPAIR-PICKUP-SCHED" } },
  { pattern: "/repair",                          info: { num: "U-02", code: "REPAIR-HOME" } },
  { pattern: "/maintain/book/confirm",           info: { num: "U-10", code: "MAINTAIN-BOOK-CONFIRM" } },
  { pattern: "/maintain/book",                   info: { num: "U-11", code: "MAINTAIN-BOOK" } },
  { pattern: "/maintain/jobs/[id]/reschedule",   info: { num: "U-13", code: "MAINTAIN-M3-RESCHEDULE" } },
  { pattern: "/maintain/jobs/[id]/extra-cost",   info: { num: "U-14", code: "MAINTAIN-M4-EXTRACOST" } },
  { pattern: "/maintain/jobs/[id]/cancel",       info: { num: "U-15", code: "MAINTAIN-M9-CANCEL" } },
  { pattern: "/maintain/jobs/[id]/offers",       info: { num: "U-15b", code: "MAINTAIN-OFFERS" } },
  { pattern: "/maintain/jobs/[id]/rate",         info: { num: "U-15c", code: "MAINTAIN-RATE" } },
  { pattern: "/maintain/jobs/[id]",              info: { num: "U-16", code: "MAINTAIN-JOB-DETAIL" } },
  { pattern: "/maintain/jobs",                   info: { num: "U-12", code: "MAINTAIN-JOBS" } },
  { pattern: "/listings/[id]/offers",            info: { num: "U-18", code: "RESELL-OFFERS-RCV" } },
  { pattern: "/listings/[id]/confirm",           info: { num: "U-19", code: "RESELL-R7-CONFIRM" } },
  { pattern: "/listings/[id]",                   info: { num: "U-20", code: "RESELL-LISTING-DETAIL" } },
  { pattern: "/listings",                        info: { num: "U-17", code: "RESELL-MY-LISTINGS" } },
  { pattern: "/marketplace/[id]/offer",          info: { num: "U-22", code: "RESELL-PAIR3-OFFER" } },
  { pattern: "/marketplace/[id]",                info: { num: "U-23", code: "RESELL-PAIR3-DETAIL" } },
  { pattern: "/marketplace",                     info: { num: "U-21", code: "RESELL-C2C-MARKET" } },
  { pattern: "/purchases/[id]/inspect",          info: { num: "U-24", code: "RESELL-R1-INSPECT" } },
  { pattern: "/purchases/[id]/complete",         info: { num: "U-25", code: "RESELL-R1-COMPLETE" } },
  { pattern: "/purchases/[id]/dispute",          info: { num: "U-26", code: "RESELL-R8-DISPUTE" } },
  { pattern: "/purchases/[id]",                  info: { num: "U-27", code: "RESELL-PURCHASE" } },
  { pattern: "/purchases",                       info: { num: "U-28", code: "RESELL-PURCHASES" } },
  { pattern: "/offers",                          info: { num: "U-17b", code: "RESELL-MY-OFFERS" } },
  { pattern: "/resell/awaiting-payment/[id]",    info: { num: "U-19b", code: "RESELL-AWAIT-PAYMENT" } },
  { pattern: "/resell/orders/[id]",              info: { num: "U-19c", code: "RESELL-R12-ORDER" } },
  { pattern: "/scrap/new",                       info: { num: "U-29", code: "SCRAP-CREATE" } },
  { pattern: "/scrap/[id]/offers",               info: { num: "U-30", code: "SCRAP-S1-OFFERS" } },
  { pattern: "/scrap/[id]/confirm",              info: { num: "U-31", code: "SCRAP-S1-CONFIRM" } },
  { pattern: "/scrap/[id]/certificate",          info: { num: "U-32", code: "SCRAP-S4-CERT" } },
  { pattern: "/scrap/[id]",                      info: { num: "U-33", code: "SCRAP-DETAIL" } },
  { pattern: "/appliances/add",                  info: { num: "U-34b", code: "APPLIANCES-ADD" } },
  { pattern: "/appliances",                      info: { num: "U-34", code: "APPLIANCES" } },
  { pattern: "/profile",                         info: { num: "U-35", code: "PROFILE" } },
  { pattern: "/notifications",                   info: { num: "U-36", code: "NOTIFICATIONS" } },
  { pattern: "/history",                         info: { num: "U-37", code: "HISTORY" } },
  // ── Phase 3 C+D success pages ────────────────────────────────────────────────
  { pattern: "/repair/new/success",                    info: { num: "U-38", code: "REPAIR-CREATE-SUCCESS" } },
  { pattern: "/maintain/book/confirm/success",         info: { num: "U-39", code: "MAINTAIN-BOOK-SUCCESS" } },
  { pattern: "/sell/new/success",                      info: { num: "U-40", code: "SELL-CREATE-SUCCESS" } },
  { pattern: "/scrap/new/success",                     info: { num: "U-41", code: "SCRAP-CREATE-SUCCESS" } },
  { pattern: "/marketplace/[id]/offer/success",        info: { num: "U-42", code: "MARKET-OFFER-SUCCESS" } },
  { pattern: "/purchases/[id]/dispute/success",        info: { num: "U-43", code: "DISPUTE-SUCCESS" } },
  // ── Batch 3 — เติม U-44+ (Advisor ruling HUB Gen44) ──────────────────────────
  // หมายเหตุ: U-03a/b/c/d (4 flow ซ่อม) ใช้ path /repair/new เดียวกัน → คง U-03 · log กลับ
  { pattern: "/wallet/deposit",                        info: { num: "U-44", code: "WALLET-DEPOSIT" } },
  { pattern: "/wallet/withdraw",                       info: { num: "U-45", code: "WALLET-WITHDRAW" } },
  { pattern: "/transactions/[id]",                     info: { num: "U-46", code: "TRANSACTION-DETAIL" } },
  { pattern: "/sell/new",                              info: { num: "U-47a", code: "SELL-NEW" } },
  { pattern: "/sell/[listingId]/edit",                 info: { num: "U-47b", code: "SELL-EDIT" } },
  { pattern: "/sell/[listingId]",                      info: { num: "U-47c", code: "SELL-MY-DETAIL" } },
  { pattern: "/sell",                                  info: { num: "U-47", code: "SELL-HOME" } },
  // signup: U-48 = entry (method picker) · sub-steps login, otp, personal, address ไม่มี badge (auth flow)
  { pattern: "/signup/method",                         info: { num: "U-48", code: "SIGNUP-ENTRY" } },
  // ── Settings ──────────────────────────────────────────────────────────────────
  { pattern: "/settings/security",                     info: { num: "U-49", code: "SETTINGS-SECURITY" } },
  // ── Jobs (WeeeU's separate jobs list — ต่างจาก /repair home) ──────────────────
  { pattern: "/jobs/[id]/progress",                    info: { num: "U-50b", code: "JOB-PROGRESS" } },
  { pattern: "/jobs/[id]",                             info: { num: "U-50a", code: "JOB-DETAIL" } },
  { pattern: "/jobs",                                  info: { num: "U-50", code: "JOBS-LIST" } },
  // ── Modules ───────────────────────────────────────────────────────────────────
  { pattern: "/modules/[module]",                      info: { num: "U-51", code: "MODULE-GUIDE" } },
  // ── Repair sub-routes (ไม่อยู่ใน registry เดิม) ──────────────────────────────
  { pattern: "/repair/[id]/decision/b1-2",             info: { num: "U-52a", code: "REPAIR-B1-DECISION" } },
  { pattern: "/repair/[id]/decision/b2-2",             info: { num: "U-52b", code: "REPAIR-B2-DECISION" } },
  { pattern: "/repair/[id]/parcel-receipt",            info: { num: "U-53a", code: "REPAIR-PARCEL-RCPT" } },
  { pattern: "/repair/[id]/pickup-receipt",            info: { num: "U-53b", code: "REPAIR-PICKUP-RCPT" } },
  { pattern: "/repair/[id]/ship-out",                  info: { num: "U-53c", code: "REPAIR-SHIP-OUT" } },
  { pattern: "/repair/[id]/shipping-details",          info: { num: "U-53d", code: "REPAIR-SHIPPING" } },
  { pattern: "/repair/[id]/walk-in-receipt",           info: { num: "U-53e", code: "REPAIR-WALKIN-RCPT" } },
  // ── Maintain mockup pages ─────────────────────────────────────────────────────
  { pattern: "/maintain/jobs/[id]/mockup/m2-expired",       info: { num: "U-54a", code: "MAINTAIN-M2-EXPIRED" } },
  { pattern: "/maintain/jobs/[id]/mockup/m6-weeer-withdrew", info: { num: "U-54b", code: "MAINTAIN-M6-WITHDREW" } },
  { pattern: "/maintain/jobs/[id]/mockup/m7-noshow",        info: { num: "U-54c", code: "MAINTAIN-M7-NOSHOW" } },
  { pattern: "/maintain/jobs/[id]/mockup/m9-cancel-inprogress", info: { num: "U-54d", code: "MAINTAIN-M9-CANCEL" } },
  // ── Scrap home ────────────────────────────────────────────────────────────────
  { pattern: "/scrap",                                 info: { num: "U-55", code: "SCRAP-HOME" } },
  // ── Gen 109 — เติมหน้าหลักที่ยังไม่มีรหัส (เดินเลขต่อ U-56+) ──────────────────
  { pattern: "/wallet/history",                        info: { num: "U-56", code: "WALLET-HISTORY" } },
  { pattern: "/wallet",                                info: { num: "U-57", code: "WALLET-HOME" } },
  // Gen109 ruling: withdraw = state ของ maintain-job ไม่ใช่จอใหม่ → ฐาน U-16 + ป้ายสถานะ "ถอนตัว" (U-58 retired)
  { pattern: "/maintain/jobs/[id]/withdraw",           info: { num: "U-16 · ถอนตัว", code: "MAINTAIN-WITHDRAW" } },
  // ── Gen 109 ruling — auth pages จอจริง (เดินเลขต่อ U-59+ · U-58 เว้นว่าง retired) ──
  // หมายเหตุ: /signup/method=U-48 เดิมคงไว้ · redirect/loading ไม่ใส่
  { pattern: "/login",                                 info: { num: "U-59", code: "LOGIN" } },
  { pattern: "/signup/email",                          info: { num: "U-60", code: "SIGNUP-EMAIL" } },
  { pattern: "/signup/personal",                       info: { num: "U-61", code: "SIGNUP-PERSONAL" } },
  { pattern: "/signup/address",                        info: { num: "U-62", code: "SIGNUP-ADDRESS" } },
  { pattern: "/signup/otp",                            info: { num: "U-63", code: "SIGNUP-OTP" } },
  { pattern: "/signup/verify-email",                   info: { num: "U-64", code: "SIGNUP-VERIFY-EMAIL" } },
];

function matchScreen(pathname: string): ScreenInfo | null {
  const sorted = [...SCREEN_MAP].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const { pattern, info } of sorted) {
    const regexStr =
      "^" +
      pattern
        .replace(/\[id\]/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$";
    if (new RegExp(regexStr).test(pathname)) return info;
  }
  return null;
}

export function ScreenBadge() {
  const pathname = usePathname();
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  const info = matchScreen(pathname);
  if (!info) return null;

  // shared commons — มุมจอ (top-left) · roleTheme เขียว WeeeU
  return (
    <ScreenIdBadge
      screenId={info.num}
      roleTheme={{ primary: WEEEU_PRIMARY }}
      position="top-left"
    />
  );
}
