"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { WalkInJob } from "../../../_lib/types";

const GRACE_OPTIONS: { days: 7 | 14 | 30; label: string; description: string }[] = [
  { days: 7,  label: "7 วัน",  description: "เคสเร่งด่วน — ต้องการพื้นที่เร็ว" },
  { days: 14, label: "14 วัน", description: "มาตรฐาน — แจ้งลูกค้าให้เวลาสมเหตุสมผล" },
  { days: 30, label: "30 วัน", description: "ให้เวลานาน — กรณีลูกค้าเดินทางไกล" },
];

export default function WalkInAbandonedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<WalkInJob | null>(null);
  const [storageFee, setStorageFee] = useState<{ fee_accrued: number; days: number; rate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [graceDays, setGraceDays] = useState<7 | 14 | 30>(14);
  const [action, setAction] = useState<"scrap" | "disposal">("scrap");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      repairApi.getWalkIn(id),
      repairApi.getStorageFee(id),
    ])
      .then(([j, sf]) => { setJob(j); setStorageFee(sf); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await repairApi.abandonWalkIn(id, {
        grace_days: graceDays,
        action,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push("/repair/walk-in/queue"), 2000);
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
      <span className="text-4xl mb-3">📋</span>
      <p className="text-sm font-semibold text-gray-800">เปิด Abandoned Protocol สำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">ระบบจะแจ้งลูกค้าและติดตาม grace period</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/repair/walk-in/${id}/ready`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Abandoned Device Protocol</h1>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-red-800">ลูกค้าไม่มารับเครื่อง</p>
          <p className="text-xs text-red-600 mt-1">
            ระบบจะส่งการแจ้งเตือนให้ลูกค้า และนับ Grace Period ก่อนดำเนินการกับอุปกรณ์
          </p>
        </div>
      </div>

      {/* Device info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-gray-500">{job.receipt_code}</span>
          <p className="text-sm font-semibold text-gray-800">{job.appliance_name}</p>
        </div>
        <p className="text-xs text-gray-500">👤 {job.customer_name} · 📞 {job.customer_phone}</p>
        {storageFee && (
          <div className="bg-yellow-50 rounded-lg p-2 flex justify-between text-xs">
            <span className="text-yellow-700">Storage fee สะสม ({storageFee.days} วัน)</span>
            <span className="font-bold text-yellow-800">{storageFee.fee_accrued.toLocaleString()} pts</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
        {/* Grace period */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Grace Period ก่อนดำเนินการ</p>
          <div className="space-y-2">
            {GRACE_OPTIONS.map((opt) => (
              <label key={opt.days} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${graceDays === opt.days ? "border-orange-300 bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}>
                <input type="radio" name="grace" value={opt.days}
                  checked={graceDays === opt.days}
                  onChange={() => setGraceDays(opt.days)}
                  className="mt-0.5 text-orange-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action after grace period */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">หลัง Grace Period — ดำเนินการ</p>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all
              ${action === "scrap" ? "border-lime-300 bg-lime-50" : "border-gray-100 hover:border-gray-200"}`}>
              <input type="radio" name="action" value="scrap"
                checked={action === "scrap"}
                onChange={() => setAction("scrap")}
                className="text-lime-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">♻️ ส่ง Scrap</p>
                <p className="text-xs text-gray-500">โอนไป Scrap module</p>
              </div>
            </label>
            <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all
              ${action === "disposal" ? "border-red-300 bg-red-50" : "border-gray-100 hover:border-gray-200"}`}>
              <input type="radio" name="action" value="disposal"
                checked={action === "disposal"}
                onChange={() => setAction("disposal")}
                className="text-red-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">🗑️ ทิ้ง</p>
                <p className="text-xs text-gray-500">กำจัดตามกฎหมาย</p>
              </div>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="บันทึกสำหรับ Admin และการติดตาม (ถ้ามี)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-700">ขั้นตอนที่จะเกิดขึ้น:</p>
          <p>1. ระบบส่ง SMS/notification แจ้ง {job.customer_name}</p>
          <p>2. นับ Grace Period {graceDays} วัน</p>
          <p>3. ถ้าไม่มารับ → {action === "scrap" ? "โอนไป Scrap module" : "กำจัดตามกฎหมาย"}</p>
          <p>4. Storage fee สะสมต่อจนถึงวันที่ดำเนินการ</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังดำเนินการ…" : `⚠️ เปิด Abandoned Protocol (${graceDays} วัน)`}
        </button>
      </div>
    </div>
  );
}
