"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
import { usePathname } from "next/navigation";

type ScreenInfo = { num: string; code: string };

const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  { pattern: "/dashboard",               info: { num: "A-01", code: "DASHBOARD" } },
  { pattern: "/repair/jobs/[id]",        info: { num: "A-03", code: "REPAIR-JOB-DETAIL" } },
  { pattern: "/repair/jobs",             info: { num: "A-02", code: "REPAIR-JOBS" } },
  { pattern: "/repair/disputes/[id]",    info: { num: "A-05", code: "REPAIR-C9-INTERVENE" } },
  { pattern: "/repair/disputes",         info: { num: "A-04", code: "REPAIR-DISPUTES" } },
  { pattern: "/maintain/jobs/[id]",      info: { num: "A-07", code: "MAINTAIN-JOB-DETAIL" } },
  { pattern: "/maintain/jobs",           info: { num: "A-06", code: "MAINTAIN-JOBS" } },
  { pattern: "/scrap/jobs/[id]",         info: { num: "A-08b", code: "SCRAP-JOB-DETAIL" } },
  { pattern: "/scrap/jobs",              info: { num: "A-08", code: "SCRAP-JOBS" } },
  { pattern: "/scrap/disputes/[id]",     info: { num: "A-10", code: "SCRAP-S11-RULING" } },
  { pattern: "/scrap/disputes",          info: { num: "A-09", code: "SCRAP-DISPUTES" } },
  { pattern: "/scrap/certificates/[id]", info: { num: "A-11b", code: "SCRAP-CERT-DETAIL" } },
  { pattern: "/scrap/certificates",      info: { num: "A-11", code: "SCRAP-CERTS" } },
  { pattern: "/resell/listings",         info: { num: "A-12", code: "RESELL-LISTINGS" } },
  { pattern: "/resell/disputes/[id]",    info: { num: "A-14", code: "RESELL-DISPUTE-RULING" } },
  { pattern: "/resell/disputes",         info: { num: "A-13", code: "RESELL-DISPUTES" } },
  { pattern: "/parts/orders/[id]",       info: { num: "A-16", code: "PARTS-ORDER-DETAIL" } },
  { pattern: "/parts/orders",            info: { num: "A-15", code: "PARTS-ORDERS" } },
  { pattern: "/disputes/[id]",           info: { num: "A-18", code: "PARTS-P7-DISPUTE" } },
  { pattern: "/disputes",               info: { num: "A-17", code: "PARTS-DISPUTES" } },
  { pattern: "/kyc/[id]",               info: { num: "A-20", code: "KYC-DETAIL" } },
  { pattern: "/kyc",                    info: { num: "A-19", code: "KYC-LIST" } },
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

  // Admin: no sidebar at root — top-left is fine
  return (
    <div className="fixed top-2 left-2 z-[9997] pointer-events-none select-none">
      <div className="bg-black/70 backdrop-blur-sm text-white rounded-lg px-2 py-1 text-center shadow-lg">
        <div className="font-mono text-sm font-bold leading-tight">{info.num}</div>
        <div className="font-mono text-[10px] opacity-70 leading-tight">{info.code}</div>
      </div>
    </div>
  );
}
