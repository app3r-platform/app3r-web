"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
import { usePathname } from "next/navigation";

type ScreenInfo = { num: string; code: string };

const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  { pattern: "/dashboard",                          info: { num: "R-01", code: "DASHBOARD" } },
  { pattern: "/repair/announcements/[id]/offer",    info: { num: "R-03", code: "REPAIR-BID" } },
  { pattern: "/repair/announcements/[id]",          info: { num: "R-04", code: "REPAIR-ANNOUNCE-DETAIL" } },
  { pattern: "/repair/announcements",               info: { num: "R-02", code: "REPAIR-ANNOUNCE-LIST" } },
  { pattern: "/repair/walk-in/queue",               info: { num: "R-05", code: "REPAIR-WALKIN-QUEUE" } },
  { pattern: "/repair/walk-in/[id]",                info: { num: "R-06", code: "REPAIR-C1-WALKIN" } },
  { pattern: "/repair/parcel/queue",                info: { num: "R-07", code: "REPAIR-PARCEL-QUEUE" } },
  { pattern: "/repair/parcel/[id]",                 info: { num: "R-08", code: "REPAIR-C3-PARCEL" } },
  { pattern: "/repair/pickup/queue",                info: { num: "R-07b", code: "REPAIR-PICKUP-QUEUE" } },
  { pattern: "/repair/jobs/[id]/assign",            info: { num: "R-10", code: "REPAIR-ASSIGN-TECH" } },
  { pattern: "/repair/jobs/[id]",                   info: { num: "R-11", code: "REPAIR-JOB-DETAIL" } },
  { pattern: "/repair/jobs",                        info: { num: "R-09", code: "REPAIR-JOBS" } },
  { pattern: "/maintain/jobs/[id]/assign/weeet",    info: { num: "R-13b", code: "MAINTAIN-ASSIGN-WEEET" } },
  { pattern: "/maintain/jobs/[id]/assign",          info: { num: "R-13", code: "MAINTAIN-ASSIGN-TECH" } },
  { pattern: "/maintain/jobs/[id]",                 info: { num: "R-14", code: "MAINTAIN-JOB-DETAIL" } },
  { pattern: "/maintain/jobs",                      info: { num: "R-12", code: "MAINTAIN-JOBS" } },
  { pattern: "/resell/buy/wizard",                  info: { num: "R-15b", code: "RESELL-B6-WIZARD" } },
  { pattern: "/resell/buy",                         info: { num: "R-15c", code: "RESELL-BUY" } },
  { pattern: "/resell/listings/[id]",               info: { num: "R-16", code: "RESELL-LISTING-DETAIL" } },
  { pattern: "/resell/listings",                    info: { num: "R-15", code: "RESELL-LISTINGS" } },
  { pattern: "/resell/marketplace/[id]/offer",      info: { num: "R-18", code: "RESELL-PAIR3-OFFER" } },
  { pattern: "/resell/marketplace/[id]",            info: { num: "R-19", code: "RESELL-C2C-DETAIL" } },
  { pattern: "/resell/marketplace",                 info: { num: "R-17", code: "RESELL-C2C-LIST" } },
  { pattern: "/resell/purchases/[id]/inspect",      info: { num: "R-21", code: "RESELL-R1-INSPECT" } },
  { pattern: "/resell/purchases/[id]/dispute",      info: { num: "R-22", code: "RESELL-R8-DISPUTE" } },
  { pattern: "/resell/purchases/[id]",              info: { num: "R-23", code: "RESELL-PURCHASE-DETAIL" } },
  { pattern: "/resell/purchases",                   info: { num: "R-20", code: "RESELL-PURCHASES" } },
  { pattern: "/scrap/announcements/[id]/offer",     info: { num: "R-25", code: "SCRAP-BID" } },
  { pattern: "/scrap/announcements/[id]",           info: { num: "R-26", code: "SCRAP-ANNOUNCE-DETAIL" } },
  { pattern: "/scrap/announcements",                info: { num: "R-24", code: "SCRAP-ANNOUNCE-LIST" } },
  { pattern: "/scrap/jobs/[id]/resell-as-scrap",    info: { num: "R-28b", code: "SCRAP-S1-DECISION" } },
  { pattern: "/scrap/jobs/[id]/resell-parts",       info: { num: "R-28c", code: "SCRAP-S2-DECISION" } },
  { pattern: "/scrap/jobs/[id]/repair-and-sell",    info: { num: "R-28d", code: "SCRAP-S3-DECISION" } },
  { pattern: "/scrap/jobs/[id]/dispose",            info: { num: "R-28e", code: "SCRAP-S4-DECISION" } },
  { pattern: "/scrap/jobs/[id]",                    info: { num: "R-28", code: "SCRAP-JOB-DETAIL" } },
  { pattern: "/scrap/jobs",                         info: { num: "R-27", code: "SCRAP-JOBS" } },
  { pattern: "/parts/my-listings/new",              info: { num: "R-29b", code: "PARTS-NEW-LISTING" } },
  { pattern: "/parts/my-listings/[id]",             info: { num: "R-29c", code: "PARTS-LISTING-DETAIL" } },
  { pattern: "/parts/my-listings",                  info: { num: "R-29", code: "PARTS-MY-LISTINGS" } },
  { pattern: "/parts/marketplace/[id]/smart-pick",  info: { num: "R-30b", code: "PARTS-SMART-PICKER" } },
  { pattern: "/parts/marketplace/[id]",             info: { num: "R-30c", code: "PARTS-ITEM-DETAIL" } },
  { pattern: "/parts/marketplace",                  info: { num: "R-30", code: "PARTS-MARKETPLACE" } },
  { pattern: "/parts/orders/[id]",                  info: { num: "R-32", code: "PARTS-ORDER-DETAIL" } },
  { pattern: "/parts/orders",                       info: { num: "R-31", code: "PARTS-ORDERS" } },
  { pattern: "/parts/my-orders/new",                info: { num: "R-33b", code: "PARTS-NEW-ORDER" } },
  { pattern: "/parts/my-orders/[id]",               info: { num: "R-34", code: "PARTS-BUYER-ORDER" } },
  { pattern: "/parts/my-orders",                    info: { num: "R-33", code: "PARTS-MY-ORDERS" } },
  { pattern: "/staff",                              info: { num: "R-35", code: "STAFF-MGMT" } },
  { pattern: "/wallet",                             info: { num: "R-36", code: "WALLET" } },
  { pattern: "/profile",                            info: { num: "R-37", code: "PROFILE" } },
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

  // Desktop: shift right of sidebar (w-60 = 240px → left-64 = 256px)
  return (
    <div className="fixed top-2 left-64 z-[9997] pointer-events-none select-none">
      <div className="bg-black/70 backdrop-blur-sm text-white rounded-lg px-2 py-1 text-center shadow-lg">
        <div className="font-mono text-sm font-bold leading-tight">{info.num}</div>
        <div className="font-mono text-[10px] opacity-70 leading-tight">{info.code}</div>
      </div>
    </div>
  );
}
