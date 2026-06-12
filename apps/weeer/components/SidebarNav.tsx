"use client";

// ── SidebarNav — grouped collapsible nav (INSERT-1 · CMD #115-AJ-WR) ──────────
// เรียนรู้ pattern NavGroup จาก Admin [apps/admin/components/sidebar.tsx]
// + เพิ่ม collapsible (RC5 · useState ย่อ/ขยายแต่ละกลุ่ม) + tooltip desc (RC6 · title)
// กลุ่มแรก label:null = top-level (แสดงเสมอ ไม่มีหัวข้อย่อ/ขยาย)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem { href: string; label: string; icon: string; desc?: string; badge?: number; }
interface NavGroup { label: string | null; desc?: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/dashboard",     label: "แดชบอร์ด",          icon: "🏠", desc: "ภาพรวมร้าน · สถิติ · งานล่าสุด" },
      { href: "/jobs/queue",    label: "คิวงาน",             icon: "📋", desc: "งานที่รอดำเนินการทั้งหมด" },
      { href: "/jobs/listings", label: "ประกาศ (Listings)",  icon: "📌", desc: "ประกาศรับงานของร้าน" },
      { href: "/staff",         label: "จัดการ WeeeT",       icon: "👷", desc: "ช่างประจำ / ช่างเช่า" },
      { href: "/notifications", label: "แจ้งเตือน",          icon: "🔔", desc: "การแจ้งเตือนทั้งหมด", badge: 2 },
    ],
  },
  {
    label: "ขายต่อ (Resell)", desc: "ขายเครื่องใช้ไฟฟ้ามือสอง",
    items: [
      { href: "/resell",             label: "ภาพรวม",                    icon: "💸", desc: "สรุปการขายต่อ" },
      { href: "/resell/inventory",   label: "คลังสินค้า",                 icon: "📦", desc: "สินค้ามือสองในคลัง" },
      { href: "/resell/listings",    label: "ประกาศของฉัน",               icon: "📢", desc: "ประกาศขายของร้าน" },
      { href: "/resell/marketplace", label: "ตลาดซื้อขาย (Marketplace)",  icon: "🛒", desc: "ซื้อ-ขายกับร้านอื่น" },
      { href: "/resell/transactions",label: "ซื้อขาย",                    icon: "🔄", desc: "ประวัติธุรกรรมขายต่อ" },
    ],
  },
  {
    label: "ซาก (Scrap)", desc: "รับซื้อ / จัดการซาก",
    items: [
      { href: "/scrap",        label: "ภาพรวม",       icon: "♻️", desc: "สรุปงานซาก" },
      { href: "/scrap/browse", label: "เลือกซื้อซาก",  icon: "🔍", desc: "ประกาศซากให้รับซื้อ" },
      { href: "/scrap/jobs",   label: "งานซาก",        icon: "🔧", desc: "งานซากที่รับมา" },
    ],
  },
  {
    label: "ซ่อม (Repair)", desc: "งานซ่อมเครื่องใช้ไฟฟ้า",
    items: [
      { href: "/repair/dashboard",     label: "ภาพรวม",                 icon: "🔧", desc: "สรุปงานซ่อม" },
      { href: "/repair/jobs",          label: "งานซ่อม",                icon: "📋", desc: "งานซ่อมที่รับมา" },
      { href: "/repair/announcements", label: "ประกาศรับงาน",            icon: "📢", desc: "ประกาศหางานซ่อม" },
      { href: "/repair/walk-in/queue", label: "คิวหน้าร้าน (Walk-in)",   icon: "🚶", desc: "ลูกค้านำเครื่องมาเอง" },
      { href: "/repair/pickup/queue",  label: "คิวรับถึงที่ (Pickup)",    icon: "🚛", desc: "รับเครื่องถึงบ้านลูกค้า" },
      { href: "/repair/parcel/queue",  label: "คิวพัสดุ (Parcel)",       icon: "📦", desc: "เครื่องส่งมาทางพัสดุ" },
    ],
  },
  {
    label: "บำรุงรักษา (Maintain)", desc: "งานบำรุงรักษาตามรอบ",
    items: [
      { href: "/maintain/queue", label: "คิวงานใหม่", icon: "🗓", desc: "งานบำรุงรักษาที่เปิดรับ" },
      { href: "/maintain/jobs",  label: "งานของฉัน",  icon: "📋", desc: "งานบำรุงที่รับมา" },
    ],
  },
  {
    label: "อะไหล่ (Parts)", desc: "คลังอะไหล่ · ตลาด B2B",
    items: [
      { href: "/parts/dashboard",   label: "ภาพรวม",          icon: "🔩", desc: "สรุปคลังอะไหล่" },
      { href: "/parts",             label: "คลังอะไหล่",       icon: "📦", desc: "อะไหล่ในสต๊อก" },
      { href: "/parts/inventory",   label: "จัดการคลัง B5",    icon: "🗃️", desc: "เพิ่ม/แก้ไขสต๊อกอะไหล่" },
      { href: "/parts/marketplace", label: "ตลาด B2B",         icon: "🛒", desc: "ซื้อ-ขายอะไหล่ระหว่างร้าน" },
      { href: "/parts/my-listings", label: "ขายของฉัน",        icon: "📢", desc: "อะไหล่ที่ลงขาย" },
      { href: "/parts/my-orders",   label: "คำสั่งซื้อ",        icon: "🔄", desc: "คำสั่งซื้ออะไหล่" },
      { href: "/parts/movements",   label: "ความเคลื่อนไหว",    icon: "📊", desc: "ประวัติรับเข้า/จ่ายออก" },
    ],
  },
  {
    label: "กระเป๋าเงิน (Wallet)", desc: "พอยต์ · ธุรกรรม · ถอนเงิน",
    items: [
      { href: "/wallet",             label: "ภาพรวมกระเป๋า", icon: "💰", desc: "ยอดพอยต์ทอง/เงิน" },
      { href: "/wallet/deposit",     label: "เติมพอยต์",      icon: "➕", desc: "เติมพอยต์เข้ากระเป๋า" },
      { href: "/wallet/withdraw",    label: "ถอนเงิน",        icon: "🏦", desc: "ถอนพอยต์เป็นเงินสด" },
      { href: "/wallet/settlements", label: "ประวัติการถอน",  icon: "🧾", desc: "รายการชำระบัญชี (Settlement)" },
      { href: "/wallet/history",     label: "ประวัติธุรกรรม", icon: "📜", desc: "เดินบัญชีพอยต์ทั้งหมด" },
    ],
  },
  {
    label: "บัญชี (Account)", desc: "ตั้งค่าร้าน",
    items: [
      { href: "/profile", label: "โปรไฟล์", icon: "⚙️", desc: "ข้อมูลร้าน / บริษัท" },
    ],
  },
];

function matchActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SidebarNav() {
  const pathname = usePathname();

  // active = href ที่เป็น prefix ยาวสุดของ pathname (กัน overview /resell ชนกับ /resell/inventory)
  const activeHref = navGroups
    .flatMap((g) => g.items.map((i) => i.href))
    .filter((h) => matchActive(pathname, h))
    .sort((a, b) => b.length - a.length)[0];

  // RC5: state ย่อ/ขยายต่อกลุ่ม — default เปิดทุกกลุ่ม (ไม่รบกวน overview)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {navGroups.map((group, gi) => {
        const isOpen = !collapsed[gi];
        const groupHasActive = group.items.some((i) => i.href === activeHref);
        return (
          <div key={gi}>
            {group.label && (
              <button
                type="button"
                title={group.desc}
                onClick={() => setCollapsed((c) => ({ ...c, [gi]: !c[gi] }))}
                className="w-full flex items-center justify-between px-2 mb-1 group"
                aria-expanded={isOpen}
              >
                <span className={`text-xs font-semibold uppercase tracking-wider ${groupHasActive ? "text-[#D63B12]" : "text-gray-400 group-hover:text-gray-600"}`}>
                  {group.label}
                </span>
                <span className={`text-[10px] text-gray-300 group-hover:text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`}>▸</span>
              </button>
            )}
            {isOpen && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.desc}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                        ${active
                          ? "bg-[#FFF1ED] text-[#B8300E]"
                          : "text-gray-600 hover:bg-[#FFF1ED] hover:text-[#B8300E]"}`}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
