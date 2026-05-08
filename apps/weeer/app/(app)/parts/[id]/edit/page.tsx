"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { partsApi } from "../../_lib/api";
import type { Part } from "../../_lib/types";

const CATEGORIES = ["คอมเพรสเซอร์", "มอเตอร์", "แผงวงจร", "ท่อ/วาล์ว", "อื่นๆ"];

export default function PartsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [unit, setUnit] = useState("ชิ้น");
  const [condition, setCondition] = useState<Part["condition"]>("new");
  const [unitPrice, setUnitPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    partsApi.get(id)
      .then(p => {
        setName(p.name); setSku(p.sku); setCategory(p.category);
        setUnit(p.unit); setCondition(p.condition);
        setUnitPrice(String(p.unitPrice));
        setImageUrl(p.imageUrl ?? "");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await partsApi.update(id, {
        name: name.trim(), sku: sku.trim(), category,
        unit: unit.trim(), condition,
        unitPrice: Number(unitPrice),
        imageUrl: imageUrl.trim() || undefined,
      });
      router.push(`/parts/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !name) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
      ⚠️ ระบบอะไหล่กำลังพัฒนา — {error}
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/parts/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">แก้ไขอะไหล่</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่ออะไหล่ <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
          <input type="text" value={sku} onChange={e => setSku(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">สภาพ</p>
          <div className="flex gap-2">
            {(["new", "used", "refurbished"] as Part["condition"][]).map(c => (
              <label key={c}
                className={`flex-1 text-center py-2 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all
                  ${condition === c ? "border-green-300 bg-green-50 text-green-800" : "border-gray-100 text-gray-600"}`}>
                <input type="radio" className="sr-only" checked={condition === c} onChange={() => setCondition(c)} />
                {c === "new" ? "ใหม่" : c === "used" ? "มือสอง" : "Refurb"}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหน่วย (pts)</label>
          <input type="number" min={0} value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ (ถ้ามี)</label>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <button type="submit" disabled={submitting || !name.trim() || !sku.trim()}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "💾 บันทึกการแก้ไข"}
        </button>
      </form>
    </div>
  );
}
