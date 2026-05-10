// ============================================================
// app/listings/resell/page.tsx — Resell listings (enhanced)
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getResellListings } from "../../../lib/api/listings";
import { mockResellListings } from "../../../lib/mock/resell";
import ListingGrid from "../../../components/listings/ListingGrid";
import FilterSidebar from "../../../components/listings/FilterSidebar";
import AdBanner from "../../../components/ads/AdBanner";
import SponsoredListing from "../../../components/ads/SponsoredListing";
import type { ResellFilter, ConditionType } from "../../../lib/types";

export const metadata: Metadata = {
  title: "ประกาศขายเครื่องใช้ไฟฟ้ามือสอง",
  description: "ค้นหาและซื้อเครื่องใช้ไฟฟ้ามือสองคุณภาพดี ราคาถูก จากผู้ขายทั่วประเทศบน App3R",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const categories = [
  "เครื่องซักผ้า", "ตู้เย็น", "แอร์", "ทีวี", "เครื่องดูดฝุ่น",
  "ไมโครเวฟ", "เตาอบ", "พัดลม", "เครื่องฟอกอากาศ",
];

// Get sponsored listings (static — from mock data)
const sponsoredListings = mockResellListings.filter((l) => l.sponsored).slice(0, 2);

export default async function ResellListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const province = params.province ?? "";
  const brand = params.brand ?? "";
  const category = params.category ?? "";
  const condition = params.condition as ConditionType | undefined;
  const sort = (params.sort ?? "latest") as ResellFilter["sort"];

  const filter: ResellFilter = {
    sort,
    ...(province ? { province } : {}),
    ...(brand ? { brand } : {}),
    ...(category ? { category } : {}),
    ...(condition ? { condition } : {}),
  };

  const result = getResellListings(filter, page);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Ad Banner */}
      <AdBanner size="leaderboard" className="mb-6" />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-purple-700">ประกาศ</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ขายเครื่องใช้ไฟฟ้ามือสอง</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-xl" />}>
            <FilterSidebar mode="resell" baseHref="/listings/resell" />
          </Suspense>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              ประกาศขายเครื่องใช้ไฟฟ้ามือสอง
            </h1>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            <Link
              href="/listings/resell?page=1"
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                !category
                  ? "bg-purple-700 text-white border-purple-700"
                  : "bg-white text-gray-700 border-gray-300 hover:border-purple-500"
              }`}
            >
              ทั้งหมด
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/listings/resell?category=${encodeURIComponent(cat)}&page=1`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  category === cat
                    ? "bg-purple-700 text-white border-purple-700"
                    : "bg-white text-gray-700 border-gray-300 hover:border-purple-500"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          {/* Limited info notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">ℹ️</span>
            <div className="text-sm text-amber-800">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดเพิ่มเติม เช่น ชื่อผู้ขาย เบอร์โทร และ
              ยื่น offer ได้หลังจาก{" "}
              <Link href="http://localhost:3002/register" className="underline font-semibold text-amber-900">
                สมัครสมาชิก WeeeU
              </Link>
            </div>
          </div>

          {/* Sponsored listings */}
          {sponsoredListings.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                ประกาศแนะนำ
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sponsoredListings.map((listing) => (
                  <SponsoredListing key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}

          {/* Main Listings grid */}
          <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-xl" />}>
            <ListingGrid
              listings={result.items}
              total={result.total}
              page={result.page}
              totalPages={result.totalPages}
              baseHref="/listings/resell"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
