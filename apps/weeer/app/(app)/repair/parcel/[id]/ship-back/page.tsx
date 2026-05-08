"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { ParcelJob } from "../../../_lib/types";

export default function ParcelShipBackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ParcelJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [returnTracking, setReturnTracking] = useState("");
  const [postPhotoGate, setPostPhotoGate] = useState(false);
  const [packPhotoGate, setPackPhotoGate] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    repairApi.getParcelJob(id)
      .then((j) => {
        setJob(j as ParcelJob);
        if (j.return_tracking) setReturnTracking(j.return_tracking as string);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!returnTracking.trim()) e.tracking = "กรุณากรอกเลข Tracking ขาออก";
    if (!postPhotoGate) e.postPhoto = "กรุณายืนยันถ่ายรูปหลังซ่อม";
    if (!packPhotoGate) e.packPhoto = "กรุณายืนยันถ่ายรูปการแพ็ค";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.shipBack(id, {
        return_tracking: returnTracking.trim(),
        post_photos: [],
        packing_photos: [],
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/parcel/queue`), 1500);
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
      <span className="text-4xl mb-3">🚀</span>
      <p className="text-sm font-semibold text-teal-700">ส่งพัสดุคืนสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">ลูกค้าจะได้รับเครื่องเร็วๆ นี้</p>
    </div>
  );
  if (!job) return null;

  const partsTotal = (job.parts_added ?? []).reduce((s, p) => s + p.price * p.qty, 0);
  const totalCost = (job.final_price ?? job.estimated_price ?? 0) + partsTotal;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/parcel/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ส่งพัสดุคืนลูกค้า</h1>
      </div>

      {/* Job summary */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className="text-sm font-semibold text-teal-800">{job.appliance_name} — ซ่อมเสร็จแล้ว</p>
        </div>
        <p className="text-xs text-teal-600">👤 {job.customer_name} · 📍 {job.customer_address}</p>
        {job.diagnosis_notes && <p className="text-xs text-teal-500 italic">{job.diagnosis_notes}</p>}
        {job.courier && <p className="text-xs text-teal-500">🚚 ใช้ขนส่ง: {job.courier}</p>}
      </div>

      {/* Cost summary */}
      {totalCost > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ค่าใช้จ่าย</p>
          {job.estimated_price !== undefined && (
            <div className="flex justify-between text-sm text-gray-700">
              <span>ค่าแรง + บริการ</span>
              <span>{job.estimated_price.toLocaleString()} pts</span>
            </div>
          )}
          {(job.parts_added ?? []).map((p, i) => (
            <div key={i} className="flex justify-between text-xs text-gray-600">
              <span>{p.name} × {p.qty}</span>
              <span>{(p.price * p.qty).toLocaleString()} pts</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold text-green-700 pt-2 border-t border-gray-100">
            <span>รวม</span>
            <span>{totalCost.toLocaleString()} pts</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Post-repair photo gate */}
        <div className={`rounded-xl border-2 p-4 transition-all ${postPhotoGate ? "border-green-300 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{postPhotoGate ? "✅" : "📸"}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">ถ่ายรูปเครื่องหลังซ่อม</p>
              <p className="text-xs text-gray-500 mt-0.5">บันทึกสภาพเครื่องหลังซ่อมเสร็จ ทุกมุม ก่อนแพ็ค</p>
              {formErrors.postPhoto && <p className="text-xs text-red-500 mt-1">{formErrors.postPhoto}</p>}
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={postPhotoGate}
              onChange={(e) => { setPostPhotoGate(e.target.checked); setFormErrors(f => ({ ...f, postPhoto: "" })); }}
              className="w-4 h-4 rounded text-green-600" />
            <span className="text-sm font-medium text-gray-700">ยืนยันถ่ายรูปเครื่องหลังซ่อมแล้ว</span>
          </label>
        </div>

        {/* Packing photo gate */}
        <div className={`rounded-xl border-2 p-4 transition-all ${packPhotoGate ? "border-green-300 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{packPhotoGate ? "✅" : "📦"}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">ถ่ายรูปการแพ็คกล่อง</p>
              <p className="text-xs text-gray-500 mt-0.5">ถ่ายรูปการแพ็คกันกระแทกและปิดกล่องก่อนส่ง</p>
              {formErrors.packPhoto && <p className="text-xs text-red-500 mt-1">{formErrors.packPhoto}</p>}
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={packPhotoGate}
              onChange={(e) => { setPackPhotoGate(e.target.checked); setFormErrors(f => ({ ...f, packPhoto: "" })); }}
              className="w-4 h-4 rounded text-green-600" />
            <span className="text-sm font-medium text-gray-700">ยืนยันถ่ายรูปการแพ็คแล้ว</span>
          </label>
        </div>

        {/* Return tracking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เลข Tracking ขาออก <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={returnTracking}
            onChange={(e) => { setReturnTracking(e.target.value); setFormErrors(f => ({ ...f, tracking: "" })); }}
            placeholder="เช่น TH987654321"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono ${formErrors.tracking ? "border-red-400" : "border-gray-200"}`}
          />
          {formErrors.tracking && <p className="text-xs text-red-500 mt-1">{formErrors.tracking}</p>}
        </div>

        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-start gap-2">
          <span className="text-base">🚀</span>
          <p className="text-xs text-teal-700">
            เมื่อยืนยัน สถานะจะเปลี่ยนเป็น <strong>กำลังส่งคืน</strong> ลูกค้าจะได้รับแจ้งเลข Tracking โดยอัตโนมัติ
          </p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting || !postPhotoGate || !packPhotoGate || !returnTracking.trim()}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? "กำลังส่ง…" : "🚀 ยืนยันส่งพัสดุคืนลูกค้า"}
        </button>
      </form>
    </div>
  );
}
