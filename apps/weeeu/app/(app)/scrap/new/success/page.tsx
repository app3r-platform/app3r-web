"use client";
// C4 — U-41 ส่งคำขอรับซากสำเร็จ
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export default function ScrapNewSuccessPage() {
  const router = useRouter();
  const ref = useMemo(
    () => "REF-" + Math.floor(10000000 + Math.random() * 90000000).toString(),
    []
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">ดำเนินการสำเร็จ</h1>
          <p className="text-base font-semibold text-weeeu-primary">ส่งคำขอรับซากสำเร็จ</p>
          <p className="text-sm text-gray-500">คำขอของคุณถูกส่งแล้ว ทีมงานจะดำเนินการและแจ้งให้ทราบ</p>
        </div>
        <p className="text-xs font-mono text-gray-300 bg-gray-50 px-3 py-1.5 rounded-lg">{ref}</p>
      </div>
      <button
        onClick={() => router.push("/scrap")}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
      >
        ดูสถานะซาก →
      </button>
    </div>
  );
}