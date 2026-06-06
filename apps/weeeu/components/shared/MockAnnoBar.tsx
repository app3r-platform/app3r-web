// MockAnnoBar — weeeu canonical annotation bar for mockup pages
// Replaces inline colour-coded annotation boxes in P2/P3 flow mockups
// Usage: <MockAnnoBar variant="dispute" label="⚖️ Dispute Flow">…</MockAnnoBar>
// HUB Gen 53 · @/components/shared/MockAnnoBar

import type { ReactNode } from "react";

export type MockAnnoVariant =
  | "origin"       // §5 amber  — source screen
  | "nav"          // §6 blue   — destination nav
  | "xapp"         // §8 green  — cross-app views
  | "decision-b1"  // orange    — B1.2 re-price branch
  | "decision-b2"  // teal      — B2.2 scrap branch
  | "dispute"      // purple    — dispute / admin-intervene flow
  | "hybrid"       // indigo    — M5 hybrid job
  | "warning"      // red       — caution / penalty
  | "info";        // gray      — general note

interface MockAnnoBarProps {
  /** Visual theme of the annotation bar */
  variant?: MockAnnoVariant;
  /** Short label shown in bold at the top, e.g. "⚖️ Dispute Flow" */
  label: string;
  /** Additional Tailwind classes for the outer wrapper */
  className?: string;
  children: ReactNode;
}

const VARIANT_STYLES: Record<
  MockAnnoVariant,
  { bar: string; title: string; body: string }
> = {
  origin:       { bar: "bg-amber-50 border border-amber-400",            title: "text-amber-900",  body: "text-amber-800"  },
  nav:          { bar: "bg-blue-50 border border-dashed border-blue-400", title: "text-blue-900",   body: "text-blue-800"   },
  xapp:         { bar: "bg-green-50 border border-green-400",             title: "text-green-900",  body: "text-green-800"  },
  "decision-b1":{ bar: "bg-orange-50 border border-orange-300",           title: "text-orange-800", body: "text-orange-700" },
  "decision-b2":{ bar: "bg-teal-50 border border-teal-300",               title: "text-teal-800",   body: "text-teal-700"   },
  dispute:      { bar: "bg-purple-50 border border-purple-300",           title: "text-purple-800", body: "text-purple-700" },
  hybrid:       { bar: "bg-indigo-50 border border-indigo-300",           title: "text-indigo-800", body: "text-indigo-700" },
  warning:      { bar: "bg-red-50 border border-red-300",                 title: "text-red-800",    body: "text-red-700"    },
  info:         { bar: "bg-gray-50 border border-gray-300",               title: "text-gray-700",   body: "text-gray-600"   },
};

export function MockAnnoBar({
  variant = "info",
  label,
  className = "",
  children,
}: MockAnnoBarProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <div className={`${s.bar} rounded-xl p-4 ${className}`}>
      <p className={`text-sm font-bold ${s.title} mb-1`}>{label}</p>
      <div className={`text-xs ${s.body}`}>{children}</div>
    </div>
  );
}
