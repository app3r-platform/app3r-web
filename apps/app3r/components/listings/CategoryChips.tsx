"use client";

// ============================================================
// components/listings/CategoryChips.tsx — Resell category quick-filter chips
// W-11 fix: ปุ่มกรองหมวดหมู่เดิม (plain <Link>) ทำให้ filter อื่น (province/brand/sort)
// หายทุกครั้งที่คลิก + reset page — binding bug. แก้เป็น client chips ที่
// merge เข้ากับ searchParams เดิม (ออกแบบตาม ServiceTypeFilter/AreaSelect).
// ============================================================
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface CategoryChipsProps {
  categories: string[];
}

export default function CategoryChips({ categories }: CategoryChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  function handleSelect(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    // reset เฉพาะ page — คง filter อื่น (province/brand/sort/condition) ไว้
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeClass =
    "bg-website-brand-700 text-white border-website-brand-700";
  const inactiveClass =
    "bg-white text-gray-700 border-gray-300 hover:border-website-brand-500";

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      <button
        type="button"
        onClick={() => handleSelect("")}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
          !current ? activeClass : inactiveClass
        }`}
      >
        ทั้งหมด
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => handleSelect(cat)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
            current === cat ? activeClass : inactiveClass
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
