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
import CategoryChips from "../../../components/listings/CategoryChips";
import RoleSplitSections from "../../../components/listings/RoleSplitSections";
import AdBanner from "../../../components/ads/AdBanner";
import SponsoredListing from "../../../components/ads/SponsoredListing";
import { NearMeToggle, TermTooltip } from "@/components/common";
import { crossAppUrls } from "@/lib/config/urls";
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

// Cross-app URL (resolved via crossAppUrls — no hardcoded localhost)
const WEEEU_URL = crossAppUrls.weeeu.base;

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
      <AdBanner position="module_first_row" size="leaderboard" className="mb-6" />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-website-brand-700">ประกาศ</Link>
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
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              ประกาศขายเครื่องใช้ไฟฟ้ามือสอง
            </h1>
            {/* C4 — NearMeToggle (mock geo, no GPS) */}
            <NearMeToggle hideMockNote />
          </div>

          {/* ทั้ง WeeeU และ WeeeR ซื้อ-ขายได้ — ลิงก์สำหรับร้าน/บริษัท */}
          <p className="text-sm text-gray-500 mb-1">
            ทั้งผู้ใช้ทั่วไปและร้าน/บริษัทสามารถซื้อและขายได้ ·{" "}
            <Link href="/register/weeer" className="text-website-brand-700 font-medium hover:underline">
              สำหรับร้าน/บริษัท WeeeR →
            </Link>
          </p>
          {/* TEMP mock-login — remove for production */}
          <p className="text-[10px] text-gray-300 mb-5">
            <Link href="/?devnav=1" className="hover:text-website-brand-700 underline">
              สลับ role (ทดสอบ flow)
            </Link>{" "}
            · ใช้กล่อง 🧪 DEV มุมขวาล่าง
          </p>

          {/* Category filter — W-11 fix: client chips (preserve params, no binding bug) */}
          <Suspense fallback={<div className="h-9 w-full bg-gray-100 animate-pulse rounded-full mb-6" />}>
            <CategoryChips categories={categories} />
          </Suspense>

          {/* รูปแบบการรับสินค้า (3 แบบ) — ห้ามใช้คำว่า "นัดรับ" */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900 mb-0.5">🚚 ผู้ขายส่งเอง</div>
              ราคารวมค่าจัดส่งแล้ว
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900 mb-0.5">🏠 ผู้ซื้อมารับเอง</div>
              ไม่มีค่าจัดส่ง (ฟรี)
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900 mb-0.5">📦 ส่งไปรษณีย์/ขนส่ง</div>
              ตกลงค่าส่ง + มีเลขติดตามพัสดุ
            </div>
          </div>

          {/* Limited info notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">ℹ️</span>
            <div className="text-sm text-amber-800 flex flex-wrap items-center gap-1">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดเพิ่มเติม เช่น ชื่อผู้ขาย เบอร์โทร และยื่น
              <TermTooltip term="offer" />
              ได้หลังจาก{" "}
              {/* W-11: เสนอทั้ง 2 ทาง — ไม่ปล่อยให้เป็น dead-end เฉพาะ WeeeU */}
              <Link href={crossAppUrls.weeeu.signup} className="underline font-semibold text-amber-900">
                สมัครสมาชิก WeeeU
              </Link>{" "}
              หรือ{" "}
              <Link href="/register/weeer" className="underline font-semibold text-amber-900">
                สมัครเป็นร้าน WeeeR
              </Link>
            </div>
          </div>

          {/* Role-split sections (W-11) */}
          <RoleSplitSections
            context="มือสอง"
            myListings={result.items.slice(0, 2).map((l) => ({
              id: l.id,
              title: l.title,
              meta: `${l.viewCount} เข้าชม · 0 ข้อเสนอ`,
            }))}
            myOffers={result.items.slice(0, 2).map((l) => ({
              id: l.id,
              title: l.title,
              meta: `${l.location} · รอตอบรับ`,
            }))}
          />

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
