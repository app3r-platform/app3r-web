"use client";

// ── ServiceProgressTimeline — Phase C-5 ──────────────────────────────────────
// Generic timeline that works for both Repair and Maintain progress

import { ProgressStageNode, type NodeState } from "./ProgressStageNode";

interface ProgressEntry {
  stage: string;
  timestamp: string;
  actor: "weeet" | "weeer" | "system";
  actor_name?: string;
  notes?: string;
  media?: string[];
}

interface StageDefinition {
  key: string;
  label: string;
  icon: string;
}

interface StageOrderMap {
  [key: string]: number;
}

interface ServiceProgressTimelineProps {
  stages: StageDefinition[];
  stageOrder: StageOrderMap;
  currentStage: string;
  entries: ProgressEntry[];
  /** Stages with negative order are terminal (cancelled/converted) */
  terminalStages?: string[];
}

export function ServiceProgressTimeline({
  stages,
  stageOrder,
  currentStage,
  entries,
  terminalStages = ["cancelled", "converted_scrap"],
}: ServiceProgressTimelineProps) {
  const currentOrder = stageOrder[currentStage] ?? -1;
  const isTerminal = terminalStages.includes(currentStage);

  /** Find the log entry for a given stage */
  const entryFor = (stageKey: string) =>
    entries.find((e) => e.stage === stageKey);

  const getNodeState = (stageKey: string): NodeState => {
    const order = stageOrder[stageKey] ?? -1;
    if (order < 0) return "pending";
    if (stageKey === currentStage) return isTerminal ? "done" : "active";
    if (order < currentOrder) return "done";
    return "pending";
  };

  return (
    <div className="space-y-0">
      {/* Terminal banner */}
      {isTerminal && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <span>🚫</span>
          <span>
            {currentStage === "cancelled"
              ? "งานถูกยกเลิก"
              : "งานถูกโอนไป Scrap"}
          </span>
        </div>
      )}

      {stages.map((stage, idx) => (
        <ProgressStageNode
          key={stage.key}
          icon={stage.icon}
          label={stage.label}
          state={getNodeState(stage.key)}
          entry={entryFor(stage.key)}
          isLast={idx === stages.length - 1}
        />
      ))}
    </div>
  );
}
