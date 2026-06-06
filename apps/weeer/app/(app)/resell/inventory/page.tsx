"use client";

// ── WeeeR Resell Inventory — 2.2 Mockup (เพิ่มปุ่มประกาศขายต่อชิ้น) ──────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { UsedAppliance, ApplianceStatus } from "../_lib/types";
import { CONDITION_LABEL, CONDITION_COLOR, APPLIANCE_STATUS_LABEL, APPLIANCE_STATUS_COLOR } from "../_lib/types";
import { MockAnnoOrigin } from "@/components/MockAnno";

const STATUS_TABS: { value: ApplianceStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "in_stock", label: "ในสต๊อก" },
  { value: "listed", label: "ประกาศอยู่" },
  { value: "sold", label: "ขายแล้ว" },
];

// Mock inventory data (Mockup 2.2)
const MOCK_ITEMS: UsedAppliance[] = [
  {
    id: "A001", shopId: "S1", name: "Samsung Q9 QLED 65\"", brand: "Samsung", model: "QN65Q900T",
    category: "TV", condition: "like_new", costPrice: 14000, suggestedPrice: 18900,
    status: "in_stock", source: { type: "purchased" }, sku: "SKU-TV-001",
    createdAt: "2026-05-10", updatedAt: "2026-05-10",
  },
  {
    id: "A002", shopId: "S1", name: "Dyson V15 Detect", brand: "Dyson", model: "V15 Detect",
    category: "Vacuum", condition: "good", costPrice: 5500, suggestedPrice: 8500,
    status: "listed", source: { type: "acquired" }, sku: "SKU-VAC-001",
    createdAt: "2026-05-12", updatedAt: "2026-05-18",
  },
  {
    id: "A003", shopId: "S1", name: "iPhone 14 Pro 256GB", brand: "Apple", model: "iPhone 14 Pro",
    category: "Phone", condition: "good", costPrice: 16000, suggestedPrice: 22000,
    status: "in_stock", source: { type: "purchased" }, sku: "SKU-PHN-003",
    createdAt: "2026-05-14", updatedAt: "2026-05-14",
  },
  {
    id: "A004", shopId: "S1", name: "Bose QC45 Headphone", brand: "Bose", model: "QC45",
    category: "Audio", condition: "fair", costPrice: 2800, suggestedPrice: 4200,
    status: "sold", source: { type: "manual" }, sku: "SKU-AUD-001",
    createdAt: "2026-05-08", updatedAt: "2026-05-22",
  },
];

export default function ResellInventoryPage() {
  const [items, setItems] = useState<UsedAppliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplianceStatus | "">("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    resellApi.inventoryList({ status: statusFilter || undefined, search: search || undefined })
      .then(setItems)
      .catch(() => setItems(MOCK_ITEMS))  // Mockup fallback
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  const filtered = items.filter(it => {
    if (statusFilter && it.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [it.name, it.brand, it.model, it.sku].some(v => v?.toLowerCase().includes(q));
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-5">
      <MockAnnoOrigin from="R-66" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">คลังสินค้ามือสอง</h1>
        </div>
        <Link href="/resell/inventory/new"
          className="bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          + เพิ่มสินค้า
        </Link>
      </div>

      {/* Search */}
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อ, ยี่ห้อ, รุ่น, SKU…"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30" />

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === t.value ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Buy CTA */}
      <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#4A1B0C]">📥 รับซื้อมือสองจากลูกค้า</p>
          <p className="text-xs text-[#FF9C80] mt-0.5">ใช้ B6 wizard ตีราคา + สแกน Barcode เพิ่มเข้าสต๊อก</p>
        </div>
        <Link href="/resell/buy"
          className="bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0 ml-3">
          เปิด B6 →
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบสินค้า</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/resell/inventory/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-[#FCEAE3] rounded-lg flex items-center justify-center text-[#FF663A] text-xl shrink-0">📦</div>
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
                  <p className="text-sm font-bold text-[#FF663A]">{item.suggestedPrice.toLocaleString()} pts</p>
                  <p className="text-xs text-gray-400">ทุน {item.costPrice.toLocaleString()}</p>
                </div>
              </Link>

              {/* ปุ่มประกาศขาย (เฉพาะ in_stock) */}
              {item.status === "in_stock" && (
                <Link href={`/resell/listings/new?applianceId=${item.id}`}
                  className="shrink-0 bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                  📢 ขาย
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
