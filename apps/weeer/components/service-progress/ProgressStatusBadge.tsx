"use client";

// ── ProgressStatusBadge — Phase C-5 ──────────────────────────────────────────

interface ProgressStatusBadgeProps {
  label: string;
  colorClass: string;  // e.g. "bg-orange-100 text-orange-700"
  icon?: string;
  size?: "sm" | "md";
}

export function ProgressStatusBadge({
  label,
  colorClass,
  icon,
  size = "md",
}: ProgressStatusBadgeProps) {
  const sizeClass = size === "sm"
    ? "text-xs px-2 py-0.5"
    : "text-xs font-medium px-2.5 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${colorClass}`}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
