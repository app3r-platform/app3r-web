import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FallbackImg } from "@/components/shared/FallbackImg";

export const metadata: Metadata = { title: "หน้าหลัก" };

const recentActivities = [
  { icon: "🔧", title: "แจ้งซ่อมแอร์", status: "กำลังดำเนินการ", date: "2 พ.ค. 69", statusColor: "text-orange-600 bg-orange-50" },
  { icon: "💰", title: "ประกาศขายตู้เย็น Sharp", status: "รอผู้ซื้อ", date: "1 พ.ค. 69", statusColor: "text-weeeu-primary bg-weeeu-surface" },
  { icon: "✅", title: "ซ่อมเครื่องซักผ้า", status: "เสร็จแล้ว", date: "28 เม.ย. 69", statusColor: "text-green-600 bg-green-50" },
];

// Home feed — การ์ดเดี่ยวแนวนอน เรียง ซื้อขาย→ซาก→ซ่อม→บำรุง (A1)
// hasActivity = แสดงเฉพาะหมวดที่ผู้ใช้มีธุรกรรม (Mockup — Phase D-2 ดึงจาก feed API จริง)
type FeedItem = { icon: string; name: string; meta: string };
const feedGroups: { key: string; title: string; href: string; hasActivity: boolean; items: FeedItem[] }[] = [
  {
    key: "used", title: "🛒 ซื้อ-ขายมือสอง", href: "/listings", hasActivity: true,
    items: [
      { icon: "🧊", name: "ตู้เย็น Sharp", meta: "3,500 ฿" },
      { icon: "❄️", name: "แอร์ Daikin", meta: "5,900 ฿" },
      { icon: "🫧", name: "ซักผ้า LG", meta: "2,800 ฿" },
      { icon: "📺", name: "ทีวี Samsung", meta: "4,200 ฿" },
    ],
  },
  {
    key: "scrap", title: "♻️ ซาก / ชิ้นส่วน", href: "/scrap", hasActivity: false,
    items: [
      { icon: "🔩", name: "คอมเพรสเซอร์", meta: "800 ฿" },
      { icon: "⚙️", name: "มอเตอร์พัดลม", meta: "350 ฿" },
      { icon: "🔌", name: "แผงวงจร PCB", meta: "500 ฿" },
      { icon: "🪛", name: "ซากเครื่องซักผ้า", meta: "1,200 ฿" },
    ],
  },
  {
    key: "repair", title: "🔧 งานซ่อม", href: "/repair", hasActivity: true,
    items: [
      { icon: "❄️", name: "ซ่อมแอร์ไม่เย็น", meta: "ประเมินฟรี" },
      { icon: "🫧", name: "เครื่องซักผ้าไม่ปั่น", meta: "ประเมินฟรี" },
      { icon: "🧊", name: "ตู้เย็นไม่เย็น", meta: "ประเมินฟรี" },
      { icon: "📺", name: "ทีวีจอดับ", meta: "ประเมินฟรี" },
    ],
  },
  {
    key: "maintain", title: "🛠️ บำรุงรักษา", href: "/maintain/book", hasActivity: false,
    items: [
      { icon: "❄️", name: "ล้างแอร์", meta: "เริ่ม 500 ฿" },
      { icon: "🌀", name: "ล้างเครื่องซักผ้า", meta: "เริ่ม 400 ฿" },
      { icon: "🧴", name: "เคลือบคอยล์", meta: "เริ่ม 350 ฿" },
      { icon: "🔍", name: "ตรวจเช็กประจำปี", meta: "เริ่ม 300 ฿" },
    ],
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Greeting — logo ×2 (56px = 2× ของแถบบน 28px) ข้างคำทักทาย (A1) */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo/WeeeU.png"
          alt="WeeeU"
          width={56}
          height={56}
          className="rounded-2xl shadow-sm"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สวัสดี, สมชาย 👋</h1>
          <p className="text-gray-500 text-sm mt-1">2 พฤษภาคม 2569</p>
        </div>
      </div>

      {/* U-01: การ์ดพอยต์ Silver+Gold ย้ายไป top-bar (layout) — ไม่ใช่กิจกรรมหลักของ dashboard */}

      {/* บริการของฉัน — การ์ดเดี่ยวแนวนอน · แสดงเฉพาะหมวดที่มีธุรกรรม (A1) */}
      <div className="space-y-3">
        {feedGroups.filter((group) => group.hasActivity).map((group) => (
          <Link
            key={group.key}
            href={group.href}
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-weeeu-primary/40 transition-colors"
          >
            {/* icon ใหญ่ซ้าย */}
            <span className="text-3xl flex-shrink-0">{group.items[0]?.icon ?? "📦"}</span>
            {/* ชื่อหมวด + teaser */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{group.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {group.items[0]?.name} · {group.items[0]?.meta}
                {group.items.length > 1 ? ` · +${group.items.length - 1} รายการ` : ""}
              </p>
            </div>
            <span className="text-sm text-weeeu-primary font-medium flex-shrink-0">ดูทั้งหมด →</span>
          </Link>
        ))}
      </div>

      {/* My appliances summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-800">เครื่องใช้ไฟฟ้าของฉัน</h2>
          <Link href="/appliances" className="text-sm text-weeeu-primary hover:text-weeeu-dark font-medium">
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "❄️", name: "แอร์", brand: "Mitsubishi", count: 2 },
            { icon: "🫧", name: "เครื่องซักผ้า", brand: "LG", count: 1 },
            { icon: "🧊", name: "ตู้เย็น", brand: "Sharp", count: 1 },
          ].map((app) => (
            <div key={app.name} className="bg-gray-50 rounded-xl p-3 text-center">
              <span className="text-2xl">{app.icon}</span>
              <p className="text-xs font-medium text-gray-700 mt-1">{app.name}</p>
              <p className="text-xs text-gray-400">{app.brand}</p>
              <span className="inline-block mt-1 text-xs bg-weeeu-surface text-weeeu-primary px-2 py-0.5 rounded-full">
                {app.count} เครื่อง
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/appliances/add"
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-weeeu-dark rounded-xl text-sm text-weeeu-primary hover:border-weeeu-primary hover:text-weeeu-primary transition-colors"
        >
          <span>+</span> เพิ่มเครื่องใช้ไฟฟ้า
        </Link>
      </div>

      {/* Recent activities */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-800">กิจกรรมล่าสุด</h2>
          <Link href="/history" className="text-sm text-weeeu-primary hover:text-weeeu-dark font-medium">
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="space-y-3">
          {recentActivities.map((act, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {act.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{act.title}</p>
                <p className="text-xs text-gray-400">{act.date}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${act.statusColor}`}>
                {act.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* สินค้าน่าสนใจ — ใต้กิจกรรมล่าสุด (U-01#3 · เหมือน website · คลิก→รายละเอียดสินค้ามือสอง) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-800">สินค้าน่าสนใจ</h2>
          <Link href="/marketplace" className="text-sm text-weeeu-primary hover:text-weeeu-dark font-medium">
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "1", image: "https://picsum.photos/seed/weeeu-mkt-air/300/200", name: "แอร์ Mitsubishi 12000 BTU", price: "4,500", area: "อ.เมือง" },
            { id: "2", image: "https://picsum.photos/seed/weeeu-mkt-washer/300/200", name: "เครื่องซักผ้า LG 8kg", price: "3,200", area: "อ.วารินชำราบ" },
            { id: "3", image: "https://picsum.photos/seed/weeeu-mkt-fridge/300/200", name: "ตู้เย็น Sharp 6.5 คิว", price: "2,800", area: "อ.เมือง" },
            { id: "4", image: "https://picsum.photos/seed/weeeu-mkt-tv/300/200", name: "ทีวี Samsung 43 นิ้ว", price: "3,900", area: "อ.เดชอุดม" },
          ].map((item) => (
            <Link
              key={item.id}
              href={`/marketplace/${item.id}`}
              className="rounded-xl border border-gray-100 overflow-hidden hover:border-weeeu-primary/40 transition-colors"
            >
              {/* U-01#3 — รูปจริง (mockup placeholder · pattern เดียวกับ marketplace) */}
              {/* D1 media fallback: FallbackImg (Client Component รองรับ onError ใน Server page) */}
              <FallbackImg
                src={item.image}
                alt={item.name}
                className="h-20 w-full bg-gray-100 object-cover"
              />
              <div className="p-2.5">
                <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-sm font-bold text-weeeu-primary mt-0.5">฿{item.price}</p>
                <p className="text-xs text-gray-400 truncate">{item.area}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
