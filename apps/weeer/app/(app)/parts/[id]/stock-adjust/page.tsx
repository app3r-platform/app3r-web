"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { partsApi } from "../../_lib/api";
import type { Part } from "../../_lib/types";

export default function PartsStockAdjustPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    partsApi.get(id)
      .then(p => { setPart(p); setQty(String(p.stockQty)); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const newQty = Number(qty) || 0;
  const diff = part ? newQty - part.stockQty : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (qty === "" || newQty < 0) errs.qty = "กรุณากรอกจำนวนที่ถูกต้อง";
    if (!note.trim()) errs.note = "กรุณาระบุเหตุผลการปรับ";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await partsApi.stockAdjust(id, { qty: newQty, note: note.trim() });
      setSuccess(true);
      setTimeout(() => router.push(`/parts/${id}`), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !part) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบอะไหล่กำลังพัฒนา — {error}</div>;
  if (success) return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <span className="text-4xl mb-3">✅</span>
      <p className="text-sm font-semibold text-green-700">ปรับสต๊อกสำเร็จ</p>
    </div>
  );
  if (!part) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/parts/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ปรับสต๊อก (Manual)</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-yellow-800">{part.name}</p>
        <p className="text-xs text-yellow-600">{part.sku} · สต๊อกปัจจุบัน: <strong>{part.stockQty} {part.unit}</strong></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนสต๊อกที่ถูกต้อง <span className="text-red-500">*</span>
          </label>
          <input type="number" min={0} value={qty}
            onChange={e => { setQty(e.target.value); setFormErrors(f => ({ ...f, qty: "" })); }}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${formErrors.qty ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.qty && <p className="text-xs text-red-500 mt-1">{formErrors.qty}</p>}
          {qty !== "" && part && diff !== 0 && (
            <p className={`text-xs mt-1 font-medium ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
              การเปลี่ยนแปลง: {diff > 0 ? "+" : ""}{diff} {part.unit}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เหตุผลการปรับ <span className="text-red-500">*</span>
          </label>
          <textarea value={note} onChange={e => { setNote(e.target.value); setFormErrors(f => ({ ...f, note: "" })); }}
            placeholder="เช่น นับสต๊อกจริงพบว่าต่างจากระบบ / สินค้าเสียหาย"
            rows={3}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none ${formErrors.note ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.note && <p className="text-xs text-red-500 mt-1">{formErrors.note}</p>}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
          <span>⚠️</span>
          <p className="text-xs text-amber-700">การปรับ Manual จะถูกบันทึกเป็น STOCK_ADJUSTMENT พร้อมชื่อผู้ทำรายการ</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting || diff === 0}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "✏️ ยืนยันปรับสต๊อก"}
        </button>
      </form>
    </div>
  );
}
