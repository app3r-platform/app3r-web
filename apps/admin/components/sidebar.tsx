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
      { href: "/",               label: "แดชบอร์ด",       icon: "📊" },
      { href: "/modules/repair", label: "จัดการโมดูล",    icon: "🗂️" },
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
      { href: "/topup",                    label: "อนุมัติเติมพอยต์",    icon: "💳" },
      { href: "/withdrawal",               label: "อนุมัติถอนเงิน",      icon: "🏦" },
      { href: "/transfers/deposits",       label: "ตรวจสลิปโอนเงิน",    icon: "🧾" },
      { href: "/transfers/withdrawals",    label: "คำขอถอนเงิน",         icon: "💸" },
      { href: "/disputes",                 label: "ข้อพิพาท",             icon: "⚖️" },
    ],
  },
  {
    label: "แพลตฟอร์ม",
    items: [
      { href: "/platform/balances",          label: "ยอดคงเหลือแพลตฟอร์ม",  icon: "⚖️" },
      { href: "/platform/gold-management",   label: "จัดการพอยต์ทอง",        icon: "🥇" },
      { href: "/platform/silver",            label: "จัดการพอยต์เงิน",       icon: "🥈" },
      { href: "/platform/transactions",      label: "บันทึกตรวจสอบ",          icon: "📋" },
      { href: "/platform/reconciliation",    label: "กระทบยอดพอยต์",          icon: "🔍" },
      { href: "/reconciliation",             label: "กระทบยอดชำระบัญชี",      icon: "⚙️" },
    ],
  },
  {
    label: "พอยต์",
    items: [
      { href: "/points",               label: "บัญชีพอยต์",      icon: "💰" },
      { href: "/points/manual-adjust", label: "ปรับยอดด้วยมือ",  icon: "✏️" },
      { href: "/promotions",           label: "โปรโมชัน",         icon: "🎁" },
    ],
  },
  {
    label: "ซ่อม",
    items: [
      { href: "/repair/jobs",                    label: "งานซ่อม",          icon: "🔧" },
      { href: "/repair/analytics",               label: "สถิติ",             icon: "📊" },
      { href: "/repair/disputes",                label: "ข้อพิพาท",          icon: "⚖️" },
      { href: "/repair/walk-in/queue",           label: "คิว Walk-in",       icon: "🚶" },
      { href: "/repair/walk-in/abandoned",       label: "ทิ้งเครื่อง",       icon: "📦" },
      { href: "/repair/pickup/queue",            label: "คิวรับ-ส่ง",        icon: "🚛" },
      { href: "/repair/pickup/dispatch-monitor", label: "ติดตามการจัดส่ง",   icon: "📡" },
      { href: "/repair/parcel/queue",            label: "คิวพัสดุ",          icon: "📦" },
      { href: "/repair/parcel/disputes",         label: "ข้อพิพาทพัสดุ",    icon: "⚠️" },
    ],
  },
  {
    label: "บำรุงรักษา",
    items: [
      { href: "/maintain/jobs",      label: "งานบำรุง",     icon: "🛁" },
      { href: "/maintain/recurring", label: "งานประจำ",     icon: "🔁" },
      { href: "/maintain/analytics", label: "สถิติ",        icon: "📊" },
    ],
  },
  {
    label: "อะไหล่",
    items: [
      { href: "/parts",              label: "คลังอะไหล่",   icon: "🔩" },
      { href: "/parts/movements",    label: "ความเคลื่อนไหว", icon: "📦" },
      { href: "/parts/analytics",    label: "สถิติ",         icon: "📊" },
    ],
  },
  {
    label: "ขายต่อ",
    items: [
      { href: "/resell/listings",    label: "ประกาศขาย",    icon: "🛍️" },
      { href: "/resell/offers",      label: "ข้อเสนอ",      icon: "🤝" },
      { href: "/resell/disputes",    label: "ข้อพิพาท",     icon: "⚖️" },
      { href: "/resell/analytics",   label: "สถิติ",         icon: "📊" },
    ],
  },
  {
    label: "รับซาก",
    items: [
      { href: "/scrap/listings",     label: "ประกาศรับซาก",  icon: "♻️" },
      { href: "/scrap/jobs",         label: "งานรับซาก",     icon: "🔨" },
      { href: "/scrap/disputes",     label: "ข้อพิพาท",      icon: "⚖️" },
      { href: "/scrap/certificates", label: "ใบรับรอง",       icon: "📜" },
    ],
  },
  {
    label: "รายการ",
    items: [
      { href: "/services", label: "งานบริการ",    icon: "🔧" },
      { href: "/listings", label: "ประกาศขาย",    icon: "🛍️" },
      { href: "/audit",    label: "บันทึกการใช้งาน", icon: "📋" },
    ],
  },
  {
    label: "CMS",
    items: [
      { href: "/content",                  label: "จัดการเนื้อหา",         icon: "📝" },
      { href: "/testimonials",             label: "รีวิวลูกค้า",           icon: "⭐" },
      { href: "/articles",                 label: "บทความ (ผู้ช่วย AI)",   icon: "✍️" },
      { href: "/products",                 label: "จัดการสินค้า (C10)",    icon: "📦" },
      { href: "/ads",                      label: "โฆษณา (C12)",           icon: "📢" },
      { href: "/notifications/download",   label: "แจ้งเตือนดาวน์โหลด",   icon: "📲" },
    ],
  },
  {
    label: "ติดต่อ",
    items: [
      { href: "/contact",      label: "กล่องข้อความ",   icon: "📨" },
      { href: "/contact/info", label: "ข้อมูลติดต่อ",    icon: "📇" },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { href: "/pricing",        label: "ราคารับซื้อ",     icon: "💲" },
      { href: "/reference",      label: "ข้อมูลอ้างอิง",   icon: "📚" },
      { href: "/system/storage", label: "พื้นที่จัดเก็บ",  icon: "💾" },
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
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
        <Image src="/admin-logo.png" alt="App3R Admin" width={32} height={32}
          className="rounded-lg" onError={() => {}} />
        <div>
          <span className="text-sm font-bold text-admin-text">App3R Admin</span>
          <p className="text-xs text-gray-500">Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                        ? "bg-admin-surface text-admin-primary font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-admin-text"
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
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span> ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
