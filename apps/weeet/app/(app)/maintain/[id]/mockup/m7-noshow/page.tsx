"use client";
/**
 * MOCKUP — M7 (WeeeT view): No-show — ช่างถึงแล้วแต่ไม่พบลูกค้า
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M7: WeeeT ถึงที่แล้ว → ไม่พบลูกค้า → กด "ลูกค้าไม่อยู่" → trigger no_show
 *
 * สิ่งที่เพิ่ม (delta จาก [id]/arrive/page.tsx เดิม):
 *  1. หลังอัพโหลดรูปถึงที่สำเร็จ → หน้า "รอลูกค้า" แสดง 2 ปุ่ม
 *     a) "เริ่มล้าง" (ปกติ → ไป checklist)
 *     b) "⚠️ ลูกค้าไม่อยู่/ไม่รับสาย" (M7 delta)
 *  2. No-show confirm dialog (พร้อม countdown รอ 15 นาที)
 *  3. หลัง confirm → state "no_show" + แจ้ง WeeeU ทันที
 *
 *
 * mock-anno §5: มาจาก T-08a arrive/page.tsx — WeeeT กด "ถึงที่" upload รูป → เข้าหน้า "รอลูกค้า"
 * mock-anno §6: ปุ่ม "เริ่มล้าง" → T-08c checklist (/maintain/[id]/checklist) [normal path]
 *               ปุ่ม "ลูกค้าไม่อยู่" → stage noshow_confirm → noshow_done
 *               หลัง noshow_done: ไม่มี navigate — แสดง "รอ WeeeU ตัดสินใจ"
 * mock-anno §8: WeeeU (U-16/mockup m7-noshow): รับ notification → เห็น "no_show" banner
 *               WeeeR (R-14): เห็น job status "no_show" · no action required
 *               Admin (A-07): เห็น no-show event ใน audit log
 *
 * Maintain Gen 4 · 2026-05-24 · Mockup เคส M7 WeeeT
 */

import { useState } from "react";
import Link from "next/link";
import { MockAnno } from "@/components/MockAnno";

const JOB = {
  id: "mock-m7-weeet-001",
  serviceCode: "MTN-20260519-0071",
  applianceType: "AC" as const,
  cleaningType: "sanitize" as const,
  scheduledAt: "2026-05-22T13:00:00+07:00",
  arrivedAt: "2026-05-22T13:02:00+07:00",
  address: { address: "45 ซ.ลาดพร้าว 71 ลาดพร้าว กรุงเทพ 10230" },
  customerName: "คุณสุดา มีสุข",
  noShowFee: 300, // ค่าเสียเที่ยวที่ WeeeU ต้องจ่าย
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    hour: "2-digit", minute: "2-digit",
  });
}

type Stage = "arrived" | "noshow_confirm" | "noshow_done";

