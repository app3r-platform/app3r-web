"use client";

// ============================================================
// components/marketing/groups/CategoryFilterRows.tsx
// Flat grid layout — dropdown filters by category/material
// Default (ทั้งหมด): all items combined, first maxItems shown
// Selected category: that category's items, first maxItems shown
// No sub-group headers — single 4-col grid
// ============================================================
import { useMemo, useState, type ReactNode } from "react";

export interface RenderedItem {
  id: string;
  node: ReactNode;
}

interface CategoryFilterRowsProps {
  /** key = ชื่อประเภท · value = items (id + rendered node) ในประเภทนั้น */
  grouped: Record<string, RenderedItem[]>;
  /** label ของ dropdown — เช่น "ประเภทเครื่อง", "วัสดุ" */
  filterLabel: string;
  /** จำนวนสูงสุดที่แสดง (default 8 = 2 แถว × 4 การ์ด) */
  maxItems?: number;
}

const ALL = "__all__";

export default function CategoryFilterRows({
  grouped,
  filterLabel,
  maxItems = 8,
}: CategoryFilterRowsProps) {
  const categories = useMemo(() => Object.keys(grouped), [grouped]);
  const [selected, setSelected] = useState<string>(ALL);

  // ถ้า category ที่เลือกหายไป → fallback "ทั้งหมด"
  const effective = selected !== ALL && categories.includes(selected) ? selected : ALL;

  // Flat list: ทั้งหมด = รวมทุก category, เลือก = เฉพาะ category นั้น
  const visibleItems = useMemo(() => {
    if (effective === ALL) {
      return categories.flatMap((c) => grouped[c]).slice(0, maxItems);
    }
    return (grouped[effective] ?? []).slice(0, maxItems);
  }, [effective, categories, grouped, maxItems]);

  return (
    <div>
      {/* Dropdown filter */}
      <div className="flex items-center gap-2 mb-5">
        <label className="text-xs font-medium text-gray-500">{filterLabel}:</label>
        <select
          value={effective}
          onChange={(e) => setSelected(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-website-brand-500"
          aria-label={`กรองตาม${filterLabel}`}
        >
          <option value={ALL}>ทั้งหมด ({categories.length} ประเภท)</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c} ({grouped[c].length})
            </option>
          ))}
        </select>
      </div>

      {/* Flat grid — no sub-group headers */}
      {visibleItems.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm">📭 ไม่มีรายการในประเภทที่เลือก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleItems.map((item) => (
            <div key={item.id}>{item.node}</div>
          ))}
        </div>
      )}
    </div>
  );
}
