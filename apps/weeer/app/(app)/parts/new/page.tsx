"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { partsApi } from "../_lib/api";
import type { Part } from "../_lib/types";

const CATEGORIES = ["คอมเพรสเซอร์", "มอเตอร์", "แผงวงจร", "ท่อ/วาล์ว", "อื่นๆ"];

export default function PartsNewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [unit, setUnit] = useState("ชิ้น");
  const [condition, setCondition] = useState<Part["condition"]>("new");
  const [unitPrice, setUnitPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sourceType, setSourceType] = useState<"purchase" | "disassembly">("purchase");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "กรุณากรอกชื่ออะไหล่";
    if (!sku.trim()) e.sku = "กรุณากรอก SKU";
    if (!unitPrice || Number(unitPrice) < 0) e.price = "กรุณากรอกราคา";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      const created = await partsApi.create({
        name: name.trim(),
        sku: sku.trim(),
        category,
        unit: unit.trim() || "ชิ้น",
        condition,
        unitPrice: Number(unitPrice),
        imageUrl: imageUrl.trim() || undefined,
        source: { type: sourceType },
      });
      router.push(`/parts/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/parts" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">เพิ่มอะไหล่ใหม่</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่ออะไหล่ <span className="text-red-500">*</span>
          </label>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setFormErrors(f => ({ ...f, name: "" })); }}
            placeholder="เช่น คอมเพรสเซอร์ Mitsubishi 9000 BTU"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.name ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU <span className="text-red-500">*</span>
          </label>
          <input type="text" value={sku} onChange={e => { setSku(e.target.value); setFormErrors(f => ({ ...f, sku: "" })); }}
            placeholder="เช่น COMP-MTS-9K"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.sku ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.sku && <p className="text-xs text-red-500 mt-1">{formErrors.sku}</p>}
        </div>

        {/* Category + Unit row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยนับ</label>
            <input type="text" value={unit} onChange={e => setUnit(e.target.value)}
              placeholder="ชิ้น / อัน / ม้วน"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
        </div>

        {/* Condition */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">สภาพ</p>
          <div className="flex gap-2">
            {(["new", "used", "refurbished"] as Part["condition"][]).map(c => (
              <label key={c}
                className={`flex-1 text-center py-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-medium
                  ${condition === c ? "border-green-300 bg-green-50 text-green-800" : "border-gray-100 text-gray-600"}`}>
                <input type="radio" className="sr-only" checked={condition === c} onChange={() => setCondition(c)} />
                {c === "new" ? "ใหม่" : c === "used" ? "มือสอง" : "Refurb"}
              </label>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ราคาต่อหน่วย (pts) <span className="text-red-500">*</span>
          </label>
          <input type="number" min={0} value={unitPrice}
            onChange={e => { setUnitPrice(e.target.value); setFormErrors(f => ({ ...f, price: "" })); }}
            placeholder="0"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.price ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
        </div>

        {/* Source type */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">แหล่งที่มา</p>
          <div className="flex gap-2">
            <label className={`flex-1 text-center py-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-medium
              ${sourceType === "purchase" ? "border-green-300 bg-green-50 text-green-800" : "border-gray-100 text-gray-600"}`}>
              <input type="radio" className="sr-only" checked={sourceType === "purchase"} onChange={() => setSourceType("purchase")} />
              🛒 ซื้อเข้า
            </label>
            <label className={`flex-1 text-center py-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-medium
              ${sourceType === "disassembly" ? "border-purple-300 bg-purple-50 text-purple-800" : "border-gray-100 text-gray-600"}`}>
              <input type="radio" className="sr-only" checked={sourceType === "disassembly"} onChange={() => setSourceType("disassembly")} />
              🔧 แยกจากซาก
            </label>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ (ถ้ามี)</label>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "🔩 เพิ่มอะไหล่"}
        </button>
      </form>
    </div>
  );
}
