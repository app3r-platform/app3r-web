"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getJobProgress } from "@/lib/utils/service-progress-sync";
import { initServiceProgressSeed as initSeed } from "@/lib/utils/init-seed";
import type { ServiceProgress } from "@/lib/types/service-progress";
import { ProgressStatusBadge } from "@/components/service-progress/ProgressStatusBadge";

const SERVICE_TYPE_LABEL: Record<string, string> = {
  on_site: "🔧 ซ่อมที่บ้าน",
  pickup: "🚐 รับ-ส่ง",
  walk_in: "🏪 นำฝากร้าน",
  parcel: "📦 ส่งพัสดุ",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<ServiceProgress | null | undefined>(undefined);

  useEffect(() => {
    initSeed();
    const data = getJobProgress(id);
    setJob(data ?? null);
  }, [id]);

  if (job === undefined) {
    return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  }

  if (job === null) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-600 font-medium">ไม่พบข้อมูลงานนี้</p>
        <Link href="/jobs" className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline">
          ← กลับรายการงาน
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="text-gray-400 hover:text-gray-700 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงาน</h1>
      </div>

      {/* Job summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {SERVICE_TYPE_LABEL[job.serviceType] ?? job.serviceType}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">#{job.jobId}</p>
          </div>
          <ProgressStatusBadge stage={job.currentStage} />
        </div>

        {job.currentSubStage && (
          <div className="bg-indigo-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-indigo-500">ขั้นตอนปัจจุบัน</p>
            <p className="text-sm font-semibold text-indigo-700">
              {job.currentSubStage.replace(/_/g, " ")}
            </p>
          </div>
        )}

        <div className="border-t border-gray-50 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">สร้างเมื่อ</span>
            <span className="font-medium text-gray-800">
              {new Date(job.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">อัพเดตล่าสุด</span>
            <span className="font-medium text-gray-800">
              {new Date(job.updatedAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ขั้นตอนทั้งหมด</span>
            <span className="font-medium text-gray-800">{job.history.length} ขั้นตอน</span>
          </div>
        </div>

        {/* Review preview */}
        {job.review && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-500 mb-1">รีวิวของคุณ</p>
            <p className="text-sm font-semibold text-green-700">
              {"⭐".repeat(job.review.rating)} ({job.review.rating}/5)
            </p>
            <p className="text-xs text-gray-600 italic mt-1">&ldquo;{job.review.comment}&rdquo;</p>
          </div>
        )}
      </div>

      {/* CTA: View progress */}
      <Link
        href={`/jobs/${id}/progress`}
        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
      >
        📋 ดูความคืบหน้างาน
      </Link>

      {/* CTA: Review (if completed) */}
      {job.currentStage === "completed" && !job.review && (
        <Link
          href={`/jobs/${id}/progress`}
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
        >
          ⭐ ให้คะแนนและรีวิว
        </Link>
      )}
    </div>
  );
}
