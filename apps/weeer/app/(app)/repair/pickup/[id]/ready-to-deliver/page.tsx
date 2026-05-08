"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { PickupJob, WeeeTStaff } from "../../../_lib/types";

export default function PickupReadyToDeliverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<PickupJob | null>(null);
  const [staff, setStaff] = useState<WeeeTStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedTech, setSelectedTech] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      repairApi.getPickupJob(id),
      repairApi.getAvailableStaff(),
    ])
      .then(([j, s]) => {
        setJob(j);
        setStaff(s);
        // pre-select original WeeeT if still available
        if (j.weeet_id) setSelectedTech(j.weeet_id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!selectedTech) e.tech = "กรุณาเลือก WeeeT ส่งคืน";
    if (!deliveryTime) e.time = "กรุณาระบุเวลานัดส่ง";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.dispatchDelivery(id, {
        tech_id: selectedTech,
        scheduled_delivery_time: deliveryTime,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/pickup/${id}/track`), 1500);
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
      <span className="text-4xl mb-3">🚚</span>
      <p className="text-sm font-semibold text-teal-700">มอบหมายส่งคืนสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">WeeeT กำลังนำเครื่องกลับให้ลูกค้า</p>
    </div>
  );
  if (!job) return null;

  const totalParts = (job.parts_added ?? []).reduce((s, p) => s + p.price * p.qty, 0);
  const totalCost = (job.final_price ?? job.estimated_price ?? 0) + totalParts;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/repair/pickup/${id}/track`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">จัดส่งคืน</h1>
      </div>

      {/* Job summary */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className="text-sm font-semibold text-teal-800">{job.appliance_name} — ซ่อมเสร็จแล้ว</p>
        </div>
        <p className="text-xs text-teal-600">👤 {job.customer_name} · 📍 {job.customer_address}</p>
        {job.diagnosis_notes && (
          <p className="text-xs text-teal-500 italic">{job.diagnosis_notes}</p>
        )}
      </div>

      {/* Cost summary */}
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
        {totalCost > 0 && (
          <div className="flex justify-between text-sm font-bold text-green-700 pt-2 border-t border-gray-100">
            <span>รวม</span>
            <span>{totalCost.toLocaleString()} pts</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Staff selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            เลือก WeeeT ส่งคืน <span className="text-red-500">*</span>
            {formErrors.tech && <span className="text-xs text-red-500 ml-2">{formErrors.tech}</span>}
          </p>
          <div className="space-y-2">
            {staff.map((s) => (
              <label key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedTech === s.id ? "border-teal-300 bg-teal-50" : "border-gray-100 hover:border-gray-200"}
                  ${!s.available ? "opacity-60" : ""}`}>
                <input type="radio" name="tech" value={s.id}
                  checked={selectedTech === s.id}
                  onChange={() => { setSelectedTech(s.id); setFormErrors(f => ({ ...f, tech: "" })); }}
                  className="text-teal-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    {s.id === job.weeet_id && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded font-medium">ช่างเดิม</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{s.phone} · งาน: {s.active_jobs}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.available ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                  {s.available ? "ว่าง" : "ไม่ว่าง"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Delivery time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เวลานัดส่ง <span className="text-red-500">*</span>
          </label>
          <input type="datetime-local" value={deliveryTime}
            onChange={(e) => { setDeliveryTime(e.target.value); setFormErrors(f => ({ ...f, time: "" })); }}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${formErrors.time ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.time && <p className="text-xs text-red-500 mt-1">{formErrors.time}</p>}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting || !selectedTech}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? "กำลังมอบหมาย…" : "🚚 มอบหมาย WeeeT ส่งคืน"}
        </button>
      </form>
    </div>
  );
}
