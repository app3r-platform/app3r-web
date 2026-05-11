"use client";
import type { ServiceProgress } from "@/lib/types/service-progress";
import { ProgressStatusBadge } from "./ProgressStatusBadge";
import { SUB_STAGE_LABELS } from "@/lib/types/service-progress";

const SERVICE_TYPE_LABEL: Record<string, string> = {
  on_site: "🔧 On-site",
  pickup: "🚛 Pickup",
  walk_in: "🏪 Walk-in",
  parcel: "📦 Parcel",
};

interface Props {
  job: ServiceProgress;
  onClick: () => void;
}

export function DailyQueueCard({ job, onClick }: Props) {
  const nextSubStageLabel = job.currentSubStage
    ? SUB_STAGE_LABELS[job.currentSubStage]
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-gray-800 border border-gray-700 hover:border-orange-500/50 rounded-xl p-4 text-left space-y-2 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500 font-mono">{job.jobNo}</p>
          <p className="text-white font-semibold text-sm">{job.customerName ?? "ลูกค้า"}</p>
          <p className="text-gray-400 text-xs">{job.applianceName ?? "-"}</p>
        </div>
        <ProgressStatusBadge stage={job.currentStage} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
          {SERVICE_TYPE_LABEL[job.serviceType] ?? job.serviceType}
        </span>
        {job.scheduledAt && (
          <span className="text-xs text-gray-500">
            🕐 {new Date(job.scheduledAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {nextSubStageLabel && (
        <p className="text-xs text-orange-400 font-medium">
          ▶ {nextSubStageLabel}
        </p>
      )}
    </button>
  );
}
