"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

type OverrideAction = "cancel" | "refund" | "forfeit";

/* ─────────────────────────────────────────────
   9-แกน lock implications per action
───────────────────────────────────────────── */
const ACTION_CONFIG: Record<OverrideAction, {
  label:   string;
  desc:    string;
  color:   string;
  btnColor: string;
  axes:    { key: string; icon: string; implication: string }[];
}> = {
  cancel: {
    label:    "ยกเลิกงาน",
    desc:     "ยกเลิกงานและคืนเงินตามนโยบายเงินค้ำประกัน (Deposit)",
    color:    "border-orange-300 bg-orange-50 text-orange-700",
    btnColor: "bg-orange-600 hover:bg-orange-700 text-white",
    axes: [
      { key: "price",        icon: "💰", implication: "ไม่มีการจ่ายเงินค่าซ่อม (Final price = 0)" },
      { key: "deposit",      icon: "💳", implication: "พอยต์ทองที่ล็อกคืนตาม policy (อิง cancellation point)" },
      { key: "cancellation", icon: "❌", implication: "เปิดใช้ cancellation policy ทันที" },
      { key: "timeline",     icon: "⏱️", implication: "งานสิ้นสุดก่อนกำหนด — ช่วงยกเลิกมีผลต่อเงินค้ำประกัน (Deposit)" },
    ],
  },
  refund: {
    label:    "คืนเงินทั้งหมด (Force Refund)",
    desc:     "คืนเงินให้ WeeeU ทั้งหมด — override นโยบายเงินค้ำประกัน (Deposit)",
    color:    "border-blue-300 bg-blue-50 text-blue-700",
    btnColor: "bg-admin-primary hover:bg-admin-dark text-white",
    axes: [
      { key: "price",    icon: "💰", implication: "คืนพักเงินกลางทั้งหมดให้ WeeeU (override ราคาตกลง)" },
      { key: "deposit",  icon: "💳", implication: "override นโยบายเงินค้ำประกัน (Deposit) — คืนพอยต์ทองที่ล็อก 100%" },
      { key: "quality",  icon: "⭐", implication: "บ่งชี้ว่างานไม่ผ่านมาตรฐาน (เหตุผล Refund)" },
      { key: "evidence", icon: "📸", implication: "หลักฐานต้องสนับสนุนการ Refund ใน Audit Log" },
    ],
  },
  forfeit: {
    label:    "ยึดเงินค้ำประกัน (Deposit)",
    desc:     "ยึดพอยต์ทองที่ล็อกให้ WeeeR ทั้งหมด (override policy)",
    color:    "border-red-300 bg-red-50 text-red-700",
    btnColor: "bg-red-600 hover:bg-red-700 text-white",
    axes: [
      { key: "deposit",      icon: "💳", implication: "ยึดพอยต์ทองที่ล็อก 100% ให้ WeeeR (override คืนลูกค้า)" },
      { key: "cancellation", icon: "❌", implication: "WeeeU ยกเลิกผิดเงื่อนไข → WeeeR รับพอยต์ทองที่ล็อก" },
      { key: "conduct",      icon: "🤝", implication: "พฤติกรรม WeeeU ละเมิดข้อตกลง" },
      { key: "price",        icon: "💰", implication: "พอยต์ทองที่ล็อกคือส่วนหนึ่งของค่าบริการ — ไม่คืน" },
    ],
  },
};

