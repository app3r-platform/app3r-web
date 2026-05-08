"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { partsApi } from "./_lib/api";
import type { Part } from "./_lib/types";
import { CONDITION_LABEL, CONDITION_COLOR } from "./_lib/types";

const CATEGORIES = ["ทั้งหมด", "คอมเพรสเซอร์", "มอเตอร์", "แผงวงจร", "ท่อ/วาล์ว", "อื่นๆ"];
const CONDITIONS: { label: string; value: Part["condition"] | "all" }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "ใหม่", value: "new" },
  { label: "มือสอง", value: "used" },
  { label: "Refurb", value: "refurbished" },
];

export default function PartsListPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [condition, setCondition] = useState<Part["condition"] | "all">("all");

  useEffect(() => {
    partsApi.list({
      ...(category !== "ทั้งหมด" ? { category } : {}),
      ...(condition !== "all" ? { condition } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    })
      .then(setParts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, condition, search]);

  const availQty = parts.reduce((s, p) => s + (p.stockQty - p.reservedQty), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">คลังอะไหล่</h1>
          <p className="text-xs text-gray-500 mt-0.5">{parts.length} รายการ · สต๊อกพร้อมใช้ {availQty} ชิ้น</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/parts/dashboard" className="text-xs text-gray-500 hover:text-gray-700">📊 Dashboard</Link>
          <Link href="/parts/new"
            className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            + เพิ่มอะไหล่
          </Link>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="ค้นหา SKU หรือชื่ออะไหล่…"
        value={search}
        onChange={e => { setSearch(e.target.value); setLoading(true); }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setLoading(true); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors
                ${category === c ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CONDITIONS.map(c => (
            <button key={c.value} onClick={() => { setCondition(c.value); setLoading(true); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors
                ${condition === c.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm flex items-center gap-2">
          <span>⚠️</span><span>ระบบอะไหล่กำลังพัฒนา — {error}</span>
        </div>
      )}

      {!loading && !error && parts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🔩</span>
          <p className="text-sm">ยังไม่มีอะไหล่ — เพิ่มได้ที่ +เพิ่มอะไหล่</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && parts.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">ชื่อ / SKU</th>
                <th className="text-left px-4 py-3">หมวด</th>
                <th className="text-center px-4 py-3">สภาพ</th>
                <th className="text-right px-4 py-3">สต๊อก</th>
                <th className="text-right px-4 py-3">ราคา/หน่วย</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {parts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_COLOR[p.condition]}`}>
                      {CONDITION_LABEL[p.condition]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${p.stockQty <= 3 ? "text-red-600" : "text-gray-800"}`}>
                      {p.stockQty}
                    </span>
                    <span className="text-gray-400 text-xs"> {p.unit}</span>
                    {p.reservedQty > 0 && (
                      <p className="text-xs text-orange-500">จอง {p.reservedQty}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {p.unitPrice.toLocaleString()} pts
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/parts/${p.id}`}
                      className="text-xs text-green-700 hover:text-green-900 font-medium">ดู →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
