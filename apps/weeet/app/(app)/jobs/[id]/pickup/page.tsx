"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpTip } from "@app3r/ui";

export default function ScrapPickupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [conditionMatch, setConditionMatch] = useState<boolean | null>(null);
  const [gpsRecorded, setGpsRecorded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Back link */}
        <Link href={`/jobs/${id}`} className="text-gray-400 hover:text-gray-200 text-sm">
          &larr; กลับงาน #{id}
        </Link>

        {/* Header */}
        <h1 className="text-xl font-bold text-white mt-4 mb-6">
          📍 ถึงหน้างาน (S6)
        </h1>

        {/* Job summary */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-gray-700 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">สรุปงาน</p>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">งาน #</span>
            <span className="text-sm font-medium text-white">s001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ประเภทงาน</span>
            <span className="text-sm font-medium text-white">งานรับซาก — เครื่องซักผ้า Samsung</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ลูกค้า</span>
            <span className="text-sm font-medium text-white">บ้านลาดพร้าว</span>
          </div>
        </div>

        {/* GPS */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1">ตำแหน่ง GPS (ระบุตำแหน่ง) <HelpTip content="GPS — ระบบระบุพิกัดตำแหน่ง ใช้บันทึกตำแหน่งจริงตอนรับ/ส่งงาน"/></p>
          {gpsRecorded ? (
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-sm font-medium">✅ บันทึก GPS แล้ว</span>
            </div>
          ) : (
            <button
              onClick={() => setGpsRecorded(true)}
              className="w-full border border-gray-600 text-gray-300 hover:bg-gray-800 py-3 rounded-xl text-sm"
            >
              📍 บันทึก GPS ปัจจุบัน
            </button>
          )}
        </div>

        {/* Condition check */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
            สภาพซากตรงตามประกาศ?
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                checked={conditionMatch === true}
                onChange={() => setConditionMatch(true)}
                className="accent-orange-500"
              />
              <span className="text-sm text-white">ใช่ ✓</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                checked={conditionMatch === false}
                onChange={() => setConditionMatch(false)}
                className="accent-red-500"
              />
              <span className="text-sm text-white">ไม่ใช่ ✗</span>
            </label>
          </div>
        </div>

        {/* Photo area */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-6">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
            แนบรูปซาก ณ หน้างาน
          </p>
          <div className="h-36 bg-gray-800 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
            <div className="text-center">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-xs text-gray-500">แตะเพื่อเพิ่มรูป</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {conditionMatch === false ? (
          <button
            onClick={() => router.push(`/jobs/${id}/mismatch`)}
            className="w-full border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white font-semibold py-3 rounded-xl text-sm"
          >
            ⚠️ ของไม่ตรงประกาศ
          </button>
        ) : (
          <button
            onClick={() => router.push(`/jobs/${id}/complete`)}
            disabled={conditionMatch === null}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✅ ยืนยันรับซาก
          </button>
        )}
      </div>
    </div>
  );
}