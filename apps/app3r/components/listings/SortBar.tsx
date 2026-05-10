"use client";

// ============================================================
// components/listings/SortBar.tsx — Sort dropdown + results count
// ============================================================
import { useRouter, useSearchParams } from "next/navigation";

interface SortBarProps {
  total: number;
  baseHref: string;
  mode?: "resell" | "scrap" | "all";
}

export default function SortBar({ total, baseHref, mode = "resell" }: SortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "latest";

  const sortOptions =
    mode === "scrap"
      ? [
          { value: "latest", label: "ล่าสุด" },
          { value: "weight-desc", label: "น้ำหนักมาก-น้อย" },
          { value: "weight-asc", label: "น้ำหนักน้อย-มาก" },
          { value: "price-asc", label: "ราคา/กก. ต่ำ-สูง" },
          { value: "price-desc", label: "ราคา/กก. สูง-ต่ำ" },
        ]
      : [
          { value: "latest", label: "ล่าสุด" },
          { value: "price-asc", label: "ราคาต่ำ-สูง" },
          { value: "price-desc", label: "ราคาสูง-ต่ำ" },
          { value: "popular", label: "ยอดนิยม" },
        ];

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.set("page", "1");
    router.push(`${baseHref}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm text-gray-500">
        พบ <strong className="text-gray-900">{total}</strong> รายการ
      </span>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">เรียงตาม</label>
        <select
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
