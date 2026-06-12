import * as React from "react";

/**
 * D15 LoadingScreen — Shared loading indicator for all 5 App3R apps
 *
 * Server Component-friendly (pure presentational, CSS-only spinner).
 * Each app passes `roleTheme.primary` to keep brand color per role.
 *
 * Usage:
 *   <LoadingScreen roleTheme={{ primary: "#1E9E5A" }} label="กำลังโหลด..." />
 */
export interface LoadingScreenProps {
  roleTheme?: { primary: string };
  label?: string;
}

export function LoadingScreen({
  roleTheme = { primary: "#1E9E5A" },
  label = "กำลังโหลด...",
}: LoadingScreenProps) {
  const ringStyle: React.CSSProperties = {
    borderColor: `${roleTheme.primary}33`, // 20% opacity ring
    borderTopColor: roleTheme.primary,
  };

  return (
    <main
      className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-14 h-14 rounded-full border-4 animate-spin mb-5"
        style={ringStyle}
        aria-hidden="true"
      />
      <p className="text-gray-600 font-medium tracking-wide animate-pulse">{label}</p>
    </main>
  );
}
