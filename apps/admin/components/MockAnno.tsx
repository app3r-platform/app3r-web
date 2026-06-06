"use client";
/**
 * MockAnno — Mockup Annotation Overlay (P2 · §5/§6/§8)
 * dev-only: แสดงเมื่อ NEXT_PUBLIC_DEV_NAV === "true" || "1"
 * ลบ component นี้ + mock-anno-data.ts ตอน Phase 4 (เขียนโค้ดจริง)
 * class mock-anno: grep และลบทีเดียว
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ADMIN_ANNO_MAP } from "@/lib/mock-anno-data";

// รหัสจอ → route (จาก SCREEN_MAP ใน ScreenBadge.tsx) — ย่อเฉพาะ base routes
const ROUTE_MAP: Record<string, string> = {
  "A-01": "/", "A-02": "/repair/jobs", "A-03": "/repair/jobs/[id]",
  "A-03c": "/repair/jobs/[id]/manual-override", "A-04": "/repair/disputes",
  "A-05": "/repair/disputes/[id]", "A-06": "/maintain/jobs",
  "A-07": "/maintain/jobs/[id]", "A-07c": "/maintain/jobs/[id]/mockup/m9-cancelled",
  "A-08": "/scrap/jobs", "A-08b": "/scrap/jobs/[id]", "A-09": "/scrap/disputes",
  "A-10": "/scrap/disputes/[id]", "A-11": "/scrap/certificates",
  "A-11b": "/scrap/certificates/[id]", "A-12": "/resell/listings",
  "A-12b": "/resell/listings/[id]", "A-13": "/resell/disputes",
  "A-14": "/resell/disputes/[id]", "A-15": "/parts/orders",
  "A-16": "/parts/orders/[id]", "A-17": "/disputes", "A-18": "/disputes/[id]",
  "A-19": "/kyc", "A-20": "/kyc/[id]",
};

// Match pathname → Screen ID (simplified — ScreenBadge มี full logic)
function matchId(pathname: string): string | null {
  const sorted = Object.entries(ROUTE_MAP).sort(
    (a, b) => b[1].length - a[1].length
  );
  for (const [id, pattern] of sorted) {
    const re = new RegExp(
      "^" +
        pattern
          .replace(/\[[^\]]+\]/g, "[^/]+")
          .replace(/\//g, "\\/") +
        "$"
    );
    if (re.test(pathname)) return id;
  }
  return null;
}

const PORT_MAP: Record<string, number> = {
  WeeeU: 3002, WeeeR: 3001, WeeeT: 3003, Admin: 3000, Website: 3004,
};

export function MockAnno() {
  // ── Hooks ก่อน early return เสมอ (Rules of Hooks) ──────────────────────────
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const flag = process.env.NEXT_PUBLIC_DEV_NAV;
  if (flag !== "true" && flag !== "1") return null;

  const screenId = matchId(pathname);
  const anno = screenId ? ADMIN_ANNO_MAP[screenId] : null;

  // ถ้าไม่มีข้อมูล annotation แสดงแค่ปุ่มเล็กๆ
  const hasData =
    anno &&
    (anno.origins.length > 0 ||
      anno.destinations.length > 0 ||
      anno.xapp.length > 0);

  return (
    // mock-anno — grep marker สำหรับลบทีเดียวตอน Phase 4
    <div className="mock-anno fixed bottom-12 right-4 z-50 font-mono text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Mockup Annotations (dev only)"
        className={`
          px-2 py-1 rounded shadow border text-white
          ${hasData ? "bg-indigo-700 border-indigo-500" : "bg-gray-600 border-gray-500"}
        `}
      >
        {open ? "▼" : "▶"} mock-anno {screenId ?? "—"}
      </button>

      {open && (
        <div className="mock-anno-panel absolute bottom-8 right-0 w-80 bg-gray-900 text-gray-100 border border-gray-600 rounded shadow-xl p-3 space-y-3">

          {/* §5 Origin */}
          <div className="mock-anno-origin">
            <div className="text-indigo-400 font-semibold mb-1">◀ §5 มาจาก (Origin)</div>
            {anno && anno.origins.length > 0 ? (
              <ul className="space-y-0.5">
                {anno.origins.map((o) => (
                  <li key={o.id} className="flex gap-2">
                    <span className="text-yellow-300 w-10 shrink-0">{o.id}</span>
                    <span className="text-gray-300">{o.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500 italic">จอแรกของแอพฯ (ไม่มี origin)</span>
            )}
          </div>

          {/* §6 Destinations */}
          <div className="mock-anno-nav">
            <div className="text-green-400 font-semibold mb-1">→ §6 ปลายทาง (Destinations)</div>
            {anno && anno.destinations.length > 0 ? (
              <ul className="space-y-0.5">
                {anno.destinations.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-green-300 shrink-0">[{d.buttonLabel}]</span>
                    <span className="text-yellow-300">{d.targetId}</span>
                    <span className="text-gray-400">{d.targetLabel}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500 italic">ไม่มีการ navigate ออก</span>
            )}
          </div>

          {/* §8 Cross-App */}
          <div className="mock-anno-xapp">
            <div className="text-orange-400 font-semibold mb-1">👁 §8 ข้ามแอพฯ (Cross-App)</div>
            {anno && anno.xapp.length > 0 ? (
              <ul className="space-y-0.5">
                {anno.xapp.map((x, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <a
                      href={`http://localhost:${x.port}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-300 shrink-0 hover:underline"
                    >
                      {x.app}:{x.port}
                    </a>
                    <span className="text-yellow-300">{x.screenId}</span>
                    <span className="text-gray-400">{x.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500 italic">ไม่มี cross-app context</span>
            )}
          </div>

          <div className="text-gray-600 text-[10px] border-t border-gray-700 pt-2">
            mock-anno · ลบตอน Phase 4 · grep &quot;mock-anno&quot;
          </div>
        </div>
      )}
    </div>
  );
}
