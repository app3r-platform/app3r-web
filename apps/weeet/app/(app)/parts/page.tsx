"use client";
import { useState } from "react";
import { mockParts } from "@/lib/mock-data";

export default function PartsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

  const categories = ["ทั้งหมด", ...Array.from(new Set(mockParts.map((p) => p.category)))];

  const filtered = mockParts.filter((p) => {
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
        <p className="text-xs text-gray-400 mt-0.5">ขอเบิกอะไหล่จากร้าน</p>
      </div>

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

      {/* Categories */}
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
          <div
            key={part.id}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium text-white">{part.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{part.sku}</p>
              </div>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                {part.category}
              </span>
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
                  ฿{part.price.toLocaleString()}
                </span>
              </div>
              <button
                disabled={part.stockQty === 0}
                className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                {part.stockQty > 0 ? "+ ขอเบิก" : "หมดสต็อก"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          ไม่พบอะไหล่ที่ค้นหา
        </div>
      )}
    </div>
  );
}
