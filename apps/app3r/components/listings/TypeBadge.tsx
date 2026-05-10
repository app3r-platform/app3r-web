// ============================================================
// components/listings/TypeBadge.tsx — Colored type badge
// ============================================================
import type { ListingType } from "../../lib/types";

const config: Record<ListingType, { label: string; className: string }> = {
  resell: { label: "ขายมือสอง", className: "bg-green-100 text-green-700" },
  scrap:  { label: "ซาก",       className: "bg-gray-100 text-gray-700" },
  repair: { label: "ซ่อม",      className: "bg-blue-100 text-blue-700" },
  maintain: { label: "บำรุงรักษา", className: "bg-orange-100 text-orange-700" },
};

interface TypeBadgeProps {
  type: ListingType;
  className?: string;
}

export default function TypeBadge({ type, className = "" }: TypeBadgeProps) {
  const cfg = config[type];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
