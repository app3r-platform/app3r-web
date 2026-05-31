"use client";

// ── D-6 Return Defective (WeeeR Buyer) ────────────────────────────────────────
// POST /api/v1/parts/orders/:id/return-defective

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import type { D6PartsReturn } from "../../../_lib/d6-types";
import { RETURN_REASON_LABEL } from "../../../_lib/d6-types";

type ReasonType = D6PartsReturn["reason"];

const EVIDENCE_TIPS = [
  "ถ่ายรูปสินค้าชำรุดชัดเจน",
  "ถ่ายรูปกล่องบรรจุภัณฑ์",
  "ถ่ายรูป Serial Number (ถ้ามี)",
];

export default function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [reason, setReason] = useState<ReasonType>("defective");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleAddMockPhoto = () => {
    if (photos.length >= 5) return;
    const seed = Math.random().toString(36).slice(2, 8);
    setPhotos((p) => [...p, `https://picsum.photos/400/300?seed=${seed}`]);
  };

  const handleSubmit = () => {
    if (description.trim().length < 10) {
      setError("กรุณาอธิบายปัญหาอย่างน้อย 10 ตัวอักษร");
      return;
    }
    setError("");
    setSubmitting(true);

    // Mock API call
    setTimeout(() => {
      const ret: D6PartsReturn = {
        id: `RET-${Date.now()}`,
        orderId: id,
        reason,
        defectDescription: description,
        evidencePhotos: photos,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const saved: D6PartsReturn[] = JSON.parse(
        localStorage.getItem("d6_returns") ?? "[]"
      ) as D6PartsReturn[];
      saved.push(ret);
      localStorage.setItem("d6_returns", JSON.stringify(saved));

      setDone(true);
      setSubmitting(false);
    }, 800);
  };

  if (done) {
    return (
      <div className="px-4 pt-10 pb-4 text-center space-y-6">
        <p className="text-6xl">📨</p>
        <div>
          <h2 className="text-xl font-bold text-gray-800">แจ้งคืนสินค้าแล้ว</h2>
          <p className="text-sm text-gray-500 mt-1">ผู้ขายจะตรวจสอบและตอบกลับภายใน 24 ชั่วโมง</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 text-left">
          <p className="font-medium mb-1">สถานะ: รอพิจารณา (pending)</p>
          <p>ผู้ขายสามารถ: คืนเงิน / เปลี่ยนสินค้า / ให้เครดิต</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/parts/my-orders/${id}`)}
            className="px-5 py-2.5 bg-[#FF663A] text-white rounded-xl text-sm font-medium"
          >
            ดูออเดอร์
          </button>
          <button
            onClick={() => router.push("/parts/my-orders")}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
          >
            รายการออเดอร์
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">← กลับ</button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">แจ้งคืนสินค้า</h1>
          <p className="text-xs text-gray-500">ออเดอร์ #{id}</p>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">สาเหตุการคืน *</p>
        {(["defective", "wrong_part", "mismatch", "quality"] as ReasonType[]).map((r) => (
          <label key={r} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="w-4 h-4 text-orange-500"
            />
            <span className="text-sm text-gray-700">{RETURN_REASON_LABEL[r]}</span>
          </label>
        ))}
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-700">อธิบายปัญหา *</p>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError("");
          }}
          rows={4}
          placeholder="อธิบายสภาพความเสียหาย / ปัญหาที่พบอย่างละเอียด (อย่างน้อย 10 ตัวอักษร)"
          className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none resize-none ${error ? "border-red-300" : "border-gray-200 focus:border-orange-400"}`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-gray-400">{description.length}/1000 ตัวอักษร</p>
      </div>

      {/* Evidence photos */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">รูปหลักฐาน ({photos.length}/5)</p>
          {photos.length < 5 && (
            <button
              onClick={handleAddMockPhoto}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + เพิ่มรูป (Mock)
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="bg-amber-50 rounded-xl px-3 py-2 text-xs text-amber-700 space-y-0.5">
          {EVIDENCE_TIPS.map((t) => <p key={t}>• {t}</p>)}
        </div>

        {/* Photo previews */}
        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photos.map((url, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                <button
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 disabled:opacity-60 transition-colors"
      >
        {submitting ? "กำลังส่ง..." : "📨 ส่งคำขอคืนสินค้า"}
      </button>

      <p className="text-xs text-center text-gray-400">
        * เฉพาะสินค้าที่อยู่ในระยะประกัน และออเดอร์สถานะ fulfilled/closed
      </p>
    </div>
  );
}
