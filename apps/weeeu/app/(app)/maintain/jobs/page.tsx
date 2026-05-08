"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import type { MaintainJob } from "@/lib/types";

type StatusFilter = "all" | MaintainJob["status"];

const STATUS_LABEL: Record<MaintainJob["status"], string> = {
  pending: "รอช่าง",
  assigned: "มอบหมายแล้ว",
  departed: "ช่างออกเดินทาง",
  arrived: "ช่างถึงแล้ว",
  in_progress: "กำลังล้าง",
  completed: "เสร็จแล้ว",
  cancelled: "ยกเลิก",
};

const STATUS_COLOR: Record<MaintainJob["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  departed: "bg-amber-100 text-amber-700",
  arrived: "bg-amber-100 text-amber-700",
  in_progress: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC: "แอร์ 🌡️",
  WashingMachine: "เครื่องซักผ้า 🫧",
};

const CLEANING_LABEL: Record<MaintainJob["cleaningType"], string> = {
  general: "ล้างทั่วไป",
  deep: "ล้างลึก",
  sanitize: "ล้าง+ฆ่าเชื้อ",
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอช่าง" },
  { value: "in_progress", label: "กำลังล้าง" },
  { value: "completed", label: "เสร็จแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MaintainJobsPage() {
  const [jobs, setJobs] = useState<MaintainJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    apiFetch("/api/v1/maintain/jobs/customer/")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setJobs(d.items ?? d ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">งานล้างของฉัน</h1>
        <Link
          href="/maintain/book"
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + จองล้าง
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-teal-600 text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-teal-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🛁</p>
          <p className="text-gray-500 font-medium">ยังไม่มีงานล้างเครื่อง</p>
          <Link
            href="/maintain/book"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            จองล้างเครื่องเลย
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <Link
              key={job.id}
              href={`/maintain/jobs/${job.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-teal-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">{APPLIANCE_LABEL[job.applianceType]}</p>
                    <span className="text-xs text-gray-400">—</span>
                    <p className="text-xs text-gray-500">{CLEANING_LABEL[job.cleaningType]}</p>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{job.serviceCode}</p>
                  <p className="text-xs text-gray-500">📅 {formatDate(job.scheduledAt)}</p>
                  {job.recurring?.enabled && (
                    <p className="text-xs text-teal-600">🔄 นัดซ้ำ ({
                      job.recurring.interval === "3_months" ? "ทุก 3 เดือน"
                      : job.recurring.interval === "6_months" ? "ทุก 6 เดือน"
                      : "ทุกปี"
                    })</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[job.status]}`}>
                    {STATUS_LABEL[job.status]}
                  </span>
                  {job.totalPrice > 0 && (
                    <p className="text-xs font-semibold text-teal-700">{job.totalPrice.toLocaleString()} Point</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
