"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { ParcelJob } from "../../../_lib/types";

interface Part { name: string; qty: number; price: number; }

const CONDITION_ITEMS = [
  "เครื่องทำงานได้บางส่วน",
  "มีรอยขีดข่วนภายนอก",
  "มีรอยแตก/บุบ",
  "ชิ้นส่วนหาย",
  "สภาพดี ไม่มีความเสียหายภายนอก",
];

export default function ParcelInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ParcelJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [conditionNotes, setConditionNotes] = useState("");
  const [photoGate, setPhotoGate] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [newPart, setNewPart] = useState<Part>({ name: "", qty: 1, price: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    repairApi.getParcelJob(id)
      .then((j) => setJob(j as ParcelJob))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function toggleCondition(item: string) {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function addPart() {
    if (!newPart.name.trim() || newPart.price <= 0) return;
    setParts(p => [...p, { ...newPart, name: newPart.name.trim() }]);
    setNewPart({ name: "", qty: 1, price: 0 });
  }

  function removePart(i: number) { setParts(p => p.filter((_, idx) => idx !== i)); }

  const partsTotal = parts.reduce((s, p) => s + p.price * p.qty, 0);
  const laborCost = Number(estimatedPrice) || 0;
  const grandTotal = laborCost + partsTotal;

  function validate() {
    const e: Record<string, string> = {};
    if (!conditionNotes.trim()) e.notes = "กรุณาบรรยายสภาพเครื่อง";
    if (!photoGate) e.photo = "กรุณายืนยันถ่ายรูปสภาพเครื่อง";
    if (!estimatedPrice || Number(estimatedPrice) < 0) e.price = "กรุณาระบุค่าแรง";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      const condFull = [
        ...(checkedItems.size > 0 ? [`[Checklist: ${[...checkedItems].join(", ")}]`] : []),
        conditionNotes.trim(),
      ].join(" ");
      await repairApi.inspectParcel(id, {
        condition_notes: condFull,
        estimated_price: laborCost,
        parts_added: parts.length > 0 ? parts : undefined,
        inspect_photos: [],
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/parcel/${id}/dispatch-tech`), 1500);
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
      <p className="text-sm font-semibold text-green-700">บันทึกการตรวจสภาพสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">กำลังไปมอบหมาย WeeeT…</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/parcel/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ตรวจสภาพเครื่อง</h1>
      </div>

      {/* Job summary */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold text-purple-800">{job.appliance_name}</p>
        <p className="text-xs text-purple-600">{job.problem_description}</p>
        <p className="text-xs text-purple-500">👤 {job.customer_name}</p>
        {job.condition_notes && (
          <p className="text-xs text-purple-400 italic">สภาพตอนรับ: {job.condition_notes}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Condition checklist */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">สภาพเครื่อง (เลือกที่พบ)</p>
          <div className="space-y-2">
            {CONDITION_ITEMS.map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={checkedItems.has(item)}
                  onChange={() => toggleCondition(item)}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Condition notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รายละเอียดสภาพเครื่อง <span className="text-red-500">*</span>
          </label>
          <textarea
            value={conditionNotes}
            onChange={(e) => { setConditionNotes(e.target.value); setFormErrors(f => ({ ...f, notes: "" })); }}
            placeholder="บรรยายสภาพเครื่องโดยละเอียด อาการ/ปัญหาที่ตรวจพบ"
            rows={3}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none ${formErrors.notes ? "border-red-400" : "border-gray-200"}`}
          />
          {formErrors.notes && <p className="text-xs text-red-500 mt-1">{formErrors.notes}</p>}
        </div>

        {/* Photo gate */}
        <div className={`rounded-xl border-2 p-3 transition-all ${photoGate ? "border-green-300 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={photoGate}
              onChange={(e) => { setPhotoGate(e.target.checked); setFormErrors(f => ({ ...f, photo: "" })); }}
              className="w-4 h-4 rounded text-green-600"
            />
            <span className="text-sm font-medium text-gray-700">📸 ยืนยันถ่ายรูปสภาพเครื่องแล้ว</span>
          </label>
          {formErrors.photo && <p className="text-xs text-red-500 mt-1">{formErrors.photo}</p>}
        </div>

        {/* Estimated price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ค่าแรง/ค่าบริการ (pts) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            value={estimatedPrice}
            onChange={(e) => { setEstimatedPrice(e.target.value); setFormErrors(f => ({ ...f, price: "" })); }}
            placeholder="0"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${formErrors.price ? "border-red-400" : "border-gray-200"}`}
          />
          {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
        </div>

        {/* Parts builder */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">อะไหล่ที่ต้องเปลี่ยน</p>
          {parts.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {parts.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700">{p.name} × {p.qty}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{(p.price * p.qty).toLocaleString()} pts</span>
                    <button type="button" onClick={() => removePart(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" placeholder="ชื่ออะไหล่" value={newPart.name}
              onChange={(e) => setNewPart(p => ({ ...p, name: e.target.value }))}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <input type="number" min={1} placeholder="จำนวน" value={newPart.qty || ""}
              onChange={(e) => setNewPart(p => ({ ...p, qty: Number(e.target.value) }))}
              className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <input type="number" min={0} placeholder="ราคา" value={newPart.price || ""}
              onChange={(e) => setNewPart(p => ({ ...p, price: Number(e.target.value) }))}
              className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <button type="button" onClick={addPart}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 rounded-lg text-sm font-medium transition-colors">+</button>
          </div>
        </div>

        {/* Total */}
        {grandTotal > 0 && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
            <div className="flex justify-between text-sm text-gray-700">
              <span>ค่าแรง</span><span>{laborCost.toLocaleString()} pts</span>
            </div>
            {parts.length > 0 && (
              <div className="flex justify-between text-sm text-gray-700 mt-1">
                <span>อะไหล่รวม</span><span>{partsTotal.toLocaleString()} pts</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-purple-700 mt-2 pt-2 border-t border-purple-100">
              <span>รวมทั้งหมด</span><span>{grandTotal.toLocaleString()} pts</span>
            </div>
          </div>
        )}

        {job.estimated_price !== undefined && Number(estimatedPrice) !== job.estimated_price && Number(estimatedPrice) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <p className="text-xs text-amber-700">
              ราคาเปลี่ยนจากเดิม <strong>{job.estimated_price.toLocaleString()} pts</strong> → <strong>{grandTotal.toLocaleString()} pts</strong> — ระบบจะแจ้ง WeeeU เพื่อขออนุมัติอัตโนมัติ
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "🔍 บันทึกการตรวจสภาพ"}
        </button>
      </form>
    </div>
  );
}
