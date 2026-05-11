"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServiceProgress } from "@/lib/utils/service-progress-sync";
import { initServiceProgressSeed } from "@/lib/utils/init-seed";
import type { ServiceProgress, MainStage } from "@/lib/types/service-progress";
import { ProgressStatusBadge } from "@/components/service-progress/ProgressStatusBadge";

const SERVICE_TYPE_LABEL: Record<string, string> = {
  on_site: "🔧 ซ่อมที่บ้าน",
  pickup: "🚐 รับ-ส่ง",
  walk_in: "🏪 นำฝากร้าน",
  parcel: "📦 ส่งพัสดุ",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<ServiceProgress[]>([]);
  const [filter, setFilter] = useState<MainStage | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initServiceProgressSeed();
    setJobs(getServiceProgress());
    setLoading(false);
  }, []);

  const filtered = filter
    ? jobs.filter((j) => j.currentStage === filter)
    : jobs;

  const FILTER_OPTIONS: { label: string; value: MainStage | "" }[] = [
    { label: "ทั้งหมด", value: "" },
    { label: "รอข้อเสนอ", value: "posted" },
    { label: "กำลังซ่อม", value: "in_progress" },
    { label: "เสร็จสิ้น", value: "completed" },
    { label: "รีวิวแล้ว", value: "reviewed" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">งานของฉัน</h1>
        <p className="text-sm text-gray-500 mt-1">ติดตามความคืบหน้าการซ่อม</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === opt.value
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔧</p>
          <p className="text-gray-600 font-medium">ไม่พบงานในหมวดนี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Link
              key={job.jobId}
              href={`/jobs/${job.jobId}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {SERVICE_TYPE_LABEL[job.serviceType] ?? job.serviceType}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">#{job.jobId}</p>
                </div>
                <ProgressStatusBadge stage={job.currentStage} />
              </div>

              {job.currentSubStage && (
                <p className="mt-2 text-xs text-indigo-600 font-medium">
                  → {job.currentSubStage.replace(/_/g, " ")}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(job.updatedAt).toLocaleString("th-TH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
                {job.currentStage === "completed" && !job.review && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    รอรีวิว ⭐
                  </span>
                )}
                {job.review && (
                  <span className="text-xs text-green-600">
                    {"⭐".repeat(job.review.rating)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
