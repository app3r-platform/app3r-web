"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scrapApi } from "../_lib/api";
import type { ScrapJob } from "../_lib/types";
import {
  SCRAP_JOB_STATUS_LABEL, SCRAP_JOB_STATUS_COLOR,
  SCRAP_JOB_OPTION_LABEL,
} from "../_lib/types";

const STATUS_FILTERS = [
  { value: "", label: "ทั้งหมด" },
  { value: "pending_decision", label: "รอตัดสินใจ" },
  { value: "in_progress",      label: "กำลังดำเนินการ" },
  { value: "completed",        label: "เสร็จสิ้น" },
  { value: "cancelled",        label: "ยกเลิก" },
] as const;

export default function ScrapJobsPage() {
  const [jobs, setJobs] = useState<ScrapJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    scrapApi.jobList()
      .then(setJobs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter
    ? jobs.filter(j => j.status === statusFilter)
    : jobs;

  const pendingCount = jobs.filter(j => j.status === "pending_decision").length;

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบซากกำลังพัฒนา — {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/scrap" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🔧 งานซาก</h1>
        {pendingCount > 0 && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">
            {pendingCount} รอตัดสินใจ
          </span>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === f.value
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่มีงานซาก</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map(job => (
            <Link key={job.id} href={`/scrap/jobs/${job.id}`}
              className="block px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SCRAP_JOB_STATUS_COLOR[job.status]}`}>
                      {SCRAP_JOB_STATUS_LABEL[job.status]}
                    </span>
                    {job.decision && job.status !== "pending_decision" && (
                      <span className="text-xs text-gray-400">
                        {SCRAP_JOB_OPTION_LABEL[job.decision]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {job.scrapItemDescription ?? `ScrapJob ${job.id.slice(0, 8)}`}
                  </p>
                  {job.conditionGrade && (
                    <p className="text-xs text-gray-400">เกรด: {job.conditionGrade.replace("grade_", "")}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(job.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
