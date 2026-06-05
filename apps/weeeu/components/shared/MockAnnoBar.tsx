"use client";
/**
 * MockAnnoBar — P2 mockup annotation bar (dev only)
 * ─────────────────────────────────────────────────
 * §5 origin   : ◀ มาจาก: <Screen IDs>
 * §6 nav      : → ไปต่อ: <destination IDs + labels>
 * §8 cross-app: 👁 แอพฯอื่น ณ จังหวะนี้ → ลิงก์
 *
 * ลบทั้งหมดด้วย: grep -r "mock-anno" apps/weeeu --include="*.tsx" -l
 * ทุก element ใช้ className ที่ขึ้นต้น "mock-anno" เพื่อ grep-delete ง่าย
 *
 * อ้างอิง: P0 Advisor Specs §3 + §5 + §6 + §8 · Gen 113
 */

import { usePathname } from "next/navigation";
import { getMockAnnoEntry, type NavTarget, type XAppLink } from "@/lib/mock-anno-data";

// ── Sub-components ────────────────────────────────────────────────────────────

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
        <OriginBadge from={entry.from} />
        <NavBadge to={entry.to} />
        {entry.xapp && <XAppBadge xapp={entry.xapp} />}
      </div>
    </div>
  );
}
