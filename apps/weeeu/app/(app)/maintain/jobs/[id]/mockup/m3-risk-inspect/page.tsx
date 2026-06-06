"use client";
/**
 * MOCKUP — M3 (WeeeU view): รับแจ้งผลตรวจสภาพ — WeeeT พบความเสี่ยงก่อนล้าง
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M3: WeeeT ถึงที่ → ตรวจสภาพ → พบความเสี่ยง → ส่ง Risk Report → WeeeU รับแจ้ง
 *
 * สิ่งที่เพิ่ม (delta จาก jobs/[id]/page.tsx เดิม):
 *  1. Banner "WeeeT พบความเสี่ยง" พร้อมรายการปัญหา (Risk Report D-Maintain-1)
 *  2. WeeeU 2 ตัวเลือก: ดำเนินการต่อ / ยุติงาน
 *  3. ถ้าดำเนินต่อ → ช่างล้างตามที่ตกลง (status กลับ in_progress)
 *  4. ถ้ายุติ → cancel flow (ไม่เสียค่าแรง เสียเฉพาะค่าตรวจ)
 *
 * mock-anno §5: มาจาก WeeeT /maintain/[id]/inspect (T-08) — WeeeT บันทึก risk report
 * mock-anno §6: ปุ่ม "ดำเนินการต่อ" → ไม่ต้อง navigate (status กลับ in_progress)
 *               ปุ่ม "ยุติงาน" → /maintain/jobs/[id]/cancel (U-15)
 * mock-anno §8: WeeeR (R-14) เห็น job ใน status "risk_reported" + รายงานเดียวกัน
 *               WeeeT (T-08) อยู่หน้า inspect ต่อ รอ WeeeU ตัดสินใจ
 *
 * Maintain Gen 4 · 2026-06-05 · Mockup เคส M3 WeeeU
 */

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import { MockAnnoBar } from "@/components/MockAnnoBar";

// ─── Sample data ───────────────────────────────────────────────────────────────
const MOCK_JOB = {
  id: "mock-m3-001",
  serviceCode: "MTN-20260605-0037",
  applianceType: "AC" as const,
  cleaningType: "deep" as const,
  status: "risk_reported" as const,
  scheduledAt: "2026-06-05T10:00:00+07:00",
  address: { address: "55/3 ถ.เพชรบุรีตัดใหม่ ราชเทวี กรุงเทพ 10400" },
  technicianId: "TECH-0017",
  shopName: "ช่างเย็น Pro สาขาพระราม 9",
  offerLock: {
    depositAmount: 300,   // Gold Point ล็อก
    travelFee:    60,     // ค่าเดินทาง (จ่ายแม้ยุติ)
    inspectFee:   50,     // ค่าตรวจสภาพ (จ่ายถ้ายุติหลังตรวจ)
  },
};

// Risk Report จาก WeeeT (D-Maintain-1)
const RISK_REPORT = {
  reportedAt: "2026-06-05T10:24:00+07:00",
  technicianName: "ช่างสมชาย อุ่นใจ",
  issues: [
    {
      type: "electrical",
      icon: "⚡",
      title: "ระบบไฟฟ้าผิดปกติ",
      detail: "พบสายไฟเปลือยบริเวณชุด PCB — เสี่ยงไฟช็อตขณะล้าง",
      severity: "high" as const,
    },
    {
      type: "refrigerant",
      icon: "🧊",
      title: "น้ำยาแอร์รั่ว",
      detail: "ตรวจพบรอยรั่วเล็กที่ท่อต่อ evaporator — ล้างไปน้ำยาอาจหมดเร็ว",
      severity: "medium" as const,
    },
  ],
  techNote: "แนะนำให้ซ่อมระบบไฟฟ้าก่อนล้าง ไม่งั้นเสี่ยงเครื่องพัง",
  photoCount: 3,
};

