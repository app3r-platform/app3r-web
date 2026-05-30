"use client";

import type { MainStage } from "@/lib/types/service-progress";

const STAGE_LABEL: Record<MainStage, string> = {
  posted: "ประกาศ",
  offer_accepted: "ยืนยัน",
  in_progress: "ดำเนินการ",
  completed: "เสร็จสิ้น",
  reviewed: "รีวิว",
};

const STAGE_ICON: Record<MainStage, string> = {
  posted: "📋",
  offer_accepted: "✅",
  in_progress: "🔧",
  completed: "📦",
  reviewed: "⭐",
};

type NodeState = "done" | "active" | "future";

interface Props {
  stage: MainStage;
  state: NodeState;
  isLast?: boolean;
}

export function ProgressStageNode({ stage, state, isLast }: Props) {
  const circleClass =
    state === "done"
      ? "bg-weeeu-primary text-white border-weeeu-primary"
      : state === "active"
        ? "bg-white text-weeeu-dark border-weeeu-primary ring-2 ring-weeeu-primary/30"
        : "bg-white text-gray-300 border-gray-200";

  const labelClass =
    state === "active"
      ? "text-weeeu-dark font-semibold"
      : state === "done"
        ? "text-gray-700 font-medium"
        : "text-gray-400";

  return (
    <div className="flex flex-col items-center">
      {/* Circle */}
      <div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base transition-all ${circleClass}`}
      >
        {state === "done" ? "✓" : STAGE_ICON[stage]}
      </div>
      {/* Label */}
      <p className={`mt-1.5 text-xs text-center ${labelClass}`}>
        {STAGE_LABEL[stage]}
      </p>
      {/* Connector line (hidden for last) */}
      {!isLast && (
        <div
          className={`hidden md:block absolute top-5 left-1/2 w-full h-0.5 ${state === "done" ? "bg-weeeu-primary/70" : "bg-gray-200"}`}
          style={{ zIndex: -1 }}
        />
      )}
    </div>
  );
}
