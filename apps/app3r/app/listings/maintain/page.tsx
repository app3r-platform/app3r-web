import type { Metadata } from "next";
import Link from "next/link";
import ListingCard from "../../../components/ListingCard";

export const metadata: Metadata = {
  title: "ประกาศบำรุงรักษาเครื่องใช้ไฟฟ้า",
  description: "จองบริการบำรุงรักษาเครื่องใช้ไฟฟ้า ล้างแอร์ ล้างเครื่องซักผ้า จากช่างมืออาชีพบน App3R",
};

const mockListings = [
  { id: "m001", title: "ล้างแอร์ 2 เครื่อง พร้อมเติมน้ำยา", type: "maintain" as const, location: "ปทุมธานี", priceLabel: "รับ offer", postedAt: "6 ชม. ที่แล้ว", imageEmoji: "🧹" },
  { id: "m002", title: "ล้างเครื่องซักผ้าฝาบน พร้อมฆ่าเชื้อ", type: "maintain" as const, location: "กรุงเทพฯ", priceLabel: "รับ offer", postedAt: "1 วัน ที่แล้ว", imageEmoji: "🫧" },
  { id: "m003", title: "ล้างแอร์ฝังฝ้า 18,000 BTU + เช็คน้ำยา", type: "maintain" as const, location: "กรุงเทพฯ", priceLabel: "รับ offer", postedAt: "1 วัน ที่แล้ว", imageEmoji: "❄️" },
  { id: "m004", title: "ล้างเครื่องซักผ้าฝาหน้า Samsung ถ่ายรูปก่อน-หลัง", type: "maintain" as const, location: "นนทบุรี", priceLabel: "รับ offer", postedAt: "2 วัน ที่แล้ว", imageEmoji: "🫧" },
  { id: "m005", title: "ล้างแอร์แยกส่วน 3 เครื่อง ต้องการช่างมีประสบการณ์", type: "maintain" as const, location: "ชลบุรี", priceLabel: "รับ offer", postedAt: "2 วัน ที่แล้ว", imageEmoji: "🧹" },
  { id: "m006", title: "ล้างตู้เย็น + เปลี่ยนยางขอบ ตู้เย็น 2 ประตู", type: "maintain" as const, location: "กรุงเทพฯ", priceLabel: "รับ offer", postedAt: "3 วัน ที่แล้ว", imageEmoji: "🧊" },
];

const services = [
  { icon: "❄️", name: "ล้างแอร์", desc: "ล้างทำความสะอาด + เติมน้ำยา" },
  { icon: "🫧", name: "ล้างเครื่องซักผ้า", desc: "ฝาบน / ฝาหน้า + ฆ่าเชื้อ" },
  { icon: "🧊", name: "บำรุงตู้เย็น", desc: "ล้าง + เปลี่ยนยาง + ตรวจสอบ" },
  { icon: "💨", name: "พัดลมและอื่นๆ", desc: "ล้าง + ตรวจสอบ + น้ำมัน" },
];

export default function MaintainListingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประกาศบำรุงรักษา</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🧹 บำรุงรักษาเครื่องใช้ไฟฟ้า</h1>
            <p className="text-gray-600 mt-1 text-sm">
              ล้างแอร์ ล้างเครื่องซักผ้า และบำรุงรักษาอื่นๆ จากช่างมืออาชีพพร้อมหลักฐานภาพ
            </p>
          </div>
          <Link
            href="http://localhost:3002/register"
            className="bg-orange-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition whitespace-nowrap"
          >
            จองบริการ →
          </Link>
        </div>

        {/* Service types */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {services.map((s) => (
            <div key={s.name} className="bg-white rounded-lg p-3 text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="font-semibold text-sm text-gray-900">{s.name}</div>
              <div className="text-xs text-gray-500">{s.desc}</div>
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
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option>ทุกจังหวัด</option>
                <option>กรุงเทพฯ</option>
                <option>นนทบุรี</option>
                <option>ปทุมธานี</option>
                <option>สมุทรปราการ</option>
                <option>ชลบุรี</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">ประเภทบริการ</label>
              <div className="space-y-2">
                {["ทั้งหมด", "ล้างแอร์", "ล้างเครื่องซักผ้า", "บำรุงตู้เย็น", "อื่นๆ"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-orange-500" defaultChecked={opt === "ทั้งหมด"} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <button className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition">
              ค้นหา
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">ประกาศบำรุงรักษาทั้งหมด</h2>
            <span className="text-gray-500 text-sm">{mockListings.length} รายการ</span>
          </div>

          {/* Limited info notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg">ℹ️</span>
            <div className="text-sm text-amber-800">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ยื่น offer ให้งานได้หลังจาก{" "}
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
