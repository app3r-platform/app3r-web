"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { partsApi } from "../../_lib/api";
import type { Part } from "../../_lib/types";

export default function PartsStockInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<"purchase" | "receive_from_disassembly">("purchase");
  const [refId, setRefId] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    partsApi.get(id)
      .then(setPart)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!qty || Number(qty) <= 0) errs.qty = "กรุณากรอกจำนวน";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await partsApi.stockIn(id, {
        qty: Number(qty),
        reason,
        refId: refId.trim() || undefined,
        note: note.trim() || undefined,
      });
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
      <span className="text-4xl mb-3">📦</span>
      <p className="text-sm font-semibold text-green-700">รับสต๊อกเข้าสำเร็จ</p>
    </div>
  );
  if (!part) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/parts/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">รับสต๊อกเข้า</h1>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-800">{part.name}</p>
        <p className="text-xs text-green-600">{part.sku} · สต๊อกปัจจุบัน: <strong>{part.stockQty} {part.unit}</strong></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนที่รับเข้า <span className="text-red-500">*</span>
          </label>
          <input type="number" min={1} value={qty}
            onChange={e => { setQty(e.target.value); setFormErrors(f => ({ ...f, qty: "" })); }}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.qty ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.qty && <p className="text-xs text-red-500 mt-1">{formErrors.qty}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">เหตุผล</p>
          <div className="flex gap-2">
            {([
              { value: "purchase", label: "🛒 ซื้อเข้า" },
              { value: "receive_from_disassembly", label: "🔧 แยกจากซาก" },
            ] as { value: "purchase" | "receive_from_disassembly"; label: string }[]).map(r => (
              <label key={r.value}
                className={`flex-1 text-center py-2 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all
                  ${reason === r.value ? "border-green-300 bg-green-50 text-green-800" : "border-gray-100 text-gray-600"}`}>
                <input type="radio" className="sr-only" checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เลขอ้างอิง (ใบสั่งซื้อ / ID ซาก)</label>
          <input type="text" value={refId} onChange={e => setRefId(e.target.value)}
            placeholder="PO-001 / SCRAP-A001"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="ข้อมูลเพิ่มเติม"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "📦 ยืนยันรับเข้า"}
        </button>
      </form>
    </div>
  );
}
