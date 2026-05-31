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

// W-2-D (D5): ประเภทเครื่องใช้ไฟฟ้า + สภาพ
const APPLIANCE_TYPES = [
  "แอร์", "ตู้เย็น", "เครื่องซักผ้า", "ทีวี",
  "เครื่องดูดฝุ่น", "ไมโครเวฟ", "เตาอบ", "พัดลม", "เครื่องฟอกอากาศ", "อื่นๆ",
];

const CONDITIONS = [
  { value: "new", label: "ใหม่ / มือ 1" },
  { value: "good", label: "ดี (มือสอง สภาพดี)" },
  { value: "fair", label: "พอใช้" },
  { value: "needs-repair", label: "ต้องซ่อม" },
];

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
  // W-2-D (D5): filters ใหม่ 5 อย่าง
  const [applianceType, setApplianceType] = useState(searchParams.get("applianceType") ?? "");
  const [condition, setCondition] = useState(searchParams.get("condition") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");
  const [warranty, setWarranty] = useState(searchParams.get("warranty") ?? "all");

  function handleSearch() {
    const params = new URLSearchParams();
    if (province) params.set("province", province);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (brand) params.set("brand", brand);
    if (material) params.set("material", material);
    if (applianceType) params.set("applianceType", applianceType);
    if (condition) params.set("condition", condition);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (warranty && warranty !== "all") params.set("warranty", warranty);
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
    setApplianceType("");
    setCondition("");
    setDateFrom("");
    setDateTo("");
    setWarranty("all");
    setSort("latest");
    router.push(`${baseHref}?page=1`);
  }

  // W-2-D (D5): preset "7 วันล่าสุด"
  function handleLast7Days() {
    const today = new Date();
    const week = new Date(today);
    week.setDate(today.getDate() - 7);
    const toStr = today.toISOString().slice(0, 10);
    const fromStr = week.toISOString().slice(0, 10);
    setDateFrom(fromStr);
    setDateTo(toStr);
    // auto-apply
    const params = new URLSearchParams(searchParams.toString());
    params.set("dateFrom", fromStr);
    params.set("dateTo", toStr);
    params.set("page", "1");
    router.push(`${baseHref}?${params.toString()}`);
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
            />
            <input
              type="number"
              placeholder="สูงสุด"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
          >
            <option value="">ทุกวัสดุ</option>
            {materials.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* W-2-D (D5): Appliance Type filter */}
      <div>
        <label className="block text-sm text-gray-700 font-medium mb-2">ประเภทเครื่องใช้ไฟฟ้า</label>
        <select
          value={applianceType}
          onChange={(e) => setApplianceType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
        >
          <option value="">ทุกประเภท</option>
          {APPLIANCE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* W-2-D (D5): Condition — เฉพาะ resell mode */}
      {mode !== "scrap" && (
        <div>
          <label className="block text-sm text-gray-700 font-medium mb-2">สภาพการใช้งาน</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
          >
            <option value="">ทั้งหมด</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* W-2-D (D5): Date range */}
      <div>
        <label className="block text-sm text-gray-700 font-medium mb-2">ช่วงวันที่ประกาศ</label>
        <div className="flex gap-2 mb-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-website-brand-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-website-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={handleLast7Days}
          className="w-full text-xs text-website-brand-600 hover:text-website-brand-700 border border-website-brand-300 hover:border-website-brand-500 py-1.5 rounded-lg font-medium transition"
        >
          📅 7 วันล่าสุด
        </button>
      </div>

      {/* W-2-D (D5): Warranty — เฉพาะ resell mode */}
      {mode !== "scrap" && (
        <div>
          <label className="block text-sm text-gray-700 font-medium mb-2">การรับประกัน</label>
          <div className="space-y-1.5">
            {[
              { value: "all", label: "ทั้งหมด" },
              { value: "yes", label: "มีรับประกัน" },
              { value: "no", label: "ไม่มีรับประกัน" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="warranty"
                  value={opt.value}
                  checked={warranty === opt.value}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="text-website-brand-500 focus:ring-website-brand-500"
                />
                <span className="text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Sort */}
      <div>
        <label className="block text-sm text-gray-700 font-medium mb-2">เรียงตาม</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSearch}
        className="w-full bg-website-brand-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-website-brand-800 transition"
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