const SEVERITY_COLOR = {
  high:   "bg-red-50 border-red-200 text-red-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  low:    "bg-blue-50 border-blue-200 text-blue-700",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type Stage = "view" | "confirm_proceed" | "confirm_cancel" | "done_proceed" | "done_cancel";

export default function M3RiskInspectMockupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const job = MOCK_JOB;
  const [stage, setStage] = useState<Stage>("view");
  const [submitting, setSubmitting] = useState(false);

  const submit = (next: "done_proceed" | "done_cancel") => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStage(next);
    }, 900);
  };

  // ─── Success: ดำเนินการต่อ ─────────────────────────────────────────────────
  if (stage === "done_proceed") {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* mock-anno §6 NAV: success → กลับ job detail (U-16) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-5xl">✅</p>
          <h2 className="text-xl font-bold text-gray-900">ยืนยันดำเนินการต่อแล้ว</h2>
          <p className="text-sm text-gray-500">
            ช่างได้รับแจ้ง — กำลังดำเนินการล้างแอร์ตามที่ตกลง
          </p>
          <p className="text-xs text-gray-400 bg-amber-50 rounded-lg p-2 border border-amber-100">
            ⚠️ ผลการตรวจสภาพถูกบันทึกแล้ว — ใช้เป็นหลักฐานกรณีข้อพิพาทหลังงาน
          </p>
          <Link
            href={`/maintain/jobs/${id}`}
            className="block w-full text-center bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
          >
            กลับรายละเอียดงาน →
          </Link>
        </div>
      </div>
    );
  }

  // ─── Success: ยุติงาน ──────────────────────────────────────────────────────
  if (stage === "done_cancel") {
    const { offerLock } = job;
    const charged = offerLock.travelFee + offerLock.inspectFee;
    const refunded = offerLock.depositAmount - charged;
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* mock-anno §6 NAV: success → ไป jobs list (U-12) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-5xl">↩️</p>
          <h2 className="text-xl font-bold text-gray-900">ยุติงานสำเร็จ</h2>
          <p className="text-sm text-gray-500">
            งาน {job.serviceCode} ถูกยุติ — settle เสร็จแล้ว
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">พอยต์ทองที่คืน</span>
              <span className="font-semibold text-green-600">+{refunded.toLocaleString()} ฿</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">หักค่าเดินทาง+ตรวจ</span>
              <span className="font-semibold text-red-500">−{charged.toLocaleString()} ฿</span>
            </div>
          </div>
          <Link
            href="/maintain/jobs"
            className="block w-full text-center bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
          >
            กลับรายการงานบำรุง →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* mock-anno §5: back → U-16 (job detail) */}
        <Link href={`/maintain/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ผลตรวจสภาพก่อนล้าง</h1>
        <span className="ml-auto text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded">
          MOCKUP M3
        </span>
      </div>

      {/* Job summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
        <p className="font-semibold text-gray-900">แอร์ 🌡️ — ล้างลึก 🔬</p>
        <p className="text-sm text-gray-500">{job.shopName}</p>
        <p className="text-xs font-mono text-gray-400">{job.serviceCode}</p>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 mt-1">
          ⚠️ รอการตัดสินใจ
        </span>
      </div>

      {/* ─── Risk Report Banner (M3 core) ─── */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900">ช่างพบความเสี่ยงก่อนเริ่มล้าง</p>
            <p className="text-xs text-amber-700 mt-1">
              รายงานโดย {RISK_REPORT.technicianName} · {fmt(RISK_REPORT.reportedAt)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              📷 แนบรูปหลักฐาน {RISK_REPORT.photoCount} ภาพ
            </p>
          </div>
        </div>

        {/* Risk items */}
        <div className="space-y-2">
          {RISK_REPORT.issues.map((issue, i) => (
            <div key={i} className={`rounded-xl border p-3 space-y-1 ${SEVERITY_COLOR[issue.severity]}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{issue.icon}</span>
                <p className="text-sm font-semibold">{issue.title}</p>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  issue.severity === "high" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
                }`}>
                  {issue.severity === "high" ? "สูง" : "ปานกลาง"}
                </span>
              </div>
              <p className="text-xs">{issue.detail}</p>
            </div>
          ))}
        </div>

        {/* Tech note */}
        <div className="bg-white/70 rounded-xl p-3 text-xs text-amber-800 border border-amber-200">
          💬 ช่างแนะนำ: {RISK_REPORT.techNote}
        </div>
      </div>

      {/* ─── mock-anno §8 CROSS-APP info ─── */}
      {/* WeeeR (R-14) เห็น risk report นี้ใน job detail ด้วย */}
      {/* WeeeT (T-08) รอ WeeeU ตัดสินใจ ก่อนดำเนินการต่อหรือหยุด */}

      {/* Settle Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ค่าใช้จ่ายถ้ายุติงาน</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">พอยต์ทองที่ล็อก</span>
            <span className="text-gray-700">{job.offerLock.depositAmount.toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">หักค่าเดินทาง</span>
            <span className="text-red-500">−{job.offerLock.travelFee.toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">หักค่าตรวจสภาพ</span>
            <span className="text-red-500">−{job.offerLock.inspectFee.toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-gray-100 pt-1.5">
            <span className="text-gray-800">คืนพอยต์ทองสุทธิ</span>
            <span className="text-green-600">
              +{(job.offerLock.depositAmount - job.offerLock.travelFee - job.offerLock.inspectFee).toLocaleString()} ฿
            </span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400">
          * ถ้าดำเนินต่อ ค่าใช้จ่ายคิดตาม offer lock ปกติ — ความเสี่ยงที่ยอมรับถือเป็นความรับผิดชอบของลูกค้า
        </p>
      </div>

      {/* ─── Decision buttons ─── */}
      {stage === "view" && (
        <div className="space-y-3">
          <button
            onClick={() => setStage("confirm_proceed")}
            className="w-full border border-weeeu-primary/60 text-weeeu-primary hover:bg-weeeu-surface font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            ✅ รับทราบ — ดำเนินการล้างต่อ (รับความเสี่ยง)
          </button>
          {/* mock-anno §6: ปุ่มนี้ → /maintain/jobs/[id]/cancel (U-15) */}
          <Link
            href={`/maintain/jobs/${id}/cancel`}
            className="block w-full text-center border border-red-200 text-red-600 hover:bg-red-50 font-medium py-3.5 rounded-2xl text-sm transition-colors"
          >
            ↩️ ยุติงาน — ไม่ล้าง
          </Link>
        </div>
      )}

      {/* Confirm: ดำเนินต่อ */}
      {stage === "confirm_proceed" && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-4">
          <p className="font-semibold text-amber-900">ยืนยันดำเนินการต่อ?</p>
          <p className="text-sm text-amber-800">
            คุณยืนยันว่ารับทราบความเสี่ยง และต้องการให้ช่างล้างแอร์ต่อไปตามที่ตกลง
            — หลังล้างเสร็จ ค่าใช้จ่ายคิดตาม offer lock ปกติ
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => submit("done_proceed")}
              disabled={submitting}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
            >
              {submitting ? "⟳ กำลังยืนยัน..." : "ยืนยัน"}
            </button>
            <button
              onClick={() => setStage("view")}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl text-sm hover:bg-gray-50 transition-colors"
            >
              กลับ
            </button>
          </div>
        </div>
      )}

      <MockAnnoBar
        caseId="M3"
        screenId="U-16/m3"
        origin="T-08 MAINTAIN-INSPECT (WeeeT บันทึก risk report)"
        nav={[
          { label: "ดำเนินต่อ", dest: "U-16 job detail (in_progress)" },
          { label: "ยุติงาน", dest: "U-15 /maintain/jobs/{id}/cancel" },
        ]}
        crossApp={[
          { app: "WeeeR", desc: "read-only risk_reported (R-14)" },
          { app: "WeeeT", desc: "รอ WeeeU ตัดสินใจ (T-08)" },
          { app: "Admin", desc: "เห็น risk_reported (A-07)" },
        ]}
      />
    </div>
  );
}
