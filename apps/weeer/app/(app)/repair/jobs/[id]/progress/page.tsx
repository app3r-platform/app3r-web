"use client";

// ── Repair Job Progress Page — D79 (Phase C-5) ────────────────────────────────

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { RepairJob } from "../../../_lib/types";
import { STATUS_COLOR, STATUS_LABEL } from "../../../_lib/types";
import { REPAIR_STAGES, REPAIR_STAGE_ORDER, WEEER_ADVANCEABLE_STAGES } from "../../../_lib/service-progress";
import { getMockRepairProgress } from "../../../_lib/service-progress-mock";
import { ServiceProgressTimeline } from "../../../../../../components/service-progress/ServiceProgressTimeline";
import { AssignWeeeTButton } from "../../../../../../components/service-progress/AssignWeeeTButton";
import { ProgressStatusBadge } from "../../../../../../components/service-progress/ProgressStatusBadge";
import { useServiceProgressSync } from "../../../../../../lib/utils/service-progress-sync";

export default function RepairJobProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJob = () => {
    setLoading(true);
    repairApi
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
      (event.type === "repair_stage_changed" && event.jobId === id) ||
      (event.type === "weeet_assigned" && event.jobId === id && event.service === "repair")
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

  const progress = getMockRepairProgress(id) ?? {
    job_id: id,
    current_stage: job.status,
    entries: [],
    updated_at: job.scheduled_at,
  };

  const canAssign = WEEER_ADVANCEABLE_STAGES.includes(job.status) && job.status === "assigned";
  const needsDecision = job.status === "awaiting_decision";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/repair/jobs/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ‹ กลับ
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 truncate">{job.appliance_name}</h1>
          <p className="text-xs text-gray-500">{job.customer_name} · {job.customer_address}</p>
        </div>
        <ProgressStatusBadge
          label={STATUS_LABEL[job.status]}
          colorClass={STATUS_COLOR[job.status]}
        />
      </div>

      {/* WeeeT assignment (if stage = assigned) */}
      {canAssign && (
        <AssignWeeeTButton
          jobId={id}
          service="repair"
          currentWeeeTId={job.weeet_id}
          currentWeeeTName={job.weeet_name}
          onAssigned={() => loadJob()}
        />
      )}

      {/* Decision needed banner */}
      {needsDecision && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <span>⚠️</span>
            <span>WeeeT ส่งผลตรวจมา — รออนุมัติจากร้าน</span>
          </div>
          <p className="text-xs text-orange-600">
            {progress.entries.find((e) => e.stage === "awaiting_decision")?.notes ?? "กรุณาตรวจสอบและอนุมัติ"}
          </p>
          <Link
            href={`/repair/jobs/${id}`}
            className="inline-block text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            ไปหน้าตัดสินใจ →
          </Link>
        </div>
      )}

      {/* Job info summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>WeeeT</span>
          <span className="font-medium text-gray-800">👷 {job.weeet_name}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>นัดหมาย</span>
          <span className="font-medium text-gray-800">
            {new Date(job.scheduled_at).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>ราคาเริ่มต้น</span>
          <span className="font-medium text-green-700">{job.original_price.toLocaleString()} pts</span>
        </div>
        {job.final_price && (
          <div className="flex justify-between text-gray-600">
            <span>ราคาสุดท้าย</span>
            <span className="font-bold text-green-700">{job.final_price.toLocaleString()} pts</span>
          </div>
        )}
        {job.source?.type === "purchased_scrap" && (
          <div className="flex justify-between text-gray-600">
            <span>ที่มา</span>
            <span className="text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full font-medium">
              🔄 จาก Scrap #{job.source.refId}
            </span>
          </div>
        )}
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">ความคืบหน้า</h2>
        <ServiceProgressTimeline
          stages={REPAIR_STAGES}
          stageOrder={REPAIR_STAGE_ORDER}
          currentStage={progress.current_stage}
          entries={progress.entries}
          terminalStages={["cancelled", "converted_scrap"]}
        />
      </div>
    </div>
  );
}
