import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "หน้าหลัก" };

const quickActions = [
  { href: "/repair/new", icon: "🔧", label: "แจ้งซ่อม", color: "bg-orange-50 text-orange-600 border-orange-100" },
  { href: "/sell/new", icon: "💰", label: "ขาย/ซื้อ", color: "bg-green-50 text-green-600 border-green-100" },
  { href: "/scrap/new", icon: "♻️", label: "ทิ้งซาก", color: "bg-teal-50 text-teal-600 border-teal-100" },
  { href: "/maintain/book", icon: "🛠️", label: "บำรุงรักษา", color: "bg-weeeu-surface text-weeeu-dark border-weeeu-primary/20" },
];

const recentActivities = [
  { icon: "🔧", title: "แจ้งซ่อมแอร์", status: "กำลังดำเนินการ", date: "2 พ.ค. 69", statusColor: "text-orange-600 bg-orange-50" },
  { icon: "💰", title: "ประกาศขายตู้เย็น Sharp", status: "รอผู้ซื้อ", date: "1 พ.ค. 69", statusColor: "text-weeeu-primary bg-weeeu-surface" },
  { icon: "✅", title: "ซ่อมเครื่องซักผ้า", status: "เสร็จแล้ว", date: "28 เม.ย. 69", statusColor: "text-green-600 bg-green-50" },
];

// Home feed 4 หมวด — role-agnostic (Mockup — Phase D-2 ดึงจาก feed API จริง)
type FeedItem = { icon: string; name: string; meta: string };
const feedGroups: { key: string; title: string; href: string; items: FeedItem[] }[] = [
  {
    key: "used", title: "🛒 มือสอง", href: "/listings",
    items: [
      { icon: "🧊", name: "ตู้เย็น Sharp", meta: "3,500 ฿" },
      { icon: "❄️", name: "แอร์ Daikin", meta: "5,900 ฿" },
      { icon: "🫧", name: "ซักผ้า LG", meta: "2,800 ฿" },
      { icon: "📺", name: "ทีวี Samsung", meta: "4,200 ฿" },
    ],
  },
  {
    key: "scrap", title: "♻️ ซาก / ชิ้นส่วน", href: "/listings?type=scrap",
    items: [
      { icon: "🔩", name: "คอมเพรสเซอร์", meta: "800 ฿" },
      { icon: "⚙️", name: "มอเตอร์พัดลม", meta: "350 ฿" },
      { icon: "🔌", name: "แผงวงจร PCB", meta: "500 ฿" },
      { icon: "🪛", name: "ซากเครื่องซักผ้า", meta: "1,200 ฿" },
    ],
  },
  {
    key: "repair", title: "🔧 งานซ่อม", href: "/repair",
    items: [
      { icon: "❄️", name: "ซ่อมแอร์ไม่เย็น", meta: "ประเมินฟรี" },
      { icon: "🫧", name: "เครื่องซักผ้าไม่ปั่น", meta: "ประเมินฟรี" },
      { icon: "🧊", name: "ตู้เย็นไม่เย็น", meta: "ประเมินฟรี" },
      { icon: "📺", name: "ทีวีจอดับ", meta: "ประเมินฟรี" },
    ],
  },
  {
    key: "maintain", title: "🛠️ บำรุงรักษา", href: "/maintain",
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
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">สวัสดี, สมชาย 👋</h1>
        <p className="text-gray-500 text-sm mt-1">2 พฤษภาคม 2569</p>
      </div>

      {/* Wallet summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Silver */}
        <Link href="/wallet?tab=silver" className="wallet-silver rounded-2xl p-5 text-white hover:opacity-90 transition-opacity">
          <p className="text-xs font-medium opacity-80 mb-1">พอยต์เงิน (Silver Point)</p>
          <p className="text-2xl font-bold">1,250</p>
          <p className="text-xs opacity-70 mt-1">≈ ฿125.00</p>
          <div className="mt-3 flex items-center gap-1 opacity-80">
            <span className="text-xs">💎 พอยต์เงิน</span>
          </div>
        </Link>

        {/* Gold */}
        <Link href="/wallet?tab=gold" className="wallet-gold rounded-2xl p-5 text-white hover:opacity-90 transition-opacity">
          <p className="text-xs font-medium opacity-80 mb-1">พอยต์ทอง (Gold Point)</p>
          <p className="text-2xl font-bold">350</p>
          <p className="text-xs opacity-70 mt-1">≈ ฿35.00</p>
          <div className="mt-3 flex items-center gap-1 opacity-80">
            <span className="text-xs">🥇 พอยต์ทอง</span>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">บริการด่วน</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${action.color} hover:scale-105 transition-transform`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Home feed 4 หมวด — แถวละ 4 (role-agnostic) */}
      {feedGroups.map((group) => (
        <div key={group.key}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-800">{group.title}</h2>
            <Link href={group.href} className="text-sm text-weeeu-primary hover:text-weeeu-dark font-medium">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {group.items.map((item, i) => (
              <Link
                key={i}
                href={group.href}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-weeeu-primary/40 transition-colors"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[11px] font-medium text-gray-700 text-center leading-tight line-clamp-2">{item.name}</span>
                <span className="text-[10px] text-weeeu-primary font-semibold">{item.meta}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

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
    </div>
  );
}
