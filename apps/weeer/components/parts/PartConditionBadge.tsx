"use client";
import { B2B_CONDITION_LABEL, B2B_CONDITION_COLOR, type PartListing } from "../../app/(app)/parts/_lib/types";

export function PartConditionBadge({ condition, size = "sm" }: { condition: PartListing["condition"]; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${cls} ${B2B_CONDITION_COLOR[condition]}`}>
      {B2B_CONDITION_LABEL[condition]}
    </span>
  );
}
