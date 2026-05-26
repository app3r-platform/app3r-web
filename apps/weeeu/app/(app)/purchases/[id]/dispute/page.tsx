"use client";

import { use, useState } from "react";
import Link from "next/link";

const REASONS = [
  "สภาพไม่ตรงตามประกาศ",
  "ขาดอุปกรณ์บางส่วน",
  "สินค้าชำรุด/เสียหาย",
  "ไม่ได้รับสินค้า",
];

export default function PurchaseDisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = selectedReason !== "" && !submitted;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href={`/purchases/${id}`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับรายละเอียดการซื้อ
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-weeeu-dark">แจ้งปัญหา (R-08)</h1>
          <p className="text-sm text-gray-400 mt-0.5">งาน #{id}</p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
            <p className="text-5xl">📋</p>
            <p className="text-base font-bold text-weeeu-dark">ส่งเรื่องแล้ว</p>
            <p className="text-sm text-gray-500">Admin จะติดต่อกลับภายใน 24 ชั่วโมง</p>
            <Link href={`/purchases/${id}`}>
              <button className="mt-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-5 py-2.5 rounded-xl transition-colors">
                กลับหน้าการซื้อ
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Reason selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-weeeu-dark">เหตุผลที่แจ้งปัญหา</p>
              <div className="space-y-2">
                {REASONS.map((reason) => (
                  <label key={reason} className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedReason(reason)}>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        selectedReason === reason ? "border-weeeu-primary" : "border-gray-300 group-hover:border-weeeu-primary"
                      }`}
                    >
                      {selectedReason === reason && (
                        <div className="w-2.5 h-2.5 rounded-full bg-weeeu-primary" />
                      )}
                    </div>
                    <span className={`text-sm ${selectedReason === reason ? "text-weeeu-dark font-medium" : "text-gray-600"}`}>
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description textarea */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
              <p className="text-sm font-semibold text-weeeu-dark">รายละเอียดเพิ่มเติม</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายปัญหาที่พบ..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30 resize-none"
              />
            </div>

            {/* Photo upload placeholder */}
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-2">
              <p className="text-2xl">📎</p>
              <p className="text-sm text-gray-500 font-medium">แนบรูปหลักฐาน</p>
              <p className="text-xs text-gray-300">รูปภาพสินค้า / หลักฐานปัญหา</p>
              <button className="mt-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-xl transition-colors">
                เลือกรูป
              </button>
            </div>

            {/* Submit button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                ส่งเรื่องให้ Admin พิจารณา
              </button>
              <p className="text-xs text-gray-400 text-center">Admin จะติดต่อกลับภายใน 24 ชั่วโมง</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
