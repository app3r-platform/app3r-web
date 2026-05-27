"use client";
// C1 — U-38 ส่งคำขอซ่อมสำเร็จ
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export default function RepairNewSuccessPage() {
  const router = useRouter();
  const ref = useMemo(
    () => "REF-" + Math.floor(10000000 + Math.random() * 90000000).toString(),
    []
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Success card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-weeeu-surface rounded-full flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">ดำเนินการสำเร็จ</h1>
          <p className="text-base font-semibold text-weeeu-primary">ส่งคำขอซ่อมสำเร็จ</p>
          <p className="text-sm text-gray-500">คำขอซ่อมของคุณถูกส่งแล้ว ช่างจะติดต่อกลับในเร็วๆ นี้</p>
        </div>
        <p className="text-xs font-mono text-gray-300 bg-gray-50 px-3 py-1.5 rounded-lg">{ref}</p>
      </div>

      {/* Action button */}
      <button
        onClick={() => router.push("/repair")}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
      >
        ดูสถานะงานซ่อม →
      </button>
    </div>
  );
}