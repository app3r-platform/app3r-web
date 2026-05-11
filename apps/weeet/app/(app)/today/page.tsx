"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProgress, saveProgress } from "@/lib/utils/service-progress-sync";
import { WEEET_SEED_PROGRESS } from "@/lib/mock-data/service-progress";
import type { ServiceProgress } from "@/lib/types/service-progress";
import { DailyQueueCard } from "@/components/service-progress/DailyQueueCard";

const TODAY = new Date().toISOString().slice(0, 10); // "2026-05-11"
const TECH_ID = "tech-001";

function isToday(scheduledAt?: string) {
  if (!scheduledAt) return false;
  return scheduledAt.startsWith(TODAY);
}

export default function TodayPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ServiceProgress[]>([]);

  useEffect(() => {
    // Seed localStorage if empty
    const existing = loadProgress();
    if (existing.length === 0) {
      saveProgress(WEEET_SEED_PROGRESS);
      setJobs(WEEET_SEED_PROGRESS.filter((j) => j.technicianId === TECH_ID));
    } else {
      setJobs(existing.filter((j) => j.technicianId === TECH_ID));
    }
  }, []);

  const activeJobs = jobs.filter(
    (j) => j.currentStage === "in_progress" || isToday(j.scheduledAt)
  );
  const doneJobs = jobs.filter((j) =>
    j.currentStage === "completed" || j.currentStage === "reviewed"
  );

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">งานวันนี้</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date().toLocaleDateString("th-TH", { dateStyle: "full" })}
        </p>
      </div>

      {/* Active jobs */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-300">
          กำลังดำเนินการ ({activeJobs.length})
        </p>
        {activeJobs.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-gray-400 text-sm">ไม่มีงานค้างอยู่</p>
          </div>
        ) : (
          activeJobs.map((job) => (
            <DailyQueueCard
              key={job.jobId}
              job={job}
              onClick={() => router.push(`/jobs/${job.jobId}/progress`)}
            />
          ))
        )}
      </div>

      {/* Done jobs */}
      {doneJobs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500">เสร็จแล้ว ({doneJobs.length})</p>
          {doneJobs.map((job) => (
            <DailyQueueCard
              key={job.jobId}
              job={job}
              onClick={() => router.push(`/jobs/${job.jobId}/progress`)}
            />
          ))}
        </div>
      )}

      <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3">
        <p className="text-xs text-gray-600">
          ⚠️ Phase 2: ข้อมูล localStorage เท่านั้น — ไม่ sync ข้าม app (Phase D WebSocket)
        </p>
      </div>
    </div>
  );
}
