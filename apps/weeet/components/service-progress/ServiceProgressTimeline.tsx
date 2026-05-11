"use client";
import { useState } from "react";
import type { ServiceProgress, MainStage } from "@/lib/types/service-progress";
import { ProgressStageNode } from "./ProgressStageNode";
import { ProgressStepDetail } from "./ProgressStepDetail";
import { SUB_STAGE_LABELS } from "@/lib/types/service-progress";

const STAGES: MainStage[] = ["posted", "offer_accepted", "in_progress", "completed", "reviewed"];

export function ServiceProgressTimeline({ job }: { job: ServiceProgress }) {
  const [expanded, setExpanded] = useState<MainStage | null>("in_progress");

  const stageIndex = STAGES.indexOf(job.currentStage);

  return (
    <div className="space-y-4">
      {/* Stage nodes (horizontal scroll on mobile) */}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center">
            <ProgressStageNode
              stage={stage}
              isCurrent={stage === job.currentStage}
              isPast={i < stageIndex}
              onClick={() => setExpanded(expanded === stage ? null : stage)}
            />
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 w-6 mx-1 shrink-0 ${i < stageIndex ? "bg-green-600" : "bg-gray-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Current sub-stage label */}
      {job.currentSubStage && (
        <div className="bg-orange-950/40 border border-orange-800/60 rounded-xl px-4 py-2">
          <p className="text-xs text-orange-400 font-medium">
            ขั้นตอนปัจจุบัน: {SUB_STAGE_LABELS[job.currentSubStage] ?? job.currentSubStage}
          </p>
        </div>
      )}

      {/* Expanded stage steps */}
      {expanded && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            ประวัติขั้นตอน
          </p>
          {job.steps
            .filter((s) => s.stage === expanded)
            .map((step) => (
              <ProgressStepDetail key={step.id} step={step} />
            ))}
          {job.steps.filter((s) => s.stage === expanded).length === 0 && (
            <p className="text-xs text-gray-500 italic">ยังไม่มีขั้นตอนในช่วงนี้</p>
          )}
        </div>
      )}
    </div>
  );
}
