// ============================================================
// app/listings/page.tsx — Unified browse /listings
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAllListings } from "../../lib/api/listings";
import ListingGrid from "../../components/listings/ListingGrid";
import FilterSidebar from "../../components/listings/FilterSidebar";
import AdBanner from "../../components/ads/AdBanner";
import type { UnifiedFilter } from "../../lib/types";

export const metadata: Metadata = {
  title: "ประกาศทั้งหมด — ซื้อขาย & ซาก",
  description: "ดูประกาศขายเครื่องใช้ไฟฟ้ามือสองและซากเครื่องใช้ไฟฟ้าทั้งหมดจากทั่วประเทศบน App3R",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const typeFilters = [
  { value: "all", label: "ทั้งหมด" },
  { value: "resell", label: "ขายมือสอง" },
  { value: "scrap", label: "ซาก" },
];

export default async function AllListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const type = (params.type ?? "all") as UnifiedFilter["type"];
  const province = params.province ?? "";
  const sort = (params.sort ?? "latest") as UnifiedFilter["sort"];

  const filter: UnifiedFilter = {
    type,
    sort,
    ...(province ? { province } : {}),
  };

  const result = getAllListings(filter, page);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Ad Banner */}
      <AdBanner size="leaderboard" className="mb-6" />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประกาศทั้งหมด</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-xl" />}>
            <FilterSidebar mode="all" baseHref="/listings" />
          </Suspense>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">ประกาศทั้งหมด</h1>
          </div>

          {/* Type filter tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {typeFilters.map((tf) => {
              const isActive = (type ?? "all") === tf.value;
              const href = tf.value === "all"
                ? "/listings?page=1"
                : `/listings?type=${tf.value}&page=1`;
              return (
                <Link
                  key={tf.value}
                  href={href}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    isActive
                      ? "bg-purple-700 text-white border-purple-700"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-500"
                  }`}
                >
                  {tf.label}
                </Link>
              );
            })}
          </div>

          <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-xl" />}>
            <ListingGrid
              listings={result.items}
              total={result.total}
              page={result.page}
              totalPages={result.totalPages}
              baseHref="/listings"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
