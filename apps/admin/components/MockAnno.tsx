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
import { matchScreenId, JUNCTION_MAP } from "@/lib/junction-data";

const PORT_MAP: Record<string, number> = {
  WeeeU: 3002, WeeeR: 3001, WeeeT: 3003, Admin: 3000, Website: 3004,
};

export function MockAnno() {
  // ── Hooks ก่อน early return เสมอ (Rules of Hooks) ──────────────────────────
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [junctionOpen, setJunctionOpen] = useState(false);

  const flag = process.env.NEXT_PUBLIC_DEV_NAV;
  if (flag !== "true" && flag !== "1") return null;

  const screenId = matchScreenId(pathname);
  const anno = screenId ? ADMIN_ANNO_MAP[screenId] : null;
  // TODO: REMOVE BEFORE PROD — junction entry (TD-07)
  const junctionEntry = screenId ? JUNCTION_MAP[screenId] : undefined;

  // ถ้าไม่มีข้อมูล annotation แสดงแค่ปุ่มเล็กๆ
  const hasData =
    anno &&
    (anno.origins.length > 0 ||
      anno.destinations.length > 0 ||
      anno.xapp.length > 0 ||
      (anno.drefs && anno.drefs.length > 0));

  return (
    // mock-anno — grep marker สำหรับลบทีเดียวตอน Phase 4
    <div className="mock-anno fixed bottom-12 right-4 z-50 font-mono text-xs flex items-center gap-1">
      {/* TODO: REMOVE BEFORE PROD — junction button (TD-07) */}
      {junctionEntry && (
        <button
          onClick={() => setJunctionOpen((j) => !j)}
          title={`Tree Junction: ${junctionEntry.screenTitle} (dev only)`}
          className="px-2 py-1 rounded shadow border bg-teal-700 border-teal-500 text-white hover:bg-teal-600 transition-colors"
        >
          ↔
        </button>
      )}
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

          {/* §D D-refs */}
          {anno && anno.drefs && anno.drefs.length > 0 && (
            <div className="mock-anno-drefs">
              <div className="text-pink-400 font-semibold mb-1">📐 §D Design Rule Refs</div>
              <ul className="space-y-0.5">
                {anno.drefs.map((d) => (
                  <li key={d.id} className="flex gap-2">
                    <span className="text-pink-300 w-10 shrink-0 font-bold">{d.id}</span>
                    <span className="text-gray-300 text-[10px] leading-relaxed">{d.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-gray-600 text-[10px] border-t border-gray-700 pt-2">
            mock-anno · ลบตอน Phase 4 · grep &quot;mock-anno&quot;
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
                <div className="text-white font-semibold text-sm">{junctionEntry.screenTitle}</div>
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
                <p className="text-gray-300 text-sm leading-relaxed">{junctionEntry.role}</p>
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
    </div>
  );
}
