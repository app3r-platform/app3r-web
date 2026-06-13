"use client";

import { use, useState, useEffect } from "react";
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
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [clipFile, setClipFile] = useState<File | null>(null);
  const [hasWarranty, setHasWarranty] = useState(false);

  // ── D3: DEV mock attach — pre-select reason + attach mock evidence ────────────
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return;
    setSelectedReason(REASONS[0]);
    try {
      const b64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAQCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: "image/jpeg" });
      setPhotoFiles([new File([blob], "mock-evidence.jpg", { type: "image/jpeg" })]);
    } catch { /* ignore — dev only */ }
  }, []);

  const canSubmit = selectedReason !== "" && description.trim() !== "" && photoFiles.length >= 3 && !submitted;

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
            {/* 7-day rule notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <span className="text-amber-500 text-lg leading-none">⏱️</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">แจ้งปัญหาได้ภายใน 7 วันนับจากรับสินค้า</p>
                <p className="text-xs text-amber-700 mt-0.5">หลังพ้นกำหนด ระบบจะปล่อยพอยต์ทองให้ผู้ขายอัตโนมัติ</p>
              </div>
            </div>

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

            {/* Photo upload — ≥3 required */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-weeeu-dark">รูปหลักฐาน <span className="text-red-500">*</span></p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${photoFiles.length >= 3 ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {photoFiles.length}/3 ขั้นต่ำ (สูงสุด 5)
                </span>
              </div>
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-weeeu-primary/40 transition-colors">
                <span className="text-2xl">📷</span>
                <p className="text-xs text-gray-500">เลือกรูปสินค้า / หลักฐานปัญหา (JPG/PNG)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    setPhotoFiles(prev => [...prev, ...files].slice(0, 5));
                    e.target.value = "";
                  }}
                />
                <span className="border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg">เลือกรูป</span>
              </label>
              {photoFiles.length > 0 && (
                <p className="text-xs text-weeeu-primary font-medium">✅ {photoFiles.length} ไฟล์แนบแล้ว</p>
              )}
              {photoFiles.length < 3 && photoFiles.length > 0 && (
                <p className="text-xs text-red-500">ต้องแนบอย่างน้อย 3 รูป (เหลืออีก {3 - photoFiles.length} รูป)</p>
              )}
            </div>

            {/* Clip / video placeholder */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
              <p className="text-sm font-semibold text-weeeu-dark">วิดีโอ/คลิปหลักฐาน (ถ้ามี)</p>
              <label className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-weeeu-primary/40 transition-colors">
                <span className="text-xl">🎥</span>
                <div>
                  <p className="text-xs text-gray-600">แนบคลิปแสดงปัญหา (ไม่บังคับ)</p>
                  <p className="text-xs text-gray-400">MP4 · สูงสุด 30 วินาที</p>
                </div>
                <input type="file" accept="video/*" className="hidden" onChange={e => setClipFile(e.target.files?.[0] ?? null)} />
              </label>
              {clipFile && <p className="text-xs text-weeeu-primary">✅ {clipFile.name}</p>}
            </div>

            {/* Warranty checkbox */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setHasWarranty(v => !v)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${hasWarranty ? "bg-weeeu-primary border-weeeu-primary" : "border-gray-300"}`}
                >
                  {hasWarranty && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">สินค้าอยู่ในช่วงรับประกัน</p>
                  <p className="text-xs text-gray-400 mt-0.5">เพิ่มน้ำหนักข้อพิพาท — Admin ตรวจสอบกับผู้ขาย</p>
                </div>
              </label>
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
