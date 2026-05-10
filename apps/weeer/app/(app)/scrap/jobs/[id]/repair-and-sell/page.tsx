"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrapApi } from "../../../_lib/api";
import { repairApi } from "../../../../repair/_lib/api";
import type { ScrapJob } from "../../../_lib/types";
import type { WeeeTStaff } from "../../../../repair/_lib/types";
import { CONDITION_GRADE_LABEL } from "../../../_lib/types";

export default function RepairAndSellPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<ScrapJob | null>(null);
  const [staff, setStaff] = useState<WeeeTStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [applianceName, setApplianceName] = useState("");
  const [weeetId, setWeeetId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    Promise.all([
      scrapApi.getJob(id),
      repairApi.getAvailableStaff(),
    ])
      .then(([jobData, staffData]) => {
        setJob(jobData);
        setApplianceName(jobData.scrapItemDescription ?? "");
        setStaff(staffData);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!applianceName.trim()) { setSubmitError("กรุณาระบุชื่องาน"); return; }
    if (!weeetId) { setSubmitError("กรุณาเลือกช่าง"); return; }
    if (!scheduledAt) { setSubmitError("กรุณาระบุวันเริ่มซ่อม"); return; }
    const priceNum = parseFloat(originalPrice);
    if (!originalPrice || isNaN(priceNum) || priceNum <= 0) { setSubmitError("กรุณาระบุราคาขายเป้าหมาย"); return; }
    if (!job) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const newRepairJob = await repairApi.createFromScrap(job, {
        appliance_name: applianceName.trim(),
        weeet_id: weeetId,
        scheduled_at: scheduledAt,
        original_price: priceNum,
        decision_notes: notes.trim() || undefined,
      });
      router.push(`/repair/jobs/${newRepairJob.id}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/scrap/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🛠 สร้างใบซ่อม</h1>
      </div>

      {/* ScrapJob source info */}
      {job && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 space-y-1">
          <p className="font-semibold">ซากต้นทาง (purchased_scrap)</p>
          <p>รายละเอียด: {job.scrapItemDescription ?? job.scrapItemId}</p>
          {job.conditionGrade && (
            <p>สภาพ: {CONDITION_GRADE_LABEL[job.conditionGrade]}</p>
          )}
          <p className="font-mono text-indigo-400">ScrapJob ID: {id}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">

        <div>
          <label className="block text-xs text-gray-500 mb-1">ชื่องานซ่อม <span className="text-red-400">*</span></label>
          <input
            value={applianceName}
            onChange={e => setApplianceName(e.target.value)}
            placeholder="เช่น เครื่องปรับอากาศ Mitsubishi 1 ตัน"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">ช่าง (WeeeT) <span className="text-red-400">*</span></label>
          <select value={weeetId} onChange={e => setWeeetId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">— เลือกช่าง —</option>
            {staff.map(s => (
              <option key={s.id} value={s.id} disabled={!s.available}>
                {s.name}{!s.available ? " (ไม่ว่าง)" : ""}{s.active_jobs > 0 ? ` — ${s.active_jobs} งาน` : ""}
              </option>
            ))}
          </select>
          {staff.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">ไม่พบช่างที่ว่าง</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">วันเริ่มซ่อม <span className="text-red-400">*</span></label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">ราคาขายเป้าหมาย (pts) <span className="text-red-400">*</span></label>
          <input
            type="number" min="1"
            value={originalPrice}
            onChange={e => setOriginalPrice(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <p className="text-xs text-gray-400 mt-1">ราคาที่คาดว่าจะขายได้หลังซ่อมเสร็จ</p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">หมายเหตุ</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="รายละเอียดงานซ่อม, อะไหล่ที่คาดว่าต้องใช้, เงื่อนไขพิเศษ..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        </div>
      </div>

      {/* Source preview */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">ข้อมูลที่ระบบบันทึกอัตโนมัติ</p>
        <p>source.type = <span className="font-mono text-indigo-600">"purchased_scrap"</span></p>
        <p>source.refId = <span className="font-mono text-indigo-600">{id}</span></p>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm">{submitError}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
          ${submitting ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
        {submitting ? "กำลังสร้างใบซ่อม…" : "✅ สร้างใบซ่อม (RepairJob)"}
      </button>

      <p className="text-center text-xs text-gray-400">
        หลังสร้างแล้วระบบจะพาไปหน้า RepairJob ที่สร้าง
      </p>
    </div>
  );
}
