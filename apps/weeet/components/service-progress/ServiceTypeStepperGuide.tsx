import { getSubStageList, SUB_STAGE_LABELS } from "@/lib/types/service-progress";

interface Props {
  serviceType: string;
  currentSubStage?: string;
}

export function ServiceTypeStepperGuide({ serviceType, currentSubStage }: Props) {
  const stages = getSubStageList(serviceType);

  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700/60 p-3 space-y-1">
      <p className="text-xs font-semibold text-gray-400 mb-2">ขั้นตอนทั้งหมด ({stages.length} ขั้น)</p>
      <div className="space-y-1">
        {stages.map((stage, i) => {
          const currentIdx = stages.indexOf(currentSubStage ?? "");
          const isDone = currentIdx > i;
          const isCurrent = stage === currentSubStage;

          return (
            <div key={stage} className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg ${isCurrent ? "bg-orange-900/30 border border-orange-800/40" : ""}`}>
              <span className={`shrink-0 ${isDone ? "text-green-400" : isCurrent ? "text-orange-400" : "text-gray-600"}`}>
                {isDone ? "✓" : isCurrent ? "▶" : `${i + 1}.`}
              </span>
              <span className={isDone ? "text-gray-500 line-through" : isCurrent ? "text-orange-200 font-medium" : "text-gray-400"}>
                {SUB_STAGE_LABELS[stage] ?? stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
