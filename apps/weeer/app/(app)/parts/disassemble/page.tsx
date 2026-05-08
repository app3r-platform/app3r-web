"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { partsApi } from "../_lib/api";

export default function PartsDisassemblePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [partName, setPartName] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [scrapId, setScrapId] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!partName.trim()) e.partName = "กรุณาระบุชื่ออะไหล่";
    if (!sku.trim()) e.sku = "กรุณาระบุ SKU";
    if (!qty || Number(qty) <= 0) e.qty = "กรุณากรอกจำนวน";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      // D54: Placeholder — manual STOCK_IN with reason=receive_from_disassembly
      // ยังไม่เชื่อม Scrap module → user fills scrapId manually
      const created = await partsApi.create({
        name: partName.trim(),
        sku: sku.trim(),
        category: "อื่นๆ",
        unit: "ชิ้น",
        condition: "used",
        unitPrice: 0,
        source: {
          type: "disassembly",
          refId: scrapId.trim() || undefined,
        },
      });
      // Stock in with disassembly reason
      await partsApi.stockIn(created.id, {
        qty: Number(qty),
        reason: "receive_from_disassembly",
        refId: scrapId.trim() || undefined,
        note: note.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/parts/${created.id}`), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <span className="text-4xl mb-3">🔧</span>
      <p className="text-sm font-semibold text-green-700">บันทึกอะไหล่จากซากสำเร็จ</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/parts" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">เพิ่มอะไหล่จากซาก</h1>
      </div>

      {/* D54 Placeholder Warning */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-bold text-amber-800">ยังไม่เชื่อม Scrap module — กรอกข้อมูลซากด้วยตนเอง (C-2.2)</p>
          <p className="text-xs text-amber-600 mt-1">
            ในอนาคตจะดึงข้อมูลจาก Scrap module อัตโนมัติ ตอนนี้กรุณากรอก ID ซากและรายละเอียดเอง
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่ออะไหล่ <span className="text-red-500">*</span>
          </label>
          <input type="text" value={partName}
            onChange={e => { setPartName(e.target.value); setFormErrors(f => ({ ...f, partName: "" })); }}
            placeholder="เช่น คอมเพรสเซอร์ Samsung 12000 BTU"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${formErrors.partName ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.partName && <p className="text-xs text-red-500 mt-1">{formErrors.partName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU <span className="text-red-500">*</span>
          </label>
          <input type="text" value={sku}
            onChange={e => { setSku(e.target.value); setFormErrors(f => ({ ...f, sku: "" })); }}
            placeholder="เช่น COMP-SAM-12K-USED"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 ${formErrors.sku ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.sku && <p className="text-xs text-red-500 mt-1">{formErrors.sku}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จำนวน <span className="text-red-500">*</span>
          </label>
          <input type="number" min={1} value={qty}
            onChange={e => { setQty(e.target.value); setFormErrors(f => ({ ...f, qty: "" })); }}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${formErrors.qty ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.qty && <p className="text-xs text-red-500 mt-1">{formErrors.qty}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID ซาก (ตาม Scrap module)
          </label>
          <input type="text" value={scrapId} onChange={e => setScrapId(e.target.value)}
            placeholder="เช่น SCRAP-A001 / RP-2024-0055"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400" />
          <p className="text-xs text-gray-400 mt-1">กรอก ID ซากจาก Scrap module เอง จนกว่าจะมีการเชื่อมระบบ</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม สภาพอะไหล่ที่แยกได้ ฯลฯ"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "🔧 บันทึกอะไหล่จากซาก"}
        </button>
      </form>
    </div>
  );
}
