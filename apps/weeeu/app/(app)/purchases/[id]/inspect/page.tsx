"use client";

import { use, useState } from "react";
import Link from "next/link";

const MOCK_ITEM = {
  name: "แอร์ Daikin 12000 BTU มือสอง",
  price: 4200,
};

const CHECKLIST = [
  "สภาพตรงตามประกาศ",
  "ครบอุปกรณ์",
  "ทดสอบการทำงาน",
  "ไม่มีรอยแตกหัก",
];

export default function PurchaseInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));

  const toggleCheck = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const allChecked = checked.every(Boolean);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href={`/purchases/${id}`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับรายละเอียดการซื้อ
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-weeeu-dark">ตรวจรับสินค้า</h1>
          <p className="text-sm text-gray-400 mt-0.5">กรุณาตรวจสอบสินค้าก่อนยืนยันรับ</p>
        </div>

        {/* Item summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">สินค้าที่ซื้อ</p>
              <p className="text-sm font-semibold text-weeeu-dark">{MOCK_ITEM.name}</p>
            </div>
            <p className="text-lg font-bold text-weeeu-primary">{MOCK_ITEM.price.toLocaleString()} ฿</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-weeeu-dark">รายการตรวจสอบ</p>
          <div className="space-y-3">
            {CHECKLIST.map((item, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleCheck(i)}>
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    checked[i] ? "bg-weeeu-primary border-weeeu-primary" : "border-gray-300 group-hover:border-weeeu-primary"
                  }`}
                >
                  {checked[i] && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className={`text-sm ${checked[i] ? "text-weeeu-dark font-medium" : "text-gray-600"}`}>{item}</span>
              </label>
            ))}
          </div>
          {allChecked && (
            <p className="text-xs text-green-600 font-medium bg-green-50 rounded-lg px-3 py-2">
              ✅ ตรวจสอบครบทุกรายการแล้ว
            </p>
          )}
        </div>

        {/* Photo upload placeholder */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-3xl">📷</p>
          <p className="text-sm text-gray-500 font-medium">แนบรูปสินค้า (ไม่บังคับ)</p>
          <p className="text-xs text-gray-300">กดเพื่ออัปโหลดรูปภาพ</p>
          <button className="mt-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-xl transition-colors">
            เลือกรูป
          </button>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Link href={`/purchases/${id}/complete`}>
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ✅ ตรงปก — ยืนยันรับ
            </button>
          </Link>
          <Link href={`/purchases/${id}/dispute`}>
            <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ⚠️ ไม่ตรงปก — แจ้งปัญหา
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
