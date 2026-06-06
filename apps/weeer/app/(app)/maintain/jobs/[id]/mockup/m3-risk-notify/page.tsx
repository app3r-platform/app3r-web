"use client";
/**
 * MOCKUP — M3 (WeeeR view): รับแจ้ง Risk Report — WeeeT พบความเสี่ยงก่อนล้าง
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M3: WeeeT พบความเสี่ยง → ส่ง Risk Report → WeeeR เห็นสถานะงาน "risk_reported"
 *
 * สิ่งที่เพิ่ม (delta จาก jobs/[id]/page.tsx เดิม):
 *  1. Banner "WeeeT แจ้งความเสี่ยง" — WeeeR เห็นรายการปัญหา
 *  2. สถานะ "risk_reported" — รอ WeeeU ตัดสินใจ
 *  3. WeeeR ไม่มี action — เป็น read-only view รอ WeeeU ตัดสินใจ
 *  4. ถ้า WeeeU อนุมัติดำเนินต่อ → สถานะกลับ in_progress · WeeeR ได้รับแจ้ง
 *  5. ถ้า WeeeU ยุติ → สถานะ terminated · WeeeR ได้รับแจ้ง settle
 *
 * mock-anno §5: มาจาก R-14 MAINTAIN-JOB-DETAIL (WeeeR เห็น notification badge)
 *               → กดดูงาน → เห็น banner M3 status
 * mock-anno §6: ไม่มี navigation (WeeeR รอ WeeeU) — ปุ่มเดียว: กลับรายการ (R-12)
 * mock-anno §8: WeeeU (U-16) เห็นหน้า m3-risk-inspect รอตัดสินใจ
 *               WeeeT (T-08) รอ WeeeU ตอบกลับก่อน
 *               Admin (A-07) เห็น job status "risk_reported"
 *
 * Maintain Gen 4 · 2026-06-05 · Mockup เคส M3 WeeeR
 */

import Link from "next/link";
import { use } from "react";
import { MockAnno } from "@/components/MockAnno";

const MOCK_JOB = {
  id: "mock-m3-weeer-001",
  serviceCode: "MTN-20260605-0037",
  applianceType: "AC" as const,
  cleaningType: "deep" as const,
  status: "risk_reported" as const,
  scheduledAt: "2026-06-05T10:00:00+07:00",
  address: { address: "55/3 ถ.เพชรบุรีตัดใหม่ ราชเทวี กรุงเทพ 10400" },
  customerName: "คุณประทุม สุขสวัสดิ์",
  shopName: "ช่างเย็น Pro สาขาพระราม 9",
  offerLock: {
    depositAmount: 300,
    travelFee: 60,
    inspectFee: 50,
    totalService: 850,
  },
};

