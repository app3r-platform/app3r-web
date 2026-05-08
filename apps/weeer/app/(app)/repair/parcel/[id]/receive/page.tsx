"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { ParcelJob } from "../../../_lib/types";
import { PARCEL_STATUS_LABEL, PARCEL_STATUS_COLOR } from "../../../_lib/types";

export default function ParcelReceivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ParcelJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [inboundTracking, setInboundTracking] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [photoGate, setPhotoGate] = useState(false);  // simulate photo capture confirmed
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    repairApi.getParcelJob(id)
      .then((j) => {
        setJob(j as ParcelJob);
        if (j.inbound_tracking) setInboundTracking(j.inbound_tracking as string);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!photoGate) e.photo = "กรุณายืนยันว่าถ่ายรูปสภาพพัสดุแล้ว";
    if (!conditionNotes.trim()) e.notes = "กรุณาบรรยายสภาพพัสดุ";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.receiveParcel(id, {
        inbound_tracking: inboundTracking.trim() || undefined,
        condition_notes: conditionNotes.trim(),
        receive_photos: [],  // photos uploaded via separate system
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/parcel/${id}/inspect`), 1500);
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
      <span className="text-4xl mb-3">📬</span>
      <p className="text-sm font-semibold text-green-700">รับพัสดุสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">กำลังไปหน้าตรวจสภาพเครื่อง…</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/parcel/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">รับพัสดุเข้าร้าน</h1>
      </div>

      {/* Job summary */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PARCEL_STATUS_COLOR[job.status]}`}>
            {PARCEL_STATUS_LABEL[job.status]}
          </span>
        </div>
        <p className="text-sm font-semibold text-indigo-800">{job.appliance_name}</p>
        <p className="text-xs text-indigo-600">{job.problem_description}</p>
        <p className="text-xs text-indigo-500">👤 {job.customer_name} · 🚚 {job.courier ?? "ไม่ระบุขนส่ง"}</p>
        {job.inbound_tracking && (
          <p className="text-xs text-indigo-500">Tracking: <span className="font-mono">{job.inbound_tracking}</span></p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Inbound tracking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เลข Tracking ขาเข้า (ถ้ามี)
          </label>
          <input
            type="text"
            value={inboundTracking}
            onChange={(e) => setInboundTracking(e.target.value)}
            placeholder="เช่น TH123456789"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 font-mono"
          />
        </div>

        {/* Photo gate */}
        <div className={`rounded-xl border-2 p-4 transition-all ${photoGate ? "border-green-300 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{photoGate ? "✅" : "📸"}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">ถ่ายรูปสภาพพัสดุก่อนแกะ</p>
              <p className="text-xs text-gray-500 mt-0.5">ถ่ายรูปกล่อง/บรรจุภัณฑ์จากทุกมุมก่อนเปิด เพื่อเป็นหลักฐาน</p>
              {formErrors.photo && <p className="text-xs text-red-500 mt-1">{formErrors.photo}</p>}
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={photoGate}
              onChange={(e) => { setPhotoGate(e.target.checked); setFormErrors(f => ({ ...f, photo: "" })); }}
              className="w-4 h-4 rounded text-green-600"
            />
            <span className="text-sm font-medium text-gray-700">ยืนยันว่าถ่ายรูปครบถ้วนแล้ว</span>
          </label>
        </div>

        {/* Condition notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สภาพพัสดุตอนรับ <span className="text-red-500">*</span>
          </label>
          <textarea
            value={conditionNotes}
            onChange={(e) => { setConditionNotes(e.target.value); setFormErrors(f => ({ ...f, notes: "" })); }}
            placeholder="บรรยายสภาพกล่อง/บรรจุภัณฑ์ เช่น กล่องครบ ไม่มีรอยบุบ / กล่องยุบด้านข้าง"
            rows={3}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${formErrors.notes ? "border-red-400" : "border-gray-200"}`}
          />
          {formErrors.notes && <p className="text-xs text-red-500 mt-1">{formErrors.notes}</p>}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
          <span className="text-lg">🏪</span>
          <p className="text-xs text-blue-700">เมื่อยืนยัน สถานะจะเปลี่ยนเป็น <strong>รับพัสดุแล้ว</strong> และเริ่มขั้นตอนตรวจสภาพเครื่อง</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "📬 ยืนยันรับพัสดุ"}
        </button>
      </form>
    </div>
  );
}
