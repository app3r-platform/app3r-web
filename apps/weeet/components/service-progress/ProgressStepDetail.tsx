"use client";
import type { ProgressStep } from "@/lib/types/service-progress";
import { ProgressMediaGallery } from "./ProgressMediaGallery";

function formatDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

const ROLE_LABEL: Record<string, string> = {
  weeeu: "ลูกค้า",
  weeer: "ร้านค้า",
  weeet: "ช่าง",
};

export function ProgressStepDetail({ step }: { step: ProgressStep }) {
  return (
    <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/60 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white">{step.label}</p>
        {step.completedAt && (
          <span className="text-xs text-gray-400 shrink-0">{formatDate(step.completedAt)}</span>
        )}
      </div>
      {step.completedByRole && (
        <p className="text-xs text-gray-500">บันทึกโดย: {ROLE_LABEL[step.completedByRole] ?? step.completedByRole}</p>
      )}
      {step.notes && (
        <p className="text-xs text-gray-300 bg-gray-900/40 rounded-lg px-3 py-2">{step.notes}</p>
      )}
      {step.extraFields && Object.keys(step.extraFields).length > 0 && (
        <div className="space-y-1">
          {Object.entries(step.extraFields).map(([k, v]) => (
            <p key={k} className="text-xs text-gray-400">
              <span className="text-gray-500">{k}:</span> <span className="text-white font-mono">{v}</span>
            </p>
          ))}
        </div>
      )}
      {step.media && <ProgressMediaGallery media={step.media} />}
    </div>
  );
}
