"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { matchScreenId, JUNCTION_MAP } from "@/lib/junction-data";

// ═══════════════════════════════════════════════════════════════
// MockAnnoBar — Developer Navigation Panel (Website)
// TODO: REMOVE BEFORE PROD — dev-only nav tool (TD-07)
// แสดงเฉพาะเมื่อ NEXT_PUBLIC_DEV_NAV=true (development only)
// Light theme (ต่างจาก Admin ที่ใช้ dark theme)
// ═══════════════════════════════════════════════════════════════

interface DevNavLink {
  label: string;
  href: string;
  type?: "next-step" | "cross-app" | "branch";
  forPath?: string;
  group?: string;
}

// Link map — Website flow navigation
const devNavLinks: DevNavLink[] = [
  // ── Home (W-01) ──────────────────────────────────────────────────────────
  { label: "→ ประกาศทั้งหมด (W-06)",       href: "/listings",                                    type: "next-step", forPath: "/" },
  { label: "→ สมัคร WeeeR (W-18)",          href: "/register/weeer",                              type: "next-step", forPath: "/" },
  { label: "→ ดาวน์โหลด WeeeU (W-04)",      href: "/download",                                    type: "next-step", forPath: "/" },

  // ── Listings Hub (W-06) ───────────────────────────────────────────────────
  { label: "→ ซ่อม (W-07)",                 href: "/listings/repair",                             type: "next-step", forPath: "/listings" },
  { label: "→ บำรุง (W-09)",                href: "/listings/maintain",                           type: "next-step", forPath: "/listings" },
  { label: "→ มือสอง (W-11)",               href: "/listings/resell",                             type: "next-step", forPath: "/listings" },
  { label: "→ ซาก (W-13)",                  href: "/listings/scrap",                              type: "next-step", forPath: "/listings" },

  // ── Repair (W-07 → W-08) ─────────────────────────────────────────────────
  { label: "→ รายละเอียดซ่อม (W-08)",       href: "/listings/repair/rs-01",                       type: "next-step", forPath: "/listings/repair" },
  { label: "🔗 WeeeR รับงานซ่อม",           href: "http://localhost:3001/repair/jobs",             type: "cross-app", forPath: "/listings/repair/rs-01" },
  { label: "🔗 WeeeU จองซ่อม",              href: "http://localhost:3002/repair/new",              type: "cross-app", forPath: "/listings/repair/rs-01" },
  { label: "→ สมัคร WeeeR",                 href: "/register/weeer",                              type: "branch",    forPath: "/listings/repair/rs-01" },

  // ── Maintain (W-09 → W-10) ───────────────────────────────────────────────
  { label: "→ รายละเอียดบำรุง (W-10)",      href: "/listings/maintain/m001",                      type: "next-step", forPath: "/listings/maintain" },
  { label: "🔗 WeeeR รับงานบำรุง",          href: "http://localhost:3001/maintains",               type: "cross-app", forPath: "/listings/maintain/m001" },
  { label: "🔗 WeeeU จองบำรุง",             href: "http://localhost:3002/maintains",               type: "cross-app", forPath: "/listings/maintain/m001" },

  // ── Resell (W-11 → W-12) ─────────────────────────────────────────────────
  { label: "→ รายละเอียดมือสอง (W-12)",     href: "/listings/resell/r001",                        type: "next-step", forPath: "/listings/resell" },
  { label: "🔗 WeeeU ซื้อมือสอง",           href: "http://localhost:3002/listings",                type: "cross-app", forPath: "/listings/resell/r001" },
  { label: "🔗 WeeeR ยื่นข้อเสนอซื้อ",      href: "http://localhost:3001/buy-offers/new",          type: "cross-app", forPath: "/listings/resell/r001" },
  { label: "→ ประวัติผู้ขาย (W-23)",        href: "/owners/seller-001",                           type: "next-step", forPath: "/listings/resell/r001" },
  { label: "→ [suspend] ถูกระงับ (W-12b)",  href: "/listings/resell/r001/suspended",              type: "branch",    forPath: "/listings/resell/r001" },

  // ── Scrap (W-13 → W-14) ──────────────────────────────────────────────────
  { label: "→ รายละเอียดซาก (W-14)",        href: "/listings/scrap/s001",                         type: "next-step", forPath: "/listings/scrap" },
  { label: "🔗 WeeeR รับซื้อซาก",           href: "http://localhost:3001/scrap/offers/new",        type: "cross-app", forPath: "/listings/scrap/s001" },

  // ── Register WeeeR (W-18) ─────────────────────────────────────────────────
  { label: "🔗 WeeeR app สมัคร",            href: "http://localhost:3001/register",                type: "cross-app", forPath: "/register/weeer" },
  { label: "→ กลับหน้าแรก (W-01)",          href: "/",                                            type: "branch",    forPath: "/register/weeer" },
];