export default function M7NoShowWeeeTMockupPage() {
  const [stage, setStage] = useState<Stage>("arrived");
  const [submitting, setSubmitting] = useState(false);

  const handleNoShow = () => {
    setSubmitting(true);
    setTimeout(() => {
      setStage("noshow_done");
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="pb-6 bg-gray-950 min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/jobs" className="text-gray-400 hover:text-white text-lg">←</Link>
        <div className="flex-1">
          <h1 className="font-bold text-white">ถึงหน้างานแล้ว</h1>
          <p className="text-xs text-gray-400">{JOB.serviceCode}</p>
        </div>
        <span className="text-[10px] font-mono text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
          MOCKUP M7-WeeeT
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Job info chip */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">งานปัจจุบัน</p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">แอร์ 🌡️ — ล้าง+ฆ่าเชื้อ 🦠</p>
              <p className="text-xs text-gray-400 mt-0.5">{JOB.address.address}</p>
            </div>
            <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-cyan-900/50 text-cyan-300">
              📍 ถึงที่แล้ว
            </span>
          </div>
          <p className="text-xs text-gray-500">
            ถึงที่: {fmt(JOB.arrivedAt)} · ลูกค้า: {JOB.customerName}
          </p>
        </div>

        {/* ─── Stage: arrived — รอลูกค้า → 2 ตัวเลือก ─── */}
        {stage === "arrived" && (
          <>
            <div className="bg-[#1696F9]/10 border border-[#1696F9]/30 rounded-xl p-3 text-xs text-[#1696F9] space-y-1">
              <p className="font-semibold">📍 บันทึกถึงที่เรียบร้อย</p>
              <p>รอลูกค้าเปิดประตู — กด "เริ่มล้าง" เมื่อพร้อม</p>
              <p className="text-gray-400">ถ้าลูกค้าไม่อยู่/ไม่รับสาย → รอ 15 นาที แล้วกดแจ้ง</p>
            </div>

            <button
              onClick={() => {/* ปกติ → router.push checklist */ alert("ไปหน้า checklist (mockup)")}}
              className="w-full bg-[#1696F9] hover:bg-[#0d7dd6] text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              🛁 เริ่มล้างเครื่อง
            </button>

            {/* M7 delta — ปุ่มแจ้งลูกค้าไม่อยู่ */}
            <button
              onClick={() => setStage("noshow_confirm")}
              className="w-full border border-amber-600/50 text-amber-400 hover:bg-amber-950/30 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              ⚠️ ลูกค้าไม่อยู่ / ไม่รับสาย
            </button>
          </>
        )}

        {/* ─── Stage: noshow_confirm ─── */}
        {stage === "noshow_confirm" && (
          <div className="bg-gray-900 border border-amber-700/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🚫</span>
              <div>
                <p className="font-semibold text-amber-300">แจ้ง: ลูกค้าไม่อยู่?</p>
                <p className="text-sm text-gray-400 mt-1">
                  ยืนยันว่าช่างถึงหน้างานแล้วแต่ไม่พบลูกค้า (รอ 15 นาทีแล้ว)
                </p>
              </div>
            </div>

            {/* Policy */}
            <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-3 space-y-1.5 text-xs">
              <p className="font-semibold text-amber-300">นโยบาย No-show (ตาม offer lock)</p>
              <div className="flex justify-between text-gray-300">
                <span>ค่าเสียเที่ยวที่ WeeeU ต้องรับผิดชอบ</span>
                <span className="font-bold text-amber-400">{JOB.noShowFee} พอยต์ทอง (Gold Point)</span>
              </div>
              <p className="text-gray-500 mt-1">
                WeeeU จะถูกแจ้ง — เลือก นัดใหม่ หรือ ยกเลิกงาน
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 text-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase">ยืนยัน:</p>
              {[
                "รอที่หน้างานอย่างน้อย 15 นาทีแล้ว",
                "โทรหาลูกค้าอย่างน้อย 2 ครั้ง ไม่รับสาย",
                "มีรูปถึงที่เป็นหลักฐาน",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400 text-base">✓</span>
                  <span className="text-xs">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleNoShow}
                disabled={submitting}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {submitting ? "กำลังส่ง..." : "✅ ยืนยันแจ้ง No-show"}
              </button>
              <button
                onClick={() => setStage("arrived")}
                className="flex-1 border border-gray-700 text-gray-400 hover:bg-gray-800 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                ย้อนกลับ
              </button>
            </div>
          </div>
        )}

        {/* ─── Stage: noshow_done ─── */}
        {stage === "noshow_done" && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 text-center space-y-3">
            <p className="text-3xl">🚫</p>
            <p className="font-semibold text-white">แจ้ง No-show เรียบร้อย</p>
            <p className="text-sm text-gray-400">
              ระบบแจ้ง WeeeU แล้ว · รอการตัดสินใจจากลูกค้า
            </p>
            <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-3 text-xs text-amber-300">
              <p>สถานะ: <span className="font-bold">no_show</span></p>
              <p className="mt-1 text-gray-400">WeeeU มีเวลา 2 ชั่วโมงเพื่อตัดสินใจ</p>
            </div>
            <Link
              href="/jobs"
              className="block w-full text-center border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              ← กลับรายการงาน
            </Link>
          </div>
        )}
      </div>

      <MockAnno
        caseId="M7"
        screenId="T-08/m7"
        origin="T-08b MAINTAIN-ARRIVE — WeeeT กด ลูกค้าไม่อยู่"
        nav={[
          { label: "เริ่มล้าง", dest: "T-08c checklist (normal path)" },
          { label: "ลูกค้าไม่อยู่", dest: "noshow_confirm → noshow_done" },
        ]}
        crossApp={[
          { app: "WeeeU", desc: "รับ notification no_show (U-16)" },
          { app: "WeeeR", desc: "status no_show (R-14)" },
          { app: "Admin", desc: "no-show event audit log (A-07)" },
        ]}
      />
    </div>
  );
}
