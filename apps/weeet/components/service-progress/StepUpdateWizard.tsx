"use client";
import { useState } from "react";
import type { ServiceProgress, ProgressStep } from "@/lib/types/service-progress";
import {
  getNextSubStage,
  isLastSubStage,
  SUB_STAGE_LABELS,
  getSubStageList,
} from "@/lib/types/service-progress";
import { roundPoint } from "@/lib/utils/rounding";
import { StepUpdateForm } from "./StepUpdateForm";
import { AdvanceStageButton } from "./AdvanceStageButton";
import { ServiceTypeStepperGuide } from "./ServiceTypeStepperGuide";
import type { ProgressStepMedia } from "@/lib/types/service-progress";

interface Props {
  job: ServiceProgress;
  technicianId: string;
  onAdvance: (
    jobId: string,
    nextSubStage: string,
    step: ProgressStep,
    markComplete?: boolean
  ) => void;
}

export function StepUpdateWizard({ job, technicianId, onAdvance }: Props) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState(false);

  const { currentStage, currentSubStage, serviceType, jobId } = job;

  // WeeeT cannot advance if stage is not in_progress
  if (currentStage !== "in_progress") {
    return (
      <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/60 text-center space-y-1">
        <p className="text-gray-400 text-sm">
          {currentStage === "completed" ? "✅ งานเสร็จสิ้นแล้ว" : "⏳ รอดำเนินการ"}
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-green-950/40 border border-green-800 rounded-xl p-4 text-center">
        <p className="text-green-300 font-semibold">✅ บันทึกขั้นตอนเสร็จแล้ว</p>
      </div>
    );
  }

  const nextSubStage = currentSubStage
    ? getNextSubStage(serviceType, currentSubStage)
    : getSubStageList(serviceType)[0];

  const isLast = currentSubStage
    ? isLastSubStage(serviceType, currentSubStage)
    : false;

  function handleFormSubmit(data: {
    notes: string;
    media: ProgressStepMedia;
    extraFields: Record<string, string>;
  }) {
    if (!nextSubStage && !isLast) return;
    setLoading(true);

    const markComplete = isLast;
    const targetSubStage = markComplete ? (currentSubStage ?? "") : (nextSubStage ?? "");
    const label = markComplete
      ? "เสร็จสิ้น"
      : SUB_STAGE_LABELS[targetSubStage] ?? targetSubStage;

    // D75 roundPoint at completed stage
    const serviceFeeRounded = markComplete && job.serviceFee
      ? roundPoint(job.serviceFee)
      : undefined;

    const step: ProgressStep = {
      id: `step-${Date.now()}`,
      stage: markComplete ? "completed" : "in_progress",
      subStage: markComplete ? undefined : targetSubStage,
      label,
      completedAt: new Date().toISOString(),
      completedBy: technicianId,
      completedByRole: "weeet",
      notes: data.notes || undefined,
      media: data.media.images.length || data.media.videos.length ? data.media : undefined,
      extraFields: Object.keys(data.extraFields).length ? data.extraFields : undefined,
    };

    void serviceFeeRounded; // stored via advanceSubStage in parent

    setTimeout(() => {
      onAdvance(jobId, targetSubStage, step, markComplete);
      setLoading(false);
      setDone(true);
      setShowForm(false);
    }, 400);
  }

  return (
    <div className="space-y-4">
      <ServiceTypeStepperGuide serviceType={serviceType} currentSubStage={currentSubStage} />

      {!showForm ? (
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-2">
            <p className="text-xs text-gray-400">ขั้นต่อไป:</p>
            <p className="text-white font-semibold text-sm">
              {nextSubStage
                ? SUB_STAGE_LABELS[nextSubStage] ?? nextSubStage
                : isLast
                ? "ทำเครื่องหมายเสร็จสิ้น"
                : "ไม่มีขั้นต่อไป"}
            </p>
          </div>
          <AdvanceStageButton
            label={isLast ? "🏁 ทำเครื่องหมายเสร็จสิ้น" : `➡️ เริ่มขั้น: ${nextSubStage ? (SUB_STAGE_LABELS[nextSubStage] ?? nextSubStage) : "-"}`}
            isLastSubStage={isLast}
            onClick={() => setShowForm(true)}
          />
        </div>
      ) : (
        <StepUpdateForm
          subStage={nextSubStage ?? currentSubStage ?? ""}
          serviceType={serviceType}
          onSubmit={handleFormSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
