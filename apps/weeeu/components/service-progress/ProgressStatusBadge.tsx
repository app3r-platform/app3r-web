"use client";

import type { MainStage } from "@/lib/types/service-progress";

const STAGE_LABEL: Record<MainStage, string> = {
  posted: "รอข้อเสนอ",
  offer_accepted: "ยืนยันแล้ว",
  in_progress: "กำลังซ่อม",
  completed: "เสร็จสิ้น",
  reviewed: "รีวิวแล้ว ⭐",
};

const STAGE_COLOR: Record<MainStage, string> = {
  posted: "bg-gray-100 text-gray-600",
  offer_accepted: "bg-weeeu-surface text-weeeu-primary",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  reviewed: "bg-weeeu-surface text-weeeu-dark",
};

interface Props {
  stage: MainStage;
  size?: "sm" | "xs";
}

export function ProgressStatusBadge({ stage, size = "sm" }: Props) {
  const textClass = size === "xs" ? "text-xs" : "text-xs font-medium";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full ${textClass} ${STAGE_COLOR[stage]}`}>
      {STAGE_LABEL[stage] ?? stage}
    </span>
  );
}
