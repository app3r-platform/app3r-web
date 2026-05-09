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

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState("");
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
    })
      .then(r => { setListings(r.results ?? r as unknown as Listing[]); setTotal((r as { count?: number }).count ?? 0); })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); load(1); }, [typeTab]);

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ตลาดซื้อ-ขาย</h1>
        <Link href="/sell/new" className="text-sm text-indigo-600 font-medium hover:underline">+ ขายของ</Link>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5">
        {TYPE_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTypeTab(t.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeTab === t.value
                ? "bg-indigo-600 text-white"
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
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <span className="text-gray-400 text-sm">—</span>
        <input
          type="number"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          placeholder="ราคาสูงสุด"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={() => { setPage(1); load(1); }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          ค้นหา
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-gray-500 font-medium">ไม่พบรายการ</p>
          <p className="text-sm text-gray-400">ลองปรับตัวกรองดู</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{total} รายการ</p>
          <div className="space-y-3">
            {listings.map(l => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {l.listingType === "scrap" ? "🔩 ชิ้นส่วน/ซากเครื่อง" : "📱 เครื่องใช้ไฟฟ้ามือสอง"}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString("th-TH")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {l.conditionGrade && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GRADE_COLOR[l.conditionGrade] ?? "bg-gray-100 text-gray-500"}`}>
                        {GRADE_LABEL[l.conditionGrade] ?? l.conditionGrade}
                      </span>
                    )}
                    <p className="text-sm font-bold text-indigo-600">{l.price.toLocaleString()} ฿</p>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-indigo-500 font-medium">ดูรายละเอียด →</p>
              </Link>
            ))}
          </div>

          {/* Simple pagination */}
          {total > listings.length * page && (
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
