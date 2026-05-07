"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { RepairJob } from "../../../_lib/types";

const DISPUTE_REASONS = [
  "งานไม่ได้คุณภาพตามที่ตกลง",
  "ซ่อมแล้วยังใช้งานไม่ได้",
  "WeeeT ไม่ปฏิบัติตามขั้นตอน",
  "ราคาไม่ตรงกับที่ตกลง",
  "อะไหล่ที่ใช้ไม่ใช่ของแท้",
  "อื่นๆ (ระบุในหมายเหตุ)",
];

export default function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    repairApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalReason = reason === "อื่นๆ (ระบุในหมายเหตุ)" ? customReason.trim() : reason;
    if (!finalReason) { setFormError("กรุณาเลือกหรือระบุเหตุผล"); return; }
    if (reason === "อื่นๆ (ระบุในหมายเหตุ)" && !customReason.trim()) {
      setFormError("กรุณาระบุเหตุผล"); return;
    }
    setSubmitting(true);
    setError("");
    setFormError("");
    try {
      await repairApi.openDispute(id, {
        reason: finalReason,
        evidence_notes: evidenceNotes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/jobs/${id}`), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !job) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (success) return (
    <div className="flex flex-col items-center justify-center h-56 text-center">
      <span className="text-4xl mb-3">🚩</span>
      <p className="text-sm font-semibold text-red-700">เปิดข้อพิพาทสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">Admin จะติดต่อกลับภายใน 24 ชั่วโมง</p>
      <p className="text-xs text-gray-400 mt-0.5">กำลังพากลับหน้างาน…</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/repair/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">เปิดข้อพิพาท</h1>
      </div>

      {/* Warning banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-red-800">การเปิดข้อพิพาทจะหยุดงานชั่วคราว</p>
          <p className="text-xs text-red-600 mt-1">Admin จะเข้ามาตรวจสอบและติดต่อทุกฝ่าย งานจะดำเนินต่อเมื่อ Admin ตัดสินใจ</p>
        </div>
      </div>

      {/* Job summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-1">
        <p className="text-xs text-gray-400">งานที่เปิดข้อพิพาท</p>
        <p className="text-sm font-semibold text-gray-800">{job.appliance_name}</p>
        <p className="text-xs text-gray-500">WeeeT: {job.weeet_name} · ลูกค้า: {job.customer_name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เหตุผล <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {DISPUTE_REASONS.map((r) => (
              <label key={r} className="flex items-start gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => { setReason(r); setFormError(""); }}
                  className="mt-0.5 text-red-600"
                />
                <span className="text-sm text-gray-700">{r}</span>
              </label>
            ))}
          </div>
          {reason === "อื่นๆ (ระบุในหมายเหตุ)" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="ระบุเหตุผล…"
              rows={2}
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          )}
          {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หลักฐานประกอบ / รายละเอียดเพิ่มเติม
          </label>
          <textarea
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
            placeholder="อธิบายปัญหาโดยละเอียด รวมถึงหมายเลขไฟล์ภาพ/วิดีโอ ถ้ามี"
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Admin จะเห็นข้อมูลนี้พร้อมกับไฟล์หลักฐานที่อัปโหลดไว้</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {submitting ? "กำลังส่ง…" : "🚩 ยืนยันเปิดข้อพิพาท"}
        </button>
      </form>
    </div>
  );
}
