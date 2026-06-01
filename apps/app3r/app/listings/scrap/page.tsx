// ============================================================
// app/listings/scrap/page.tsx — Scrap listings /listings/scrap
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getScrapListings } from "../../../lib/api/listings";
import ListingGrid from "../../../components/listings/ListingGrid";
import FilterSidebar from "../../../components/listings/FilterSidebar";
import ScrapModeChips from "../../../components/listings/ScrapModeChips";
import RoleSplitSections from "../../../components/listings/RoleSplitSections";
import AdBanner from "../../../components/ads/AdBanner";
import { RoleAwareCTA, TermTooltip } from "@/components/common";
import type { ScrapFilter, ScrapMaterial } from "../../../lib/types";

// Cross-app URL stub (ENV + localhost fallback — NEVER a real domain)
const WEEEU_URL = process.env.NEXT_PUBLIC_WEEEU_URL ?? "http://localhost:3002";

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
      <AdBanner position="module_first_row" size="leaderboard" className="mb-6" />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-website-brand-700">ประกาศ</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ซาก</span>
      </nav>

      {/* Gray header */}
      <div className="bg-gray-700 text-white rounded-xl px-6 py-5 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">ซากเครื่องใช้ไฟฟ้า</h1>
            <p className="text-gray-300 text-sm mt-1">
              ซื้อขายซากเครื่องใช้ไฟฟ้า อลูมิเนียม ทองแดง เหล็ก พลาสติก ราคาดี
            </p>
          </div>
          {/* ประกาศขาย/ทิ้งซาก — role-aware (C1). WeeeU เท่านั้น */}
          <RoleAwareCTA
            label="ประกาศขาย/ทิ้งซาก"
            intent="generic"
            className="whitespace-nowrap"
            overrides={{
              weeeu: { label: "ประกาศขาย/ทิ้งซาก", target: `${WEEEU_URL}/scrap/new` },
              weeer: { label: "สำหรับ WeeeU เท่านั้น", target: "#", message: "สำหรับ WeeeU เท่านั้น" },
              weeet: { message: "สำหรับ WeeeU เท่านั้น" },
            }}
          />
        </div>
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
          {/* ขาย / ทิ้ง split (W-13) — UI-only mock */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 mb-2">ประเภทซาก</p>
            <Suspense fallback={<div className="h-9 w-64 bg-gray-100 animate-pulse rounded-full" />}>
              <ScrapModeChips />
            </Suspense>
            <p className="mt-2 text-xs text-gray-500">
              <strong>ทิ้งซาก = ฟรี</strong> สำหรับผู้ทิ้ง · ร้าน WeeeR เสียพอยต์เพื่อยื่นข้อเสนอรับซาก
            </p>
          </div>

          {/* Info notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">ℹ️</span>
            <div className="text-sm text-amber-800 flex flex-wrap items-center gap-1">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดเพิ่มเติม เช่น ชื่อผู้ขาย เบอร์โทร และยื่น
              <TermTooltip term="offer" />
              ได้หลังจาก{" "}
              <Link href={WEEEU_URL + "/register"} className="underline font-semibold text-amber-900">
                สมัครสมาชิก WeeeU
              </Link>
            </div>
          </div>

          {/* Role-split sections (W-13) */}
          <RoleSplitSections
            context="ซาก"
            myListings={result.items.slice(0, 2).map((l) => ({
              id: l.id,
              title: l.title,
              meta: `${l.location} · 0 ข้อเสนอ`,
            }))}
            myOffers={result.items.slice(0, 2).map((l) => ({
              id: l.id,
              title: l.title,
              meta: `${l.location} · รอตอบรับ`,
            }))}
          />

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
