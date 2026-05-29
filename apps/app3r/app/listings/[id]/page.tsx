/**
 * W-Round-1 Wave 2: /listings/[id]
 *
 * Universal public listing detail page consuming listing_meta (B2 contract).
 * Renders core meta + reviews (D86) + Q&A (GR-5, anonymous-public view).
 *
 * NOT a replacement for /listings/{repair,scrap,resell,maintain}/[id] —
 * those domain-specific pages still serve domain-enriched UX.
 * This page is the "by-listing_meta UUID" entry consumed by ads + cross-app links.
 *
 * ISR: 60s revalidate (meta cache), 300s for reviews/Q&A inside fetch wrapper.
 * Server Component.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getListingMeta,
  getListingReviews,
  getListingQuestions,
  getTambonDetail,
} from "@/lib/api/listing-meta";
import { ListingMetaHeader } from "@/components/listings/ListingMetaHeader";
import { ReviewsList } from "@/components/listings/ReviewsList";
import { QuestionsList } from "@/components/listings/QuestionsList";

export const revalidate = 60;

type Params = Promise<{ id: string }>;

// UUID v4-ish basic validation — Next.js won't catch invalid shapes before render
function isLikelyUuid(s: string): boolean {
  return /^[0-9a-f-]{32,36}$/i.test(s);
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  if (!isLikelyUuid(id)) return { title: "ไม่พบประกาศ — App3R" };
  const meta = await getListingMeta(id);
  if (!meta) return { title: "ไม่พบประกาศ — App3R" };
  return {
    title: `ประกาศ #${meta.listingId.slice(0, 8)} — App3R`,
    description: `รายละเอียดประกาศประเภท ${meta.listingType} บน App3R`,
  };
}

const DOMAIN_PATH: Record<string, string> = {
  repair: "repair",
  maintain: "maintain",
  resell: "resell",
  scrap: "scrap",
  parts: "parts",
};

export default async function ListingByIdPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!isLikelyUuid(id)) notFound();

  const meta = await getListingMeta(id);
  if (!meta) notFound();

  // Fetch reviews + questions + tambon in parallel
  const [reviewsRes, questionsRes, tambon] = await Promise.all([
    getListingReviews(id),
    getListingQuestions(id),
    meta.tambonId ? getTambonDetail(meta.tambonId) : Promise.resolve(null),
  ]);

  const reviews = reviewsRes?.items ?? [];
  const questions = questionsRes?.items ?? [];
  const isClosed = questionsRes?.isClosed ?? false;

  const domainSegment = DOMAIN_PATH[meta.listingType];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-600">
          หน้าหลัก
        </Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-website-brand-600">
          ประกาศ
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium break-all">
          #{meta.listingId.slice(0, 8)}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          <ListingMetaHeader meta={meta} tambon={tambon} />

          {domainSegment && (
            <div className="bg-website-brand-50 border border-website-brand-200 rounded-xl p-4 text-sm">
              <p className="text-gray-700">
                ดูรายละเอียดเพิ่มเติม (รูป/คำอธิบาย/ราคา) ที่หน้าโดเมน:
              </p>
              <Link
                href={`/listings/${domainSegment}`}
                className="inline-block mt-2 text-website-brand-700 font-semibold hover:underline"
              >
                ไปยัง /listings/{domainSegment} →
              </Link>
            </div>
          )}

          <ReviewsList reviews={reviews} />
          <QuestionsList questions={questions} isClosed={isClosed} />
        </main>

        <aside className="lg:col-span-1 space-y-4">
          {/*
            W-Round-1 Wave 2 — Ads sidebar slot (R2-4)
            BLOCKED: Backend /api/v1/ads requires JWT (advertiser-scoped).
            No public read-only endpoint yet to query active/approved ads by placement.
            Tracked in Completion Report — request Backend to add:
              GET /api/v1/ads/public?placement=detail_sidebar&listingType=...
            Until then this slot renders a placeholder.
          */}
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              พื้นที่โฆษณา (Ad slot)
            </div>
            <p className="text-xs text-gray-500">
              ตำแหน่ง sidebar หน้า detail (R2-4)
            </p>
            <p className="text-[10px] text-gray-400 italic mt-2">
              รอ Backend เปิด public ads endpoint
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
            <h3 className="font-semibold text-gray-800 mb-2">เกี่ยวกับประกาศนี้</h3>
            <p>
              ประกาศ ID: <code className="text-[10px] break-all">{meta.listingId}</code>
            </p>
            <p className="mt-1">ประเภท: {meta.listingType}</p>
            <p className="mt-1">สถานะ: {meta.state}</p>
            {meta.tambonId && (
              <p className="mt-1">
                Tambon ID: <code className="text-[10px]">{meta.tambonId}</code>
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
