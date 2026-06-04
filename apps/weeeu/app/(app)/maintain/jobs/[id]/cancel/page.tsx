"use client";

/**
 * ยุติงานบำรุงรักษา (M9 ยุติกลางคัน) — U-15 · /maintain/jobs/[id]/cancel
 *
 * Disposition Matrix M9: settle ตามเฟส + offer terms (DECISION จุด1) · cancel-terms
 *   - แสดง cancel-terms ของข้อเสนอที่เลือก (deposit/travel/labor) ตามเฟสปัจจุบัน
 *   - ยืนยัน → หน้า success (in-page · success-wire #6)
 *
 * mockup — settle/ตัดพอยต์จริง = BE จังหวะ2
 */

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";

// เฟสงาน + นโยบาย settle ตามเฟส (จาก offer terms ที่ตกลงไว้)
type Phase = "pending" | "assigned" | "departed" | "in_progress";

const MOCK_JOB = {
  serviceCode: "MTN-20260604-0091",
  applianceLabel: "แอร์ 🌡️ — ล้างลึก",
  shopName: "ช่างเย็น Pro สาขาพระราม 9",
  phase: "departed" as Phase, // เปลี่ยนเพื่อทดสอบ settle แต่ละเฟส
  terms: {
    deposit: 200,          // พอยต์ทองที่ล็อก (คืนได้)
    travel_fee: 50,        // ค่าเดินทาง
    labor_cancel_fee: 150, // ค่าแรงยุติ (เมื่อช่างเริ่มงานแล้ว)
  },
};

const PHASE_LABEL: Record<Phase, string> = {
  pending:     "รอช่างรับงาน",
  assigned:    "ช่างรับงานแล้ว",
  departed:    "ช่างกำลังเดินทาง",
  in_progress: "ช่างกำลังทำงาน",
};

// settle ตามเฟส: ยิ่งใกล้/เริ่มงาน ยิ่งหักมาก (offer terms = SoT)
function computeSettle(phase: Phase, terms: typeof MOCK_JOB.terms) {
  const lines: { label: string; amount: number; refund: boolean }[] = [];
  // พอยต์ทองที่ล็อก — คืนเสมอถ้ายังไม่เริ่มงาน
  lines.push({ label: "พอยต์ทองที่ล็อก (คืน)", amount: terms.deposit, refund: true });
  if (phase === "departed" || phase === "in_progress") {
    lines.push({ label: "ค่าเดินทาง (ช่างออกเดินทางแล้ว)", amount: terms.travel_fee, refund: false });
  }
  if (phase === "in_progress") {
    lines.push({ label: "ค่าแรงยุติงาน (ช่างเริ่มทำงานแล้ว)", amount: terms.labor_cancel_fee, refund: false });
  }
  const charged = lines.filter(l => !l.refund).reduce((s, l) => s + l.amount, 0);
  const refunded = lines.filter(l => l.refund).reduce((s, l) => s + l.amount, 0);
  return { lines, charged, refunded };
}

const CANCEL_REASONS = [
  "เปลี่ยนใจ ไม่ต้องการใช้บริการแล้ว",
  "ช่างติดต่อไม่ได้ / ล่าช้า",
  "นัดเวลาไม่ตรงกัน",
  "พบช่างรายอื่นที่เหมาะกว่า",
  "อื่นๆ",
];

