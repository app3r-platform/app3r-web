"use client";

import { use, useState } from "react";
import Link from "next/link";

const CHECKLIST = [
  "สภาพตรงตามประกาศ",
  "ทดสอบการทำงานได้",
  "ครบอุปกรณ์ตามที่แจ้ง",
  "ไม่มีความเสียหายที่ไม่ได้แจ้ง",
];

export default function ResellPurchaseInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  const allChecked = checked.every(Boolean);

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/resell/purchases/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ตรวจรับสินค้า</h1>
      </div>

      {/* Item summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">สรุปรายการสินค้า</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">สินค้า</p>
            <p className="text-sm font-medium text-gray-800">แอร์ Daikin 12000 BTU</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ราคาที่ซื้อ</p>
            <p className="text-sm font-semibold text-green-700">4,200 ฿</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">จากร้าน</p>
            <p className="text-sm font-medium text-gray-800">บริษัท ตัวอย่าง จำกัด</p>
          </div>
        </div>
      </div>

      {/* Inspection checklist */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รายการตรวจรับ</p>
        <div className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                ${checked[i] ? "border-green-200 bg-green-50" : "border-gray-100 hover:bg-gray-50"}`}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="w-4 h-4 accent-green-600"
              />
              <span className={`text-sm ${checked[i] ? "text-green-800 font-medium" : "text-gray-700"}`}>
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Photo upload placeholder */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">แนบรูปการตรวจรับ</p>
        <div className="border-2 border-dashed border-gray-200 rounded-xl h-28 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gray-300 transition-colors">
          <span className="text-2xl">📷</span>
          <p className="text-xs text-gray-400">คลิกเพื่อเลือกรูป</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          disabled={!allChecked}
          className={`w-full font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors
            ${allChecked
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          ✅ ยืนยันรับ (ตรงปก)
        </button>
        <Link
          href={`/resell/purchases/${id}/dispute`}
          className="w-full block text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
        >
          ⚠️ พบปัญหา → แจ้ง Dispute
        </Link>
      </div>
    </div>
  );
}
