"use client";

// ── ProgressStageNode — Phase C-5 ────────────────────────────────────────────

import { ProgressStepDetail } from "./ProgressStepDetail";

export type NodeState = "done" | "active" | "pending";

interface ProgressEntry {
  stage: string;
  timestamp: string;
  actor: "weeet" | "weeer" | "system";
  actor_name?: string;
  notes?: string;
  media?: string[];
}

interface ProgressStageNodeProps {
  icon: string;
  label: string;
  state: NodeState;
  entry?: ProgressEntry;
  isLast?: boolean;
}

export function ProgressStageNode({
  icon,
  label,
  state,
  entry,
  isLast = false,
}: ProgressStageNodeProps) {
  const dotColor =
    state === "done"
      ? "bg-green-500 border-green-500"
      : state === "active"
      ? "bg-orange-400 border-orange-400 ring-4 ring-orange-100"
      : "bg-white border-gray-200";

  const labelColor =
    state === "done"
      ? "text-gray-700 font-medium"
      : state === "active"
      ? "text-orange-700 font-semibold"
      : "text-gray-400";

  return (
    <div className="relative flex gap-3">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-100" />
      )}

      {/* Stage dot */}
      <div className="shrink-0 mt-0.5">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${dotColor}`}
        >
          {state === "done" ? (
            <span className="text-white text-xs">✓</span>
          ) : state === "active" ? (
            <span className="text-white">{icon}</span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2">
          {state !== "done" && <span className="text-sm">{icon}</span>}
          <span className={`text-sm ${labelColor}`}>{label}</span>
          {state === "active" && (
            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
              ปัจจุบัน
            </span>
          )}
        </div>
        {entry && (
          <ProgressStepDetail
            timestamp={entry.timestamp}
            actor={entry.actor}
            actorName={entry.actor_name}
            notes={entry.notes}
            media={entry.media}
          />
        )}
      </div>
    </div>
  );
}
