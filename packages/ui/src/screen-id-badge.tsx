import * as React from "react";

/**
 * D15 ScreenIdBadge — Shared screen-identifier badge for all 5 App3R apps
 *
 * Server Component-friendly (pure presentational, no client hooks/state).
 * Renders a tiny fixed-corner pill showing the screen id (e.g. "U-12", "R-04")
 * so อ.PP review rounds go faster — a short code is easy to point at on screen.
 *
 * Each app passes `roleTheme.primary` to brand the badge per role; it defaults
 * to website green (#1E9E5A). Marked `aria-hidden` by default because it is a
 * dev/review aid, not real page content — flip `exposeToA11y` to surface it.
 * It never blocks the UI underneath (`pointer-events-none`) and stays small.
 *
 * Wiring into each app's layout is a separate task (Wave B-2); this module only
 * provides the component + types.
 *
 * Usage:
 *   <ScreenIdBadge screenId="U-12" roleTheme={{ primary: "#1E9E5A" }} />
 *   <ScreenIdBadge screenId="R-04" position="top-left" />
 */
export type ScreenBadgeCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ScreenIdBadgeProps {
  /** Screen identifier shown in the badge, e.g. "U-12" / "R-04". */
  screenId: string;
  /** Brand color for the badge; falls back to website green (#1E9E5A). */
  roleTheme?: { primary?: string };
  /** Which screen corner to pin to. Default: "bottom-right". */
  position?: ScreenBadgeCorner;
  /** Expose to screen readers instead of hiding it. Default: false (aria-hidden). */
  exposeToA11y?: boolean;
}

const CORNER_CLASS: Record<ScreenBadgeCorner, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

export function ScreenIdBadge({
  screenId,
  roleTheme,
  position = "bottom-right",
  exposeToA11y = false,
}: ScreenIdBadgeProps) {
  const primary = roleTheme?.primary ?? "#1E9E5A";

  return (
    <span
      className={`fixed z-50 pointer-events-none select-none rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-white opacity-70 shadow-sm ${CORNER_CLASS[position]}`}
      style={{ backgroundColor: primary }}
      aria-hidden={exposeToA11y ? undefined : true}
      data-screen-id={screenId}
    >
      {screenId}
    </span>
  );
}
