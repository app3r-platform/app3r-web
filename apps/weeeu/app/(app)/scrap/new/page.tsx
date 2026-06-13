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
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";
import { MockAnnoOrigin, MockAnnoXApp } from "@/components/shared/MockAnnoBar";

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
    repairData ? String(repairData.weeetAssessedPrice) : "200"
  );
  const [grade, setGrade] = useState(
    repairData ? repairData.grade : "grade_B" as "grade_A" | "grade_B" | "grade_C"
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // U-SCRAP-SELECT: saved appliance pre-select
  const MOCK_MY_APPLIANCES = [
    { id: "", name: "— ไม่ระบุเครื่อง / ป้อนเอง —" },
    { id: "my-ap-001", name: "ตู้เย็น Samsung 2 ประตู 14 คิว" },
    { id: "my-ap-002", name: "แอร์ Mitsubishi 12000 BTU" },
    { id: "my-ap-003", name: "เครื่องซักผ้า LG 8 กก." },
  ];
  const [selectedAppliance, setSelectedAppliance] = useState("");

  // U-SCRAP-SELECT: photo files (required ≥1)
  const [scrapPhotos, setScrapPhotos] = useState<File[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (scrapPhotos.length === 0) {
      alert("กรุณาแนบรูปซากอย่างน้อย 1 รูป");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      alert("✅ ประกาศซากเรียบร้อย — ระบบจะแจ้งเตือนเมื่อมีร้านยื่นข้อเสนอ");
      router.push("/scrap");
    }, 900);
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* §5 Origin + §8 Cross-app annotations */}
      <MockAnnoOrigin text="◀ มาจาก: U-55 · /scrap หรือ U-07 · /repair/[id]/scrap-offer (S12: Repair C4 → ?from_repair=REP-xxx)" />
      <MockAnnoXApp screenLabel="U-29: ประกาศซากใหม่">
        <p>• ขณะ WeeeU กรอกฟอร์มนี้ — แอพฯอื่นยังไม่เห็นรายการ (ยังไม่ publish)</p>
        <p>• หลัง submit → <strong>WeeeR :3001</strong> [R-70] จะเห็นรายการใน feed /scrap</p>
      </MockAnnoXApp>

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
            ราคาประเมิน: <span className="font-mono font-semibold">{repairData.weeetAssessedPrice} พอยต์ทอง (Gold Point)</span>
            {" "}· น้ำหนักประมาณ {repairData.estimatedWeightKg} กก.
          </p>
          <p className="text-xs text-orange-500">
            ✅ ข้อมูลด้านล่างถูก pre-fill จากงานซ่อม — ตรวจสอบและแก้ไขได้
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

        {/* U-SCRAP-SELECT: เลือกเครื่องจากรายการของฉัน */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกเครื่องใช้ไฟฟ้า (จากรายการของฉัน)</label>
          <select
            value={selectedAppliance}
            onChange={e => setSelectedAppliance(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
          >
            {MOCK_MY_APPLIANCES.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 mt-1">เลือกจากเครื่องที่ลงทะเบียนไว้ หรือป้อนเองในช่องรายละเอียด (จริง = BE)</p>
        </div>

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
                {t === "sell" ? "💰 ขายซาก (WeeeR จ่ายพอยต์ทองให้คุณ)" : "🆓 ทิ้งซาก (ฟรี — ไม่รับเงิน)"}
              </button>
            ))}
          </div>
          {listingType === "sell" && (
            <p className="text-xs text-green-600 mt-2">
              ⚠️ ระบบพักเงินกลาง (Escrow) <EscrowInfoIcon /> กลับทิศ: WeeeR (ร้าน) เป็นผู้จ่ายพอยต์ทองให้คุณ ไม่ใช่คุณจ่าย
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
              ราคาที่ต้องการ (พอยต์ทอง)
              {repairData && (
                <span className="ml-2 text-xs text-orange-500">
                  (ราคาประเมินจาก WeeeT: {repairData.weeetAssessedPrice} พอยต์ทอง)
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">พอยต์ทอง</span>
            </div>
          </div>
        )}

        {/* U-SCRAP-SELECT: price slider (sell only) */}
        {listingType === "sell" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ปรับราคาด้วย Slider (พอยต์ทอง)
            </label>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={Number(price) || 200}
              onChange={e => setPrice(e.target.value)}
              className="w-full accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>50</span><span className="text-green-700 font-semibold">{Number(price) || 200} พอยต์ทอง</span><span>5,000</span>
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

        {/* U-SCRAP-SELECT: รูปภาพซาก (บังคับ ≥1) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            รูปภาพซาก <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-gray-400">(บังคับอย่างน้อย 1 รูป)</span>
          </label>
          {repairData?.photos && repairData.photos.length > 0 && (
            <div className="space-y-1 mb-2">
              <p className="text-xs text-orange-500">📷 รูปจากงานซ่อม (ใช้ได้ทันที)</p>
              <div className="flex gap-2 flex-wrap">
                {repairData.photos.map((_, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-400 text-xs">
                    📷 {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files ?? []).slice(0, 5);
                setScrapPhotos(files);
              }}
            />
            <p className="text-2xl mb-1">📷</p>
            {scrapPhotos.length > 0 ? (
              <p className="text-sm text-green-700 font-medium">✅ เลือกแล้ว {scrapPhotos.length} รูป</p>
            ) : (
              <>
                <p className="text-sm text-gray-500">แตะเพื่อเพิ่มรูปภาพ</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG/PNG · สูงสุด 5 รูป · บังคับ ≥1</p>
              </>
            )}
          </label>
          {scrapPhotos.length === 0 && (
            <p className="text-xs text-red-500 mt-1">กรุณาแนบรูปซากอย่างน้อย 1 รูป</p>
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
        {/* §6 Nav annotation */}
        <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono text-center">→ U-41 /scrap/new/success → U-55 /scrap</p>
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
