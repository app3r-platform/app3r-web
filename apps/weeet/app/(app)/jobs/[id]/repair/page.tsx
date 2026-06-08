"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpTip } from "@app3r/ui";
import OtpInput from "@/components/OtpInput";

export default function RepairCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [repairNote, setRepairNote] = useState("");
  const [parts, setParts] = useState("");
  const [finalPrice, setFinalPrice] = useState("1800");
  const [otp, setOtp] = useState("");

  // D2 — Mock OTP pre-fill (Phase 3 dev only)
  useEffect(() => {
    setOtp("123456");
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Back link */}
        <Link href={`/jobs/${id}`} className="text-gray-400 hover:text-gray-200 text-sm">
          &larr; กลับงาน #{id}
        </Link>

        {/* Header */}
        <h1 className="text-xl font-bold text-white mt-4 mb-6">
          ✅ บันทึกผลซ่อม (C1)
        </h1>

        {/* Job summary */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-gray-700 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">สรุปงาน</p>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">งาน #</span>
            <span className="text-sm font-medium text-white">c001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">อุปกรณ์</span>
            <span className="text-sm font-medium text-white">แอร์ Daikin FTKQ18TV2S</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ลูกค้า</span>
            <span className="text-sm font-medium text-white">#U-4821</span>
          </div>
        </div>

        {/* Repair notes */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">ผลการซ่อม</p>
          <textarea
            value={repairNote}
            onChange={(e) => setRepairNote(e.target.value)}
            placeholder="บันทึกรายละเอียดการซ่อม..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Photo area */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">แนบรูปหลังซ่อม</p>
          <div className="h-36 bg-gray-800 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
            <div className="text-center">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-xs text-gray-500">แตะเพื่อเพิ่มรูป</p>
            </div>
          </div>
        </div>

        {/* Parts used */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">อะไหล่ที่ใช้</p>
          <textarea
            value={parts}
            onChange={(e) => setParts(e.target.value)}
            placeholder="อะไหล่ที่ใช้..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Final price */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-6">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">ราคาสุดท้าย</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-sm font-semibold text-gray-300">฿</span>
          </div>
        </div>

        {/* OTP input */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 mb-6">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">OTP ยืนยันการรับมอบ <HelpTip content="OTP (One-Time Password) — รหัสยืนยันใช้ครั้งเดียว ส่งทาง SMS ใช้ยืนยันตอนรับ-ส่งมอบงาน"/></p>
          <p className="text-xs text-gray-600 mb-3">WeeeU จะได้รับ OTP — กรอกเพื่อยืนยัน</p>
          <OtpInput value={otp} onChange={setOtp} />
        </div>

        {/* Submit button */}
        <button
          onClick={() => router.push(`/jobs/${id}/repair/success`)}
          disabled={otp.length !== 6}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl text-sm mb-3 transition-colors"
        >
          📲 ส่งมอบ + ยืนยัน OTP
        </button>
        <p className="text-xs text-gray-500 text-center">
          WeeeU จะได้รับ OTP ยืนยันการรับงาน
        </p>
      </div>
    </div>
  );
}