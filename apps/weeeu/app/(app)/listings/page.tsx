"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listingsApi } from "@/lib/api/listings";
import type { Listing } from "@/lib/types";

const TYPE_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "used_appliance", label: "เครื่องใช้ไฟฟ้า" },
  { value: "scrap", label: "ชิ้นส่วน/ซาก" },
];

const GRADE_LABEL: Record<string, string> = {
  grade_A: "เกรด A",
  grade_B: "เกรด B",
  grade_C: "เกรด C",
};

const GRADE_COLOR: Record<string, string> = {
  grade_A: "bg-green-100 text-green-700",
  grade_B: "bg-yellow-100 text-yellow-700",
  grade_C: "bg-red-100 text-red-600",
};

// Mock: ตัวอย่าง listing สำหรับแสดงถ้า API ว่าง (Mockup R1)
const MOCK_LISTINGS: Listing[] = [
  {
    id: "mock-001",
    sellerId: "seller-01",
    sellerType: "WeeeU",
    listingType: "used_appliance",
    applianceId: "app-01",
    conditionGrade: "grade_A",
    workingParts: [],
    price: 8500,
    deliveryMethods: ["parcel", "on_site"],
    status: "receiving_offers",
    warranty: { sourceWarranty: 6, additionalWarranty: 3 },
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "mock-002",
    sellerId: "seller-02",
    sellerType: "WeeeR",
    listingType: "used_appliance",
    applianceId: "app-02",
    conditionGrade: "grade_B",
    workingParts: [],
    price: 4200,
    deliveryMethods: ["parcel"],
    status: "receiving_offers",
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "mock-003",
    sellerId: "seller-03",
    sellerType: "WeeeR",
    listingType: "used_appliance",
    applianceId: "app-03",
    conditionGrade: "grade_A",
    workingParts: [],
    price: 12000,
    deliveryMethods: ["on_site"],
    status: "announced",
    warranty: { sourceWarranty: 12, additionalWarranty: 6 },
    expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_NAMES: Record<string, string> = {
  "mock-001": "แอร์ Mitsubishi 12000 BTU",
  "mock-002": "เครื่องซักผ้า Samsung 8kg",
  "mock-003": "แอร์ Daikin 18000 BTU (ใหม่มาก)",
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState("");
  const [pageSize, setPageSize] = useState<number | "all">(20);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const load = (p = 1) => {
    setLoading(true);
    listingsApi.browse({
      listingType: typeTab || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: p,
      ...(pageSize !== "all" && { pageSize }),
    })
      .then(r => {
        const items = r.results ?? r as unknown as Listing[];
        // Mockup: ถ้า API ยังไม่มีข้อมูล ใช้ mock listings
        const display = Array.isArray(items) && items.length > 0 ? items : MOCK_LISTINGS;
        setListings(display);
        setTotal((r as { count?: number }).count ?? display.length);
      })
      .catch(() => {
        setListings(MOCK_LISTINGS);
        setTotal(MOCK_LISTINGS.length);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); load(1); }, [typeTab]);

  const filtered = typeTab
    ? listings.filter(l => l.listingType === typeTab)
    : listings;

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ตลาดซื้อ-ขาย</h1>
        <Link
          href="/sell/new"
          className="bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + ขายของ
        </Link>
      </div>

      {/* PageSize selector (c) */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">แสดง:</span>
        {([20, 50, "ทั้งหมด"] as const).map(s => (
          <button key={String(s)} type="button"
            onClick={() => { setPageSize(s === "ทั้งหมด" ? "all" : s); setPage(1); load(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${(s === "ทั้งหมด" ? pageSize === "all" : pageSize === s) ? "bg-weeeu-primary text-white border-weeeu-primary" : "border-gray-200 text-gray-500 hover:border-weeeu-primary"}`}>
            {String(s)}
          </button>
        ))}
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5">
        {TYPE_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTypeTab(t.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeTab === t.value
                ? "bg-weeeu-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Price filter */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          placeholder="ราคาต่ำสุด"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
        />
        <span className="text-gray-400 text-sm">—</span>
        <input
          type="number"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          placeholder="ราคาสูงสุด"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
        />
        <button
          onClick={() => { setPage(1); load(1); }}
          className="px-4 py-2 bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-medium rounded-xl transition-colors"
        >
          ค้นหา
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-gray-500 font-medium">ไม่พบรายการ</p>
          <p className="text-sm text-gray-400">ลองปรับตัวกรองดู</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{total} รายการ</p>
          <div className="space-y-3">
            {filtered.map(l => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-weeeu-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {l.listingType === "scrap" ? "🔩 ชิ้นส่วน/ซากเครื่อง" : `📱 ${MOCK_NAMES[l.id] ?? "เครื่องใช้ไฟฟ้ามือสอง"}`}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString("th-TH")}</p>
                    {l.deliveryMethods.includes("parcel") && (
                      <p className="text-xs text-gray-400">🚚 ส่งพัสดุได้</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {l.conditionGrade && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GRADE_COLOR[l.conditionGrade] ?? "bg-gray-100 text-gray-500"}`}>
                        {GRADE_LABEL[l.conditionGrade] ?? l.conditionGrade}
                      </span>
                    )}
                    <p className="text-sm font-bold text-weeeu-primary">{l.price.toLocaleString()} ฿</p>
                  </div>
                </div>

                {/* Q&A placeholder (ไอเดีย 9 — FLAG-3 placeholder) */}
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">💬 Q&A</span>
                  <span className="text-xs text-gray-300">ถามผู้ขายได้</span>
                  <span className="ml-auto text-xs text-weeeu-primary font-medium">ดูรายละเอียด →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Simple pagination */}
          {total > filtered.length * page && (
            <button
              onClick={() => { const next = page + 1; setPage(next); load(next); }}
              className="w-full border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              โหลดเพิ่มเติม
            </button>
          )}
        </>
      )}
    </div>
  );
}
