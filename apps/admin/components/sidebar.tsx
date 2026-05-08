"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

interface NavItem { href: string; label: string; icon: string; }
interface NavGroup { label: string | null; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/",           label: "Dashboard",          icon: "📊" },
    ],
  },
  {
    label: "ผู้ใช้งาน",
    items: [
      { href: "/users",      label: "ผู้ใช้งาน",           icon: "👥" },
      { href: "/kyc",        label: "ตรวจ KYC",            icon: "🪪" },
    ],
  },
  {
    label: "การเงิน",
    items: [
      { href: "/topup",      label: "อนุมัติเติม Point",   icon: "💳" },
      { href: "/withdrawal", label: "อนุมัติถอนเงิน",      icon: "🏦" },
      { href: "/disputes",   label: "ข้อพิพาท",             icon: "⚖️" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/platform/balances",          label: "Platform Balances",  icon: "⚖️" },
      { href: "/platform/gold-management",   label: "Gold Management",    icon: "🥇" },
      { href: "/platform/silver",            label: "Silver Points",      icon: "🥈" },
      { href: "/platform/transactions",      label: "Audit Trail",        icon: "📋" },
      { href: "/platform/reconciliation",    label: "Reconciliation",     icon: "🔍" },
    ],
  },
  {
    label: "Points",
    items: [
      { href: "/points",               label: "Point Ledger",    icon: "💰" },
      { href: "/points/manual-adjust", label: "Manual Adjust",   icon: "✏️" },
      { href: "/promotions",           label: "โปรโมชัน",         icon: "🎁" },
    ],
  },
  {
    label: "Repair",
    items: [
      { href: "/repair/jobs",              label: "Repair Jobs",    icon: "🔧" },
      { href: "/repair/analytics",         label: "Analytics",      icon: "📊" },
      { href: "/repair/disputes",          label: "Disputes",       icon: "⚖️" },
      { href: "/repair/walk-in/queue",     label: "Walk-in Queue",  icon: "🚶" },
      { href: "/repair/walk-in/abandoned", label: "Abandoned",      icon: "📦" },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { href: "/system/storage", label: "Storage",         icon: "💾" },
      { href: "/config",         label: "ตั้งค่าระบบ",      icon: "⚙️" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    removeToken();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
        <Image src="/admin-logo.png" alt="App3R Admin" width={32} height={32}
          className="rounded-lg" onError={() => {}} />
        <div>
          <span className="text-sm font-bold text-white">App3R Admin</span>
          <p className="text-xs text-gray-500">Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span>🚪</span> ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
