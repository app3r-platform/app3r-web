"use client";

// ============================================================
// components/listings/FilterSidebar.tsx — Filter sidebar
// ============================================================
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const provinces = [
  "กรุงเทพฯ", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "ชลบุรี",
  "ระยอง", "เชียงใหม่", "ขอนแก่น", "อุดรธานี", "นครราชสีมา",
];

const brands = ["Samsung", "LG", "Daikin", "Mitsubishi", "Panasonic", "Sharp", "Dyson", "Xiaomi"];
const materials = ["อลูมิเนียม", "ทองแดง", "เหล็ก", "พลาสติก", "อื่นๆ"];

interface FilterSidebarProps {
  mode: "resell" | "scrap" | "all";
  baseHref: string;
}

export default function FilterSidebar({ mode, baseHref }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [province, setProvince] = useState(searchParams.get("province") ?? "");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "");
  const [material, setMaterial] = useState(searchParams.get("material") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest");

  function handleSearch() {
    const params = new URLSearchParams();
    if (province) params.set("province", province);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (brand) params.set("brand", brand);
    if (material) params.set("material", material);
    if (sort && sort !== "latest") params.set("sort", sort);
    params.set("page", "1");
    router.push(`${baseHref}?${params.toString()}`);
  }

  function handleReset() {
    setProvince("");
    setPriceMin("");
    setPriceMax("");
    setBrand("");
    setMaterial("");
    setSort("latest");
    router.push(`${baseHref}?page=1`);
  }

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

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 sticky top-20">
      <h3 className="font-semibold text-gray-900">กรองประกาศ</h3>

      {/* Province */}
      <div>
        <label className="block text-sm text-gray-700 font-medium mb-2">จังหวัด</label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">ทุกจังหวัด</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Price range — resell mode */}
      {mode !== "scrap" && (
        <div>
          <label className="block text-sm text-gray-700 font-medium mb-2">ช่วงราคา (บาท)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="ต่ำสุด"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="number"
              placeholder="สูงสุด"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Brand — resell/all mode */}
      {mode !== "scrap" && (
        <div>
          <label className="block text-sm text-gray-700 font-medium mb-2">ยี่ห้อ</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">ทุกยี่ห้อ</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      )}

      {/* Material — scrap mode */}
      {mode === "scrap" && (
        <div>
          <label className="block text-sm text-gray-700 font-medium mb-2">วัสดุ</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">ทุกวัสดุ</option>
            {materials.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sort */}
      <div>
        <label className="block text-sm text-gray-700 font-medium mb-2">เรียงตาม</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSearch}
        className="w-full bg-purple-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-800 transition"
      >
        ค้นหา
      </button>
      <button
        onClick={handleReset}
        className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
      >
        ล้างตัวกรอง
      </button>
    </div>
  );
}
