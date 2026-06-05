// ============================================================
// components/marketing/HomeListings.tsx
// W-2-A: Parent component — orchestrates module groups (D1)
// Fix-Wave A (W-01):
//  - module selector (anchor chips) ลด scroll (Visitor #4)
//  - ปุ่ม "สินค้าแนะนำ" → /products (Visitor #3)
//  - เรียงใหม่: ซ่อม → บำรุงรักษา → ซาก → ขายมือสอง (resell ท้ายสุด · WeeeU #5)
//  - แต่ละโมดูลมี id anchor + scroll-mt กัน sticky navbar บัง
// ============================================================
import { Suspense } from "react";
import Link from "next/link";
import HomeActionCTA from "./HomeActionCTA";
import ResellGroup from "./groups/ResellGroup";
import ScrapGroup from "./groups/ScrapGroup";
import RepairRequestGroup from "./groups/RepairRequestGroup";
import MaintainRequestGroup from "./groups/MaintainRequestGroup";
import GroupSkeleton from "./groups/GroupSkeleton";

const MODULES = [
  { id: "module-repair", label: "🔧 ซ่อม" },
  { id: "module-maintain", label: "🛡️ บำรุงรักษา" },
  { id: "module-scrap", label: "♻️ ซาก" },
  { id: "module-resell", label: "📦 ขายมือสอง" },
];

export default function HomeListings() {
  return (
    <div className="bg-gray-50">
      {/* W-2-B D2: CTA block (sell split · repair/maintain) */}
      <HomeActionCTA />

      {/* Visitor #4: module selector (ลด scroll) + Visitor #3: ปุ่มสินค้าแนะนำ */}
      <nav className="max-w-7xl mx-auto px-4 pt-4 sticky top-16 z-30">
        <div className="flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          {MODULES.map((m) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:border-website-brand-500 hover:text-website-brand-700 transition"
            >
              {m.label}
            </a>
          ))}
          <Link
            href="/products"
            className="ml-auto px-3 py-1.5 rounded-full text-sm font-semibold bg-website-brand-700 text-white hover:bg-website-brand-800 transition"
          >
            ⭐ สินค้าแนะนำ →
          </Link>
        </div>
      </nav>

      {/* เรียงโมดูล: ซ่อม → บำรุงรักษา → ซาก → ขายมือสอง (resell ท้ายสุด · WeeeU #5) */}
      <div id="module-repair" className="scroll-mt-32">
        <Suspense fallback={<GroupSkeleton />}>
          <RepairRequestGroup />
        </Suspense>
      </div>
      <div id="module-maintain" className="scroll-mt-32">
        <Suspense fallback={<GroupSkeleton />}>
          <MaintainRequestGroup />
        </Suspense>
      </div>
      <div id="module-scrap" className="scroll-mt-32">
        <Suspense fallback={<GroupSkeleton />}>
          <ScrapGroup />
        </Suspense>
      </div>
      <div id="module-resell" className="scroll-mt-32">
        <Suspense fallback={<GroupSkeleton />}>
          <ResellGroup />
        </Suspense>
      </div>
    </div>
  );
}
