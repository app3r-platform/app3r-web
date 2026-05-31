"use client";

import { use, useState } from "react";
import Link from "next/link";

export default function ScrapDisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [resolution, setResolution] = useState<string | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Back link */}
      <Link href="/scrap/disputes" className="text-gray-400 hover:text-gray-600 text-sm">
        &larr; กลับรายการ Scrap Disputes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          ♻️ Scrap Dispute — S11 #{id}
        </h1>
        <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold px-3 py-1.5 rounded-full">
          🔍 รอ Admin ตัดสิน
        </span>
      </div>

      {/* Scrap job summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          สรุปงาน Scrap
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">งาน #</span>
            <span className="text-sm font-medium text-gray-800">s001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">เจ้าของซาก</span>
            <span className="text-sm font-medium text-gray-800">สมศรี</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ร้านรับซาก</span>
            <span className="text-sm font-medium text-gray-800">ร้านดีเจริญ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ราคาตกลง</span>
            <span className="text-sm font-medium text-gray-800">850 ฿</span>
          </div>
        </div>
      </div>

      {/* Dispute reason */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          เหตุผล Dispute
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          ร้านรับซากแจ้งว่าของไม่ตรงประกาศ (S8) ขอคืน escrow
        </p>
      </div>

      {/* Evidence from shop */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          หลักฐานจากร้านรับซาก
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-xs text-gray-400">📷 รูปหลักฐาน 1</span>
          </div>
          <div className="h-40 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
            <span className="text-xs text-gray-400">📷 รูปหลักฐาน 2</span>
          </div>
        </div>
      </div>

      {/* Escrow */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
        <span className="text-xl">💰</span>
        <div>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">ระบบพักเงินกลาง (Escrow)</p>
          <p className="text-sm font-medium text-gray-800">เงินพักกลาง (Escrow) ค้าง: 850 ฿</p>
        </div>
      </div>

      {/* Resolution */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          คำตัดสิน
        </p>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setResolution("S11-A")}
            className={`bg-admin-primary hover:bg-admin-dark text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-opacity ${
              resolution !== null && resolution !== "S11-A" ? "opacity-50" : "opacity-100"
            }`}
          >
            🔄 [A] คืน escrow ให้ผู้รับซาก (S11-A)
          </button>
          <button
            onClick={() => setResolution("S11-B")}
            className={`border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 px-5 rounded-xl text-sm transition-all ${
              resolution === "S11-B" ? "border-green-500 bg-green-50 text-green-700" : ""
            }`}
          >
            ✅ [B] โอน escrow ให้เจ้าของซาก (S11-B)
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="บันทึกเหตุผลประกอบคำตัดสิน..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-primary resize-none mb-3"
        />
        <button
          disabled={!resolution}
          className="bg-admin-primary hover:bg-admin-dark text-white font-semibold py-2.5 px-5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          บันทึกคำตัดสิน
        </button>
      </div>
    </div>
  );
}