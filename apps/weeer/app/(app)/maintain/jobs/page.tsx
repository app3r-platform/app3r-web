"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { maintainApi } from "../_lib/api";
import type { MaintainJob, MaintainStatus } from "../_lib/types";
import {
  MAINTAIN_STATUS_LABEL,
  MAINTAIN_STATUS_COLOR,
  APPLIANCE_LABEL,
  CLEANING_LABEL,
} from "../_lib/types";

const FILTER_TABS: { label: string; value: MaintainStatus | "all" }[] = [
  { label: "ทั้งหมด",      value: "all" },
  { label: "มอบหมายแล้ว", value: "assigned" },
  { label: "กำลังล้าง",   value: "in_progress" },
  { label: "เสร็จแล้ว",   value: "completed" },
  { label: "ยกเลิก",      value: "cancelled" },
];

export default function MaintainJobsPage() {
  const [jobs, setJobs] = useState<MaintainJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<MaintainStatus | "all">("all");

  useEffect(() => {
    maintainApi.getShopJobs()
      .then(setJobs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">งาน Maintain</h1>
          <p className="text-xs text-gray-500 mt-0.5">งานล้างเครื่องที่ร้านรับแล้ว</p>
        </div>
        <Link href="/maintain/queue" className="text-sm text-green-700 hover:text-green-900 font-medium">
          + รับงานใหม่
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${filter === tab.value
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1 opacity-70">
                ({jobs.filter(j => j.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🛁</span>
          <p className="text-sm">ไม่มีงานในหมวดนี้</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((job) => (
          <Link key={job.id} href={`/maintain/jobs/${job.id}`}
            className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MAINTAIN_STATUS_COLOR[job.status]}`}>
                    {MAINTAIN_STATUS_LABEL[job.status]}
                  </span>
                  <span className="text-xs text-gray-400">{job.serviceCode}</span>
                  {job.recurring?.enabled && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">🔁 นัดซ้ำ</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{job.applianceType === "AC" ? "❄️" : "🫧"}</span>
                  <p className="text-sm font-semibold text-gray-800">
                    {APPLIANCE_LABEL[job.applianceType]} — {CLEANING_LABEL[job.cleaningType]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  <span className="text-xs text-gray-400">📍 {job.address.address}</span>
                  <span className="text-xs text-gray-400">
                    🗓 {new Date(job.scheduledAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {!job.technicianId && job.status === "assigned" && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">⚠️ ยังไม่ได้มอบหมายช่าง</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-green-700">{job.totalPrice.toLocaleString()} pts</p>
                <p className="text-xs text-gray-400">{job.estimatedDuration} ชม.</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
