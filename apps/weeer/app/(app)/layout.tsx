import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/dashboard",      icon: "🏠", label: "Dashboard" },
  { href: "/staff",          icon: "👷", label: "จัดการ WeeeT" },
  { href: "/jobs/queue",     icon: "📋", label: "คิวงาน" },
  { href: "/jobs/listings",  icon: "📌", label: "ประกาศ / Listings" },
  { href: "/notifications",  icon: "🔔", label: "แจ้งเตือน", badge: 2 },
  { href: "/wallet",         icon: "💰", label: "กระเป๋าเงิน" },
  { href: "/profile",        icon: "⚙️", label: "โปรไฟล์" },
  // ── Module placeholders (Phase 2b) ──
  { type: "divider", label: "โมดูล" },
  { href: "/modules/resell",  icon: "💸", label: "ขายต่อ (A)",    module: true },
  { href: "/modules/scrap",   icon: "♻️", label: "รับซาก (B)",    module: true },
  { href: "/modules/repair",  icon: "🔧", label: "ซ่อม (C)",      module: true },
  { href: "/modules/maintain",icon: "🛠️", label: "บำรุง (D)",     module: true },
  { href: "/modules/parts",   icon: "🔩", label: "อะไหล่ (E)",    module: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100 gap-3">
          <Image src="/logo/WeeeR.png" alt="WeeeR" width={36} height={36} className="rounded-xl" />
          <div>
            <div className="text-sm font-bold text-gray-900">App3R WeeeR</div>
            <div className="text-xs text-gray-400">ร้าน / บริษัท</div>
          </div>
        </div>

        {/* User info (mock) */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">บ</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">บริษัท ช่างเย็น จำกัด</p>
              <p className="text-xs text-gray-400">company@example.com</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item, i) => {
            if ("type" in item && item.type === "divider") {
              return (
                <div key={i} className="pt-3 pb-1 px-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href as string}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-green-50 hover:text-green-800 transition-all duration-150">
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>
                ) : null}
                {"module" in item && item.module ? (
                  <span className="text-xs text-gray-300">›</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <span>🚪</span>ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-20 shadow-sm">
          <div className="flex-1" />
          <Link href="/notifications" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
          <Link href="/wallet" className="flex items-center gap-2 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl transition-colors">
            <span>🪙</span>
            <span className="text-sm font-semibold text-green-700">4,250 Silver</span>
          </Link>
        </header>
        {/* Page */}
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
