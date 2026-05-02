import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "โปรไฟล์ & ตั้งค่า" };

const settingGroups = [
  {
    title: "บัญชีและความปลอดภัย",
    items: [
      { icon: "👤", label: "แก้ไขโปรไฟล์", href: "/profile/edit" },
      { icon: "🔒", label: "เปลี่ยนรหัสผ่าน", href: "/profile/change-password" },
      { icon: "📱", label: "เบอร์โทรศัพท์", href: "/profile/phone", value: "081-234-5678" },
      { icon: "📧", label: "อีเมล", href: "/profile/email", value: "somchai@email.com" },
    ],
  },
  {
    title: "การแจ้งเตือน",
    items: [
      { icon: "🔔", label: "แจ้งเตือนการซ่อม", toggle: true, enabled: true },
      { icon: "💰", label: "แจ้งเตือนซื้อ/ขาย", toggle: true, enabled: true },
      { icon: "💎", label: "แจ้งเตือน Wallet", toggle: true, enabled: false },
      { icon: "📢", label: "โปรโมชัน & ข่าวสาร", toggle: true, enabled: false },
    ],
  },
  {
    title: "การชำระเงิน",
    items: [
      { icon: "🏦", label: "บัญชีธนาคาร", href: "/profile/bank", value: "กสิกรไทย XXX5678" },
      { icon: "💳", label: "วิธีชำระเงิน", href: "/profile/payment" },
    ],
  },
  {
    title: "แอปพลิเคชัน",
    items: [
      { icon: "🌐", label: "ภาษา", href: "/profile/language", value: "ไทย" },
      { icon: "📋", label: "เงื่อนไขการใช้งาน", href: "/terms" },
      { icon: "🔒", label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
      { icon: "ℹ️", label: "เกี่ยวกับแอป", href: "/about", value: "v1.0.0" },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ & ตั้งค่า</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-blue-700">
              สม
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700 transition-colors">
              ✏️
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">สมชาย ใจดี</h2>
            <p className="text-gray-500 text-sm">081-234-5678</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                💎 Silver Member
              </span>
              <span className="text-xs text-gray-400">สมาชิกตั้งแต่ เม.ย. 69</span>
            </div>
          </div>

          <Link
            href="/profile/edit"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
          >
            แก้ไข
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: "เครื่องใช้ไฟฟ้า", value: "4", icon: "🔌" },
            { label: "รายการซ่อม", value: "12", icon: "🔧" },
            { label: "Silver Point", value: "1,250", icon: "💎" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl">{stat.icon}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings groups */}
      {settingGroups.map((group) => (
        <div key={group.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.title}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {group.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-lg w-7 text-center">{item.icon}</span>
                <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                {"value" in item && item.value && (
                  <span className="text-sm text-gray-400">{item.value}</span>
                )}
                {"toggle" in item && item.toggle ? (
                  <div className={`w-11 h-6 rounded-full transition-colors ${item.enabled ? "bg-blue-600" : "bg-gray-200"} flex items-center px-1`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${item.enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                ) : (
                  <span className="text-gray-300">›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 py-4 border border-red-200 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-medium text-sm">
        🚪 ออกจากระบบ
      </button>

      {/* Delete account */}
      <button className="w-full text-center text-xs text-gray-400 hover:text-red-400 transition-colors py-2">
        ลบบัญชีผู้ใช้
      </button>
    </div>
  );
}
