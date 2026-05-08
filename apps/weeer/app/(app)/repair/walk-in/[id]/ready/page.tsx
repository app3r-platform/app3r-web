"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { WalkInJob } from "../../../_lib/types";

export default function WalkInReadyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<WalkInJob | null>(null);
  const [storageFee, setStorageFee] = useState<{ fee_accrued: number; days: number; rate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      repairApi.getWalkIn(id),
      repairApi.getStorageFee(id),
    ])
      .then(([j, sf]) => { setJob(j); setStorageFee(sf); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleClose() {
    setClosing(true);
    setError("");
    try {
      // Close = mark as closed after customer picks up
      await repairApi.startWalkIn(id); // reuse start endpoint as "close/pickup confirmation"
      setSuccess(true);
      setTimeout(() => router.push("/repair/walk-in/queue"), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setClosing(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !job) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (success) return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <span className="text-4xl mb-3">🏁</span>
      <p className="text-sm font-semibold text-green-700">ปิดงานสำเร็จ — ลูกค้ารับเครื่องแล้ว</p>
      <p className="text-xs text-gray-400 mt-1">กำลังกลับ Queue…</p>
    </div>
  );
  if (!job) return null;

  const totalParts = (job.parts_added ?? []).reduce((s, p) => s + p.price * p.qty, 0);
  const basePrice = (job.estimated_price ?? 0) + totalParts;
  const totalDue = basePrice + (storageFee?.fee_accrued ?? 0);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/walk-in/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">พร้อมรับคืน</h1>
      </div>

      {/* Receipt banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-center">
        <p className="text-xs text-teal-600 mb-1">Receipt Code</p>
        <p className="text-3xl font-mono font-bold text-teal-800 tracking-widest">{job.receipt_code}</p>
        <p className="text-sm text-teal-600 mt-2 font-medium">{job.appliance_name} — ✅ ซ่อมเสร็จแล้ว</p>
      </div>

      {/* Customer info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">ลูกค้า</p>
          <p className="font-medium text-gray-800">{job.customer_name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">เบอร์โทร</p>
          <p className="font-medium text-gray-800">{job.customer_phone}</p>
        </div>
        {job.ready_at && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400">พร้อมรับตั้งแต่</p>
            <p className="font-medium text-gray-800 text-xs">
              {new Date(job.ready_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">สรุปค่าใช้จ่าย</p>
        <div className="flex justify-between text-sm text-gray-700">
          <span>ค่าซ่อม</span>
          <span>{basePrice.toLocaleString()} pts</span>
        </div>
        {storageFee && storageFee.fee_accrued > 0 && (
          <div className="flex justify-between text-sm text-yellow-700">
            <span>Storage fee ({storageFee.days} วัน × {storageFee.rate} pts/วัน)</span>
            <span>{storageFee.fee_accrued.toLocaleString()} pts</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-green-700 pt-2 border-t border-gray-100">
          <span>รวมทั้งหมด</span>
          <span>{totalDue.toLocaleString()} pts</span>
        </div>
      </div>

      {/* Storage fee warning */}
      {storageFee && storageFee.days >= 7 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">⏰</span>
          <div>
            <p className="text-sm font-semibold text-orange-800">เครื่องค้างอยู่ {storageFee.days} วัน</p>
            <p className="text-xs text-orange-600 mt-0.5">
              กำลังสะสม storage fee — แจ้งลูกค้ามารับโดยด่วน
              {storageFee.days >= 30 && " · พิจารณา Abandoned Protocol"}
            </p>
          </div>
        </div>
      )}

      {storageFee && storageFee.days >= 30 && (
        <Link href={`/repair/walk-in/${id}/abandoned`}
          className="w-full block text-center bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium py-3 rounded-xl transition-colors text-sm">
          ⚠️ เปิด Abandoned Device Protocol
        </Link>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button onClick={handleClose} disabled={closing}
        className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
        {closing ? "กำลังปิดงาน…" : "🏁 ลูกค้ารับเครื่องแล้ว — ปิดงาน"}
      </button>
    </div>
  );
}
