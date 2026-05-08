"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { ParcelJob, WeeeTStaff } from "../../../_lib/types";

export default function ParcelDispatchTechPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ParcelJob | null>(null);
  const [staff, setStaff] = useState<WeeeTStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedTech, setSelectedTech] = useState("");
  const [techError, setTechError] = useState("");

  useEffect(() => {
    Promise.all([
      repairApi.getParcelJob(id),
      repairApi.getAvailableStaff(),
    ])
      .then(([j, s]) => {
        setJob(j as ParcelJob);
        setStaff(s);
        if ((j as ParcelJob).weeet_id) setSelectedTech((j as ParcelJob).weeet_id!);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTech) { setTechError("กรุณาเลือก WeeeT"); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.dispatchParcelTech(id, { tech_id: selectedTech });
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
      <span className="text-4xl mb-3">👷</span>
      <p className="text-sm font-semibold text-green-700">มอบหมาย WeeeT สำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">WeeeT จะเริ่มซ่อมในร้าน</p>
    </div>
  );
  if (!job) return null;

  const availableStaff = staff.filter(s => s.available);
  const busyStaff = staff.filter(s => !s.available);

  const totalCost = (job.estimated_price ?? 0) + (job.parts_added ?? []).reduce((s, p) => s + p.price * p.qty, 0);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/parcel/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">มอบหมาย WeeeT ซ่อม</h1>
      </div>

      {/* Job summary */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1.5">
        <p className="text-sm font-semibold text-green-800">{job.appliance_name}</p>
        <p className="text-xs text-green-600">{job.diagnosis_notes ?? job.problem_description}</p>
        <p className="text-xs text-green-500">👤 {job.customer_name}</p>
        {totalCost > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-green-500">💰 ประมาณการ:</span>
            <span className="text-xs font-bold text-green-700">{totalCost.toLocaleString()} pts</span>
          </div>
        )}
        {job.condition_notes && (
          <p className="text-xs text-green-400 italic">สภาพ: {job.condition_notes}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            เลือก WeeeT <span className="text-red-500">*</span>
            {techError && <span className="text-xs text-red-500 ml-2">{techError}</span>}
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
                    onChange={() => { setSelectedTech(s.id); setTechError(""); }}
                    className="text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                      {s.id === job.weeet_id && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded font-medium">ช่างเดิม</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{s.phone} · งาน: {s.active_jobs}</p>
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
                    onChange={() => { setSelectedTech(s.id); setTechError(""); }}
                    className="text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.phone} · งาน: {s.active_jobs}</p>
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

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting || !selectedTech}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? "กำลังมอบหมาย…" : "👷 มอบหมาย WeeeT ซ่อม"}
        </button>
      </form>
    </div>
  );
}
