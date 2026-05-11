"use client";
import type { MainStage } from "@/lib/types/service-progress";
import { MAIN_STAGE_LABELS } from "@/lib/types/service-progress";

interface Props {
  stage: MainStage;
  isCurrent: boolean;
  isPast: boolean;
  onClick?: () => void;
}

export function ProgressStageNode({ stage, isCurrent, isPast, onClick }: Props) {
  const circleClass = isCurrent
    ? "bg-orange-500 ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-900"
    : isPast
    ? "bg-green-600"
    : "bg-gray-700";

  const labelClass = isCurrent
    ? "text-orange-300 font-semibold"
    : isPast
    ? "text-green-400"
    : "text-gray-500";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 focus:outline-none"
      type="button"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${circleClass}`}>
        {isPast && !isCurrent ? (
          <span className="text-white text-xs">✓</span>
        ) : (
          <span className="text-white text-xs">●</span>
        )}
      </div>
      <span className={`text-xs text-center max-w-16 leading-tight ${labelClass}`}>
        {MAIN_STAGE_LABELS[stage]}
      </span>
    </button>
  );
}
