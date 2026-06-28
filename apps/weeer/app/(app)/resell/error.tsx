"use client";

// ── Resell error boundary (W0-followup-2) ───────────────────────────────────
// safety net: crash ใดๆ ใน resell subtree = graceful UI ไม่ใช่ white-screen
// scope: resell-level (ไม่กระทบ module อื่น · scope-guard Resell only)

import { useEffect } from "react";
import Link from "next/link";

export default function ResellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[resell error boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <span className="text-5xl mb-4">⚠️</span>
      <h2 className="text-lg font-bold text-gray-900">เกิดข้อผิดพลาดในการแสดงผล</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">
        ขออภัย โหลดหน้านี้ไม่สำเร็จ — ลองใหม่อีกครั้ง หรือกลับไปหน้าขายต่อ
      </p>
      <div className="flex gap-3 mt-5">
        <button
          onClick={reset}
          className="bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          ลองใหม่
        </button>
        <Link
          href="/resell"
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          กลับหน้าขายต่อ
        </Link>
      </div>
    </div>
  );
}