export default function MaintainCancelPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const job = MOCK_JOB;
  const settle = computeSettle(job.phase, job.terms);

  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = () => {
    const reasonVal = reason === "อื่นๆ" ? customReason.trim() : reason;
    if (!reasonVal) { setError("กรุณาเลือก/ระบุเหตุผลในการยุติงาน"); return; }
    if (!ack) { setError("กรุณารับทราบยอด settle ตามเงื่อนไขข้อเสนอก่อนยืนยัน"); return; }
    setError("");
    setSubmitting(true);
    // mock — settle/ปลดล็อก escrow จริง = BE
    setTimeout(() => { setSubmitting(false); setDone(true); }, 900);
  };

  // ─── Success state (success-wire #6) ───────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-5xl">✅</p>
          <div>
            <h2 className="text-xl font-bold text-gray-900">ยุติงานสำเร็จ</h2>
            <p className="text-sm text-gray-500 mt-2">
              ระบบได้ settle ตามเงื่อนไขข้อเสนอแล้ว — งาน {job.serviceCode} ถูกยกเลิก
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">คืนพอยต์ทองที่ล็อก</span>
              <span className="font-semibold text-green-600">+{settle.refunded.toLocaleString()} ฿</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">หักตามเงื่อนไข</span>
              <span className="font-semibold text-red-500">−{settle.charged.toLocaleString()} ฿</span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/maintain/jobs`)}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
          >
            กลับรายการงานบำรุง →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ยุติงานบำรุงรักษา</h1>
      </div>

      {/* Job summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
        <p className="font-semibold text-gray-900">{job.applianceLabel}</p>
        <p className="text-sm text-gray-500">{job.shopName}</p>
        <p className="text-xs font-mono text-gray-400">{job.serviceCode}</p>
        <p className="text-xs text-amber-600 mt-1">สถานะปัจจุบัน: {PHASE_LABEL[job.phase]}</p>
      </div>

      {/* settle ตามเฟส + offer terms (DECISION จุด1) */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">การคิดค่าใช้จ่ายเมื่อยุติงาน (ตามเงื่อนไขข้อเสนอ)</p>
        <p className="text-xs text-gray-500">
          ยอด settle คิดตามเฟสปัจจุบันและเงื่อนไขที่ตกลงกับ WeeeR — เงื่อนไขข้อเสนอเป็น Source of Truth กรณีข้อพิพาท
        </p>
        <div className="space-y-1.5 border-t border-gray-100 pt-3">
          {settle.lines.map((l, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <span className="text-xs text-gray-500">{l.label}</span>
              <span className={`text-xs font-medium ${l.refund ? "text-green-600" : "text-red-500"}`}>
                {l.refund ? "+" : "−"}{l.amount.toLocaleString()} ฿
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-1">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-gray-700">หักจากคุณรวม</span>
            <span className="text-red-600">{settle.charged.toLocaleString()} ฿</span>
          </div>
          <p className="text-[11px] text-gray-400">
            พอยต์ทองที่ล็อกส่วนที่เหลือจะถูกปลดคืนผ่าน ระบบพักเงินกลาง (Escrow) <EscrowInfoIcon className="inline-flex" /> ทันทีหลังยืนยัน
          </p>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เหตุผลในการยุติงาน <span className="text-red-500">*</span></p>
        <div className="space-y-1.5">
          {CANCEL_REASONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                reason === r ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text font-medium" : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              {reason === r && <span className="mr-2">✅</span>}{r}
            </button>
          ))}
        </div>
        {reason === "อื่นๆ" && (
          <textarea
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            placeholder="ระบุเหตุผล..."
            rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40 resize-none"
          />
        )}
      </div>

      {/* Acknowledge */}
      <label className="flex items-start gap-2 cursor-pointer select-none bg-gray-50 border border-gray-200 rounded-xl p-3">
        <input
          type="checkbox"
          checked={ack}
          onChange={e => setAck(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-weeeu-primary focus:ring-weeeu-primary/40"
        />
        <span className="text-xs text-gray-600">
          รับทราบว่ายุติงานในเฟสนี้จะถูกหัก <span className="font-semibold text-red-600">{settle.charged.toLocaleString()} ฿</span> ตามเงื่อนไขข้อเสนอ และไม่สามารถเรียกคืนได้
        </span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/maintain/jobs/${id}`}
          className="flex-1 text-center border border-gray-200 text-gray-600 font-medium py-3.5 rounded-2xl text-sm hover:bg-gray-50 transition-colors"
        >
          ← ไม่ยุติ กลับงาน
        </Link>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⟳</span> กำลังยุติงาน...</> : "ยืนยันยุติงาน"}
        </button>
      </div>
    </div>
  );
}
