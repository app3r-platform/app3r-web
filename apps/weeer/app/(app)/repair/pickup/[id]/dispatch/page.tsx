"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { PickupJob, WeeeTStaff } from "../../../_lib/types";

export default function PickupDispatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<PickupJob | null>(null);
  const [staff, setStaff] = useState<WeeeTStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedTech, setSelectedTech] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      repairApi.getPickupJob(id),
      repairApi.getAvailableStaff(),
    ])
      .then(([j, s]) => { setJob(j); setStaff(s); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!selectedTech) e.tech = "กรุณาเลือก WeeeT";
    if (!pickupTime) e.time = "กรุณาระบุเวลานัดรับ";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.dispatchPickup(id, {
        tech_id: selectedTech,
        scheduled_pickup_time: pickupTime,
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
      <span className="text-4xl mb-3">👷</span>
      <p className="text-sm font-semibold text-green-700">มอบหมายช่างสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">กำลังไปหน้าติดตาม…</p>
    </div>
  );
  if (!job) return null;

  const availableStaff = staff.filter(s => s.available);
  const busyStaff = staff.filter(s => !s.available);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/pickup/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">มอบหมาย WeeeT</h1>
      </div>

      {/* Job summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold text-blue-800">{job.appliance_name}</p>
        <p className="text-xs text-blue-600">{job.problem_description}</p>
        <p className="text-xs text-blue-500">👤 {job.customer_name} · 📍 {job.customer_address}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Staff selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            เลือก WeeeT <span className="text-red-500">*</span>
            {formErrors.tech && <span className="text-xs text-red-500 ml-2">{formErrors.tech}</span>}
          </p>

          {availableStaff.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-green-700">✅ พร้อมรับงาน ({availableStaff.length})</p>
              {availableStaff.map((s) => (
                <label key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${selectedTech === s.id ? "border-green-300 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="radio" name="tech" value={s.id}
                    checked={selectedTech === s.id}
                    onChange={() => { setSelectedTech(s.id); setFormErrors(f => ({ ...f, tech: "" })); }}
                    className="text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                      {s.distance_km !== undefined && (
                        <span className="text-xs text-gray-400">~{s.distance_km.toFixed(1)} km</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{s.phone} · งานปัจจุบัน: {s.active_jobs} งาน</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">ว่าง</span>
                </label>
              ))}
            </div>
          )}

          {busyStaff.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400">⏳ ไม่ว่าง ({busyStaff.length})</p>
              {busyStaff.map((s) => (
                <label key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all opacity-60
                    ${selectedTech === s.id ? "border-orange-300 bg-orange-50 opacity-100" : "border-gray-100"}`}>
                  <input type="radio" name="tech" value={s.id}
                    checked={selectedTech === s.id}
                    onChange={() => { setSelectedTech(s.id); setFormErrors(f => ({ ...f, tech: "" })); }}
                    className="text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.phone} · งานปัจจุบัน: {s.active_jobs} งาน</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">ไม่ว่าง</span>
                </label>
              ))}
            </div>
          )}

          {staff.length === 0 && !loading && (
            <p className="text-sm text-gray-400 text-center py-4">ไม่มี WeeeT ในระบบ</p>
          )}
        </div>

        {/* Pickup time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เวลานัดรับ <span className="text-red-500">*</span>
          </label>
          <input type="datetime-local" value={pickupTime}
            onChange={(e) => { setPickupTime(e.target.value); setFormErrors(f => ({ ...f, time: "" })); }}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.time ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.time && <p className="text-xs text-red-500 mt-1">{formErrors.time}</p>}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting || !selectedTech}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? "กำลังมอบหมาย…" : "👷 มอบหมาย WeeeT"}
        </button>
      </form>
    </div>
  );
}
