"use client";

// ── ProgressStepDetail — Phase C-5 ───────────────────────────────────────────

import { ProgressMediaGallery } from "./ProgressMediaGallery";

interface ProgressStepDetailProps {
  timestamp: string;
  actor: "weeet" | "weeer" | "system";
  actorName?: string;
  notes?: string;
  media?: string[];
}

const ACTOR_LABEL: Record<string, string> = {
  weeet: "👷 WeeeT",
  weeer: "🏪 ร้าน",
  system: "⚙️ ระบบ",
};

export function ProgressStepDetail({
  timestamp,
  actor,
  actorName,
  notes,
  media,
}: ProgressStepDetailProps) {
  const time = new Date(timestamp).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="ml-7 mt-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>{ACTOR_LABEL[actor]}{actorName ? ` — ${actorName}` : ""}</span>
        <span>·</span>
        <span>{time}</span>
      </div>
      {notes && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{notes}</p>
      )}
      {media && media.length > 0 && (
        <ProgressMediaGallery media={media} />
      )}
    </div>
  );
}