interface JobSummary {
  id:              string;
  weeeu_name:      string;
  weeer_name:      string;
  weeet_name:      string;
  status:          string;
  deposit_amount:  number | null;
  final_price:     number | null;
  deposit_action?: string | null;
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_JOB_SUMMARY: JobSummary = {
  id: "rj-001aabbcc-ddee-ffgg-hh11-iijjkkllmmnn",
  weeeu_name: "สมชาย ใจดี",
  weeer_name: "ร้าน iCare สยาม",
  weeet_name: "ช่างวิชัย รักษ์มือถือ",
  status: "awaiting_user",
  deposit_amount: 500,
  final_price: null,
  deposit_action: "pending",
};

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function ManualOverridePage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job,       setJob]       = useState<JobSummary | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [action,    setAction]    = useState<OverrideAction | "">("");
  const [reason,    setReason]    = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result,    setResult]    = useState<{ ok: boolean; message: string } | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<JobSummary>(`/admin/repair/jobs/${jobId}`);
      setJob(d);
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setJob(MOCK_JOB_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (!isSuperAdmin())    { router.push(`/repair/jobs/${jobId}`); return; }
    if (jobId) fetchJob();
  }, [router, fetchJob, jobId]);

  async function handleSubmit() {
    if (!action || !reason.trim() || !confirmed) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/repair/jobs/${jobId}/override`, { action, reason });
      setResult({ ok: true, message: `Override "${action}" สำเร็จ — งานถูก update แล้ว` });
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      showToast("โหมดสาธิต: backend ยังไม่พร้อม");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar /><main className="flex-1 p-8 text-gray-500">กำลังโหลด...</main>
    </div>
  );

  const cfg = action ? ACTION_CONFIG[action] : null;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 max-w-2xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
          <Link href="/repair/jobs" className="hover:text-gray-600">รายการงานซ่อม</Link>
          <span>/</span>
          <Link href={`/repair/jobs/${jobId}`} className="hover:text-gray-600">รายละเอียดงาน</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">แทรกแซงด้วยมือ</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">⚙️ แทรกแซงด้วยมือ (Super Admin)</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            🔒 Super Admin เท่านั้น
          </span>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700 font-semibold mb-1">⚠️ คำเตือน — การกระทำนี้ไม่สามารถย้อนกลับได้</p>
          <p className="text-xs text-red-600">
            Manual override จะบันทึกใน Audit Log ทันที ระบุเหตุผลที่ชัดเจนก่อนดำเนินการ
          </p>
        </div>

        {/* Job summary */}
        {job && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2">งาน</p>
            <p className="font-mono text-xs text-gray-500 mb-3">{job.id}</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">WeeeU</p>
                <p className="text-gray-800 font-medium">{job.weeeu_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">WeeeR</p>
                <p className="text-gray-800 font-medium">{job.weeer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">WeeeT</p>
                <p className="text-gray-800 font-medium">{job.weeet_name}</p>
              </div>
            </div>
            {job.deposit_amount != null && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs">
                <div>
                  <span className="text-gray-500">เงินค้ำประกัน (Deposit): </span>
                  <span className="font-semibold text-admin-primary">{job.deposit_amount.toLocaleString()} G</span>
                  {job.deposit_action && <span className="text-gray-500 ml-1">({job.deposit_action})</span>}
                </div>
                {job.final_price != null && (
                  <div>
                    <span className="text-gray-500">ราคาสุดท้าย: </span>
                    <span className="font-semibold text-gray-700">{job.final_price.toLocaleString()} G</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {result ? (
          <div className={`rounded-xl p-5 border ${
            result.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            <p className="font-semibold mb-2">{result.ok ? "✅ สำเร็จ" : "❌ เกิดข้อผิดพลาด"}</p>
            <p className="text-sm">{result.message}</p>
            <Link href={`/repair/jobs/${jobId}`}
              className="mt-4 inline-block text-sm text-admin-primary hover:text-admin-dark font-medium">
              ← กลับรายละเอียดงาน
            </Link>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Action selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">เลือก Action</label>
              <div className="space-y-2">
                {(Object.entries(ACTION_CONFIG) as [OverrideAction, typeof ACTION_CONFIG[OverrideAction]][]).map(([key, c]) => (
                  <button key={key} onClick={() => setAction(key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      action === key ? c.color : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}>
                    <p className="font-semibold text-sm">{c.label}</p>
                    <p className="text-xs mt-0.5 opacity-80">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 9-Axes implications */}
            {cfg && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  ⚙️ ผลกระทบต่อ 9 แกน Lock
                </p>
                <div className="space-y-2">
                  {cfg.axes.map(ax => (
                    <div key={ax.key} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-base shrink-0 mt-0.5">{ax.icon}</span>
                      <div>
                        <p className="text-xs font-medium text-gray-700 capitalize">{ax.key}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ax.implication}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    ℹ️ ผลตัดสินนี้จะ <strong>override</strong> ข้อตกลง 9 แกนเดิมโดยอำนาจ Super Admin
                    และบันทึกใน Audit Log พร้อมชื่อผู้ดำเนินการ
                  </p>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผล <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder="ระบุเหตุผลที่ชัดเจน — จะบันทึกใน Audit Log"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-admin-primary resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{reason.length} ตัวอักษร (แนะนำ ≥ 20)</p>
            </div>

            {/* Confirmation */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-red-500" />
              <span className="text-sm text-gray-700">
                ฉันเข้าใจว่าการกระทำนี้ไม่สามารถย้อนกลับได้ และได้บันทึกใน Audit Log
                ในชื่อ Super Admin แล้ว
              </span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!action || reason.trim().length < 10 || !confirmed || submitting}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                cfg?.btnColor ?? "bg-red-600 hover:bg-red-50 text-red-700 border border-red-200"
              }`}>
              {submitting ? "กำลังดำเนินการ..." : `ยืนยัน ${cfg?.label ?? ""}`}
            </button>

          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-100 border border-gray-300 rounded-xl px-5 py-3 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
