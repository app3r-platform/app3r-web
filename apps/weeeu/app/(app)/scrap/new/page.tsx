"use client";

/**
 * WeeeU — ฟอร์มประกาศซากใหม่
 * S12: Cross-module Repair C4 — ถ้ามี ?from_repair=REP-xxxx ใน URL
 *      → แสดง context banner + pre-fill ข้อมูลจาก Repair Job
 *      ⚠️ ต่อยอด flow เดิม Repair C4 — ห้ามออกแบบใหม่ทับ
 */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// ── Mock: ดึงข้อมูล Repair Job (S12 pre-fill) ────────────────────────────────
function getMockRepairJobData(repairJobId: string) {
  // จำลองข้อมูลจาก Repair Job ที่ถูกส่งมา (B2.2 path: WeeeT วินิจฉัยซ่อมไม่คุ้ม)
  return {
    id: repairJobId,
    applianceName: "แอร์ Mitsubishi 12000 BTU",
    applianceType: "air_conditioner",
    diagnosis: "คอมเพรสเซอร์พัง ซ่อมไม่คุ้ม ราคาซ่อม > ราคาเครื่องใหม่",
    weeetAssessedPrice: 350, // WeeeT's assessed scrap price (Gold Point)
    estimatedWeightKg: 25,
    photos: ["/mock/repair-job-before-1.jpg", "/mock/repair-job-before-2.jpg"],
    address: "123/4 ถ.สุขุมวิท กรุงเทพ",
    grade: "grade_C" as const,
  };
}

// ── Inner component ที่ใช้ useSearchParams (ต้อง wrap ด้วย Suspense) ──────────
function NewScrapForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRepairId = searchParams.get("from_repair");

  // S12 — pre-fill ถ้ามาจาก Repair C4
  const repairData = fromRepairId ? getMockRepairJobData(fromRepairId) : null;

  const [listingType, setListingType] = useState<"sell" | "dispose">(
    repairData ? "sell" : "sell"
  );
  const [description, setDescription] = useState(
    repairData ? repairData.diagnosis : ""
  );
  const [price, setPrice] = useState(
    repairData ? String(repairData.weeetAssessedPrice) : ""
  );
  const [grade, setGrade] = useState(
    repairData ? repairData.grade : "grade_B" as "grade_A" | "grade_B" | "grade_C"
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert("✅ ประกาศซากเรียบร้อย — ระบบจะแจ้งเตือนเมื่อมีร้านยื่นข้อเสนอ");
      router.push("/scrap");
    }, 900);
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scrap" className="text-gray-400 hover:text-gray-700 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">♻️ ประกาศซากใหม่</h1>
          <p className="text-xs text-gray-400 mt-0.5">ไม่มีค่าธรรมเนียมประกาศ</p>
        </div>
      </div>

      {/* S12 — Context banner (เฉพาะ from_repair) */}
      {repairData && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-bold">🔧</span>
            <p className="text-sm font-semibold text-orange-800">
              งานซ่อม #{repairData.id} → แนะนำทิ้งซาก
            </p>
            <Link href={`/jobs/${repairData.id}`}
              className="ml-auto text-xs text-orange-600 hover:underline">
              ดูงานซ่อม ↗
            </Link>
          </div>
          <p className="text-xs text-orange-700">
            ช่างวินิจฉัย: <span className="font-medium">{repairData.diagnosis}</span>
          </p>
          <p className="text-xs text-orange-600">
            ราคาประเมิน: <span className="font-mono font-semibold">{repairData.weeetAssessedPrice} Gold Point</span>
            {" "}· น้ำหนักประมาณ {repairData.estimatedWeightKg} กก.
          </p>
          <p className="text-xs text-orange-500">
            ✅ ข้อมูลด้านล่างถูก pre-fill จากงานซ่อม — ตรวจสอบและแก้ไขได้
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

        {/* ประเภท: ขาย / ทิ้ง */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทประกาศ</label>
          <div className="flex gap-3">
            {(["sell", "dispose"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setListingType(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                  listingType === t
                    ? t === "sell"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-400 bg-gray-50 text-gray-700"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                {t === "sell" ? "💰 ขายซาก (WeeeR จ่าย Gold Point ให้คุณ)" : "🆓 ทิ้งซาก (ฟรี — ไม่รับเงิน)"}
              </button>
            ))}
          </div>
          {listingType === "sell" && (
            <p className="text-xs text-green-600 mt-2">
              ⚠️ escrow กลับทิศ: WeeeR (ร้าน) เป็นผู้จ่าย Gold Point ให้คุณ ไม่ใช่คุณจ่าย
            </p>
          )}
        </div>

        {/* เกรดสภาพ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">เกรดสภาพ</label>
          <div className="flex gap-2">
            {(["grade_A", "grade_B", "grade_C"] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  grade === g
                    ? g === "grade_A" ? "border-green-500 bg-green-50 text-green-700"
                    : g === "grade_B" ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "border-red-400 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                {g === "grade_A" ? "A — ดี" : g === "grade_B" ? "B — พอใช้" : "C — เสีย"}
              </button>
            ))}
          </div>
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            รายละเอียดซาก
            {repairData && <span className="ml-2 text-xs text-orange-500">(pre-filled จากงานซ่อม)</span>}
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="เช่น ตู้เย็น Samsung 2 ประตู — มอเตอร์พัง, แผงวงจรเสีย..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none"
            required
          />
        </div>

        {/* ราคา (เฉพาะ sell) */}
        {listingType === "sell" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ราคาที่ต้องการ (Gold Point)
              {repairData && (
                <span className="ml-2 text-xs text-orange-500">
                  (ราคาประเมินจาก WeeeT: {repairData.weeetAssessedPrice} Gold)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min={1}
                placeholder="เช่น 500"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 pr-16"
                required={listingType === "sell"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Gold</span>
            </div>
          </div>
        )}

        {/* หมายเหตุ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">หมายเหตุเพิ่มเติม (ไม่บังคับ)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="เช่น ต้องการขนออกด่วน ..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
          />
        </div>

        {/* Upload photos placeholder */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">รูปภาพ</label>
          {repairData?.photos && repairData.photos.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-orange-500">📷 รูปจากงานซ่อม (ใช้ได้ทันที)</p>
              <div className="flex gap-2 flex-wrap">
                {repairData.photos.map((url, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-400 text-xs">
                    📷 {i + 1}
                  </div>
                ))}
                <div className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs cursor-pointer hover:bg-gray-100">
                  ➕
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-gray-500">คลิกเพื่อเพิ่มรูปภาพ</p>
              <p className="text-xs text-gray-400 mt-1">รองรับ JPG/PNG · สูงสุด 5 รูป</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#0DC36C] hover:bg-green-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-colors shadow-sm"
        >
          {submitting ? "กำลังประกาศ..." : "✅ ประกาศซาก"}
        </button>
      </form>

      <p className="text-xs text-center text-gray-400">
        ✅ ไม่มีค่าธรรมเนียมประกาศ · ร้านซากที่สนใจจะยื่นข้อเสนอมาให้คุณเลือก
      </p>
    </div>
  );
}

// ── Default export ที่ wrap NewScrapForm ด้วย Suspense (Next.js 15 requirement) ──
export default function NewScrapPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">กำลังโหลด...</div>}>
      <NewScrapForm />
    </Suspense>
  );
}
