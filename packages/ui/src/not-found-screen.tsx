import * as React from "react";

/**
 * D14 NotFoundScreen — Shared 404 component for all 5 App3R apps
 *
 * Server Component-friendly (pure presentational, no client hooks).
 * Each app passes its `roleTheme` so brand colors stay consistent per role.
 *
 * Usage (Website):
 *   <NotFoundScreen roleTheme={{ primary: "#1E9E5A" }} />
 *
 * Usage (WeeeR):
 *   <NotFoundScreen roleTheme={{ primary: "#2563EB" }} />
 */
export interface NotFoundScreenProps {
  roleTheme?: { primary: string; surface?: string };
  title?: string;
  message?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function NotFoundScreen({
  roleTheme = { primary: "#1E9E5A" },
  title = "ไม่พบหน้านี้ (Not Found)",
  message = "ขออภัย หน้าที่คุณมองหาอาจถูกย้ายหรือลบ",
  ctaHref = "/",
  ctaLabel = "กลับหน้าหลัก",
}: NotFoundScreenProps) {
  const surfaceStyle: React.CSSProperties = roleTheme.surface
    ? { backgroundColor: roleTheme.surface }
    : {};

  return (
    <main
      className="min-h-[60vh] flex items-center justify-center px-4 py-16"
      style={surfaceStyle}
    >
      <div className="max-w-md w-full text-center">
        <div
          className="text-7xl sm:text-8xl font-extrabold mb-4 select-none"
          style={{ color: roleTheme.primary }}
          aria-hidden="true"
        >
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
        <a
          href={ctaHref}
          className="inline-block px-6 py-3 rounded-lg font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: roleTheme.primary }}
        >
          {ctaLabel}
        </a>
      </div>
    </main>
  );
}
