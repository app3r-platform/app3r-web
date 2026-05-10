// ============================================================
// app/listings/scrap/page.tsx — Scrap listings /listings/scrap
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getScrapListings } from "../../../lib/api/listings";
import ListingGrid from "../../../components/listings/ListingGrid";
import FilterSidebar from "../../../components/listings/FilterSidebar";
import AdBanner from "../../../components/ads/AdBanner";
import type { ScrapFilter, ScrapMaterial } from "../../../lib/types";

export const metadata: Metadata = {
  title: "ซากเครื่องใช้ไฟฟ้า — ขายซาก อลูมิเนียม ทองแดง เหล็ก",
  description: "ค้นหาซากเครื่องใช้ไฟฟ้า อลูมิเนียม ทองแดง เหล็ก พลาสติก จากทั่วประเทศบน App3R",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ScrapListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const province = params.province ?? "";
  const material = params.material as ScrapMaterial | undefined;
  const sort = (params.sort ?? "latest") as ScrapFilter["sort"];

  const filter: ScrapFilter = {
    sort,
    ...(province ? { province } : {}),
    ...(material ? { material } : {}),
  };

  const result = getScrapListings(filter, page);

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
        <span className="text-gray-900 font-medium">ซาก</span>
      </nav>

      {/* Gray header */}
      <div className="bg-gray-700 text-white rounded-xl px-6 py-5 mb-8">
        <h1 className="text-2xl font-bold">ซากเครื่องใช้ไฟฟ้า</h1>
        <p className="text-gray-300 text-sm mt-1">
          ซื้อขายซากเครื่องใช้ไฟฟ้า อลูมิเนียม ทองแดง เหล็ก พลาสติก ราคาดี
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-xl" />}>
            <FilterSidebar mode="scrap" baseHref="/listings/scrap" />
          </Suspense>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Info notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">ℹ️</span>
            <div className="text-sm text-amber-800">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดเพิ่มเติม เช่น ชื่อผู้ขาย เบอร์โทร และยื่น offer ได้หลังจาก{" "}
              <Link href="http://localhost:3002/register" className="underline font-semibold text-amber-900">
                สมัครสมาชิก WeeeU
              </Link>
            </div>
          </div>

          <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-xl" />}>
            <ListingGrid
              listings={result.items}
              total={result.total}
              page={result.page}
              totalPages={result.totalPages}
              baseHref="/listings/scrap"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
