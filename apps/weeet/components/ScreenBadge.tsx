"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
import { usePathname } from "next/navigation";

type ScreenInfo = { num: string; code: string };

const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  { pattern: "/jobs/[id]/diagnose",   info: { num: "T-02", code: "REPAIR-DIAGNOSE" } },
  { pattern: "/jobs/[id]/repair/success", info: { num: "T-15", code: "REPAIR-C1-SUCCESS" } },
  { pattern: "/jobs/[id]/repair",     info: { num: "T-03", code: "REPAIR-C1-COMPLETE" } },
  { pattern: "/jobs/[id]/pickup",     info: { num: "T-04", code: "SCRAP-S6-PICKUP" } },
  { pattern: "/jobs/[id]/schedule",   info: { num: "T-05", code: "REPAIR-C3-SCHEDULE" } },
  { pattern: "/jobs/[id]/scrap-offer",info: { num: "T-06", code: "REPAIR-C4-SCRAP" } },
  { pattern: "/jobs/[id]/complete",   info: { num: "T-07", code: "JOB-COMPLETE" } },
  { pattern: "/jobs/[id]/inspect",    info: { num: "T-08", code: "MAINTAIN-INSPECT" } },
  { pattern: "/jobs/[id]/issue",      info: { num: "T-09", code: "MAINTAIN-M4-ISSUE" } },
  { pattern: "/jobs/[id]/mismatch",   info: { num: "T-10", code: "SCRAP-S8-MISMATCH" } },
  { pattern: "/jobs/[id]",            info: { num: "T-11", code: "JOB-DETAIL" } },
  { pattern: "/jobs",                 info: { num: "T-01", code: "JOBS-LIST" } },
  { pattern: "/profile",              info: { num: "T-12", code: "PROFILE" } },
  { pattern: "/notifications",        info: { num: "T-13", code: "NOTIFICATIONS" } },
  { pattern: "/wallet",               info: { num: "T-14", code: "WALLET" } },
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
      <div className="bg-black/80 backdrop-blur-sm text-white rounded-lg px-2 py-1 text-center shadow-lg border border-white/10">
        <div className="font-mono text-sm font-bold leading-tight">{info.num}</div>
        <div className="font-mono text-[10px] opacity-70 leading-tight">{info.code}</div>
      </div>
    </div>
  );
}
