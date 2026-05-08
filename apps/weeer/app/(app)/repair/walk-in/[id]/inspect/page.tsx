"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { WalkInJob } from "../../../_lib/types";

interface Part { name: string; qty: number; price: number }

export default function WalkInInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<WalkInJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [newPart, setNewPart] = useState({ name: "", qty: "1", price: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    repairApi.getWalkIn(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function addPart() {
    if (!newPart.name.trim() || !newPart.price) return;
    setParts(p => [...p, { name: newPart.name, qty: Number(newPart.qty), price: Number(newPart.price) }]);
    setNewPart({ name: "", qty: "1", price: "" });
  }

  function removePart(i: number) {
    setParts(p => p.filter((_, idx) => idx !== i));
  }

  const totalParts = parts.reduce((s, p) => s + p.price * p.qty, 0);
  const totalEstimate = Number(estimatedPrice || 0) + totalParts;

  function validate() {
    const e: Record<string, string> = {};
    if (!diagnosisNotes.trim()) e.diagnosisNotes = "กรุณาระบุผลตรวจ";
    if (!estimatedPrice || Number(estimatedPrice) < 0) e.estimatedPrice = "กรุณาระบุราคาประเมิน";
    return e;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.inspectWalkIn(id, {
        diagnosis_notes: diagnosisNotes,
        estimated_price: Number(estimatedPrice),
        parts_added: parts.length > 0 ? parts : undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/walk-in/${id}/in-progress`), 1500);
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
      <span className="text-4xl mb-3">🔍</span>
      <p className="text-sm font-semibold text-green-700">บันทึกผลตรวจสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">กำลังไปหน้าซ่อม…</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/walk-in/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ตรวจสภาพ Walk-in</h1>
      </div>

      {job && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-700">{job.receipt_code}</span>
            <span className="text-sm font-semibold text-blue-800">{job.appliance_name}</span>
          </div>
          <p className="text-xs text-blue-600">{job.problem_description}</p>
          <p className="text-xs text-blue-500">👤 {job.customer_name} · {job.customer_phone}</p>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ผลตรวจสภาพ <span className="text-red-500">*</span>
          </label>
          <textarea value={diagnosisNotes}
            onChange={(e) => setDiagnosisNotes(e.target.value)}
            placeholder="ระบุสาเหตุ อุปกรณ์ที่เสีย วิธีซ่อมที่แนะนำ"
            rows={4}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${formErrors.diagnosisNotes ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.diagnosisNotes && <p className="text-xs text-red-500 mt-1">{formErrors.diagnosisNotes}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ราคาประเมิน (ค่าแรง + อื่นๆ) <span className="text-red-500">*</span>
          </label>
          <input type="number" min="0" value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            placeholder="เช่น 500"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.estimatedPrice ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.estimatedPrice && <p className="text-xs text-red-500 mt-1">{formErrors.estimatedPrice}</p>}
        </div>

        {/* Parts */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">อะไหล่ที่ต้องใช้</p>
          {parts.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
              <span className="text-xs text-gray-700">{p.name} × {p.qty}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-700">{(p.price * p.qty).toLocaleString()} pts</span>
                <button onClick={() => removePart(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input type="text" value={newPart.name}
              onChange={(e) => setNewPart(p => ({ ...p, name: e.target.value }))}
              placeholder="ชื่ออะไหล่"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
            <input type="number" min="1" value={newPart.qty}
              onChange={(e) => setNewPart(p => ({ ...p, qty: e.target.value }))}
              className="w-14 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-green-400" />
            <input type="number" min="0" value={newPart.price}
              onChange={(e) => setNewPart(p => ({ ...p, price: e.target.value }))}
              placeholder="pts"
              className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
            <button onClick={addPart}
              className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium px-3 py-2 rounded-xl transition-colors">
              + เพิ่ม
            </button>
          </div>
        </div>

        {/* Total */}
        {(estimatedPrice || parts.length > 0) && (
          <div className="bg-green-50 rounded-xl px-4 py-3 flex justify-between items-center border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-700">ราคารวมประเมิน</span>
            <span className="text-lg font-bold text-green-700">{totalEstimate.toLocaleString()} pts</span>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "✅ บันทึกผลตรวจ + เริ่มซ่อม"}
        </button>
      </div>
    </div>
  );
}
