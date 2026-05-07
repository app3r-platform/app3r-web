"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

type OverrideAction = "cancel" | "refund" | "forfeit";

const ACTION_CONFIG: Record<OverrideAction, { label: string; desc: string; color: string }> = {
  cancel:  { label: "Cancel Job",   desc: "ยกเลิกงานและคืนเงินตาม deposit policy", color: "border-orange-700 bg-orange-900/20 text-orange-300" },
  refund:  { label: "Force Refund", desc: "คืนเงินให้ WeeeU ทั้งหมด (override deposit policy)", color: "border-blue-700 bg-blue-900/20 text-blue-300" },
  forfeit: { label: "Forfeit Deposit", desc: "ยึดมัดจำให้ WeeeR ทั้งหมด (override policy)", color: "border-red-700 bg-red-900/20 text-red-300" },
};

interface JobSummary {
  id: string;
  weeeu_name: string;
  weeer_name: string;
  weeet_name: string;
  status: string;
  deposit_amount: number | null;
  final_price: number | null;
}

export default function ManualOverridePage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<OverrideAction | "">("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<JobSummary>(`/admin/repair/jobs/${jobId}`);
      setJob(d);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (!isSuperAdmin()) { router.push(`/repair/jobs/${jobId}`); return; }
    if (jobId) fetchJob();
  }, [router, fetchJob, jobId]);

  async function handleSubmit() {
    if (!action || !reason.trim() || !confirmed) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/repair/jobs/${jobId}/override`, { action, reason });
      setResult({ ok: true, message: `Override "${action}" สำเร็จ — งานถูก update แล้ว` });
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8 text-gray-500">กำลังโหลด...</main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/repair/jobs/${jobId}`} className="text-sm text-gray-500 hover:text-gray-300">
            ← Job Detail
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">⚙️ Manual Override</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-800">
            🔒 Super Admin Only
          </span>
        </div>

        {/* Warning */}
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-300 font-semibold mb-1">⚠️ คำเตือน — การกระทำนี้ไม่สามารถย้อนกลับได้</p>
          <p className="text-xs text-red-400">
            Manual override จะบันทึกใน Audit Log ทันที ระบุเหตุผลที่ชัดเจนก่อนดำเนินการ
          </p>
        </div>

        {/* Job summary */}
        {job && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2">Job</p>
            <p className="font-mono text-xs text-gray-400 mb-3">{job.id}</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-gray-600">WeeeU</p><p className="text-gray-200">{job.weeeu_name}</p></div>
              <div><p className="text-xs text-gray-600">WeeeR</p><p className="text-gray-200">{job.weeer_name}</p></div>
              <div><p className="text-xs text-gray-600">WeeeT</p><p className="text-gray-200">{job.weeet_name}</p></div>
            </div>
            {job.deposit_amount != null && (
              <p className="text-xs text-gray-500 mt-3">Deposit: {job.deposit_amount.toLocaleString()} G</p>
            )}
          </div>
        )}

        {result ? (
          <div className={`rounded-xl p-5 border ${result.ok ? "bg-green-900/20 border-green-800 text-green-300" : "bg-red-900/20 border-red-800 text-red-300"}`}>
            <p className="font-semibold mb-2">{result.ok ? "✅ สำเร็จ" : "❌ เกิดข้อผิดพลาด"}</p>
            <p className="text-sm">{result.message}</p>
            <Link href={`/repair/jobs/${jobId}`}
              className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300">
              ← กลับ Job Detail
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Action selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">เลือก Action</label>
              <div className="space-y-2">
                {(Object.entries(ACTION_CONFIG) as [OverrideAction, typeof ACTION_CONFIG[OverrideAction]][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => setAction(key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      action === key ? cfg.color : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                    }`}>
                    <p className="font-semibold text-sm">{cfg.label}</p>
                    <p className="text-xs mt-0.5 opacity-80">{cfg.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                เหตุผล <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder="ระบุเหตุผลที่ชัดเจน — จะบันทึกใน Audit Log"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 resize-none"
              />
              <p className="text-xs text-gray-600 mt-1">{reason.length} ตัวอักษร (แนะนำ ≥ 20)</p>
            </div>

            {/* Confirmation */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-red-500" />
              <span className="text-sm text-gray-300">
                ฉันเข้าใจว่าการกระทำนี้ไม่สามารถย้อนกลับได้ และได้บันทึกใน Audit Log ในชื่อ Super Admin แล้ว
              </span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!action || reason.trim().length < 10 || !confirmed || submitting}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-red-700 hover:bg-red-600 text-white enabled:hover:shadow-lg">
              {submitting ? "กำลังดำเนินการ..." : `ยืนยัน ${action ? ACTION_CONFIG[action].label : ""}`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
