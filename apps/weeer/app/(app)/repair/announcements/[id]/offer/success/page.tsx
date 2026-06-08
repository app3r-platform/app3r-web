"use client";
// C7 — ส่งใบเสนอราคาสำเร็จ (WeeeR)
// Screen: R-38 / REPAIR-BID-SUCCESS · Phase 3 Sign-off

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MockAnnoOrigin, MockAnnoNav } from "@/components/MockAnno";

export default function RepairBidSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const ref = useMemo(
    () =>
      "REF-" +
      Math.floor(10000000 + Math.random() * 90000000).toString(),
    []
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 max-w-sm mx-auto text-center">
      <MockAnnoOrigin from="R-38" />
      {/* ✅ Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-4xl">✅</span>
      </div>

      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-gray-900">ส่งใบเสนอราคาสำเร็จ</h1>
        <p className="text-sm font-medium text-green-700">ดำเนินการสำเร็จ</p>
      </div>

      {/* Details */}
      <div className="bg-gray-50 rounded-2xl px-5 py-4 w-full space-y-2 text-left">
        <p className="text-sm text-gray-600">
          ใบเสนอราคางานซ่อมของคุณถูกส่งแล้ว รอลูกค้าตอบรับ
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">หมายเลขอ้างอิง</span>
          <span className="text-xs font-mono font-medium text-gray-700">{ref}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">ประกาศ ID</span>
          <span className="text-xs font-mono text-gray-500">{id}</span>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 w-full text-left">
        <p className="text-xs text-blue-700 font-medium">📢 ขั้นตอนถัดไป</p>
        <p className="text-xs text-blue-600 mt-0.5">
          ระบบจะแจ้งเตือนเมื่อลูกค้าตอบรับหรือปฏิเสธข้อเสนอของคุณ
        </p>
      </div>

      {/* CTA */}
      <MockAnnoNav to="R-01" label="ดูงานซ่อม" style={{ display: "contents" }}>
        <button
          onClick={() => router.push("/repair/jobs")}
          className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          ดูงานซ่อม
        </button>
      </MockAnnoNav>
    </div>
  );
}
