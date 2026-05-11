"use client";

import { useState } from "react";
import type { PartListing, PartCategory } from "../../app/(app)/parts/_lib/types";
import { CATEGORY_LABEL } from "../../app/(app)/parts/_lib/types";

interface PartListingFormProps {
  shopId: string;
  shopName: string;
  onSubmit: (listing: Omit<PartListing, "id" | "createdAt">) => void;
  onClose: () => void;
}

export function PartListingForm({ shopId, shopName, onSubmit, onClose }: PartListingFormProps) {
  const [form, setForm] = useState({
    name: "", brand: "", category: "electronic" as PartCategory,
    condition: "new" as PartListing["condition"],
    pricePoints: "", stock: "", description: "",
  });
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const valid = form.name.trim() && form.brand.trim() && Number(form.pricePoints) > 0 && Number(form.stock) > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const seed = Date.now().toString();
    onSubmit({
      shopId, shopName,
      name: form.name.trim(), brand: form.brand.trim(),
      category: form.category, condition: form.condition,
      pricePoints: Number(form.pricePoints), stock: Number(form.stock),
      description: form.description.trim() || undefined,
      images: [`https://picsum.photos/400/300?seed=${seed}`],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md space-y-4 p-5 my-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">ลงขายอะไหล่ใหม่</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {[
          { label: "ชื่ออะไหล่ *", key: "name", placeholder: "เช่น เซ็นเซอร์อุณหภูมิ NTC 10K" },
          { label: "ยี่ห้อ (Brand) *", key: "brand", placeholder: "เช่น Mitsubishi" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input value={form[key as "name" | "brand"]} onChange={(e) => set(key as "name" | "brand", e.target.value)} placeholder={placeholder} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">หมวด (Category)</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value as PartCategory)} className="w-full text-sm border border-gray-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">สภาพ</label>
            <select value={form.condition} onChange={(e) => set("condition", e.target.value as PartListing["condition"])} className="w-full text-sm border border-gray-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="new">ใหม่</option>
              <option value="used">มือสอง</option>
              <option value="refurbished">รีเฟอร์บิช</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ราคา (pts) *</label>
            <input type="number" min="1" value={form.pricePoints} onChange={(e) => set("pricePoints", e.target.value)} placeholder="0" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">จำนวนสต็อก *</label>
            <input type="number" min="1" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">คำอธิบาย (ไม่บังคับ)</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="รายละเอียดเพิ่มเติม…" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>

        <button onClick={handleSubmit} disabled={!valid || loading} className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">
          {loading ? "กำลังลงขาย…" : "🏷️ ลงขายเลย"}
        </button>
      </div>
    </div>
  );
}
