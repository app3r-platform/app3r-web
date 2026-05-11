"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { repairApi } from "../_lib/api";
import type { RepairJob, RepairJobStatus } from "../_lib/types";
import { STATUS_LABEL, STATUS_COLOR } from "../_lib/types";

const FILTER_STATUSES: { value: string; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "awaiting_decision", label: "รออนุมัติ ⚠️" },
  { value: "in_progress", label: "กำลังซ่อม" },
  { value: "awaiting_review", label: "รอตรวจรับ" },
  { value: "closed", label: "ปิดแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
];

function RepairJobsContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");

  useEffect(() => {
    setLoading(true);
    repairApi.getJobs(statusFilter ? { status: statusFilter } : undefined)
      .then(setJobs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">งานซ่อม (On-site)</h1>
        <Link href="/repair/announcements"
          className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          + ยื่นข้อเสนอ
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_STATUSES.map((f) => (
          <button key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors
              ${statusFilter === f.value ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {!loading && !error && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">📋</span>
          <p className="text-sm">ไม่พบงานในสถานะที่เลือก</p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/repair/jobs/${job.id}`}
            className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg">🔧</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{job.appliance_name}</p>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[job.status as RepairJobStatus]}`}>
                    {STATUS_LABEL[job.status as RepairJobStatus]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{job.customer_name} · {job.customer_address}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-400">👷 {job.weeet_name}</span>
                  <span className="text-xs text-gray-400">
                    นัด: {new Date(job.scheduled_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {job.final_price && (
                    <span className="text-xs font-medium text-green-700">{job.final_price.toLocaleString()} pts</span>
                  )}
                </div>
                {job.status === "awaiting_decision" && (
                  <div className="mt-2 flex items-center gap-1.5 bg-orange-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs">⚠️</span>
                    <span className="text-xs font-medium text-orange-700">WeeeT ส่งผลตรวจมา — รออนุมัติ</span>
                  </div>
                )}
                <div className="mt-1.5">
                  <span className="text-xs text-green-600 font-medium">📊 ดู Progress</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RepairJobsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}>
      <RepairJobsContent />
    </Suspense>
  );
}
