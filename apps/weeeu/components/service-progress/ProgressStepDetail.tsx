"use client";

import { useState } from "react";
import type { ProgressStep } from "@/lib/types/service-progress";
import { ProgressMediaGallery } from "./ProgressMediaGallery";

const ROLE_LABEL: Record<string, string> = {
  weeeu: "ลูกค้า",
  weeer: "ร้านซ่อม",
  weeet: "ช่าง",
};

const ROLE_COLOR: Record<string, string> = {
  weeeu: "bg-blue-100 text-blue-700",
  weeer: "bg-green-100 text-green-700",
  weeet: "bg-orange-100 text-orange-700",
};

interface Props {
  step: ProgressStep;
  index: number;
}

export function ProgressStepDetail({ step, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasMedia =
    step.media.images.length > 0 || step.media.videos.length > 0;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Step number */}
        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {step.subStage
              ? step.subStage.replace(/_/g, " ")
              : step.stage.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(step.enteredAt).toLocaleString("th-TH", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>

        {/* Role badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ROLE_COLOR[step.recordedBy.role] ?? "bg-gray-100 text-gray-600"}`}
        >
          {ROLE_LABEL[step.recordedBy.role] ?? step.recordedBy.role}
        </span>

        {/* Media indicator */}
        {hasMedia && (
          <span className="text-gray-300 text-xs shrink-0">📷</span>
        )}

        {/* Chevron */}
        <span className="text-gray-300 text-sm shrink-0">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-50">
          {/* Recorded by */}
          <p className="text-xs text-gray-500">
            บันทึกโดย: <span className="font-medium text-gray-700">{step.recordedBy.name}</span>
          </p>

          {/* Notes */}
          {step.notes && (
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">
              {step.notes}
            </p>
          )}

          {/* Exit time */}
          {step.exitedAt && (
            <p className="text-xs text-gray-400">
              สิ้นสุด:{" "}
              {new Date(step.exitedAt).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}

          {/* Media gallery */}
          {hasMedia && <ProgressMediaGallery media={step.media} />}
        </div>
      )}
    </div>
  );
}
