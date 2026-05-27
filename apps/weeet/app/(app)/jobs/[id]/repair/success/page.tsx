"use client";
// C11 — บันทึกผลซ่อมสำเร็จ
// Phase 3 Success Page · ScreenBadge T-15
import { use } from "react";
import { useRouter } from "next/navigation";

export default function RepairSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-green-900/40 border-2 border-green-500/60 flex items-center justify-center">
            <span className="text-5xl">✅</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">บันทึกผลซ่อมสำเร็จ</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            ผลการซ่อมถูกบันทึกเรียบร้อยแล้ว ระบบจะแจ้งลูกค้าทราบ
          </p>
        </div>

        {/* Job ID badge */}
        <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-1.5">
          <span className="text-xs text-gray-400">งาน</span>
          <span className="text-sm font-mono font-semibold text-white">{id}</span>
        </div>

        {/* Action */}
        <button
          onClick={() => router.push("/jobs")}
          className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
        >
          กลับหน้างาน
        </button>
      </div>
    </div>
  );
}
