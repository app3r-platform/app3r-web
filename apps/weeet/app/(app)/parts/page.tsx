"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { partsApi } from "@/lib/api";
import type { Part } from "@/lib/types";

function MyOrdersChip({ router }: { router: ReturnType<typeof useRouter> }) {
  const [orderIds, setOrderIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("weeet_part_order_ids") ?? "[]") as string[];
      setOrderIds(ids);
    } catch {
      // ignore
    }
  }, []);
  return (
    <button
      type="button"
      onClick={() => router.push("/parts/orders")}
      className="w-full flex items-center justify-between bg-blue-900/30 border border-blue-700/40 rounded-xl px-4 py-2.5 text-sm"
    >
      <span className="text-blue-300 font-medium">📦 ออเดอร์ของฉัน</span>
      <span className="text-xs text-gray-500">
        {orderIds.length > 0 ? `${orderIds.length} รายการ` : "ดูทั้งหมด"} →
      </span>
    </button>
  );
}

const CONDITION_LABELS: Record<Part["condition"], string> = {
  new: "ใหม่",
  used: "มือสอง",
  refurbished: "ซ่อมแล้ว",
};

const CONDITION_COLORS: Record<Part["condition"], string> = {
  new: "text-green-400",
  used: "text-yellow-400",
  refurbished: "text-blue-400",
};

export default function PartsPage() {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

  useEffect(() => {
    partsApi.list()
      .then((data) => {
        setParts(data);
        setLoading(false);
      })
      .catch(() => {
        setApiError(true);
        setLoading(false);
      });
  }, []);

  const categories = ["ทั้งหมด", ...Array.from(new Set(parts.map((p) => p.category)))];

  const filtered = parts.filter((p) => {
    const matchCat = selectedCategory === "ทั้งหมด" || p.category === selectedCategory;
    const matchSearch =
      !search ||
      p.name.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">อะไหล่ / วัสดุ</h1>
        <p className="text-xs text-gray-400 mt-0.5">คลังอะไหล่ของร้าน</p>
      </div>

      {/* My orders shortcut */}
      <MyOrdersChip router={router} />

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="ค้นหาชื่อ / รหัสอะไหล่"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse space-y-2">
              <div className="h-4 bg-gray-700 rounded w-2/3" />
              <div className="h-3 bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error / empty state */}
      {!loading && apiError && (
        <div className="text-center py-10 space-y-2">
          <p className="text-3xl">🔩</p>
          <p className="text-gray-400 text-sm">ระบบอะไหล่กำลังพัฒนา</p>
          <p className="text-gray-600 text-xs">ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>
        </div>
      )}

      {/* Categories */}
      {!loading && !apiError && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-orange-600 text-white"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Parts list */}
          <div className="space-y-3">
            {filtered.map((part) => (
              <button
                key={part.id}
                type="button"
                onClick={() => router.push(`/parts/${part.id}`)}
                className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 hover:border-orange-600/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-white">{part.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{part.sku}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                      {part.category}
                    </span>
                    <span className={`text-xs ${CONDITION_COLORS[part.condition]}`}>
                      {CONDITION_LABELS[part.condition]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">
                      คงเหลือ:{" "}
                      <span className={part.stockQty > 5 ? "text-green-400" : "text-red-400"}>
                        {part.stockQty} {part.unit}
                      </span>
                    </span>
                    <span className="text-orange-400 font-medium">
                      ฿{part.unitPrice.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    จอง {part.reservedQty}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-400 text-sm">
              ไม่พบอะไหล่ที่ค้นหา
            </div>
          )}
        </>
      )}
    </div>
  );
}
