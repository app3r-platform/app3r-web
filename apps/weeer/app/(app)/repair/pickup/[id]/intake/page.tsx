"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { PickupJob } from "../../../_lib/types";

export default function PickupIntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<PickupJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [conditionNotes, setConditionNotes] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    repairApi.getPickupJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!conditionNotes.trim()) { setFormError("กรุณาระบุสภาพเครื่องตอนรับ"); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.intakePickup(id, { condition_notes: conditionNotes });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/pickup/${id}/diagnose`), 1500);
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
      <span className="text-4xl mb-3">📥</span>
      <p className="text-sm font-semibold text-green-700">รับเครื่องเข้าร้านสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">กำลังไปหน้าวินิจฉัย…</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/repair/pickup/${id}/track`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">รับเครื่องเข้าร้าน</h1>
      </div>

      {/* Job summary */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold text-yellow-800">{job.appliance_name}</p>
        <p className="text-xs text-yellow-600">{job.problem_description}</p>
        <p className="text-xs text-yellow-500">👤 {job.customer_name} · 👷 {job.weeet_name ?? "—"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สภาพเครื่องตอนรับ <span className="text-red-500">*</span>
          </label>
          <textarea value={conditionNotes}
            onChange={(e) => { setConditionNotes(e.target.value); setFormError(""); }}
            placeholder="บรรยายสภาพอุปกรณ์ตอนที่รับมาถึงร้าน เช่น รอยขีดข่วน, ชิ้นส่วนหาย, สภาพทั่วไป"
            rows={4}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${formError ? "border-red-400" : "border-gray-200"}`} />
          {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-700">📸 ถ่ายรูปสภาพเครื่อง</p>
          <p className="text-xs text-blue-600 mt-0.5">บันทึกหลักฐานสภาพก่อนซ่อม — อัปโหลดผ่านระบบหลัง</p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
          <span className="text-lg">🏪</span>
          <p className="text-xs text-green-700">เมื่อยืนยัน สถานะจะเปลี่ยนเป็น <strong>เครื่องถึงร้าน</strong> และเริ่มขั้นตอนวินิจฉัย</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "📥 ยืนยันรับเครื่องเข้าร้าน"}
        </button>
      </form>
    </div>
  );
}
