"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ServiceProgress, MainStage } from "@/lib/types/service-progress";
import { useServiceProgressSync, submitReview } from "@/lib/utils/service-progress-sync";
import { ProgressStageNode } from "./ProgressStageNode";
import { ProgressStepDetail } from "./ProgressStepDetail";
import { ReviewSubmitForm } from "./ReviewSubmitForm";
import { ReviewedSummaryCard } from "./ReviewedSummaryCard";

const ALL_STAGES: MainStage[] = [
  "posted",
  "offer_accepted",
  "in_progress",
  "completed",
  "reviewed",
];

const SERVICE_TYPE_LABEL: Record<string, string> = {
  on_site: "🔧 ซ่อมที่บ้าน",
  pickup: "🚐 รับ-ส่ง",
  walk_in: "🏪 นำฝากร้าน",
  parcel: "📦 ส่งพัสดุ",
};

interface Props {
  jobId: string;
}

export function ServiceProgressTimeline({ jobId }: Props) {
  const [job, setJob] = useState<ServiceProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewKey, setReviewKey] = useState(0); // force re-render after review submit

  useEffect(() => {
    const cleanup = useServiceProgressSync((all) => {
      const found = all.find((p) => p.jobId === jobId) ?? null;
      setJob(found);
      setLoading(false);
    });
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, reviewKey]);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-600 font-medium">ไม่พบข้อมูลงานนี้</p>
        <Link
          href="/jobs"
          className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline"
        >
          ← กลับรายการงาน
        </Link>
      </div>
    );
  }

  const stageIndex = ALL_STAGES.indexOf(job.currentStage);
  const canReview =
    job.currentStage === "completed" && !job.review;

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="text-gray-400 hover:text-gray-700 text-xl">
          ‹
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">ติดตามงาน</h1>
          <p className="text-xs text-gray-400">
            {SERVICE_TYPE_LABEL[job.serviceType] ?? job.serviceType} · #{job.jobId}
          </p>
        </div>
      </div>

      {/* Stage progress bar — horizontal (5 nodes) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-1">
          {ALL_STAGES.map((stage, i) => {
            const state =
              i < stageIndex ? "done" : i === stageIndex ? "active" : "future";
            return (
              <div key={stage} className="flex-1 flex flex-col items-center relative">
                <ProgressStageNode
                  stage={stage}
                  state={state}
                  isLast={i === ALL_STAGES.length - 1}
                />
                {/* Connector line between nodes */}
                {i < ALL_STAGES.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${i < stageIndex ? "bg-indigo-400" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current sub-stage */}
        {job.currentSubStage && (
          <div className="mt-4 pt-4 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-500">ขั้นตอนปัจจุบัน</p>
            <p className="text-sm font-semibold text-indigo-700 mt-0.5">
              {job.currentSubStage.replace(/_/g, " ")}
            </p>
          </div>
        )}

        {/* Last updated */}
        <p className="text-xs text-gray-400 text-center mt-3">
          อัพเดตล่าสุด:{" "}
          {new Date(job.updatedAt).toLocaleString("th-TH", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      </div>

      {/* Review section (stage 5) */}
      {job.currentStage === "reviewed" && job.review ? (
        <ReviewedSummaryCard
          rating={job.review.rating}
          comment={job.review.comment}
          submittedAt={job.review.submittedAt}
        />
      ) : canReview ? (
        <ReviewSubmitForm
          jobId={jobId}
          onSubmitted={() => setReviewKey((k) => k + 1)}
        />
      ) : null}

      {/* History steps */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          ประวัติการดำเนินงาน ({job.history.length} ขั้นตอน)
        </p>
        {[...job.history].reverse().map((step, i) => (
          <ProgressStepDetail
            key={`${step.stage}-${step.enteredAt}`}
            step={step}
            index={job.history.length - 1 - i}
          />
        ))}
      </div>
    </div>
  );
}
