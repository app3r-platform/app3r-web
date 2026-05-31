"use client";
// C9 — ลงขายอะไหล่สำเร็จ (WeeeR)
// Screen: R-40 / PARTS-NEW-SUCCESS · Phase 3 Sign-off

import { useMemo } from "react";
import { useRouter } from "next/navigation";

export default function PartsNewSuccessPage() {
  const router = useRouter();

  const ref = useMemo(
    () =>
      "REF-" +
      Math.floor(10000000 + Math.random() * 90000000).toString(),
    []
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 max-w-sm mx-auto text-center">
      {/* ✅ Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-4xl">✅</span>
      </div>

      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-gray-900">ลงขายอะไหล่สำเร็จ</h1>
        <p className="text-sm font-medium text-green-700">ดำเนินการสำเร็จ</p>
      </div>

      {/* Details */}
      <div className="bg-gray-50 rounded-2xl px-5 py-4 w-full space-y-2 text-left">
        <p className="text-sm text-gray-600">
          อะไหล่ของคุณถูกลงในตลาดแล้ว ผู้สนใจจะส่งออเดอร์มาในระบบ
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">หมายเลขอ้างอิง</span>
          <span className="text-xs font-mono font-medium text-gray-700">{ref}</span>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 w-full text-left">
        <p className="text-xs text-blue-700 font-medium">🔩 ขั้นตอนถัดไป</p>
        <p className="text-xs text-blue-600 mt-0.5">
          ติดตามสถานะออเดอร์ได้ที่ "รายการขายของฉัน" เมื่อมีผู้สั่งซื้อระบบจะแจ้งเตือนทันที
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/parts/my-listings")}
        className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-2xl transition-colors"
      >
        ดูรายการขายของฉัน
      </button>
    </div>
  );
}
