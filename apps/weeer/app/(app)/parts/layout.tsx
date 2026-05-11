"use client";

// ── Parts B2B Sub-layout — Phase C-6 ─────────────────────────────────────────
// sub-layout (เลย์เอาต์ย่อย) สำหรับ /parts/* เท่านั้น
// มี ShopIdSwitcher dropdown (HUB NOTE-1 resolved — วางที่นี่ ไม่ใช่ root layout)

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShopIdSwitcher } from "../../../components/ShopIdSwitcher";

const PARTS_NAV = [
  { href: "/parts/marketplace",  label: "ตลาด B2B",    icon: "🛒" },
  { href: "/parts/my-listings",  label: "ขายของฉัน",   icon: "📦" },
  { href: "/parts/my-orders",    label: "คำสั่งซื้อ",   icon: "🔄" },
];

export default function PartsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* ShopIdSwitcher — สวิตช์สลับร้าน */}
      <ShopIdSwitcher disabled={modalOpen} onShopChange={() => { /* re-render จาก localStorage */ }} />

      {/* Tab nav สำหรับ parts */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {PARTS_NAV.map((n) => {
          const active = pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors ${
                active ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div onClick={(e) => {
        // ตรวจว่า modal เปิดอยู่ไหม (pass setter ผ่าน context ถ้าต้องการ — ตอนนี้ basic)
        void e;
      }}>
        {children}
      </div>
    </div>
  );
}
