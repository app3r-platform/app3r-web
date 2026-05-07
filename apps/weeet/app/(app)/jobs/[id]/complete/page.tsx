"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";

export default function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await repairApi.complete(id);
      router.replace("/jobs");
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-6">
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <h1 className="font-bold text-white">T6 — ยืนยันปิดงาน</h1>
      </div>

      <div className="px-4 pt-8 space-y-6">
        <div className="text-center space-y-3">
          <p className="text-6xl">✅</p>
          <h2 className="text-xl font-bold text-white">ยืนยันงานเสร็จสิ้น</h2>
          <p className="text-gray-400 text-sm">
            กดปุ่มด้านล่างเพื่อยืนยันว่างานซ่อมเสร็จสมบูรณ์<br />
            หลังจากนี้ระบบจะส่งสรุปให้ WeeeR ตรวจสอบ
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3 text-sm">
          <p className="text-white font-semibold">ก่อนปิดงาน ตรวจสอบว่า:</p>
          {[
            "ส่งรูปก่อน/หลังซ่อมครบแล้ว",
            "ทดสอบเครื่องใช้ไฟฟ้าเรียบร้อย",
            "แจ้งลูกค้าและรับทราบผลแล้ว",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-300">
              <span className="text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-orange-500"
          />
          <span className="text-sm text-gray-300">
            ฉันยืนยันว่าซ่อมเสร็จเรียบร้อย และลูกค้าได้รับทราบผลแล้ว
          </span>
        </label>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={handleComplete}
          disabled={!confirmed || submitting}
          className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><span className="animate-spin">⏳</span> กำลังบันทึก...</>
          ) : (
            "✅ ยืนยันปิดงาน"
          )}
        </button>

        <button
          onClick={() => router.back()}
          disabled={submitting}
          className="w-full text-gray-400 hover:text-gray-300 text-sm py-2"
        >
          ยกเลิก — กลับไปหน้างาน
        </button>
      </div>
    </div>
  );
}
