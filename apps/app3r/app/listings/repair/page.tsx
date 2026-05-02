import type { Metadata } from "next";
import Link from "next/link";
import ListingCard from "../../../components/ListingCard";

export const metadata: Metadata = {
  title: "ประกาศซ่อมเครื่องใช้ไฟฟ้า",
  description: "หาช่างซ่อมเครื่องใช้ไฟฟ้าคุณภาพดี ราคาโปร่งใส ผ่านระบบ Escrow ที่ปลอดภัยบน App3R",
};

const mockListings = [
  { id: "p001", title: "แอร์ Mitsubishi 12,000 BTU ต้องการซ่อมไม่เย็น", type: "repair" as const, location: "นนทบุรี", priceLabel: "รับ offer", postedAt: "4 ชม. ที่แล้ว", imageEmoji: "❄️" },
  { id: "p002", title: "ทีวี Sony 55 นิ้ว จอมีเส้น ต้องการซ่อม", type: "repair" as const, location: "กรุงเทพฯ", priceLabel: "รับ offer", postedAt: "1 วัน ที่แล้ว", imageEmoji: "📺" },
  { id: "p003", title: "เครื่องซักผ้า LG ฝาบน ปั่นไม่หมุน", type: "repair" as const, location: "สมุทรปราการ", priceLabel: "รับ offer", postedAt: "1 วัน ที่แล้ว", imageEmoji: "🫧" },
  { id: "p004", title: "ตู้เย็น Hitachi ไม่เย็น คอมเพรสเซอร์ดัง", type: "repair" as const, location: "กรุงเทพฯ", priceLabel: "รับ offer", postedAt: "2 วัน ที่แล้ว", imageEmoji: "🧊" },
  { id: "p005", title: "เครื่องดูดฝุ่น Dyson ไม่ดูด แบตเสื่อม", type: "repair" as const, location: "ปทุมธานี", priceLabel: "รับ offer", postedAt: "2 วัน ที่แล้ว", imageEmoji: "🌀" },
  { id: "p006", title: "ไมโครเวฟ Panasonic ไม่ร้อน เครื่องดับ", type: "repair" as const, location: "กรุงเทพฯ", priceLabel: "รับ offer", postedAt: "3 วัน ที่แล้ว", imageEmoji: "📟" },
];

export default function RepairListingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประกาศซ่อมเครื่องใช้ไฟฟ้า</span>
      </nav>

      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🔧 ซ่อมเครื่องใช้ไฟฟ้า</h1>
            <p className="text-gray-600 mt-1 text-sm">
              ลงประกาศ รับ offer จากร้านซ่อมที่ผ่านการรับรอง ปลอดภัยด้วยระบบ Escrow
            </p>
          </div>
          <Link
            href="http://localhost:3002/register"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
          >
            ลงประกาศซ่อม →
          </Link>
        </div>

        {/* How escrow works */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "📝", label: "1. ลงประกาศฟรี", desc: "ระบุปัญหา รับ offer" },
            { icon: "💰", label: "2. จ่าย Escrow 30%", desc: "ล็อคเงินก่อน งานไม่เสร็จ-คืนเงิน" },
            { icon: "✅", label: "3. งานเสร็จ จ่าย 70%", desc: "ยืนยัน → โอนเงินให้ร้าน" },
          ].map((step) => (
            <div key={step.label} className="bg-white rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <div className="font-semibold text-sm text-gray-900">{step.label}</div>
                <div className="text-xs text-gray-500">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 sticky top-20">
            <h3 className="font-semibold text-gray-900">กรองประกาศ</h3>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">จังหวัด</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>ทุกจังหวัด</option>
                <option>กรุงเทพฯ</option>
                <option>นนทบุรี</option>
                <option>ปทุมธานี</option>
                <option>สมุทรปราการ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">ประเภทเครื่องใช้ไฟฟ้า</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>ทุกประเภท</option>
                <option>แอร์</option>
                <option>ทีวี</option>
                <option>เครื่องซักผ้า</option>
                <option>ตู้เย็น</option>
                <option>ไมโครเวฟ</option>
              </select>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              ค้นหา
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">ประกาศซ่อมทั้งหมด</h2>
            <span className="text-gray-500 text-sm">{mockListings.length} รายการ</span>
          </div>

          {/* Limited info notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg">ℹ️</span>
            <div className="text-sm text-amber-800">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ยื่น offer ให้งานซ่อมได้หลังจาก{" "}
              <Link href="/register/weeer" className="underline font-semibold text-amber-900">
                สมัคร WeeeR
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {mockListings.map((listing) => (
              <ListingCard key={listing.id} {...listing} limited={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
