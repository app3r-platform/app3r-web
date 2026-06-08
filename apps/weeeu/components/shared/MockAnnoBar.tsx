"use client";
/**
 * MockAnnoBar — P2 mockup annotation bar (dev only)
 * ─────────────────────────────────────────────────
 * §5 origin   : ◀ มาจาก: <Screen IDs>
 * §6 nav      : → ไปต่อ: <destination IDs + labels>
 * §8 cross-app: 👁 แอพฯอื่น ณ จังหวะนี้ → ลิงก์
 * JUNCTION 2.4: [↔] popup — flow map ต่อจอ
 *
 * ลบทั้งหมดด้วย: grep -r "mock-anno" apps/weeeu --include="*.tsx" -l
 * ทุก element ใช้ className ที่ขึ้นต้น "mock-anno" เพื่อ grep-delete ง่าย
 *
 * อ้างอิง: P0 Advisor Specs §3 + §5 + §6 + §8 · Gen 113 · JUNCTION 2.4
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { getMockAnnoEntry, type NavTarget, type XAppLink } from "@/lib/mock-anno-data";
import { getJunctionEntry, type JunctionTo } from "@/lib/junction-data";

// ── Sub-components ────────────────────────────────────────────────────────────

/** [↔] JUNCTION 2.4 — popup แสดง from/to flow ของจอนี้ */
function JunctionButton({ screenId }: { screenId: string }) {
  const [open, setOpen] = useState(false);
  const junction = getJunctionEntry(screenId);
  if (!junction) return null;

  return (
    <span className="mock-anno mock-anno-junction relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="mock-anno mock-anno-junction-btn inline-flex items-center bg-teal-100 hover:bg-teal-200 text-teal-700 text-[10px] font-bold rounded px-1.5 py-0.5 transition-colors cursor-pointer"
        title={`JUNCTION 2.4 — ${junction.title}`}
      >
        [↔]
      </button>
      {open && (
        <>
          {/* Click-away backdrop */}
          <span
            className="mock-anno fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="mock-anno mock-anno-junction-popup absolute top-full left-0 mt-1 z-50 bg-white border border-teal-200 rounded-xl shadow-xl p-3 w-64">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-teal-700">
                {junction.screenId} · {junction.title}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-[10px] ml-2 leading-none"
              >
                ✕
              </button>
            </div>
            {/* From */}
            {junction.from.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] text-gray-400 mb-1">◀ มาจาก</p>
                <div className="flex flex-wrap gap-1">
                  {junction.from.map((f, i) => (
                    <span key={i} className="text-[9px] bg-gray-100 rounded px-1 py-0.5 text-gray-600">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* To */}
            {junction.to.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 mb-1">→ ไปต่อ</p>
                <div className="flex flex-wrap gap-1">
                  {junction.to.map((t: JunctionTo, i: number) => (
                    <span key={i} className="text-[9px] bg-teal-50 rounded px-1 py-0.5 text-teal-700">
                      <span className="font-bold">{t.id}</span>
                      {t.note && <span className="text-teal-400 ml-0.5">[{t.note}]</span>}
                      {" "}
                      <span className="text-teal-500">{t.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </span>
  );
}

function OriginBadge({ from }: { from: string[] }) {
  if (!from.length) return null;
  return (
    <span className="mock-anno mock-anno-origin inline-flex items-center gap-1 text-[10px] text-gray-500">
      <span className="opacity-60">◀ มาจาก:</span>
      {from.map((f, i) => (
        <span key={i} className="mock-anno mock-anno-origin-item bg-gray-100 rounded px-1 py-0.5">
          {f}
        </span>
      ))}
    </span>
  );
}

function NavBadge({ to }: { to: NavTarget[] }) {
  if (!to.length) return null;
  return (
    <span className="mock-anno mock-anno-nav inline-flex items-center gap-1 flex-wrap text-[10px] text-blue-600">
      <span className="opacity-60">→ ไปต่อ:</span>
      {to.map((t, i) => (
        <span key={i} className="mock-anno mock-anno-nav-item bg-blue-50 rounded px-1 py-0.5">
          {t.branch && <span className="font-bold text-blue-400">[{t.branch}] </span>}
          <span className="font-semibold">{t.id}</span>
          <span className="text-blue-400 ml-0.5">{t.label}</span>
        </span>
      ))}
    </span>
  );
}

function XAppBadge({ xapp }: { xapp: XAppLink[] }) {
  if (!xapp.length) return null;
  return (
    <span className="mock-anno mock-anno-xapp inline-flex items-center gap-1 text-[10px] text-purple-600">
      <span className="opacity-60">👁 แอพฯอื่น:</span>
      {xapp.map((x, i) => (
        <a
          key={i}
          href={`http://localhost:${x.port}${x.path}`}
          target="_blank"
          rel="noreferrer"
          className="mock-anno mock-anno-xapp-link bg-purple-50 rounded px-1 py-0.5 hover:bg-purple-100 transition-colors"
          title={`${x.app} — ${x.screenId} : ${x.label}`}
        >
          <span className="font-semibold">{x.app}</span>
          <span className="text-purple-400 ml-0.5">{x.screenId}</span>
        </a>
      ))}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MockAnnoBar() {
  const pathname = usePathname();

  // Dev-only: ปิดถ้าไม่ได้เปิด NEXT_PUBLIC_DEV_NAV
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;

  const entry = getMockAnnoEntry(pathname);
  if (!entry) return null;

  const hasContent =
    entry.from.length > 0 ||
    entry.to.length > 0 ||
    (entry.xapp?.length ?? 0) > 0;

  if (!hasContent) return null;

  return (
    <div
      className="mock-anno mock-anno-bar sticky top-14 z-10 w-full bg-amber-50 border-b border-amber-200 px-4 py-1.5"
      role="complementary"
      aria-label="mockup-annotation"
    >
      {/* Screen ID label */}
      <div className="mock-anno flex items-start gap-2 flex-wrap max-w-lg mx-auto">
        <span className="mock-anno mock-anno-screen-id inline-flex items-center bg-amber-100 text-amber-700 text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0">
          🏷 {entry.screenId}
        </span>
        {/* JUNCTION 2.4 — [↔] popup */}
        <JunctionButton screenId={entry.screenId} />
        <OriginBadge from={entry.from} />
        <NavBadge to={entry.to} />
        {entry.xapp && <XAppBadge xapp={entry.xapp} />}
      </div>
    </div>
  );
}

// ── Scrap module extensions (union from feature/scrap-p2p3) ──────────────────
// §5 Origin (yellow) · §6 Nav (blue) · §8 Cross-app (purple details)
// ใช้ใน apps/weeeu/app/(app)/scrap/**

export function MockAnnoOrigin({ text }: { text: string }) {
  return (
    <div className="mock-anno mock-anno-origin text-[10px] bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-yellow-700 font-mono">
      {text}
    </div>
  );
}

export function MockAnnoNav({ text }: { text: string }) {
  return (
    <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-1">{text}</p>
  );
}

export function MockAnnoXApp({
  screenLabel,
  children,
}: {
  screenLabel: string;
  children: import("react").ReactNode;
}) {
  return (
    <details className="mock-anno mock-anno-xapp">
      <summary className="cursor-pointer text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 font-medium">
        👁 แอพฯอื่น ณ จังหวะนี้ ({screenLabel})
      </summary>
      <div className="mt-1 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 space-y-1">
        {children}
      </div>
    </details>
  );
}
