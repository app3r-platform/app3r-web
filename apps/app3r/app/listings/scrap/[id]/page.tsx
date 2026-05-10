// ============================================================
// app/listings/scrap/[id]/page.tsx — Scrap detail page
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getScrapListing } from "../../../../lib/api/listings";
import PhotoGallery from "../../../../components/listings/PhotoGallery";
import TypeBadge from "../../../../components/listings/TypeBadge";
import AdBanner from "../../../../components/ads/AdBanner";
import InterestedButton from "./InterestedButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = getScrapListing(id);
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

export default async function ScrapDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = getScrapListing(id);
  if (!listing) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-purple-700">ประกาศ</Link>
        <span>/</span>
        <Link href="/listings/scrap" className="hover:text-purple-700">ซาก</Link>
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
              <TypeBadge type="scrap" />
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {listing.material}
              </span>
              {listing.sponsored && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Sponsored
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-500">ราคา/กก.</p>
                <p className="text-2xl font-extrabold text-gray-700">{listing.pricePerKgLabel}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">น้ำหนักรวม</p>
                <p className="text-2xl font-extrabold text-gray-700">{listing.totalWeightLabel}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">มูลค่าโดยประมาณ</p>
                <p className="text-2xl font-extrabold text-purple-700">{listing.estimatedValueLabel}</p>
              </div>
            </div>
          </div>

          {/* Details table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: "วัสดุหลัก", value: listing.material },
                  { label: "น้ำหนัก", value: listing.totalWeightLabel },
                  { label: "ราคา/กก.", value: listing.pricePerKgLabel },
                  { label: "มูลค่าประมาณ", value: listing.estimatedValueLabel },
                  { label: "ที่ตั้ง", value: listing.location },
                  { label: "จังหวัด", value: listing.province },
                  { label: "โพสต์เมื่อ", value: listing.postedAt },
                  { label: "ยอดเข้าชม", value: `${listing.viewCount} ครั้ง` },
                ].map(({ label, value }) => (
                  <tr key={label} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-500 font-medium w-36">{label}</td>
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
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ราคา/กก.</span>
                <span className="font-bold text-gray-700">{listing.pricePerKgLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">น้ำหนัก</span>
                <span className="font-bold text-gray-700">{listing.totalWeightLabel}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-500 font-medium">มูลค่าโดยประมาณ</span>
                <span className="font-extrabold text-purple-700">{listing.estimatedValueLabel}</span>
              </div>
            </div>
            <InterestedButton listingTitle={listing.title} />
            <p className="text-xs text-gray-400 text-center">
              การติดต่อผ่านระบบ WeeeU — มีระบบ Escrow คุ้มครอง
            </p>
          </div>

          {/* Seller info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">ข้อมูลผู้ขาย</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-lg">
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
        </div>
      </div>
    </div>
  );
}
