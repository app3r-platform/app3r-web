// ============================================================
// app/listings/resell/[id]/page.tsx — Resell detail page
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResellListing } from "../../../../lib/api/listings";
import { getMockRoleFromCookie } from "../../../../lib/auth/mock-auth";
import PhotoGallery from "../../../../components/listings/PhotoGallery";
import TypeBadge from "../../../../components/listings/TypeBadge";
import AdBanner from "../../../../components/ads/AdBanner";
import InterestedButton from "./InterestedButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = getResellListing(id);
  if (!listing) return { title: "ไม่พบประกาศ" };

  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: [{ url: listing.images[0] }],
    },
  };
}

export default async function ResellDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = getResellListing(id);
  if (!listing) notFound();

  // W-2-D (D6): Tier-based privacy
  const role = await getMockRoleFromCookie();
  const canSeeSeller = role !== "anonymous";  // Anonymous: ซ่อนชื่อ/เบอร์
  const canInterest = role === "weeeu" || role === "weeer" || role === "weeeu-owner"; // WeeeT: disabled

  const conditionColor: Record<string, string> = {
    "มือสอง-ดีมาก": "text-green-700 bg-green-100",
    "มือสอง-ดี": "text-blue-700 bg-blue-100",
    "มือสอง-พอใช้": "text-yellow-700 bg-yellow-100",
    "ชำรุด": "text-red-700 bg-red-100",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-website-brand-700">ประกาศ</Link>
        <span>/</span>
        <Link href="/listings/resell" className="hover:text-website-brand-700">ขายมือสอง</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium line-clamp-1">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Gallery + Description */}
        <div className="lg:col-span-2 space-y-6">
          <PhotoGallery images={listing.images} alt={listing.title} />

          {/* Title & badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <TypeBadge type="resell" />
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  conditionColor[listing.condition] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {listing.condition}
              </span>
              {listing.sponsored && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Sponsored
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="text-3xl font-extrabold text-website-brand-700">{listing.priceLabel}</p>
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
                  { label: "โพสต์เมื่อ", value: listing.postedAt },
                  { label: "ยอดเข้าชม", value: `${listing.viewCount} ครั้ง` },
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

          {/* Ad Banner */}
          <AdBanner size="leaderboard" />
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-5">
          {/* Price & CTA */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 sticky top-20">
            <p className="text-2xl font-extrabold text-website-brand-700">{listing.priceLabel}</p>
            {/* W-2-D (D6): Tier-based "สนใจสินค้า" button */}
            {canInterest ? (
              <InterestedButton listingTitle={listing.title} />
            ) : role === "weeet" ? (
              <button
                disabled
                title="WeeeT (ช่าง) ไม่สามารถยื่นข้อเสนอซื้อสินค้าได้ — เฉพาะ WeeeU/WeeeR"
                className="w-full bg-gray-200 text-gray-400 py-3 rounded-xl font-semibold cursor-not-allowed"
              >
                สนใจสินค้า (เฉพาะ WeeeU/WeeeR)
              </button>
            ) : (
              <InterestedButton listingTitle={listing.title} />
            )}
            <p className="text-xs text-gray-400 text-center">
              การติดต่อผ่านระบบ WeeeU — มีระบบ Escrow คุ้มครอง
            </p>
          </div>

          {/* Seller info — W-2-D (D6): ซ่อนสำหรับ Anonymous */}
          {canSeeSeller ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">ข้อมูลผู้ขาย</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-website-brand-100 flex items-center justify-center text-website-brand-700 font-bold text-lg">
                  {listing.seller.displayName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{listing.seller.displayName}</p>
                  <p className="text-xs text-gray-500">สมาชิกตั้งแต่ปี {listing.seller.joinedYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-yellow-500">★</span>{" "}
                  <span className="font-semibold">{listing.seller.rating}</span>
                  <span className="text-gray-500"> /5</span>
                </div>
                <div className="text-gray-500">
                  ขายแล้ว {listing.seller.totalSales} รายการ
                </div>
              </div>
              {listing.seller.verified && (
                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg w-fit">
                  <span>✓</span> ผ่านการยืนยันตัวตน
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
              <h2 className="font-semibold text-amber-900 flex items-center gap-2">
                <span>🔒</span> ข้อมูลผู้ขายถูกซ่อนไว้
              </h2>
              <p className="text-xs text-amber-800">
                สมัครสมาชิกหรือเข้าสู่ระบบเพื่อดูชื่อผู้ขาย คะแนนรีวิว และติดต่อโดยตรง
              </p>
              <Link
                href="/register/weeer"
                className="block bg-amber-500 text-white text-center py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition mt-2"
              >
                สมัครสมาชิก →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
