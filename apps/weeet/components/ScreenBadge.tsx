"use client";
// D15 — Screen ID Badge (dev/review tool · ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
// Wave B-2 wire: maps the current WeeeT route → T-xx screen id, then renders the
// shared @app3r/ui <ScreenIdBadge> branded ฟ้า WeeeT (#1696F9) ที่มุมจอ.
// Single layout mount → ครอบคลุมทุกหน้าตาม screen-ID registry WeeeT.
import { usePathname } from "next/navigation";
import { ScreenIdBadge } from "@app3r/ui";

// WeeeT brand primary (tailwind weeet.primary) — roleTheme ของ badge
const WEEET_PRIMARY = "#1696F9";

// screen-ID registry WeeeT — pathname pattern → เลข T-xx (+ ป้ายสถานะ สำหรับ variant ของ base เดิม)
// กฎ (HUB CMD Gen 109): หน้าหลัก/flow step = เลขเดี่ยวเดินต่อ · variant/state = ฐานเดิม + ป้าย · dynamic [id] = 1 template
// ⚠️ เลข T- เดิม (T-01..T-17) ห้ามเปลี่ยน
const SCREEN_MAP: Array<{ pattern: string; num: string; label?: string }> = [
  // ── Jobs flow (repair/scrap) ───────────────────────────────────────────────
  { pattern: "/jobs/[id]/diagnose",          num: "T-02" },
  { pattern: "/jobs/[id]/repair/success",    num: "T-15" },
  { pattern: "/jobs/[id]/repair/in-progress",num: "T-03", label: "กำลังซ่อม" },
  { pattern: "/jobs/[id]/repair/tested",     num: "T-03", label: "ทดสอบ" },
  { pattern: "/jobs/[id]/repair",            num: "T-03" },
  { pattern: "/jobs/[id]/pickup/en-route",   num: "T-04", label: "กำลังไปรับ" },
  { pattern: "/jobs/[id]/pickup/arrived",    num: "T-04", label: "ถึงจุดรับ" },
  { pattern: "/jobs/[id]/pickup/at-shop",    num: "T-04", label: "ถึงร้าน" },
  { pattern: "/jobs/[id]/pickup/receipt",    num: "T-04", label: "ใบรับของ" },
  { pattern: "/jobs/[id]/pickup",            num: "T-04" },
  { pattern: "/jobs/[id]/schedule",          num: "T-05" },
  { pattern: "/jobs/[id]/scrap-offer",       num: "T-06" },
  { pattern: "/jobs/[id]/complete",          num: "T-07" },
  { pattern: "/jobs/[id]/inspect",           num: "T-08" },
  { pattern: "/jobs/[id]/issue",             num: "T-09" },
  { pattern: "/jobs/[id]/mismatch",          num: "T-10" },
  { pattern: "/jobs/[id]/arrive",            num: "T-33" },
  { pattern: "/jobs/[id]/depart",            num: "T-34" },
  { pattern: "/jobs/[id]/photo",             num: "T-35" },
  { pattern: "/jobs/[id]/parts",             num: "T-36" },
  { pattern: "/jobs/[id]/progress",          num: "T-37" },
  { pattern: "/jobs/[id]/post-repair",       num: "T-38" },
  { pattern: "/jobs/[id]",                   num: "T-11" },
  { pattern: "/jobs",                        num: "T-01" },
  // ── Maintain flow ──────────────────────────────────────────────────────────
  { pattern: "/maintain/[id]/inspect",       num: "T-39" },
  { pattern: "/maintain/[id]/arrive",        num: "T-40" },
  { pattern: "/maintain/[id]/checklist",     num: "T-41" },
  { pattern: "/maintain/[id]/complete",      num: "T-42" },
  { pattern: "/maintain/[id]/depart",        num: "T-43" },
  // ── Service listings ─────────────────────────────────────────────────────────
  { pattern: "/listings/[id]",               num: "T-16" },
  { pattern: "/listings",                    num: "T-17" },
  // ── Scrap ────────────────────────────────────────────────────────────────────
  { pattern: "/scrap/[id]",                  num: "T-23" },
  { pattern: "/scrap",                       num: "T-22" },
  // ── Parts (B2B จัดซื้ออะไหล่) ──────────────────────────────────────────────────
  { pattern: "/parts/catalog/[id]",          num: "T-27" },
  { pattern: "/parts/catalog",               num: "T-26" },
  { pattern: "/parts/orders/[id]",           num: "T-31" },
  { pattern: "/parts/orders",                num: "T-30" },
  { pattern: "/parts/requests",              num: "T-32" },
  { pattern: "/parts/cart",                  num: "T-28" },
  { pattern: "/parts/checkout",              num: "T-29" },
  { pattern: "/parts/[id]",                  num: "T-25" },
  { pattern: "/parts",                       num: "T-24" },
  // ── Main / standalone ─────────────────────────────────────────────────────────
  { pattern: "/dashboard",                   num: "T-18" },
  { pattern: "/today",                       num: "T-19" },
  { pattern: "/reports",                     num: "T-20" },
  { pattern: "/settings",                    num: "T-21" },
  { pattern: "/profile",                     num: "T-12" },
  // ── Reserved (เลขเดิม · ยังไม่มี route จริง) ────────────────────────────────────
  { pattern: "/notifications",               num: "T-13" },
  { pattern: "/wallet",                      num: "T-14" },
];

function matchScreenId(pathname: string): { num: string; label?: string } | null {
  const dynCount = (p: string) => (p.match(/\[id\]/g) ?? []).length;
  // เรียงจาก pattern ยาวสุดก่อน (เจาะจงกว่า) · ถ้ายาวเท่ากัน ให้ literal (ไม่มี [id]) ชนะ dynamic
  const sorted = [...SCREEN_MAP].sort(
    (a, b) => b.pattern.length - a.pattern.length || dynCount(a.pattern) - dynCount(b.pattern),
  );
  for (const entry of sorted) {
    const regexStr =
      "^" +
      entry.pattern
        .replace(/\[id\]/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$";
    if (new RegExp(regexStr).test(pathname)) return { num: entry.num, label: entry.label };
  }
  return null;
}

export function ScreenBadge() {
  const pathname = usePathname();
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  const matched = matchScreenId(pathname);
  if (!matched) return null;
  // variant/state ของ base เดิม → "T-xx · ป้าย" (ฐานเดิม ไม่แตกเลขใหม่)
  const screenId = matched.label ? `${matched.num} · ${matched.label}` : matched.num;

  return (
    <ScreenIdBadge
      screenId={screenId}
      roleTheme={{ primary: WEEET_PRIMARY }}
      position="top-left"
    />
  );
}
