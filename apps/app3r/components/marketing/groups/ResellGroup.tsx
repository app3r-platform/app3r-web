// ============================================================
// components/marketing/groups/ResellGroup.tsx
// W-2-A: กลุ่ม 1 — ขายมือสอง (Resell)
// มีรูปประกอบ · group by category · 4 ต่อแถว · 2 แถวต่อประเภท · เรียงล่าสุดก่อน
// W-2-B (D1 role-based): WeeeU เห็นเฉพาะของตัวเอง · Anon คลิก → /register/weeer
// ============================================================
import Link from "next/link";
import { cookies } from "next/headers";
import { mockResellListings } from "@/lib/mock/resell";
import ListingCard from "@/components/listings/ListingCard";
import CategoryFilterRows, { type RenderedItem } from "./CategoryFilterRows";
import RoleAwareCard from "@/components/listings/RoleAwareCard";
import EmptyGroupState from "./EmptyGroupState";
import { getMockRoleFromCookie, MOCK_USERS } from "@/lib/auth/mock-role";
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

export default async function ResellGroup() {
  // W-2-B: อ่าน mock role จาก cookie (Server Component)
  const cookieStore = await cookies();
  const role = getMockRoleFromCookie(cookieStore.get("app3r-mock-role")?.value);

  // กรอง active เท่านั้น
  let activeListings = mockResellListings.filter((l) => l.status === "active");

  // D1 role-based filter: WeeeU เห็นเฉพาะของตัวเอง
  if (role === "weeeu") {
    const myId = MOCK_USERS.weeeu.id;
    activeListings = activeListings.filter((l) => l.seller.id === myId);
  }

  const grouped = groupByCategory(activeListings);
  const categories = Object.keys(grouped);

  // Pre-render nodes (server-side) เพื่อส่งให้ client dropdown (CategoryFilterRows)
  const renderedGrouped: Record<string, RenderedItem[]> = {};
  for (const cat of categories) {
    renderedGrouped[cat] = grouped[cat].map((item) => ({
      id: item.id,
      node: (
        <RoleAwareCard href={`/listings/resell/${item.id}`}>
          <ListingCard listing={item} />
        </RoleAwareCard>
      ),
    }));
  }

  if (categories.length === 0) {
    return (
      <EmptyGroupState
        icon="📦"
        title="ขายเครื่องใช้ไฟฟ้ามือสอง"
        browseHref="/listings/resell"
        isOwner={role === "weeeu"}
        ownerMessage="คุณยังไม่มีประกาศขายมือสอง"
        guestMessage="ยังไม่มีประกาศขายมือสองในตอนนี้"
        postLabel="ลงขายมือสองชิ้นแรก"
      />
    );
  }

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

      <CategoryFilterRows
        grouped={renderedGrouped}
        rowsPerType={2}
        filterLabel="ประเภทเครื่อง"
      />
    </section>
  );
}
