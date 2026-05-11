"use client";
import { CATEGORY_LABEL, CATEGORY_COLOR, type PartCategory } from "../../app/(app)/parts/_lib/types";

export function PartCategoryBadge({ category, size = "sm" }: { category: PartCategory; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${cls} ${CATEGORY_COLOR[category]}`}>
      {CATEGORY_LABEL[category]}
    </span>
  );
}
