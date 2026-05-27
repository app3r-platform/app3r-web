"use client";
// SuccessTrackingBanner — Phase 3 C+D
// ใช้ใน server component pages ที่ต้องการ tracking ref (useMemo ต้องอยู่ใน client)
import { useMemo } from "react";

interface SuccessTrackingBannerProps {
  title: string;
  /** สีพื้นหลัง: "green" (default) | "weeeu" */
  variant?: "green" | "weeeu";
}

export function SuccessTrackingBanner({ title, variant = "green" }: SuccessTrackingBannerProps) {
  const ref = useMemo(
    () => "REF-" + Math.floor(10000000 + Math.random() * 90000000).toString(),
    []
  );

  const bg = variant === "weeeu"
    ? "bg-weeeu-surface border-weeeu-primary/30 text-weeeu-dark"
    : "bg-green-50 border-green-200 text-green-800";

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${bg}`}>
      <span className="text-2xl shrink-0">✅</span>
      <div className="min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs opacity-60 font-mono mt-0.5">{ref}</p>
      </div>
    </div>
  );
}
