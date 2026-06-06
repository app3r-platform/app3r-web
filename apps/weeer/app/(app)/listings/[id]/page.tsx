"use client";
/**
 * W-Round-1 Wave 2 (WeeeR) — /listings/[id]
 * Screen: R-42 / LISTING-META-DETAIL
 *
 * Universal listing detail consuming listing_meta (B2 contract) + reviews (D86) + Q&A (GR-5).
 * NOT a replacement for domain pages (/resell/listings/[id], /repair/jobs/[id]) — this is the
 * "by listing_meta UUID" entry consumed by cross-app links / ads.
 *
 * Contract-first (Ruling 3 = A · "ไม่ mock" = consume real Backend routes). Client component
 * (WeeeR app is authenticated). Fails soft to a not-found state until Backend Part1 routes land.
 * Structural reference: apps/app3r/app/listings/[id]/page.tsx.
 */
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MockAnnoOrigin } from "@/components/MockAnno";
import {
  getListingMeta,
  getListingReviews,
  getListingQuestions,
  getTambonDetail,
} from "@/lib/api/listing-meta";
import type {
  ListingMeta,
  Review,
  Question,
  TambonDetail,
  ListingType,
} from "@/lib/types/listing-meta";
import { ListingMetaHeader } from "@/components/listings/ListingMetaHeader";
import { ReviewsList } from "@/components/listings/ReviewsList";
import { QuestionsList } from "@/components/listings/QuestionsList";

const DOMAIN_PATH: Record<ListingType, string> = {
  repair: "repair",
  maintain: "maintain",
  resell: "resell/listings",
  scrap: "scrap",
  parts: "parts",
};

function isLikelyUuid(s: string): boolean {
  return /^[0-9a-f-]{32,36}$/i.test(s);
}

type LoadState =
  | { phase: "loading" }
  | { phase: "not-found" }
  | {
      phase: "ready";
      meta: ListingMeta;
      reviews: Review[];
      questions: Question[];
      questionsClosed: boolean;
      tambon: TambonDetail | null;
    };

export default function ListingByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    if (!isLikelyUuid(id)) {
      setState({ phase: "not-found" });
      return;
    }

    (async () => {
      const meta = await getListingMeta(id);
      if (cancelled) return;
      if (!meta) {
        setState({ phase: "not-found" });
        return;
      }

      const [reviewsRes, questionsRes, tambon] = await Promise.all([
        getListingReviews(id),
        getListingQuestions(id),
        meta.tambon_id ? getTambonDetail(meta.tambon_id) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      setState({
        phase: "ready",
        meta,
        reviews: reviewsRes?.results ?? [],
        questions: questionsRes?.results ?? [],
        questionsClosed: questionsRes?.is_closed ?? false,
        tambon,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.phase === "loading") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (state.phase === "not-found") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่พบประกาศ</h1>
        <p className="text-sm text-gray-500 mb-6">
          ประกาศนี้อาจถูกลบ หมดอายุ หรือยังไม่เผยแพร่
        </p>
        <Link
          href="/resell/marketplace"
          className="inline-block bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          ไปยังตลาดมือสอง
        </Link>
      </div>
    );
  }

  const { meta, reviews, questions, questionsClosed, tambon } = state;
  const domainSegment = DOMAIN_PATH[meta.listing_type];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <MockAnnoOrigin from="R-42" />
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/dashboard" className="hover:text-[#D63B12]">
          หน้าหลัก
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium break-all">
          #{meta.listing_id.slice(0, 8)}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          <ListingMetaHeader meta={meta} tambon={tambon} />

          {domainSegment && (
            <div className="bg-[#FFF1ED] border border-[#FFD0BF] rounded-xl p-4 text-sm">
              <p className="text-gray-700">
                ดูรายละเอียดเพิ่มเติม (รูป/คำอธิบาย/ราคา) ที่หน้าโดเมน:
              </p>
              <Link
                href={`/${domainSegment}`}
                className="inline-block mt-2 text-[#D63B12] font-semibold hover:underline"
              >
                ไปยัง /{domainSegment} →
              </Link>
            </div>
          )}

          <ReviewsList reviews={reviews} />
          <QuestionsList questions={questions} isClosed={questionsClosed} />
        </main>

        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
            <h3 className="font-semibold text-gray-800 mb-2">เกี่ยวกับประกาศนี้</h3>
            <p>
              ประกาศ ID:{" "}
              <code className="text-[10px] break-all">{meta.listing_id}</code>
            </p>
            <p className="mt-1">ประเภท: {meta.listing_type}</p>
            <p className="mt-1">สถานะ: {meta.state}</p>
            {meta.tambon_id && (
              <p className="mt-1">
                Tambon ID: <code className="text-[10px]">{meta.tambon_id}</code>
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
