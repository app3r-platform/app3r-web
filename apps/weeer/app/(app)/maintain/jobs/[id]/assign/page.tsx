"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { maintainApi } from "../../../_lib/api";
import { repairApi } from "../../../../repair/_lib/api";
import type { MaintainJob } from "../../../_lib/types";
import type { WeeeTStaff } from "../../../../repair/_lib/types";
import { APPLIANCE_LABEL, CLEANING_LABEL } from "../../../_lib/types";

export default function MaintainAssignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<MaintainJob | null>(null);
  const [staff, setStaff] = useState<WeeeTStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedTech, setSelectedTech] = useState("");
  const [techError, setTechError] = useState("");

  useEffect(() => {
    Promise.all([
      maintainApi.getJob(id),
      repairApi.getAvailableStaff(),   // reuse Repair endpoint — same staff pool
    ])
      .then(([j, s]) => {
        setJob(j);
        setStaff(s);
        if (j.technicianId) setSelectedTech(j.technicianId);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTech) { setTechError("กรุณาเลือกช่าง"); return; }
    setSubmitting(true);
    setError("");
    try {
      await maintainApi.assignTechnician(id, selectedTech);
      setSuccess(true);
      setTimeout(() => router.push(`/maintain/jobs/${id}`), 1500);
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
      <p className="text-xs text-gray-400 mt-1">กำลังกลับหน้ารายละเอียด…</p>
    </div>
  );
  if (!job) return null;

  const availableStaff = staff.filter(s => s.available);
  const busyStaff = staff.filter(s => !s.available);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">มอบหมายช่าง</h1>
      </div>

      {/* Job summary */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{job.applianceType === "AC" ? "❄️" : "🫧"}</span>
          <p className="text-sm font-semibold text-green-800">
            {APPLIANCE_LABEL[job.applianceType]} — {CLEANING_LABEL[job.cleaningType]}
          </p>
        </div>
        <p className="text-xs text-green-600">📍 {job.address.address}</p>
        <p className="text-xs text-green-500">
          🗓 {new Date(job.scheduledAt).toLocaleDateString("th-TH", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })} · ⏱ {job.estimatedDuration} ชม.
        </p>
        {job.recurring?.enabled && (
          <p className="text-xs text-purple-600">🔁 นัดซ้ำ — ส่วนลด 10%</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            เลือกช่าง <span className="text-red-500">*</span>
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
                      {s.id === job.technicianId && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded font-medium">ช่างเดิม</span>
                      )}
                      {s.distance_km !== undefined && (
                        <span className="text-xs text-gray-400">~{s.distance_km.toFixed(1)} km</span>
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
            <p className="text-sm text-gray-400 text-center py-4">ไม่มีช่างในระบบ</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting || !selectedTech}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? "กำลังมอบหมาย…" : "👷 ยืนยันมอบหมายช่าง"}
        </button>
      </form>
    </div>
  );
}
