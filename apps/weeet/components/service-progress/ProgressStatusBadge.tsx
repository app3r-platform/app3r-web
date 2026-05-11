import type { MainStage } from "@/lib/types/service-progress";
import { MAIN_STAGE_LABELS } from "@/lib/types/service-progress";

const STAGE_COLORS: Record<MainStage, string> = {
  posted: "bg-gray-700 text-gray-300",
  offer_accepted: "bg-blue-900/60 text-blue-300",
  in_progress: "bg-orange-900/60 text-orange-300",
  completed: "bg-green-900/60 text-green-300",
  reviewed: "bg-purple-900/60 text-purple-300",
};

export function ProgressStatusBadge({ stage }: { stage: MainStage }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage]}`}>
      {MAIN_STAGE_LABELS[stage]}
    </span>
  );
}
