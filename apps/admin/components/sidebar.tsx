"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

const navItems = [
  { href: "/",           label: "Dashboard",      icon: "📊" },
  { href: "/users",      label: "ผู้ใช้งาน",       icon: "👥" },
  { href: "/topup",      label: "อนุมัติเติม Point", icon: "💳" },
  { href: "/withdrawal", label: "อนุมัติถอนเงิน",   icon: "🏦" },
  { href: "/disputes",    label: "ข้อพิพาท",          icon: "⚖️" },
  { href: "/points",      label: "Point Ledger",    icon: "💰" },
  { href: "/promotions",  label: "Point & โปรโมชัน", icon: "🎁" },
  { href: "/config",      label: "ตั้งค่าระบบ",     icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    removeToken();
    router.push("/login");
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-lg font-bold text-white">⚙️ App3R</span>
        <p className="text-xs text-gray-500 mt-0.5">Admin Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span>🚪</span> ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
