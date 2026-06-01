"use client";

// ============================================================
// components/marketing/groups/CategoryFilterRows.tsx
// W-01: Per-section dropdown เลือกประเภทเครื่องใช้ไฟฟ้า (category)
// Client island — รับ pre-rendered nodes (จาก Server group) แล้วกรองตามประเภท
// "ทั้งหมด" = แสดงทุกประเภท · เลือกประเภท = แสดงเฉพาะแถวนั้น
// NOTE: รับ ReactNode ที่ render แล้ว (ข้าม server→client ได้) — ไม่รับ function
// ============================================================
import { useMemo, useState, type ReactNode } from "react";

export interface RenderedItem {
  id: string;
  node: ReactNode;
}

interface CategoryFilterRowsProps {
  /** key = ชื่อประเภท · value = items (id + rendered node) ในประเภทนั้น */
  grouped: Record<string, RenderedItem[]>;
  /** จำนวนแถวต่อประเภท (1 หรือ 2) → จำกัด = rowsPerType * 4 */
  rowsPerType: number;
  /** label ของ dropdown — เช่น "ประเภทเครื่อง", "วัสดุ" */
  filterLabel: string;
}

const ALL = "__all__";

export default function CategoryFilterRows({
  grouped,
  rowsPerType,
  filterLabel,
}: CategoryFilterRowsProps) {
  const categories = useMemo(() => Object.keys(grouped), [grouped]);
  const [selected, setSelected] = useState<string>(ALL);

  // ถ้า category ที่เลือกหายไป → fallback "ทั้งหมด"
  const effective = selected !== ALL && categories.includes(selected) ? selected : ALL;
  const visibleCategories = effective === ALL ? categories : [effective];
  const limit = rowsPerType * 4;

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

      {visibleCategories.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm">📭 ไม่มีรายการในประเภทที่เลือก</p>
        </div>
      ) : (
        visibleCategories.map((category) => {
          const visible = grouped[category].slice(0, limit);
          if (visible.length === 0) return null;
          return (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-base font-semibold text-gray-800">{category}</h4>
                <span className="text-xs text-gray-400">({visible.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {visible.map((item) => (
                  <div key={item.id}>{item.node}</div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
