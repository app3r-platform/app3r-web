"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { WalkInJob } from "../../../_lib/types";

export default function WalkInInProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<WalkInJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    repairApi.getWalkIn(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReady() {
    setSubmitting(true);
    setError("");
    try {
      await repairApi.readyWalkIn(id);
      setSuccess(true);
      setTimeout(() => router.push(`/repair/walk-in/${id}/ready`), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !job) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (success) return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <span className="text-4xl mb-3">✅</span>
      <p className="text-sm font-semibold text-teal-700">ซ่อมเสร็จ — พร้อมรับคืน</p>
      <p className="text-xs text-gray-400 mt-1">กำลังไปหน้ารับคืน…</p>
    </div>
  );
  if (!job) return null;

  const totalParts = (job.parts_added ?? []).reduce((s, p) => s + p.price * p.qty, 0);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/walk-in/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">กำลังซ่อม</h1>
      </div>

      {/* Job card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-green-700 font-bold">{job.receipt_code}</span>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{job.appliance_name}</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">กำลังซ่อม 🔧</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">ลูกค้า</p>
            <p className="font-medium text-gray-800">{job.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">เบอร์โทร</p>
            <p className="font-medium text-gray-800">{job.customer_phone}</p>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      {job.diagnosis_notes && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-700 mb-1">ผลตรวจสภาพ</p>
          <p className="text-sm text-gray-700">{job.diagnosis_notes}</p>
        </div>
      )}

      {/* Price breakdown */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ราคา</p>
        {job.estimated_price !== undefined && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>ค่าแรง + ค่าบริการ</span>
            <span>{job.estimated_price.toLocaleString()} pts</span>
          </div>
        )}
        {(job.parts_added ?? []).map((p, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-600">
            <span>{p.name} × {p.qty}</span>
            <span>{(p.price * p.qty).toLocaleString()} pts</span>
          </div>
        ))}
        {(job.estimated_price || totalParts > 0) && (
          <div className="flex justify-between text-sm font-bold text-green-700 pt-2 border-t border-gray-100">
            <span>รวม</span>
            <span>{((job.estimated_price ?? 0) + totalParts).toLocaleString()} pts</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button onClick={handleReady} disabled={submitting}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
        {submitting ? "กำลังบันทึก…" : "✅ ซ่อมเสร็จ — พร้อมให้ลูกค้ารับคืน"}
      </button>
    </div>
  );
}
