"use client";
// D15 — Screen ID Badge (dev/review tool · ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
// Wave B-2 wire: maps the current WeeeT route → T-xx screen id, then renders the
// shared @app3r/ui <ScreenIdBadge> branded ฟ้า WeeeT (#1696F9) ที่มุมจอ.
// Single layout mount → ครอบคลุมทุกหน้าตาม screen-ID registry WeeeT.
import { usePathname } from "next/navigation";
import { ScreenIdBadge } from "@app3r/ui";

// WeeeT brand primary (tailwind weeet.primary) — roleTheme ของ badge
const WEEET_PRIMARY = "#1696F9";

// screen-ID registry WeeeT (T-01..T-17) — pathname pattern → เลข T-xx
const SCREEN_MAP: Array<{ pattern: string; num: string }> = [
  { pattern: "/jobs/[id]/diagnose",        num: "T-02" },
  { pattern: "/jobs/[id]/repair/success",  num: "T-15" },
  { pattern: "/jobs/[id]/repair",          num: "T-03" },
  { pattern: "/jobs/[id]/pickup",          num: "T-04" },
  { pattern: "/jobs/[id]/schedule",        num: "T-05" },
  { pattern: "/jobs/[id]/scrap-offer",     num: "T-06" },
  { pattern: "/jobs/[id]/complete",        num: "T-07" },
  { pattern: "/jobs/[id]/inspect",         num: "T-08" },
  { pattern: "/jobs/[id]/issue",           num: "T-09" },
  { pattern: "/jobs/[id]/mismatch",        num: "T-10" },
  { pattern: "/jobs/[id]",                 num: "T-11" },
  { pattern: "/jobs",                      num: "T-01" },
  { pattern: "/profile",                   num: "T-12" },
  { pattern: "/notifications",             num: "T-13" },
  { pattern: "/wallet",                    num: "T-14" },
  { pattern: "/listings/[id]",             num: "T-16" },
  { pattern: "/listings",                  num: "T-17" },
];

function matchScreenId(pathname: string): string | null {
  const sorted = [...SCREEN_MAP].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const { pattern, num } of sorted) {
    const regexStr =
      "^" +
      pattern
        .replace(/\[id\]/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$";
    if (new RegExp(regexStr).test(pathname)) return num;
  }
  return null;
}

export function ScreenBadge() {
  const pathname = usePathname();
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  const screenId = matchScreenId(pathname);
  if (!screenId) return null;

  return (
    <ScreenIdBadge
      screenId={screenId}
      roleTheme={{ primary: WEEET_PRIMARY }}
      position="top-left"
    />
  );
}
