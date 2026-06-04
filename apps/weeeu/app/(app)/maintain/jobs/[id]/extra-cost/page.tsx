"use client";

/**
 * อนุมัติค่าใช้จ่ายเพิ่มเติม (M4 พบปัญหาเพิ่ม) — U-14 · /maintain/jobs/[id]/extra-cost
 *
 * Disposition Matrix M4: อนุมัติ A/B (จ่ายเพิ่ม/ปฏิเสธ) · confirm + success · breakdown visibility
 *   ช่างพบปัญหาเพิ่มระหว่างงาน → เสนอค่าใช้จ่ายเพิ่ม (breakdown) → ลูกค้าอนุมัติ/ปฏิเสธ
 *
 * mockup — ตัดพอยต์/persist จริง = BE จังหวะ2
 */

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const MOCK = {
  serviceCode: "MTN-20260604-0091",
  applianceLabel: "แอร์ 🌡️ — ล้างลึก",
  shopName: "ช่างเย็น Pro สาขาพระราม 9",
  basePrice: 850,
  // breakdown ค่าใช้จ่ายเพิ่ม ที่ช่างเสนอ (visibility)
  extras: [
    { label: "แคปาซิเตอร์คอมเพรสเซอร์เสื่อม — เปลี่ยนใหม่", parts: 450, labor: 150 },
    { label: "ล้างท่อน้ำทิ้งอุดตัน (งานเพิ่ม)", parts: 0, labor: 120 },
  ],
  note: "ตรวจพบระหว่างล้าง — ถ้าไม่เปลี่ยนแคปฯ เครื่องจะตัดการทำงานเป็นระยะ",
};

type Decision = "approve" | "reject";

export default function MaintainExtraCostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Decision | null>(null);

  const extraTotal = MOCK.extras.reduce((s, e) => s + e.parts + e.labor, 0);
  const newTotal = MOCK.basePrice + extraTotal;

  const handleConfirm = () => {
    if (!decision) return;
    setSubmitting(true);
    // mock — อนุมัติ → ตัดพอยต์เพิ่ม / ปฏิเสธ → ช่างทำเฉพาะงานเดิม (BE)
    setTimeout(() => { setSubmitting(false); setDone(decision); }, 800);
  };

  // ─── Success (confirm + success · A/B) ────────────────────────────────────
  if (done) {
    const approved = done === "approve";
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-5xl">{approved ? "✅" : "↩️"}</p>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {approved ? "อนุมัติค่าใช้จ่ายเพิ่มแล้ว" : "ปฏิเสธค่าใช้จ่ายเพิ่ม"}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {approved
                ? `ช่างจะดำเนินการตามที่เสนอ — ยอดรวมใหม่ ${newTotal.toLocaleString()} ฿`
                : "ช่างจะทำเฉพาะงานเดิมตามที่ตกลง — ปัญหาที่พบเพิ่มจะไม่ถูกแก้ไข"}
            </p>
          </div>
          <button
            onClick={() => router.push(`/maintain/jobs/${id}`)}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
          >
            กลับรายละเอียดงาน →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ค่าใช้จ่ายเพิ่มเติม</h1>
      </div>

      {/* Job summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
        <p className="font-semibold text-gray-900">{MOCK.applianceLabel}</p>
        <p className="text-sm text-gray-500">{MOCK.shopName}</p>
        <p className="text-xs font-mono text-gray-400">{MOCK.serviceCode}</p>
      </div>

      {/* ช่างแจ้งปัญหาเพิ่ม */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-amber-800">🔧 ช่างพบปัญหาเพิ่มระหว่างทำงาน</p>
        <p className="text-xs text-amber-700">{MOCK.note}</p>
      </div>

      {/* Breakdown (visibility) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียดค่าใช้จ่ายเพิ่ม</p>
        <div className="space-y-3">
          {MOCK.extras.map((e, i) => (
            <div key={i} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
              <p className="text-sm text-gray-700">{e.label}</p>
              <div className="flex gap-4 mt-1 text-xs text-gray-400">
                {e.parts > 0 && <span>อะไหล่ {e.parts.toLocaleString()} ฿</span>}
                {e.labor > 0 && <span>ค่าแรง {e.labor.toLocaleString()} ฿</span>}
                <span className="ml-auto font-medium text-gray-600">{(e.parts + e.labor).toLocaleString()} ฿</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ค่าบริการเดิม</span>
            <span className="text-gray-700">{MOCK.basePrice.toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ค่าใช้จ่ายเพิ่ม</span>
            <span className="text-amber-700 font-medium">+{extraTotal.toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-1.5">
            <span className="text-gray-800">ยอดรวมใหม่</span>
            <span className="text-weeeu-primary">{newTotal.toLocaleString()} ฿</span>
          </div>
        </div>
      </div>

      {/* A/B decision */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setDecision("reject")}
          className={`py-4 rounded-2xl border text-sm font-semibold transition-colors ${
            decision === "reject" ? "bg-gray-100 border-gray-400 text-gray-800 ring-1 ring-gray-300" : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          ↩️ ปฏิเสธ — ทำเฉพาะงานเดิม
        </button>
        <button
          type="button"
          onClick={() => setDecision("approve")}
          className={`py-4 rounded-2xl border text-sm font-semibold transition-colors ${
            decision === "approve" ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text ring-1 ring-weeeu-primary/30" : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
          }`}
        >
          ✅ อนุมัติจ่ายเพิ่ม
        </button>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!decision || submitting}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {submitting
          ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</>
          : decision === "approve" ? `ยืนยันอนุมัติ — จ่ายเพิ่ม ${extraTotal.toLocaleString()} ฿`
          : decision === "reject" ? "ยืนยันปฏิเสธค่าใช้จ่ายเพิ่ม"
          : "เลือกตัวเลือกด้านบนก่อน"}
      </button>
    </div>
  );
}
