"use client";

// ── Parts B2B Sub-layout — Phase C-6 ─────────────────────────────────────────
// sub-layout (เลย์เอาต์ย่อย) สำหรับ /parts/* เท่านั้น
// มี ShopIdSwitcher dropdown (HUB NOTE-1 resolved — วางที่นี่ ไม่ใช่ root layout)

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShopIdSwitcher } from "../../../components/ShopIdSwitcher";

// ── P12 (Gen78): Modal-lock context ──────────────────────────────────────────
// ล็อก ShopIdSwitcher ขณะ modal ของหน้าลูกเปิดอยู่ (กัน race: สลับร้านกลาง flow)
interface PartsModalContextValue {
  setModalOpen: (open: boolean) => void;
}
const PartsModalContext = createContext<PartsModalContextValue>({
  setModalOpen: () => { /* no-op default */ },
});

/**
 * useModalLock(open) — เรียกใน page ลูก พร้อม state ของ modal นั้นๆ
 * เมื่อ open=true → ShopIdSwitcher ถูก disable; false/unmount → ปลดล็อก
 */
export function useModalLock(open: boolean): void {
  const { setModalOpen } = useContext(PartsModalContext);
  useEffect(() => {
    setModalOpen(open);
    return () => setModalOpen(false);
  }, [open, setModalOpen]);
}

const PARTS_NAV = [
  { href: "/parts/marketplace",  label: "ตลาด B2B",    icon: "🛒" },
  { href: "/parts/my-listings",  label: "ขายของฉัน",   icon: "📦" },
  { href: "/parts/my-orders",    label: "คำสั่งซื้อ",   icon: "🔄" },
];

export default function PartsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PartsModalContext.Provider value={{ setModalOpen }}>
      <div className="space-y-4">
        {/* ShopIdSwitcher — สวิตช์สลับร้าน (P12: ล็อกขณะ modal เปิด) */}
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
                  active ? "bg-white text-[#D63B12] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </PartsModalContext.Provider>
  );
}
