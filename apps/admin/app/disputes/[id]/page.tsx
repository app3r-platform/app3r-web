"use client";

import { use, useState } from "react";
import Link from "next/link";

export default function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedResolution, setSelectedResolution] = useState<string | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Back link */}
      <Link href="/disputes" className="text-gray-400 hover:text-gray-600 text-sm">
        &larr; กลับรายการ Disputes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          ⚖️ Dispute — Parts #{id}
        </h1>
        <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold px-3 py-1.5 rounded-full">
          🔍 รอ Admin ตัดสิน
        </span>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* LEFT: Buyer + Order */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              ข้อมูลผู้ซื้อ
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">ชื่อร้าน</span>
                <span className="text-sm font-medium text-gray-800">ร้านซ่อมดีเจริญ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">ติดต่อ</span>
                <span className="text-sm font-medium text-gray-800">081-234-5678</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">อีเมล</span>
                <span className="text-sm font-medium text-gray-800">buyer@deecharoen.co.th</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              ข้อมูลคำสั่งซื้อ
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">อะไหล่</span>
                <span className="text-sm font-medium text-gray-800">คอมเพรสเซอร์ Daikin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">ราคา</span>
                <span className="text-sm font-medium text-gray-800">3,500 ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">วันที่สั่งซื้อ</span>
                <span className="text-sm font-medium text-gray-800">20 พ.ค. 2569</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Seller + Dispute reason */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              ข้อมูลผู้ขาย
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">ชื่อร้าน</span>
                <span className="text-sm font-medium text-gray-800">ร้านอะไหล่ไทยแลนด์</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">ติดต่อ</span>
                <span className="text-sm font-medium text-gray-800">02-987-6543</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">อีเมล</span>
                <span className="text-sm font-medium text-gray-800">seller@thaiparts.co.th</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              เหตุผล Dispute
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              ได้รับอะไหล่ผิดรุ่น — สั่ง FTXS35 ได้รับ FTXS25
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">รุ่นที่สั่ง</span>
                <span className="text-sm font-medium text-green-600">FTXS35</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">รุ่นที่ได้รับ</span>
                <span className="text-sm font-medium text-red-500">FTXS25</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          หลักฐานที่แนบ
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

      {/* Resolution */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          คำตัดสิน
        </p>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setSelectedResolution("A")}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold border transition-colors ${
              selectedResolution === "A"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-green-400"
            }`}
          >
            ✅ คืนเงินผู้ซื้อ (ตัดสิน A)
          </button>
          <button
            onClick={() => setSelectedResolution("B")}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold border transition-colors ${
              selectedResolution === "B"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
            }`}
          >
            📦 สั่งให้ผู้ขายส่งใหม่ (ตัดสิน B)
          </button>
          <button
            onClick={() => setSelectedResolution("C")}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold border transition-colors ${
              selectedResolution === "C"
                ? "bg-yellow-500 text-white border-yellow-500"
                : "bg-white text-gray-700 border-gray-200 hover:border-yellow-400"
            }`}
          >
            ⚖️ แบ่งกลาง (ตัดสิน C)
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="บันทึกเหตุผลประกอบคำตัดสิน..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-primary resize-none"
        />
        <button
          disabled={!selectedResolution}
          className="mt-3 bg-admin-primary hover:bg-admin-dark text-white font-semibold py-2.5 px-5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          บันทึกคำตัดสิน{selectedResolution ? ` (${selectedResolution})` : ""}
        </button>
      </div>

      {/* Audit log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Audit Log
        </p>
        <p className="text-xs text-gray-400 italic">บันทึกการดำเนินการ...</p>
      </div>
    </div>
  );
}