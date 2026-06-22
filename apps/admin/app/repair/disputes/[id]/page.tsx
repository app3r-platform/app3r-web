"use client";

import { use, useState } from "react";
import Link from "next/link";

export default function RepairDisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [action, setAction] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Back link */}
      <Link href="/repair/disputes" className="text-gray-400 hover:text-gray-600 text-sm">
        &larr; กลับรายการ Repair Disputes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          🔧 Repair Dispute — C9 Intervene #{id}
        </h1>
        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold px-3 py-1.5 rounded-full">
          🚨 Admin Intervene
        </span>
      </div>

      {/* Case timeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Case Timeline
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">งาน #</span>
            <span className="text-sm font-medium text-gray-800">c001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">WeeeU (ลูกค้า)</span>
            <span className="text-sm font-medium text-gray-800">สมศรี รัตนะ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">WeeeR (ร้านซ่อม)</span>
            <span className="text-sm font-medium text-gray-800">ร้านดีเจริญ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">WeeeT (ช่าง)</span>
            <span className="text-sm font-medium text-gray-800">สมชาย</span>
          </div>
        </div>
      </div>

      {/* Dispute reason */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          เหตุผล Dispute
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          ลูกค้าแจ้งว่าซ่อมแล้วยังเสียเหมือนเดิม ช่างบอกซ่อมเสร็จแล้ว
        </p>
      </div>

      {/* Evidence */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          หลักฐาน
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">ฝั่ง WeeeU (ลูกค้า)</p>
            <div className="h-36 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-400">📷 รูปหลักฐาน WeeeU</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">ฝั่ง WeeeT (ช่าง)</p>
            <div className="h-36 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-xs text-gray-400">📷 รูปหลักฐาน WeeeT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow status */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
        <span className="text-xl">💰</span>
        <div>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">สถานะระบบพักเงินกลาง (Escrow)</p>
          <p className="text-sm font-medium text-gray-800">Gold ที่ล็อก: 1,800 ฿</p>
        </div>
      </div>

      {/* Admin action */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Admin Action
        </p>
        <div className="space-y-3 mb-4">
          {[
            { val: "refund", label: "🔄 คืน Gold ให้ WeeeU (ยกเลิกงาน)" },
            { val: "release", label: "✅ โอน Gold ให้ WeeeR (งานเสร็จ)" },
            { val: "split", label: "⚖️ แบ่ง Gold ตามสัดส่วน" },
          ].map((opt) => (
            <label key={opt.val} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="adminAction"
                value={opt.val}
                checked={action === opt.val}
                onChange={() => setAction(opt.val)}
                className="accent-admin-primary"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="บันทึกเหตุผลประกอบคำตัดสิน..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-primary resize-none mb-3"
        />
        <button
          onClick={() => setSaved(true)}
          disabled={!action}
          className="bg-admin-primary hover:bg-admin-dark text-white font-semibold py-2.5 px-5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          บันทึกคำตัดสิน
        </button>
        {saved && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <p className="text-sm text-green-700 font-medium">
              บันทึกคำตัดสินเรียบร้อยแล้ว — ระบบจะดำเนินการตามที่เลือกและแจ้งทั้งสองฝ่าย (mock)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}