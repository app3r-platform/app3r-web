"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { UsedAppliance, ApplianceStatus } from "../_lib/types";
import { CONDITION_LABEL, CONDITION_COLOR, APPLIANCE_STATUS_LABEL, APPLIANCE_STATUS_COLOR } from "../_lib/types";

const STATUS_TABS: { value: ApplianceStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "in_stock", label: "ในสต๊อก" },
  { value: "listed", label: "ประกาศอยู่" },
  { value: "sold", label: "ขายแล้ว" },
];

export default function ResellInventoryPage() {
  const [items, setItems] = useState<UsedAppliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplianceStatus | "">("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    resellApi.inventoryList({ status: statusFilter || undefined, search: search || undefined })
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
      ⚠️ ระบบขายมือสองกำลังพัฒนา — {error}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">คลังสินค้ามือสอง</h1>
        </div>
        <Link href="/resell/inventory/new"
          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          + เพิ่มสินค้า
        </Link>
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อ, ยี่ห้อ, รุ่น, SKU…"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === t.value ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบสินค้า</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {items.map(item => (
            <Link key={item.id} href={`/resell/inventory/${item.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xl shrink-0">📦</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{[item.brand, item.model].filter(Boolean).join(" ")}{item.sku ? ` · ${item.sku}` : ""}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CONDITION_COLOR[item.condition]}`}>
                    {CONDITION_LABEL[item.condition]}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${APPLIANCE_STATUS_COLOR[item.status]}`}>
                    {APPLIANCE_STATUS_LABEL[item.status]}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-blue-700">{item.suggestedPrice.toLocaleString()} pts</p>
                <p className="text-xs text-gray-400">ทุน {item.costPrice.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
