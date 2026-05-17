import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "หน้าหลัก" },
  { href: "/wallet", icon: "👛", label: "กระเป๋าตังค์" },
  { href: "/appliances", icon: "🔌", label: "เครื่องใช้ไฟฟ้า" },
  { href: "/notifications", icon: "🔔", label: "การแจ้งเตือน", badge: 3 },
  { href: "/history", icon: "📋", label: "ประวัติ" },
  // ─── Module placeholders (Phase 2b) ───
  { type: "divider", label: "บริการ" },
  { href: "/modules/repair", icon: "🔧", label: "แจ้งซ่อม", module: true },
  { href: "/sell", icon: "💰", label: "ประกาศขาย" },
  { href: "/listings", icon: "🛒", label: "ตลาดซื้อ-ขาย" },
  { href: "/offers", icon: "🤝", label: "ข้อเสนอของฉัน" },
  { href: "/modules/scrap", icon: "♻️", label: "ขายซาก/ทิ้งซาก", module: true },
  { href: "/maintain/book", icon: "🛁", label: "จองล้าง" },
  { href: "/maintain/jobs", icon: "🛠️", label: "งานล้างของฉัน" },
  { href: "/modules/parts", icon: "🔩", label: "อะไหล่", module: true },
  { href: "/jobs", icon: "📋", label: "งานซ่อมของฉัน" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ─── Sidebar ─── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Image src="/logo/WeeeU.png" alt="WeeeU" width={32} height={32} className="rounded-lg mr-2" />
          <span className="text-lg font-bold text-blue-700">WeeeU</span>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
              สม
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">สมชาย ใจดี</p>
              <p className="text-xs text-gray-400">081-234-5678</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item, i) => {
            if ("type" in item && item.type === "divider") {
              return (
                <div key={i} className="pt-3 pb-1 px-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {item.label}
                  </p>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href as string}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150"
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                ) : null}
                {"module" in item && item.module ? (
                  <span className="text-xs text-gray-300 font-normal">›</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all"
          >
            <span>⚙️</span>
            <span>โปรไฟล์ & ตั้งค่า</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <span>🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top header (mobile-friendly) */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-20 shadow-sm">
          <div className="flex-1" />
          {/* Notification bell */}
          <Link href="/notifications" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
          {/* Wallet shortcut */}
          <Link href="/wallet" className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
            <span>👛</span>
            <span className="text-sm font-semibold text-blue-700">฿ 1,250</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>

        {/* Footer — Sub-CMD-4 D78 */}
        <Footer />
      </div>
    </div>
  );
}
