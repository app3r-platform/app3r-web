"use client";
// ============================================================
// components/marketing/HomeActionCTA.tsx
// W-2-B (D2): 2 CTA buttons เหนือ HomeListings
// - ลงประกาศขายเครื่องใช้ไฟฟ้ามือสอง → WeeeU app /sell/new
// - แจ้งความต้องการซ่อม/บำรุงรักษา → WeeeU app /repair/new
// behavior: ถ้า logged in → direct · ถ้าไม่ → login?return=...
// ใช้ useMockRole เพื่อตรวจ login (Phase 3 mockup)
// ============================================================
import Link from "next/link";
import { useMockRole } from "@/lib/auth/useMockRole";

const WEEEU_APP_URL = process.env.NEXT_PUBLIC_WEEEU_APP_URL ?? "http://localhost:3002";

export default function HomeActionCTA() {
  const { role, mounted } = useMockRole();
  const isLoggedIn = mounted && role !== "anonymous";

  const sellHref = isLoggedIn
    ? `${WEEEU_APP_URL}/sell/new`
    : `${WEEEU_APP_URL}/login?return=/sell/new`;

  const repairHref = isLoggedIn
    ? `${WEEEU_APP_URL}/repair/new`
    : `${WEEEU_APP_URL}/login?return=/repair/new`;

  return (
    <section className="max-w-7xl mx-auto px-4 -mt-6 mb-2 relative z-10">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link
          href={sellHref}
          className="group flex items-center gap-4 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-400 transition"
        >
          <span className="text-3xl shrink-0">📦</span>
          <div className="flex-1">
            <p className="font-bold text-emerald-900 group-hover:text-emerald-700 transition text-sm sm:text-base">
              ลงประกาศขายเครื่องใช้ไฟฟ้ามือสอง
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {isLoggedIn ? "เริ่มต้นลงประกาศได้ทันที →" : "ล็อกอินแล้วลงประกาศได้เลย →"}
            </p>
          </div>
        </Link>

        <Link
          href={repairHref}
          className="group flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 transition"
        >
          <span className="text-3xl shrink-0">🔧</span>
          <div className="flex-1">
            <p className="font-bold text-blue-900 group-hover:text-blue-700 transition text-sm sm:text-base">
              แจ้งความต้องการซ่อม / บำรุงรักษา
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              {isLoggedIn ? "เริ่มแจ้งงานช่างได้ทันที →" : "ล็อกอินแล้วเริ่มแจ้งงานได้เลย →"}
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
