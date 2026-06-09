"use client";

// ── JobListPlaceholder — Wave1 ────────────────────────────────────────────────
// Shows recent jobs from mock-data/repair-jobs (Wave1)
// TODO Wave2: replace mock data with apiGet('/api/v1/weeer/jobs/recent')

import Link from "next/link";
import { WEEER_REPAIR_JOBS } from "@/lib/mock-data/repair-jobs";

const MAX_DISPLAY = 3;

const STATUS_STYLE: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  ANNOUNCED:   "bg-blue-100 text-blue-700",
  ASSIGNED:    "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED:   "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:     "รอจัดสรร",
  ANNOUNCED:   "ประกาศแล้ว",
  ASSIGNED:    "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังดำเนิน",
  COMPLETED:   "เสร็จแล้ว",
};

export default function JobListPlaceholder() {
  // Wave1: use mock-data (first MAX_DISPLAY items)
  // TODO Wave2: fetch from apiGet('/api/v1/weeer/jobs/recent')
  const jobs = WEEER_REPAIR_JOBS.slice(0, MAX_DISPLAY);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">งานล่าสุด</h2>
        <Link href="/jobs/queue" className="text-sm text-[#D63B12] hover:underline">
          ดูทั้งหมด →
        </Link>
      </div>
      {/* Wave1 badge — remove in Wave2 when wired to real API */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5 text-xs text-amber-600 flex items-center gap-1.5">
        <span>🔧</span>
        <span>Wave1 placeholder — Wave2 จะดึงจาก api-client จริง</span>
      </div>
      {jobs.map((j) => (
        <div
          key={j.id}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3"
        >
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0">
            ซ่อม
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{j.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{j.area}</div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[j.status] ?? "bg-gray-100 text-gray-600"}`}
          >
            {STATUS_LABEL[j.status] ?? j.status}
          </span>
        </div>
      ))}
    </div>
  );
}
