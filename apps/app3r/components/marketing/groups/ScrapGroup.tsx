// ============================================================
// components/marketing/groups/ScrapGroup.tsx
// W-2-A: กลุ่ม 2 — ขาย/ทิ้งซาก (Scrap)
// มีรูปประกอบ · group by material · 4 ต่อแถว · 1 แถวต่อประเภท · เรียงล่าสุดก่อน
// ============================================================
import Link from "next/link";
import { cookies } from "next/headers";
import { mockScrapListings } from "@/lib/mock/scrap";
import ListingCard from "@/components/listings/ListingCard";
import CategoryFilterRows, { type RenderedItem } from "./CategoryFilterRows";
import RoleAwareCard from "@/components/listings/RoleAwareCard";
import EmptyGroupState from "./EmptyGroupState";
import { getMockRoleFromCookie } from "@/lib/auth/mock-role";
import type { ScrapListing } from "@/lib/types";

// Scrap ไม่มี postedDaysAgo ใน type — ใช้ลำดับใน array แทน (assume sorted newest first ใน mock)
function groupByMaterial(items: ScrapListing[]): Record<string, ScrapListing[]> {
  return items.reduce<Record<string, ScrapListing[]>>((acc, item) => {
    const key = item.material || "อื่นๆ";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default async function ScrapGroup() {
  const cookieStore = await cookies();
  const role = getMockRoleFromCookie(cookieStore.get("app3r-mock-role")?.value);

  // WeeeU เห็นทุก listing (browsing/selling scrap)
  const activeListings = mockScrapListings.filter((l) => l.status === "active");

  const grouped = groupByMaterial(activeListings);
  const materials = Object.keys(grouped);

  // Pre-render nodes (server-side) สำหรับ client dropdown
  const renderedGrouped: Record<string, RenderedItem[]> = {};
  for (const mat of materials) {
    renderedGrouped[mat] = grouped[mat].map((item) => ({
      id: item.id,
      node: (
        <RoleAwareCard href={`/listings/scrap/${item.id}`}>
          <ListingCard listing={item} />
        </RoleAwareCard>
      ),
    }));
  }

  if (materials.length === 0) {
    // WeeeR central view: ซ่อนกลุ่มที่ว่าง (WeeeR #6)
    if (role === "weeer") return null;
    return (
      <EmptyGroupState
        icon="♻️"
        title="ขาย/ทิ้งซากเครื่องใช้ไฟฟ้า"
        browseHref="/listings/scrap"
        isOwner={role === "weeeu"}
        ownerMessage="คุณยังไม่มีประกาศซาก"
        guestMessage="ยังไม่มีประกาศซากในตอนนี้"
        postLabel="ลงประกาศขาย/ทิ้งซาก"
      />
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 border-b border-gray-100">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">♻️</span>
            <h2 className="text-2xl font-bold text-gray-900">ขาย/ทิ้งซากเครื่องใช้ไฟฟ้า</h2>
          </div>
          <p className="text-gray-500 text-sm">B2B ร้านซื้อ-ร้านขาย · จัดกลุ่มตามวัสดุ</p>
        </div>
        <Link
          href="/listings/scrap"
          className="text-sm text-website-brand-600 hover:text-website-brand-700 font-medium hidden sm:inline-flex items-center gap-1"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      <CategoryFilterRows
        grouped={renderedGrouped}
        filterLabel="วัสดุ"
      />
    </section>
  );
}
