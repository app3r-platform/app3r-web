"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
import { usePathname } from "next/navigation";

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

  return (
    <div className="fixed top-2 left-2 z-[9997] pointer-events-none select-none">
      <div className="bg-black/70 backdrop-blur-sm text-white rounded-lg px-2 py-1 text-center shadow-lg">
        <div className="font-mono text-sm font-bold leading-tight">{info.num}</div>
        <div className="font-mono text-[10px] opacity-70 leading-tight">{info.code}</div>
      </div>
    </div>
  );
}
