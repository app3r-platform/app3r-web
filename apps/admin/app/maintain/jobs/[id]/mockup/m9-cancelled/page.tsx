"use client";
/**
 * MOCKUP — M9 (Admin view): Audit — ยกเลิกกลางล้าง
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M9: Admin ดูงานที่ถูก WeeeU ยกเลิกระหว่าง in_progress
 *
 * สิ่งที่เพิ่ม (delta จาก admin/maintain/jobs/[id] ทั่วไป):
 *  1. Status badge "ยกเลิก (กลางคัน)" + cancel reason ที่ WeeeU ระบุ
 *  2. Settle audit panel (ค่าเดินทาง + ค่าบริการส่วน + breakdown)
 *  3. Audit log timeline (WeeeU ส่ง → ระบบ process → settle สำเร็จ)
 *  4. Admin action: "อนุมัติ settle" / "ปรับ settle" / "escalate dispute"
 *
 *
 * mock-anno §5: มาจาก A-06 MAINTAIN-JOBS list (Admin เลือก job ที่ status = "cancelled")
 *               หรือ A-07 job detail เดิม → settle pending → เข้าหน้า audit
 * mock-anno §6: ปุ่ม "อนุมัติ settle" / "ปรับ settle" / "escalate" → stay (A-07 updated)
 *               ปุ่ม "กลับรายการ" → A-06 MAINTAIN-JOBS
 * mock-anno §8: WeeeU (U-16): เห็น status "cancelled" + ยอด settle คืน
 *               WeeeR (R-14): เห็น settle เข้า wallet + penalty (ถ้ามี)
 *               WeeeT: งานหยุด (notification only)
 *
 * Maintain Gen 4 · 2026-05-24 · Mockup เคส M9 Admin
 */

import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { MockAnno } from "@/components/MockAnno";

const JOB = {
  id: "mock-m9-admin-001",
  serviceCode: "MTN-20260519-0088",
  applianceType: "AC" as const,
  cleaningType: "deep" as const,
  status: "cancelled" as const,
  scheduledAt: "2026-05-22T10:00:00+07:00",
  cancelledAt: "2026-05-22T11:34:00+07:00",
  cancelReason: "ติดธุระฉุกเฉิน ต้องพาคนในบ้านส่งโรงพยาบาล",
  cancelledBy: "WeeeU (ลูกค้า)",
  address: { address: "200 ถ.พหลโยธิน จตุจักร กรุงเทพ 10900" },
  customer: { name: "คุณอรุณ สว่างใจ", id: "USR-2245" },
  shop:     { name: "ร้านฟ้าใสแอร์เซอร์วิส", id: "SHOP-0088" },
  technicianId: "TECH-0042",
  offerLock: {
    depositAmount:   300,
    travelFee:        80,
    serviceProgress:  50,   // ค่าบริการตามสัดส่วน (ล้างได้ ~60% แล้ว)
    cancelMidPolicy: "ยกเลิกกลางคัน: WeeeR ได้รับค่าเดินทาง + ค่าบริการตามสัดส่วน",
  },
  settle: {
    toWeeeR:   130,  // 80 travel + 50 service partial
    toWeeeU:   170,  // 300 deposit - 130 = 170 คืน
    status: "pending_approval" as "pending_approval" | "approved" | "disputed",
  },
};

