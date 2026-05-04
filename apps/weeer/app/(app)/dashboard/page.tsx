import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard — WeeeR" };

const STATS = [
  { label: "Silver",       value: "4,250",  suffix: "pts",  icon: "🪙",  bg: "bg-gray-50",   text: "text-gray-700" },
  { label: "Gold",         value: "1,800",  suffix: "pts",  icon: "⭐",  bg: "bg-yellow-50",  text: "text-yellow-700" },
  { label: "งานเดือนนี้",  value: "37",     suffix: "งาน",  icon: "📋",  bg: "bg-blue-50",    text: "text-blue-700" },
  { label: "WeeeT Active", value: "3",      suffix: "คน",   icon: "👷",  bg: "bg-green-50",   text: "text-green-700" },
];

const RECENT_JOBS = [
  { id: "JOB-0501", type: "ซ่อม",  title: "ซ่อมแอร์บ้าน Mitsubishi",  status: "PENDING",     weeet: null },
  { id: "JOB-0500", type: "บำรุง", title: "บำรุงรักษาแอร์ประจำปี",     status: "ASSIGNED",    weeet: "R001-T01" },
  { id: "JOB-0499", type: "ซ่อม",  title: "ซ่อมตู้เย็น Samsung",       status: "IN_PROGRESS", weeet: "R001-T02" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอจัดสรร", ASSIGNED: "มอบหมายแล้ว", IN_PROGRESS: "กำลังดำเนิน", COMPLETED: "เสร็จแล้ว",
};

const WEEET_LIST = [
  { id: "R001-T00", name: "ร้าน ABC (ตัวเอง)", type: "default", status: "active" },
  { id: "R001-T01", name: "นายวิทยา ซ่อมเก่ง",  type: "rented",  status: "active" },
  { id: "R001-T02", name: "นายสมชาย ช่างดี",    type: "rented",  status: "active" },
  { id: "R001-T03", name: "นายมาลัย ไฟฟ้า",     type: "rented",  status: "suspended" },
];

const SHOP = {
  name: "ร้านซ่อมแอร์ ABC",
  status: "active", // active / pending / suspended
  gold: 1800,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{SHOP.name}</h1>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">เปิดใช้งาน</span>
        </div>
        <Link href="/manage-technicians" className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-xl transition-colors">
          👷 จัดการ WeeeT
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.text}`}>{s.value} <span className="text-sm font-normal">{s.suffix}</span></div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gold warning for WeeeT hire */}
      {SHOP.gold < 200 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <span>⚠️</span> Gold เหลือน้อย — ต้องมีอย่างน้อย 100 Gold เพื่อจ้าง WeeeT เพิ่ม
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/jobs/queue",     icon: "📋", label: "คิวงาน" },
          { href: "/jobs/listings",  icon: "📢", label: "ประกาศ" },
          { href: "/wallet",         icon: "💰", label: "กระเป๋า" },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="bg-white border border-gray-100 rounded-2xl p-4 text-center hover:border-green-200 hover:bg-green-50 transition-colors shadow-sm">
            <div className="text-2xl mb-1">{n.icon}</div>
            <div className="text-xs font-medium text-gray-600">{n.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Jobs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">งานล่าสุด</h2>
          <Link href="/jobs/queue" className="text-sm text-green-700 hover:underline">ดูทั้งหมด →</Link>
        </div>
        {RECENT_JOBS.map((j) => (
          <div key={j.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0">{j.type}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{j.title}</div>
              {j.weeet && <div className="text-xs text-green-600 mt-0.5">👷 {j.weeet}</div>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[j.status]}`}>{STATUS_LABEL[j.status]}</span>
          </div>
        ))}
      </div>

      {/* WeeeT summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">WeeeT ของฉัน</h2>
          <Link href="/manage-technicians" className="text-sm text-green-700 hover:underline">จัดการ →</Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {WEEET_LIST.slice(0, 4).map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-2">
              <span className="text-xl">👷</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-800 truncate">{t.name}</div>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.type === "default" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>
                    {t.type === "default" ? "ตัวเอง" : "เช่า"}
                  </span>
                  {t.status === "suspended" && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">ระงับ</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings shortcut */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {[
          { href: "/profile",       icon: "🏪", label: "ข้อมูลร้าน" },
          { href: "/wallet",        icon: "💳", label: "บัญชีธนาคาร & กระเป๋า" },
          { href: "/notifications", icon: "🔔", label: "แจ้งเตือน" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className="ml-auto text-gray-300 text-sm">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
