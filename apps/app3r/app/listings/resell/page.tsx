import type { Metadata } from "next";
import Link from "next/link";
import ListingCard from "../../../components/ListingCard";

export const metadata: Metadata = {
  title: "ประกาศขายเครื่องใช้ไฟฟ้ามือสอง",
  description: "ค้นหาและซื้อเครื่องใช้ไฟฟ้ามือสองคุณภาพดี ราคาถูก จากผู้ขายทั่วประเทศบน App3R",
};

const mockListings = [
  { id: "r001", title: "เครื่องซักผ้า Samsung 10 kg สภาพดี ใช้งาน 2 ปี", type: "resell" as const, location: "กรุงเทพฯ", priceLabel: "3,500 บาท", postedAt: "2 ชม. ที่แล้ว", imageEmoji: "🫧" },
  { id: "r002", title: "ตู้เย็น LG 2 ประตู 14 คิว ราคาพิเศษ", type: "resell" as const, location: "สมุทรปราการ", priceLabel: "4,200 บาท", postedAt: "8 ชม. ที่แล้ว", imageEmoji: "🧊" },
  { id: "r003", title: "เครื่องปรับอากาศ Daikin 18,000 BTU มือสอง", type: "resell" as const, location: "นนทบุรี", priceLabel: "7,800 บาท", postedAt: "1 วัน ที่แล้ว", imageEmoji: "❄️" },
  { id: "r004", title: "ไมโครเวฟ Panasonic 20L สภาพ 90%", type: "resell" as const, location: "ปทุมธานี", priceLabel: "1,200 บาท", postedAt: "1 วัน ที่แล้ว", imageEmoji: "📟" },
  { id: "r005", title: "เครื่องดูดฝุ่น Dyson V8 พร้อมอุปกรณ์ครบ", type: "resell" as const, location: "กรุงเทพฯ", priceLabel: "6,500 บาท", postedAt: "2 วัน ที่แล้ว", imageEmoji: "🌀" },
  { id: "r006", title: "ทีวี Samsung 50 นิ้ว Smart TV 4K ปี 2023", type: "resell" as const, location: "ชลบุรี", priceLabel: "8,900 บาท", postedAt: "2 วัน ที่แล้ว", imageEmoji: "📺" },
  { id: "r007", title: "เตาอบ Sharp 38L ใช้งาน 1 ปี สภาพดี", type: "resell" as const, location: "กรุงเทพฯ", priceLabel: "2,100 บาท", postedAt: "3 วัน ที่แล้ว", imageEmoji: "🍕" },
  { id: "r008", title: "พัดลมไดสัน Hot & Cool สภาพดีมาก", type: "resell" as const, location: "กรุงเทพฯ", priceLabel: "4,500 บาท", postedAt: "3 วัน ที่แล้ว", imageEmoji: "💨" },
  { id: "r009", title: "เครื่องซักผ้า Panasonic ฝาหน้า 8 kg ปี 2022", type: "resell" as const, location: "ระยอง", priceLabel: "5,500 บาท", postedAt: "4 วัน ที่แล้ว", imageEmoji: "🫧" },
];

const categories = [
  { label: "ทั้งหมด", active: true },
  { label: "เครื่องซักผ้า", active: false },
  { label: "ตู้เย็น", active: false },
  { label: "แอร์", active: false },
  { label: "ทีวี", active: false },
  { label: "เครื่องดูดฝุ่น", active: false },
  { label: "ไมโครเวฟ", active: false },
];

export default function ResellListingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ขายเครื่องใช้ไฟฟ้ามือสอง</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 sticky top-20">
            <h3 className="font-semibold text-gray-900">กรองประกาศ</h3>

            {/* Location */}
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">จังหวัด</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>ทุกจังหวัด</option>
                <option>กรุงเทพฯ</option>
                <option>นนทบุรี</option>
                <option>ปทุมธานี</option>
                <option>สมุทรปราการ</option>
                <option>ชลบุรี</option>
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">ช่วงราคา (บาท)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="ต่ำสุด"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  placeholder="สูงสุด"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">เรียงตาม</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>ล่าสุด</option>
                <option>ราคาต่ำ-สูง</option>
                <option>ราคาสูง-ต่ำ</option>
              </select>
            </div>

            <button className="w-full bg-purple-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-800 transition">
              ค้นหา
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              ประกาศขายเครื่องใช้ไฟฟ้ามือสอง
            </h1>
            <span className="text-gray-500 text-sm">{mockListings.length} รายการ</span>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            {categories.map((cat) => (
              <button
                key={cat.label}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  cat.active
                    ? "bg-purple-700 text-white border-purple-700"
                    : "bg-white text-gray-700 border-gray-300 hover:border-purple-500"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Limited info notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg">ℹ️</span>
            <div className="text-sm text-amber-800">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดเพิ่มเติม เช่น ชื่อผู้ขาย เบอร์โทร และ
              ยื่น offer ได้หลังจาก{" "}
              <Link href="http://localhost:3002/register" className="underline font-semibold text-amber-900">
                สมัครสมาชิก WeeeU
              </Link>
            </div>
          </div>

          {/* Listings grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {mockListings.map((listing) => (
              <ListingCard key={listing.id} {...listing} limited={true} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8 gap-1">
            {[1, 2, 3, "...", 12].map((page, i) => (
              <button
                key={i}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  page === 1
                    ? "bg-purple-700 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-purple-500"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
