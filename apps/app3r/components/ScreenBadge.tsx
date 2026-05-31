"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
// D15 wire: rendering delegated to the shared @app3r/ui ScreenIdBadge so the
// Website stops carrying its own inline badge markup (kills the 5x duplication
// the D15 commons was built to remove). This wrapper keeps the Website-specific
// path → W-xx screen-ID registry + the dev-only gate (public site must not show
// the badge in production).
import { usePathname } from "next/navigation";
import { ScreenIdBadge } from "@app3r/ui";

type ScreenInfo = { num: string; code: string };

const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  { pattern: "/about",                    info: { num: "W-02", code: "ABOUT" } },
  { pattern: "/contact",                  info: { num: "W-03", code: "CONTACT" } },
  { pattern: "/download",                 info: { num: "W-04", code: "DOWNLOAD" } },
  { pattern: "/faq",                      info: { num: "W-05", code: "FAQ" } },
  { pattern: "/listings/repair/[id]",     info: { num: "W-08", code: "LISTING-REPAIR-DETAIL" } },
  { pattern: "/listings/repair",          info: { num: "W-07", code: "LISTINGS-REPAIR" } },
  { pattern: "/listings/maintain/[id]",   info: { num: "W-10", code: "LISTING-MAINTAIN-DETAIL" } },
  { pattern: "/listings/maintain",        info: { num: "W-09", code: "LISTINGS-MAINTAIN" } },
  { pattern: "/listings/resell/[id]",     info: { num: "W-12", code: "LISTING-RESELL-DETAIL" } },
  { pattern: "/listings/resell",          info: { num: "W-11", code: "LISTINGS-RESELL" } },
  { pattern: "/listings/scrap/[id]",      info: { num: "W-14", code: "LISTING-SCRAP-DETAIL" } },
  { pattern: "/listings/scrap",           info: { num: "W-13", code: "LISTINGS-SCRAP" } },
  { pattern: "/listings",                 info: { num: "W-06", code: "LISTINGS-HUB" } },
  { pattern: "/articles/[id]",            info: { num: "W-16", code: "ARTICLE-DETAIL" } },
  { pattern: "/articles",                 info: { num: "W-15", code: "ARTICLES" } },
  { pattern: "/products/[id]",            info: { num: "W-21", code: "PRODUCT-DETAIL" } },
  { pattern: "/products",                 info: { num: "W-17", code: "PRODUCTS" } },
  { pattern: "/register/weeer",           info: { num: "W-18", code: "REGISTER-WEEER" } },
  { pattern: "/preview/[id]",             info: { num: "W-19", code: "PREVIEW" } },
  { pattern: "/[id]",                     info: { num: "W-20", code: "SLUG-PAGE" } },
  { pattern: "/",                         info: { num: "W-01", code: "HOME" } },
];

function matchScreen(pathname: string): ScreenInfo | null {
  // QF2 fix: static patterns (ไม่มี '[') มาก่อน dynamic patterns (มี '[')
  // ภายใน group เดียวกัน sort by length descending (longer = more specific)
  const sorted = [...SCREEN_MAP].sort((a, b) => {
    const aDyn = a.pattern.includes("[");
    const bDyn = b.pattern.includes("[");
    if (aDyn !== bDyn) return aDyn ? 1 : -1;
    return b.pattern.length - a.pattern.length;
  });
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
  // Dev-only flag: accept "true" (legacy convention) or "1" (HUB Gen 39 CMD)
  const flag = process.env.NEXT_PUBLIC_DEV_NAV;
  if (flag !== "true" && flag !== "1") return null;
  const info = matchScreen(pathname);
  if (!info) return null;

  // roleTheme = Website brand green (#1E9E5A); pinned top-left to stay clear of
  // the bottom-right MockAuthSwitcher and not cover page UI.
  return (
    <ScreenIdBadge
      screenId={info.num}
      roleTheme={{ primary: "#1E9E5A" }}
      position="top-left"
    />
  );
}
