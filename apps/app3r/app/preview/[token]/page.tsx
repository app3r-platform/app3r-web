// ============================================================
// app/preview/[token]/page.tsx — READ-ONLY Listing Preview (mockup)
// W-19 — โหมดพรีวิวประกาศก่อนเผยแพร่ (ไม่มีปุ่มยื่นข้อเสนอ / ไม่มี Q&A)
//   - token ใดๆ → แสดงพรีวิวประกาศ (read-only) เสมอ ไม่ notFound
//   - token === "expired" → แสดงหน้าจอ "ลิงก์หมดอายุ"
// MOCKUP-ONLY: ดึงประกาศจาก mock data (lib/api/listings)
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { TermTooltip, MockAnnoOrigin, MockAnnoXapp } from "@/components/common";
import { mockResellListings } from "@/lib/mock/resell";
import type { ResellListing } from "@/lib/types";

// ห้าม index หน้า preview + ไม่ cache (พรีวิวต้องสดเสมอ)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "พรีวิวประกาศ — App3R",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

// mock rule: token ที่ทำให้ลิงก์ "หมดอายุ" (expired link state)
const EXPIRED_TOKENS = new Set(["expired", "expired-link", "ลิงก์หมดอายุ"]);

/**
 * เลือกประกาศจาก mock data แบบ deterministic ตาม token
 * (token เดียวกัน → ประกาศเดิมเสมอ) — ถ้า token ว่างก็ fallback ตัวแรก
 */
function pickListingByToken(token: string): ResellListing {
  const list = mockResellListings;
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return list[hash % list.length] ?? list[0];
}

const conditionColor: Record<string, string> = {
  "มือสอง-ดีมาก": "text-green-700 bg-green-100",
  "มือสอง-ดี": "text-blue-700 bg-blue-100",
  "มือสอง-พอใช้": "text-yellow-700 bg-yellow-100",
  ชำรุด: "text-red-700 bg-red-100",
};

export default async function PreviewPage({ params }: Props) {
  const { token } = await params;
  const decoded = decodeURIComponent(token ?? "").trim().toLowerCase();

  // ── Expired-link state ────────────────────────────────────
  if (EXPIRED_TOKENS.has(decoded)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-3xl">
            ⏳
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ลิงก์พรีวิวหมดอายุ</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            ลิงก์พรีวิวนี้หมดอายุแล้วหรือถูกยกเลิกการแชร์ —
            กรุณาขอลิงก์พรีวิวใหม่จากเจ้าของประกาศ หรือกลับไปยังหน้าหลัก
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/"
              className="bg-website-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-website-brand-800 transition"
            >
              กลับหน้าหลัก
            </Link>
            <Link
              href="/listings/resell"
              className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              ดูประกาศทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Read-only preview ─────────────────────────────────────
  const listing = pickListingByToken(decoded || "preview");

  return (
    <div>
      {/* §5 mock-anno-origin: WeeeU เจ้าของประกาศ preview ก่อน publish (cross-app entry) */}
      <MockAnnoOrigin from="WeeeU-owner-preview" />
      {/* §8 mock-anno-xapp: เจ้าของ (WeeeU) กำลังดูตัวอย่างก่อนเผยแพร่ */}
      <MockAnnoXapp
        context="WeeeU เจ้าของดูพรีวิวก่อน publish"
        apps={[
          { app: "WeeeU", screen: "U-listing-draft", href: "http://localhost:3002/listings/draft", label: "ร่างประกาศของฉัน" },
        ]}
      />
      {/* โหมดพรีวิว — banner ต้องเห็นชัดเสมอ */}
      <div className="sticky top-0 z-50 bg-amber-400 text-gray-900 text-center py-2 px-4 font-bold text-sm flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>👁️ โหมดพรีวิว — ยังไม่เผยแพร่</span>
        <span className="font-normal text-xs text-gray-700">
          (มุมมองสำหรับตรวจสอบก่อนเผยแพร่ — อ่านได้อย่างเดียว)
        </span>
        <Link
          href="/"
          className="underline text-gray-700 hover:text-gray-900 font-normal text-xs"
        >
          กลับหน้าหลัก
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Preview info bar */}
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800 flex flex-wrap items-center gap-2">
          <span className="font-semibold">ตัวอย่างประกาศ</span>
          <span className="text-amber-600">·</span>
          <span>ผู้เข้าชมทั่วไปยังไม่เห็นประกาศนี้จนกว่าคุณจะกดเผยแพร่</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image + details + description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>

            {/* Thumbnails (ถ้ามีหลายรูป) */}
            {listing.images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {listing.images.slice(1).map((src, i) => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${listing.title} รูปที่ ${i + 2}`}
                      className="w-full h-24 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Title & badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  ขายมือสอง
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    conditionColor[listing.condition] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {listing.condition}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <p className="text-3xl font-extrabold text-website-brand-700">
                {listing.priceLabel}
              </p>
            </div>

            {/* Details table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: "ยี่ห้อ", value: listing.brand },
                    { label: "หมวดหมู่", value: listing.category },
                    { label: "สภาพ", value: listing.condition },
                    { label: "ที่ตั้ง", value: listing.location },
                    { label: "จังหวัด", value: listing.province },
                  ].map(({ label, value }) => (
                    <tr key={label} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 text-gray-500 font-medium w-32">{label}</td>
                      <td className="px-4 py-3 text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Description */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
              <h2 className="font-semibold text-gray-900">รายละเอียดสินค้า</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Right: Sidebar — read-only, NO offer button, NO Q&A */}
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 sticky top-20">
              <p className="text-2xl font-extrabold text-website-brand-700">
                {listing.priceLabel}
              </p>
              {/* แทนที่ปุ่มยื่นข้อเสนอด้วยแถบแจ้งโหมดพรีวิว (read-only) */}
              <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-semibold text-center text-sm">
                การ
                <TermTooltip term="offer" label="ยื่นข้อเสนอ" />
                จะใช้งานได้หลังเผยแพร่
              </div>
              <p className="text-xs text-gray-400 text-center">
                เมื่อเผยแพร่แล้ว ผู้ใช้จะติดต่อผ่านระบบ WeeeU —
                มีระบบ <TermTooltip term="escrow" label="พักเงินกลาง (Escrow)" /> คุ้มครอง
              </p>
            </div>

            {/* Seller info — แสดงเพื่อให้เจ้าของตรวจสอบหน้าตา */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">ข้อมูลผู้ขาย</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-website-brand-100 flex items-center justify-center text-website-brand-700 font-bold text-lg">
                  {listing.seller.displayName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {listing.seller.displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    สมาชิกตั้งแต่ปี {listing.seller.joinedYear}
                  </p>
                </div>
              </div>
              {listing.seller.verified && (
                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg w-fit">
                  <span>✓</span> ผ่านการยืนยันตัวตน
                </div>
              )}
            </div>

            {/* หมายเหตุ: ไม่มีส่วนถาม-ตอบ (Q&A) ในโหมดพรีวิว */}
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-xs text-gray-500 text-center">
              ส่วนถาม–ตอบ จะเปิดให้ใช้งานหลังประกาศถูกเผยแพร่
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
