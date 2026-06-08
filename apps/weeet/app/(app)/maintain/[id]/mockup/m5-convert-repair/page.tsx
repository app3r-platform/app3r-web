"use client";
/**
 * MOCKUP — M5 (WeeeT view): ตรวจสภาพ → พบเสียหาย → เสนอ Convert to Repair
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M5: WeeeT ตรวจ → พบเสียหายต้องซ่อม → กด "แจ้งต้องซ่อม" (D-Maintain-2)
 *
 * สิ่งที่เพิ่ม (delta จาก [id]/inspect/page.tsx เดิม):
 *  1. Mode "damage_form" — เพิ่มปุ่ม "แจ้งพบความเสียหาย" ใน inspect flow
 *  2. Form กรอกรายการเสียหาย + ค่าประเมิน + อัพโหลดรูป (mock)
 *  3. หลัง submit → state "damage_submitted" + แจ้ง WeeeU
 *  4. WeeeU ตัดสินใจ: เปิด Repair case ใหม่ (M5-HA) หรือปิดแค่นี้ (M5-HB)
 *
 * mock-anno §5: มาจาก T-08 MAINTAIN-INSPECT — WeeeT กด "แจ้งพบความเสียหาย"
 *               (ปุ่มนี้อยู่ใน normal inspect mode หลังตรวจสภาพ)
 * mock-anno §6: หลัง submit → T-08 (รอ WeeeU ตอบกลับ) — stay on inspect waiting
 * mock-anno §8: WeeeU (U-16) ได้รับ notification + เห็น m5-hybrid-a banner
 *               WeeeR (R-14) เห็น job status "closed_for_repair"
 *               Admin (A-07) เห็น damage report ใน job detail
 *
 * Maintain Gen 4 · 2026-06-05 · Mockup เคส M5 WeeeT
 */

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import { MockAnno } from "@/components/MockAnno";

const MOCK_JOB = {
  id: "mock-m5-weeet-001",
  serviceCode: "MTN-20260605-0051",
  applianceType: "WashingMachine" as const,
  cleaningType: "general" as const,
  address: { address: "102 ซ.รามคำแหง 24 หัวหมาก กรุงเทพ 10240" },
  customerName: "คุณสุนทร มั่นคง",
  arrivedAt: "2026-06-05T09:05:00+07:00",
};

const DAMAGE_TYPES = [
  { id: "bearing", label: "ลูกปืนถังซักเสื่อม 🔩", detail: "เครื่องสั่นผิดปกติ" },
  { id: "seal", label: "ซีลประตูรั่ว 💧", detail: "น้ำรั่วจากประตู" },
  { id: "motor", label: "มอเตอร์เสีย ⚙️", detail: "เสียงผิดปกติ/หยุดทำงาน" },
  { id: "pcb", label: "บอร์ดวงจรเสีย ⚡", detail: "ไม่เปิดหรือค้างรหัส error" },
  { id: "drum", label: "ถังซักร้าว/แตก 🔓", detail: "ตรวจพบรอยแตก" },
  { id: "other", label: "อื่นๆ", detail: "" },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    hour: "2-digit", minute: "2-digit",
  });
}

type Stage = "inspect" | "damage_form" | "damage_submitted";

export default function M5ConvertRepairWeeeTMockupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const job = MOCK_JOB;

  const [stage, setStage] = useState<Stage>("inspect");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [estimateCost, setEstimateCost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  const handleSubmit = () => {
    if (selectedTypes.length === 0) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStage("damage_submitted");
    }, 1000);
  };

  return (
    <div className="pb-6 bg-gray-950 min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        {/* mock-anno §5: back → T-08 (inspect) */}
        <Link href={`/maintain/${id}/inspect`} className="text-gray-400 hover:text-white text-lg">←</Link>
        <div className="flex-1">
          <h1 className="font-bold text-white">
            {stage === "inspect" ? "ตรวจสภาพก่อนล้าง" :
             stage === "damage_form" ? "แจ้งพบความเสียหาย" :
             "ส่งรายงานแล้ว"}
          </h1>
          <p className="text-xs text-gray-400">{job.serviceCode}</p>
        </div>
        <span className="text-[10px] font-mono text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
          MOCKUP M5-WeeeT
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Job info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">งานปัจจุบัน</p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">เครื่องซักผ้า 🫧 — ล้างทั่วไป 🧼</p>
              <p className="text-xs text-gray-400 mt-0.5">{job.address.address}</p>
            </div>
            <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-cyan-900/50 text-cyan-300">
              📍 ถึงที่แล้ว
            </span>
          </div>
          <p className="text-xs text-gray-500">
            ถึงที่: {fmt(job.arrivedAt)} · ลูกค้า: {job.customerName}
          </p>
        </div>

        {/* ─── Stage: inspect — normal view + ปุ่ม damage ─── */}
        {stage === "inspect" && (
          <>
            <div className="bg-[#1696F9]/10 border border-[#1696F9]/30 rounded-xl p-3 text-xs text-[#1696F9] space-y-1">
              <p className="font-semibold">🔍 ตรวจสภาพก่อนล้าง</p>
              <p>ตรวจเครื่อง — ถ้าปกติกด "ผ่าน" ล้างตามปกติ · ถ้าพบเสียหายกด "แจ้งพบความเสียหาย"</p>
            </div>

            {/* Normal pass */}
            <button
              onClick={() => alert("ผ่าน → ไปหน้า checklist (mockup normal path)")}
              className="w-full bg-[#1696F9] hover:bg-[#0d7dd6] text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              ✅ ผ่านการตรวจ — ล้างตามปกติ
            </button>

            {/* M5: พบเสียหาย (D-Maintain-2) */}
            <button
              onClick={() => setStage("damage_form")}
              className="w-full border border-red-600/50 text-red-400 hover:bg-red-950/30 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              🔧 พบความเสียหาย — ต้องแจ้ง WeeeU
            </button>
          </>
        )}

        {/* ─── Stage: damage_form — กรอกรายงาน ─── */}
        {stage === "damage_form" && (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3 text-xs text-red-300">
              <p className="font-semibold">📋 แจ้งพบความเสียหาย</p>
              <p className="text-gray-400 mt-1">เลือกประเภทเสียหาย + รายละเอียด → ส่งให้ WeeeU ตัดสินใจ</p>
            </div>

            {/* ประเภทเสียหาย */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                ประเภทเสียหาย <span className="text-red-500">*</span>
              </p>
              {DAMAGE_TYPES.map(dt => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => toggleType(dt.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    selectedTypes.includes(dt.id)
                      ? "bg-red-900/40 border-red-600/60 text-red-200"
                      : "border-gray-700 text-gray-400 hover:border-red-700/50"
                  }`}
                >
                  {selectedTypes.includes(dt.id) && <span className="mr-2 text-red-400">✓</span>}
                  <span>{dt.label}</span>
                  {dt.detail && <span className="text-xs text-gray-500 ml-2">— {dt.detail}</span>}
                </button>
              ))}
            </div>

            {/* หมายเหตุ */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รายละเอียดเพิ่ม</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="อธิบายสภาพเครื่อง อาการ และความเสียหายที่พบ..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-600/50 resize-none"
              />
            </div>

            {/* ประมาณค่าซ่อม */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ประมาณค่าซ่อม (ไม่บังคับ)</p>
              <input
                value={estimateCost}
                onChange={e => setEstimateCost(e.target.value)}
                placeholder="เช่น 800–1,200 ฿"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-600/50"
              />
            </div>

            {/* Photo mock */}
            <div className="border border-dashed border-gray-700 rounded-xl p-4 text-center text-xs text-gray-500 space-y-1">
              <p className="text-2xl">📷</p>
              <p>อัพโหลดรูปหลักฐาน (mock — logic BE)</p>
              <button className="text-[#1696F9] font-medium">เลือกรูป</button>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                onClick={() => setStage("inspect")}
                className="flex-1 border border-gray-700 text-gray-400 hover:bg-gray-800 font-medium py-3 rounded-xl text-sm"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedTypes.length === 0 || submitting}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {submitting ? "⟳ กำลังส่ง..." : "📨 ส่งรายงาน → WeeeU"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Stage: damage_submitted — รอ WeeeU ─── */}
        {stage === "damage_submitted" && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center space-y-3">
              <p className="text-3xl">📨</p>
              <p className="font-semibold text-white">ส่งรายงานให้ WeeeU แล้ว</p>
              <p className="text-sm text-gray-400">
                รอ WeeeU ตัดสินใจ — ดำเนินต่อ, เปิดงานซ่อมใหม่, หรือปิดงาน
              </p>
              <div className="bg-red-900/30 border border-red-700/40 rounded-xl p-3 text-xs text-red-300 text-left space-y-1">
                <p className="font-semibold">รายการที่แจ้ง:</p>
                {selectedTypes.map(typeId => {
                  const dt = DAMAGE_TYPES.find(d => d.id === typeId);
                  return dt ? <p key={typeId}>• {dt.label}</p> : null;
                })}
                {notes && <p className="text-gray-400 mt-1 border-t border-red-800/40 pt-1">{notes}</p>}
                {estimateCost && <p>ประมาณ: {estimateCost}</p>}
              </div>
              <p className="text-xs text-gray-500">
                งานล้างถูกปิดชั่วคราว — รอสัญญาณจาก WeeeU
              </p>
            </div>

            {/* mock-anno §8: cross-app status */}
            {/* WeeeU ได้รับ notification → เห็น m5-hybrid-a banner ใน U-16 */}
            {/* WeeeR เห็น job status "closed_for_repair" ใน R-14 */}

            {/* mock-anno §6: กลับ → T-08 (รอ) */}
            <Link
              href={`/maintain/${id}/inspect`}
              className="block w-full text-center border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium py-3 rounded-2xl text-sm transition-colors"
            >
              ← กลับหน้าตรวจสภาพ (รอ WeeeU)
            </Link>
            <Link
              href="/jobs"
              className="block w-full text-center text-gray-500 hover:text-gray-300 text-sm text-center"
            >
              กลับรายการงานทั้งหมด
            </Link>
          </div>
        )}
      </div>

      {/* caseId="M5-HA" screenId="T-08/m5" */}
      <MockAnno
        origin="M5-HA · T-08/m5 · T-08 MAINTAIN-INSPECT — WeeeT กด พบความเสียหาย (D-Maintain-2)"
        nav={"submit D-Maintain-2 → damage_submitted (รอ WeeeU)\nกลับ → T-08 inspect (stage=inspect)"}
        xapp="WeeeU: ได้รับ notification · เห็น m5-hybrid-a (U-16/m5) · WeeeR: closed_for_repair (R-14) · Admin: damage report (A-07)"
      />
    </div>
  );
}
