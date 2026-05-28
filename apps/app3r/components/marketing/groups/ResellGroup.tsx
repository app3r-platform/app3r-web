// ============================================================
// components/marketing/groups/ResellGroup.tsx
// W-2-A: กลุ่ม 1 — ขายมือสอง (Resell)
// มีรูปประกอบ · group by category · 4 ต่อแถว · 2 แถวต่อประเภท · เรียงล่าสุดก่อน
// ============================================================
import Link from "next/link";
import { mockResellListings } from "@/lib/mock/resell";
import ListingCard from "@/components/listings/ListingCard";
import ApplianceTypeRow from "./ApplianceTypeRow";
import type { ResellListing } from "@/lib/types";

/**
 * จัดกลุ่ม listings ตาม category (ประเภทเครื่องใช้ไฟฟ้า)
 * เรียงในแต่ละกลุ่มจากใหม่สุด (postedDaysAgo น้อยสุด)
 */
function groupByCategory(items: ResellListing[]): Record<string, ResellListing[]> {
  const sorted = [...items].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  return sorted.reduce<Record<string, ResellListing[]>>((acc, item) => {
    const key = item.category || "อื่นๆ";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default function ResellGroup() {
  // กรอง active เท่านั้น
  const activeListings = mockResellListings.filter((l) => l.status === "active");
  const grouped = groupByCategory(activeListings);
  const categories = Object.keys(grouped);

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 border-b border-gray-100">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📦</span>
            <h2 className="text-2xl font-bold text-gray-900">ขายเครื่องใช้ไฟฟ้ามือสอง</h2>
          </div>
          <p className="text-gray-500 text-sm">เครื่องใช้ไฟฟ้ามือสองคุณภาพดี · จัดกลุ่มตามประเภท</p>
        </div>
        <Link
          href="/listings/resell"
          className="text-sm text-website-brand-600 hover:text-website-brand-700 font-medium hidden sm:inline-flex items-center gap-1"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      {categories.map((category) => (
        <ApplianceTypeRow
          key={category}
          applianceType={category}
          items={grouped[category]}
          rowsPerType={2}
          renderItem={(item) => <ListingCard listing={item} />}
        />
      ))}
    </section>
  );
}
