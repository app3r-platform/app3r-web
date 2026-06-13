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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

        {/* Photo upload — warning ห้ามละเว้น */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-orange-500 text-lg leading-none">⚠️</span>
            <p className="text-sm text-orange-700 font-medium">ไม่แนบรูป/คลิป = สละสิทธิ์ แพลตฟอร์มไม่รับข้อพิพาท</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">📷</span>
            <p className="text-xs text-orange-600">กดเพื่ออัปโหลดรูปสินค้าที่รับมา</p>
            <button className="border border-orange-300 text-orange-700 hover:bg-orange-100 text-sm px-4 py-2 rounded-xl transition-colors">
              เลือกรูป
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!allChecked}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            ✅ ตรงปก — ยืนยันรับ
          </button>
          <Link href={`/purchases/${id}/dispute`}>
            <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ⚠️ ไม่ตรงปก — แจ้งปัญหา
            </button>
          </Link>
        </div>

        {/* Confirm modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-2xl">✅</p>
                <h2 className="text-lg font-bold text-gray-900">ยืนยันรับสินค้า?</h2>
                <p className="text-sm text-gray-500">ระบบจะโอนพอยต์ทองให้ผู้ขายทันที — ไม่สามารถแจ้งข้อพิพาทได้หลังยืนยัน</p>
              </div>
              <div className="flex gap-3">
                <Link href={`/purchases/${id}/complete`} className="flex-1">
                  <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                    ยืนยัน — โอนพอยต์ทองให้ผู้ขาย
                  </button>
                </Link>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