const AUDIT_LOG = [
  { time: "11:34", actor: "WeeeU",   event: "กดยกเลิกงาน",            detail: `เหตุผล: "${JOB.cancelReason}"` },
  { time: "11:34", actor: "ระบบ",   event: "แจ้ง WeeeR + WeeeT",      detail: "Push notification ส่งแล้ว" },
  { time: "11:35", actor: "ระบบ",   event: "คำนวณ settle",             detail: `WeeeR +${JOB.settle.toWeeeR}pt / WeeeU +${JOB.settle.toWeeeU}pt` },
  { time: "11:35", actor: "ระบบ",   event: "สร้าง settle record",      detail: "รอ Admin อนุมัติ" },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function M9CancelledAdminMockupPage() {
  const [settleStatus, setSettleStatus] = useState(JOB.settle.status);
  const [confirming, setConfirming]     = useState<"approve" | "dispute" | null>(null);

  const handleApprove = () => {
    setTimeout(() => { setSettleStatus("approved"); setConfirming(null); }, 600);
  };

  const handleDispute = () => {
    setTimeout(() => { setSettleStatus("disputed"); setConfirming(null); }, 600);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800">← กลับ</Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">รายละเอียดงาน (Audit)</h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                ยกเลิก (กลางคัน)
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-0.5">{JOB.serviceCode}</p>
          </div>
          <span className="text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded">
            MOCKUP M9-Admin
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">

            {/* Job info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
              </div>
              <div className="p-5 space-y-3">
                <Row label="เครื่อง"       value="แอร์ 🌡️ — ล้างลึก 🔬" />
                <Row label="ลูกค้า"         value={`${JOB.customer.name} (${JOB.customer.id})`} />
                <Row label="ร้าน"           value={`${JOB.shop.name} (${JOB.shop.id})`} />
                <Row label="ช่าง"           value={JOB.technicianId} />
                <Row label="วันนัด"         value={fmt(JOB.scheduledAt)} />
                <Row label="เวลายกเลิก"    value={fmt(JOB.cancelledAt)} />
                <Row label="ยกเลิกโดย"    value={JOB.cancelledBy} />
                <Row label="ที่อยู่"         value={JOB.address.address} />
              </div>
            </div>

            {/* Cancel reason */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">เหตุผลยกเลิก</p>
              <p className="text-sm text-gray-800">&ldquo;{JOB.cancelReason}&rdquo;</p>
              <p className="text-xs text-gray-500">— {JOB.cancelledBy} · {fmt(JOB.cancelledAt)}</p>
            </div>

            {/* Audit log */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">บันทึก Audit</p>
              </div>
              <div className="p-5 space-y-3">
                {AUDIT_LOG.map((entry, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-gray-400 shrink-0 pt-0.5">{entry.time}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          entry.actor === "WeeeU" ? "bg-[#E1F7EC] text-[#0A9B55]"
                          : "bg-gray-100 text-gray-500"
                        }`}>{entry.actor}</span>
                        <span className="font-medium text-gray-800">{entry.event}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — Settle */}
          <div className="space-y-5">

            {/* Settle breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ตรวจสอบการ Settle</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  settleStatus === "approved"  ? "bg-green-50 text-green-700"
                  : settleStatus === "disputed" ? "bg-red-50 text-red-700"
                  : "bg-yellow-50 text-yellow-700"
                }`}>
                  {settleStatus === "approved"  ? "✅ อนุมัติแล้ว"
                  : settleStatus === "disputed" ? "⚖️ พิพาท"
                  : "⏳ รออนุมัติ"}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500">{JOB.offerLock.cancelMidPolicy}</p>

                {/* Breakdown — WeeeR */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase">WeeeR รับ</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ค่าเดินทาง</span>
                      <span className="font-medium">{JOB.offerLock.travelFee} Point</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ค่าบริการ (ตามสัดส่วน)</span>
                      <span className="font-medium">{JOB.offerLock.serviceProgress} Point</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-1.5">
                      <span className="font-semibold text-gray-700">รวม WeeeR</span>
                      <span className="font-bold text-[#FF663A]">{JOB.settle.toWeeeR} Point</span>
                    </div>
                  </div>
                </div>

                {/* Breakdown — WeeeU */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase">WeeeU คืน</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">พอยต์ทองที่ล็อก</span>
                      <span className="font-medium">{JOB.offerLock.depositAmount} Point</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">หัก settle WeeeR</span>
                      <span className="font-medium text-red-600">−{JOB.settle.toWeeeR} Point</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-1.5">
                      <span className="font-semibold text-gray-700">คืน WeeeU</span>
                      <span className="font-bold text-[#0A9B55]">{JOB.settle.toWeeeU} Point</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin actions */}
            {settleStatus === "pending_approval" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ Admin</p>

                {confirming === "approve" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3 text-sm">
                    <p className="font-medium text-green-800">ยืนยันอนุมัติ settle?</p>
                    <p className="text-xs text-green-700">
                      WeeeR +{JOB.settle.toWeeeR}pt · WeeeU +{JOB.settle.toWeeeU}pt
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleApprove}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm">
                        ✅ อนุมัติ
                      </button>
                      <button onClick={() => setConfirming(null)}
                        className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm">
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}

                {confirming === "dispute" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-3 text-sm">
                    <p className="font-medium text-red-800">Escalate เป็น dispute?</p>
                    <p className="text-xs text-red-600">Admin จะต้องตรวจสอบเพิ่มเติมก่อน settle</p>
                    <div className="flex gap-2">
                      <button onClick={handleDispute}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-sm">
                        ⚖️ Escalate
                      </button>
                      <button onClick={() => setConfirming(null)}
                        className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm">
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}

                {!confirming && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirming("approve")}
                      className="flex-1 bg-[#2C5E8C] hover:bg-[#1e4a72] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      ✅ อนุมัติ Settle
                    </button>
                    <button
                      onClick={() => setConfirming("dispute")}
                      className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
                    >
                      ⚖️ Dispute
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settled result */}
            {settleStatus === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
                <p className="text-xl">✅</p>
                <p className="font-semibold text-green-800">Settle อนุมัติแล้ว</p>
                <p className="text-xs text-green-700">
                  WeeeR +{JOB.settle.toWeeeR}pt · WeeeU +{JOB.settle.toWeeeU}pt
                </p>
              </div>
            )}
            {settleStatus === "disputed" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-1">
                <p className="text-xl">⚖️</p>
                <p className="font-semibold text-red-800">Escalated เป็น Dispute</p>
                <Link href={`/disputes?job_id=${JOB.id}&service=maintain`}
                  className="text-xs text-red-600 underline">
                  ดูหน้า Dispute →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* M9 case · A-07c · admin canonical = data-driven (ดู ADMIN_ANNO_MAP) — case-flow owner: maintain */}
      <MockAnno />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}