const RISK_REPORT = {
  reportedAt: "2026-06-05T10:24:00+07:00",
  technicianName: "ช่างสมชาย อุ่นใจ",
  issues: [
    {
      icon: "⚡",
      title: "ระบบไฟฟ้าผิดปกติ",
      detail: "พบสายไฟเปลือยบริเวณชุด PCB — เสี่ยงไฟช็อตขณะล้าง",
      severity: "high" as const,
    },
    {
      icon: "🧊",
      title: "น้ำยาแอร์รั่ว",
      detail: "ตรวจพบรอยรั่วเล็กที่ท่อต่อ evaporator",
      severity: "medium" as const,
    },
  ],
  photoCount: 3,
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function M3RiskNotifyWeeRMockupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const job = MOCK_JOB;

  return (
    <div className="pb-6 bg-gray-950 min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        {/* mock-anno §5: back → R-12 (MAINTAIN-JOBS list) */}
        <Link href="/maintain/jobs" className="text-gray-400 hover:text-white text-lg">←</Link>
        <div className="flex-1">
          <h1 className="font-bold text-white">รายละเอียดงาน</h1>
          <p className="text-xs text-gray-400">{job.serviceCode}</p>
        </div>
        <span className="text-[10px] font-mono text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
          MOCKUP M3-WeeeR
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ─── M3 Risk Banner (WeeeR read-only) ─── */}
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-300">ช่างแจ้งความเสี่ยง — รอลูกค้าตัดสินใจ</p>
              <p className="text-xs text-amber-500 mt-1">
                {RISK_REPORT.technicianName} รายงาน · {fmt(RISK_REPORT.reportedAt)}
              </p>
            </div>
          </div>

          {/* Risk items */}
          <div className="space-y-2">
            {RISK_REPORT.issues.map((issue, i) => (
              <div key={i} className={`rounded-xl p-3 space-y-1 ${
                issue.severity === "high"
                  ? "bg-red-900/40 border border-red-700/50"
                  : "bg-amber-900/40 border border-amber-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{issue.icon}</span>
                  <p className="text-sm font-semibold text-white">{issue.title}</p>
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    issue.severity === "high" ? "bg-red-700 text-red-100" : "bg-amber-700 text-amber-100"
                  }`}>
                    {issue.severity === "high" ? "สูง" : "ปานกลาง"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{issue.detail}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900/60 rounded-xl p-3 text-xs text-amber-400">
            📷 หลักฐานรูป {RISK_REPORT.photoCount} ภาพ · รอ WeeeU ตัดสินใจว่าจะดำเนินต่อหรือยุติงาน
          </div>
        </div>

        {/* ─── mock-anno §8: Cross-app status ─── */}
        {/* WeeeU กำลังเห็น m3-risk-inspect (U-16 + risk banner) — รอการตัดสินใจ */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้ามแอพ 🔗</p>
          <div className="space-y-1.5 text-xs text-gray-400">
            <p>• WeeeU (U-16): กำลังเห็น Risk Report — รอตัดสินใจดำเนินต่อหรือยุติ</p>
            <p>• WeeeT (T-08): รออยู่หน้างาน รอสัญญาณจาก WeeeU</p>
            <p>• Admin (A-07): เห็น status "risk_reported"</p>
          </div>
        </div>

        {/* Status card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้อมูลงาน</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ลูกค้า</span>
              <span className="text-gray-200">{job.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ที่อยู่</span>
              <span className="text-gray-200 text-right max-w-[55%]">{job.address.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">วันนัด</span>
              <span className="text-gray-200">{fmt(job.scheduledAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ค่าบริการ</span>
              <span className="text-gray-200">{job.offerLock.totalService.toLocaleString()} ฿</span>
            </div>
          </div>
        </div>

        {/* ─── WeeeR: read-only, no action while risk_reported ─── */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center text-xs text-gray-500 space-y-1">
          <p className="text-gray-300 font-medium">รอการตัดสินใจจากลูกค้า</p>
          <p>งานจะดำเนินต่อหรือยุติ ขึ้นอยู่กับ WeeeU — ร้านจะได้รับแจ้งอัตโนมัติ</p>
        </div>

        {/* mock-anno §6: กลับ → R-12 */}
        <Link
          href="/maintain/jobs"
          className="block w-full text-center border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium py-3 rounded-2xl text-sm transition-colors"
        >
          ← กลับรายการงาน
        </Link>
      </div>

      <MockAnno
        caseId="M3"
        screenId="R-14/m3"
        origin="R-14 MAINTAIN-JOB-DETAIL (notification badge) — risk_reported"
        nav={[
          { label: "กลับรายการ", dest: "R-12 /maintain/jobs" },
        ]}
        crossApp={[
          { app: "WeeeU", desc: "กำลังเห็น m3-risk-inspect รอตัดสิน" },
          { app: "WeeeT", desc: "รออยู่หน้างาน (T-08)" },
          { app: "Admin", desc: "status risk_reported (A-07)" },
        ]}
      />
    </div>
  );
}
