// ============================================================
// app/owners/[id]/page.tsx — W-23 OWNER-HISTORY (ประวัติผู้ประกาศ)
// Round 2 W-08: ลิงก์ "ประวัติผู้ประกาศ" ในหน้ารายละเอียดประกาศมีปลายทางจริง
// (เลนส์ #9 — ดูประวัติ/ความน่าเชื่อถือผู้ประกาศ). Public read-only · MOCKUP.
// Screen ID badge (D15) + global not-found (D14) + brand theme เขียว (A1).
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnerProfile } from "@/lib/mock/owner-history";
import { MockAnnoOrigin, MockAnnoXapp } from "@/components/common";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = getOwnerProfile(id);
  if (!profile) return { title: "ไม่พบผู้ประกาศ — App3R" };
  return {
    title: `ประวัติผู้ประกาศ: ${profile.seller.displayName}`,
    description: `ประวัติและประกาศทั้งหมดของ ${profile.seller.displayName} บน App3R`,
    robots: { index: false, follow: false },
  };
}

export default async function OwnerHistoryPage({ params }: PageProps) {
  const { id } = await params;
  const profile = getOwnerProfile(id);
  if (!profile) notFound();

  const { seller, listings } = profile;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* §5 mock-anno-origin: มาจาก W-08/W-10/W-12/W-14 (ลิงก์ "ดูประวัติผู้ประกาศ") */}
      <MockAnnoOrigin from={["W-08", "W-10", "W-12", "W-14"]} />
      {/* §8 mock-anno-xapp: WeeeU เจ้าของดูประวัติตัวเอง / WeeeR ตรวจสอบ seller */}
      <MockAnnoXapp
        context="ดูประวัติผู้ประกาศ"
        apps={[
          { app: "WeeeU", screen: "U-owner-profile", href: "http://localhost:3002/profile", label: "โปรไฟล์ WeeeU" },
          { app: "WeeeR", screen: "R-seller-check", href: "http://localhost:3001/sellers", label: "ตรวจสอบ seller" },
        ]}
      />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-website-brand-700">ประกาศ</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประวัติผู้ประกาศ</span>
      </nav>

      {/* หน้าจำลอง — placeholder notice */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
        🧪 หน้าจำลอง (mockup) — ข้อมูลประวัติ/รีวิวเป็นตัวอย่าง · ข้อมูลจริงเชื่อมต่อ Backend จังหวะถัดไป
      </div>

      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-website-brand-100 flex items-center justify-center text-website-brand-700 font-bold text-2xl shrink-0">
            {seller.displayName.charAt(0)}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{seller.displayName}</h1>
              {seller.verified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                  <span>✓</span> ยืนยันตัวตนแล้ว
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">สมาชิกตั้งแต่ปี {seller.joinedYear}</p>
            <div className="flex items-center gap-5 mt-3 text-sm">
              <div>
                <span className="text-yellow-500">★</span>{" "}
                <span className="font-semibold text-gray-900">{seller.rating}</span>
                <span className="text-gray-500"> /5 คะแนนรีวิว</span>
              </div>
              <div className="text-gray-600">
                ขายสำเร็จ <span className="font-semibold text-gray-900">{seller.totalSales}</span> รายการ
              </div>
              <div className="text-gray-600">
                ประกาศปัจจุบัน <span className="font-semibold text-gray-900">{listings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Owner's listings */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        ประกาศของผู้ประกาศนี้ ({listings.length})
      </h2>
      {listings.length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-4xl mb-2">📭</p>
          <p>ผู้ประกาศรายนี้ยังไม่มีประกาศที่เปิดอยู่</p>
          <Link
            href="/listings/resell"
            className="inline-block mt-4 text-website-brand-700 font-semibold hover:underline text-sm"
          >
            ดูประกาศทั้งหมดบน App3R →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <Link
              key={`${l.type}-${l.id}`}
              href={l.href}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition group"
            >
              {/* D1 fallback: bg-gray-100 แสดงเมื่อโหลดรูปไม่ได้ · text fallback ใน aria-label */}
              <div className="h-40 bg-gray-100 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.image}
                  alt={l.title}
                  aria-label={`รูปประกาศ: ${l.title}`}
                  className="w-full h-full object-cover"
                  style={{ color: "transparent" }}
                />
              </div>
              <div className="p-4 space-y-1.5">
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-website-brand-50 text-website-brand-700">
                  {l.type === "resell" ? "ขายมือสอง" : "ซาก"}
                </span>
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-website-brand-700 transition">
                  {l.title}
                </h3>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-website-brand-700 text-sm">{l.priceLabel}</span>
                  <span className="text-xs text-gray-400">{l.postedAt}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Reviews note (mock) */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
        <h3 className="font-semibold text-gray-800 mb-1">รีวิวจากผู้ใช้</h3>
        <p className="text-xs text-gray-500">
          คะแนนรวม {seller.rating}/5 จากผู้ซื้อ {seller.totalSales} ราย — รีวิวรายธุรกรรมจะแสดงหลังเชื่อมต่อ
          ระบบจริง (รีวิวเกิดหลังจบธุรกรรมเท่านั้น)
        </p>
      </div>
    </div>
  );
}