const DEV_NAV_ENABLED =
  process.env.NEXT_PUBLIC_DEV_NAV === "true" ||
  process.env.NEXT_PUBLIC_DEV_NAV === "1";

export function MockAnnoBar() {
  const [open, setOpen] = useState(false);
  // TODO: REMOVE BEFORE PROD — junction state (TD-07)
  const [junctionOpen, setJunctionOpen] = useState(false);
  const pathname = usePathname();

  if (!DEV_NAV_ENABLED) return null;

  // TODO: REMOVE BEFORE PROD — junction lookup (TD-07)
  const screenId = matchScreenId(pathname);
  const junctionEntry = screenId ? JUNCTION_MAP[screenId] : undefined;

  // Filter links relevant to current path
  const relevantLinks = devNavLinks.filter((link) => {
    if (!link.forPath) return true;
    if (link.forPath === pathname) return true;
    // match dynamic segments: forPath = /listings/resell/r001, pathname = /listings/resell/r005
    const pattern = link.forPath
      .replace(/\/[a-z]{1,4}\d{3,}$/i, "/[^/]+") // crude dynamic-segment match
      .replace(/\//g, "\\/");
    return new RegExp("^" + pattern + "$").test(pathname);
  });

  return (
    <>
      {/* Toggle button — fixed bottom-right */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="MockAnnoBar — Dev Navigation"
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-website-brand-700 text-white shadow-lg
                   flex items-center justify-center text-lg hover:bg-website-brand-800 transition-colors"
      >
        {open ? "✕" : "🧭"}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-16 right-4 z-[9998] w-72 max-h-[70vh] overflow-y-auto
                      bg-white border border-gray-200 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-website-brand-50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-website-brand-700">🧭 MockAnnoBar</span>
              <span className="text-xs bg-website-brand-700 text-white px-1.5 py-0.5 rounded font-mono">
                Website
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* TODO: REMOVE BEFORE PROD — junction button (TD-07) */}
              {junctionEntry && (
                <button
                  onClick={() => setJunctionOpen(true)}
                  title={`Tree Junction: ${junctionEntry.screenTitle}`}
                  className="text-xs px-2 py-0.5 rounded border bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100 transition-colors font-mono"
                >
                  ↔ {screenId}
                </button>
              )}
              <span className="text-xs text-gray-400 font-mono">
                {relevantLinks.length} links
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="p-3">
            {relevantLinks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">ไม่มี link สำหรับหน้านี้</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {relevantLinks.map((link) => (
                  <a
                    key={`${link.href}-${link.forPath ?? "global"}`}
                    href={link.href}
                    className={`block px-3 py-2 text-sm rounded-lg hover:bg-website-brand-50
                               hover:text-website-brand-700 transition-colors truncate ${
                      link.type === "cross-app"
                        ? "text-blue-700"
                        : link.type === "branch"
                        ? "text-amber-700"
                        : "text-gray-700"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-400 text-center">
              NEXT_PUBLIC_DEV_NAV=true · dev only
            </p>
          </div>
        </div>
      )}

      {/* TODO: REMOVE BEFORE PROD — Junction popup modal (TD-07) */}
      {junctionOpen && junctionEntry && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
          onClick={() => setJunctionOpen(false)}
        >
          <div
            className="bg-gray-900 border border-teal-700/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-700 bg-gray-800/60 rounded-t-2xl">
              <div>
                <div className="text-teal-400 text-[10px] font-mono mb-0.5 uppercase tracking-wider">
                  ↔ Tree Junction v2 · {junctionEntry.screenCode}
                </div>
                <div className="text-white font-semibold text-sm">
                  {junctionEntry.screenTitle}
                </div>
              </div>
              <button
                onClick={() => setJunctionOpen(false)}
                className="text-gray-400 hover:text-white ml-3 text-xl leading-none mt-0.5"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 📋 หน้าที่ */}
              <section>
                <div className="text-indigo-400 font-semibold text-[10px] uppercase tracking-widest mb-2">
                  📋 หน้าที่
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {junctionEntry.role}
                </p>
              </section>

              {/* ◀ มาจาก */}
              <section>
                <div className="text-yellow-400 font-semibold text-[10px] uppercase tracking-widest mb-2">
                  ◀ มาจาก
                </div>
                <ul className="space-y-1.5">
                  {junctionEntry.origins.map((o, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-yellow-600 shrink-0 mt-0.5">•</span>
                      <span className="text-gray-300">{o}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ▶ ไปต่อ */}
              <section>
                <div className="text-green-400 font-semibold text-[10px] uppercase tracking-widest mb-2">
                  ▶ ไปต่อ
                </div>
                <ul className="space-y-1.5">
                  {junctionEntry.destinations.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-green-600 shrink-0 mt-0.5">→</span>
                      <span className="text-gray-300">{d}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="text-gray-600 text-[10px] border-t border-gray-700 pt-3">
                Tree Junction v2 · Advisor Gen 115 · dev only — ลบตอน Phase 4
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
