"use client";

import { useState } from "react";
import Link from "next/link";

export default function RepairCompletePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [repairNote, setRepairNote] = useState("");
  const [parts, setParts] = useState("");
  const [finalPrice, setFinalPrice] = useState("1800");

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

        {/* Submit button */}
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm mb-3">
          📲 ส่งมอบ + OTP
        </button>
        <p className="text-xs text-gray-500 text-center">
          WeeeU จะได้รับ OTP ยืนยันการรับงาน
        </p>
      </div>
    </div>
  );
}