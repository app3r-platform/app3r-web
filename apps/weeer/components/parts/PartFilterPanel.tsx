"use client";

import type { PartCategory } from "../../app/(app)/parts/_lib/types";
import { CATEGORY_LABEL } from "../../app/(app)/parts/_lib/types";
import { SHOPS_MOCK } from "../../lib/mock-data/shops";

export interface PartFilters {
  category: PartCategory | "";
  condition: "new" | "used" | "refurbished" | "";
  shopId: string;
  minPrice: string;
  maxPrice: string;
  stockOnly: boolean;
}

const defaultFilters: PartFilters = {
  category: "", condition: "", shopId: "", minPrice: "", maxPrice: "", stockOnly: false,
};

interface PartFilterPanelProps {
  filters: PartFilters;
  onChange: (f: PartFilters) => void;
  onReset: () => void;
}

export { defaultFilters };

export function PartFilterPanel({ filters, onChange, onReset }: PartFilterPanelProps) {
  const set = <K extends keyof PartFilters>(key: K, val: PartFilters[K]) =>
    onChange({ ...filters, [key]: val });

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">กรอง (Filter)</p>
        <button onClick={onReset} className="text-xs text-green-700 hover:underline">รีเซ็ต</button>
      </div>

      {/* หมวดหมู่ */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">หมวดหมู่ (Category)</p>
        <div className="flex flex-wrap gap-1.5">
          {(["", ...Object.keys(CATEGORY_LABEL)] as (PartCategory | "")[]).map((cat) => (
            <button
              key={cat}
              onClick={() => set("category", cat as PartCategory | "")}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filters.category === cat ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "" ? "ทั้งหมด" : CATEGORY_LABEL[cat as PartCategory]}
            </button>
          ))}
        </div>
      </div>

      {/* สภาพ */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">สภาพ (Condition)</p>
        <div className="flex flex-wrap gap-1.5">
          {(["", "new", "used", "refurbished"] as const).map((c) => (
            <button
              key={c}
              onClick={() => set("condition", c)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filters.condition === c ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c === "" ? "ทั้งหมด" : c === "new" ? "ใหม่" : c === "used" ? "มือสอง" : "รีเฟอร์บิช"}
            </button>
          ))}
        </div>
      </div>

      {/* ราคา */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">ราคา (pts)</p>
        <div className="flex gap-2 items-center">
          <input type="number" value={filters.minPrice} onChange={(e) => set("minPrice", e.target.value)} placeholder="ต่ำสุด" className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500" />
          <span className="text-gray-400 text-xs">–</span>
          <input type="number" value={filters.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} placeholder="สูงสุด" className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>
      </div>

      {/* ร้าน */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">ร้านค้า (Shop)</p>
        <select value={filters.shopId} onChange={(e) => set("shopId", e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-green-500">
          <option value="">ทุกร้าน</option>
          {SHOPS_MOCK.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* มีสต็อก */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={filters.stockOnly} onChange={(e) => set("stockOnly", e.target.checked)} className="w-4 h-4 accent-green-700" />
        <span className="text-xs text-gray-600">แสดงเฉพาะที่มีสต็อก</span>
      </label>
    </div>
  );
}
