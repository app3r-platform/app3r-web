"use client";

// ── Maintain Job Progress Page — D79 (Phase C-5) ──────────────────────────────

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { maintainApi } from "../../../_lib/api";
import type { MaintainJob } from "../../../_lib/types";
import {
  MAINTAIN_STATUS_COLOR,
  MAINTAIN_STATUS_LABEL,
  APPLIANCE_LABEL,
  CLEANING_LABEL,
} from "../../../_lib/types";
import { MAINTAIN_STAGES, MAINTAIN_STAGE_ORDER, MAINTAIN_ADVANCEABLE_STAGES } from "../../../_lib/service-progress";
import { getMockMaintainProgress } from "../../../_lib/service-progress-mock";
import { ServiceProgressTimeline } from "../../../../../../components/service-progress/ServiceProgressTimeline";
import { AssignWeeeTButton } from "../../../../../../components/service-progress/AssignWeeeTButton";
import { ProgressStatusBadge } from "../../../../../../components/service-progress/ProgressStatusBadge";
import { useServiceProgressSync } from "../../../../../../lib/utils/service-progress-sync";

export default function MaintainJobProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<MaintainJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJob = () => {
    setLoading(true);
    maintainApi
      .getJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJob(); }, [id]);

  // Sync: refresh on cross-tab update
  useServiceProgressSync((event) => {
    if (
      event.type === "refresh_jobs" ||
      (event.type === "maintain_stage_changed" && event.jobId === id) ||
      (event.type === "weeet_assigned" && event.jobId === id && event.service === "maintain")
    ) {
      loadJob();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>
    );
  }
  if (error || !job) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
        {error || "ไม่พบข้อมูลงาน"}
      </div>
    );
  }

  const progress = getMockMaintainProgress(id) ?? {
    job_id: id,
    current_stage: job.status,
    entries: [],
    updated_at: job.scheduledAt,
  };

  const canAssign = MAINTAIN_ADVANCEABLE_STAGES.includes(job.status) && job.status === "pending";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ‹ กลับ
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {APPLIANCE_LABEL[job.applianceType]} — {CLEANING_LABEL[job.cleaningType]}
          </h1>
          <p className="text-xs text-gray-500">{job.serviceCode} · {job.address.address}</p>
        </div>
        <ProgressStatusBadge
          label={MAINTAIN_STATUS_LABEL[job.status]}
          colorClass={MAINTAIN_STATUS_COLOR[job.status]}
        />
      </div>

      {/* WeeeT assignment (if stage = pending) */}
      {canAssign && (
        <AssignWeeeTButton
          jobId={id}
          service="maintain"
          currentWeeeTId={job.technicianId ?? ""}
          onAssigned={() => loadJob()}
        />
      )}

      {/* Job info summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>นัดหมาย</span>
          <span className="font-medium text-gray-800">
            {new Date(job.scheduledAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>ระยะเวลา</span>
          <span className="font-medium text-gray-800">{job.estimatedDuration} ชั่วโมง</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>ราคา</span>
          <span className="font-bold text-green-700">{job.totalPrice.toLocaleString()} pts</span>
        </div>
        {job.recurring?.enabled && (
          <div className="flex justify-between text-gray-600">
            <span>นัดซ้ำ</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              🔁 ทุก {job.recurring.interval.replace("_", " ")}
            </span>
          </div>
        )}
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">ความคืบหน้า</h2>
        <ServiceProgressTimeline
          stages={MAINTAIN_STAGES}
          stageOrder={MAINTAIN_STAGE_ORDER}
          currentStage={progress.current_stage}
          entries={progress.entries}
          terminalStages={["cancelled"]}
        />
      </div>
    </div>
  );
}
