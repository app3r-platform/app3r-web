"use client";

// ============================================================
// app/error.tsx — Route error boundary (Website)
// W-01: error state สำหรับหน้าหลัก + sections (listing groups, testimonials)
// Brand chrome = green website-brand-* (#1E9E5A) · no off-brand color
// ============================================================
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // log ฝั่ง client (mockup) — ไม่เปิดเผย sensitive detail
    console.error("[App3R-Website] route error:", error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-5">
        <div className="w-20 h-20 bg-website-brand-50 rounded-full flex items-center justify-center text-4xl mx-auto">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-gray-900">เกิดข้อผิดพลาดบางอย่าง</h1>
        <p className="text-gray-600 text-sm">
          ขออภัย ไม่สามารถโหลดเนื้อหาส่วนนี้ได้ในขณะนี้ — ลองอีกครั้งหรือกลับสู่หน้าหลัก
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-website-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-website-brand-700 transition"
          >
            ลองอีกครั้ง
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 border border-website-brand-500 text-website-brand-700 rounded-lg text-sm font-semibold hover:bg-website-brand-50 transition"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
