"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

// RC4 (CMD #115-V) — i18n ไทยครบ · RC5 — collapsible groups · RC6 — tooltip (desc/title)
interface NavItem { href: string; label: string; icon: string; desc: string; }
interface NavGroup { label: string | null; desc?: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/",               label: "แดชบอร์ด",       icon: "📊", desc: "ภาพรวมระบบทั้งแพลตฟอร์ม" },
      { href: "/modules/repair", label: "จัดการโมดูล",     icon: "🗂️", desc: "ตั้งค่า/เปิด-ปิดโมดูลบริการ" },
    ],
  },
  {
    label: "ผู้ใช้งาน",
    desc: "จัดการบัญชีผู้ใช้และการยืนยันตัวตน",
    items: [
      { href: "/users",      label: "ผู้ใช้งาน",  icon: "👥", desc: "รายชื่อผู้ใช้ทั้งหมด (WeeeU/WeeeR/WeeeT)" },
      { href: "/kyc",        label: "ตรวจ KYC",   icon: "🪪", desc: "อนุมัติเอกสารยืนยันตัวตน WeeeR" },
    ],
  },
  {
    label: "การเงิน",
    desc: "อนุมัติเติม/ถอน และตรวจสลิป",
    items: [
      { href: "/topup",                 label: "อนุมัติเติม Point", icon: "💳", desc: "อนุมัติคำขอเติม Point" },
      { href: "/withdrawal",            label: "อนุมัติถอนเงิน",    icon: "🏦", desc: "อนุมัติคำขอถอนเงินออกจากระบบ" },
      { href: "/transfers/deposits",    label: "ตรวจสลิปโอนเงิน",  icon: "🧾", desc: "ตรวจสลิปโอนเงินเข้า (Manual)" },
      { href: "/transfers/withdrawals", label: "คำขอถอนเงิน",       icon: "💸", desc: "รายการคำขอถอนเงินรอดำเนินการ" },
      { href: "/disputes",              label: "ข้อพิพาท",           icon: "⚖️", desc: "ข้อพิพาทอะไหล่ (Parts)" },
    ],
  },
  {
    label: "แพลตฟอร์ม",
    desc: "ดุลพอยต์ระดับแพลตฟอร์มและการกระทบยอด",
    items: [
      { href: "/platform/balances",       label: "ยอดคงเหลือแพลตฟอร์ม", icon: "⚖️", desc: "ยอด Gold/Silver/Escrow ของแพลตฟอร์ม" },
      { href: "/platform/gold-management", label: "จัดการ Gold",         icon: "🥇", desc: "Reserve pool และ fee pools (Gold)" },
      { href: "/platform/silver",          label: "จัดการ Silver",       icon: "🥈", desc: "Silver Point: trigger/หมดอายุ/ประวัติ" },
      { href: "/platform/transactions",    label: "บันทึกตรวจสอบ",       icon: "📋", desc: "Audit trail ธุรกรรมพอยต์ทั้งหมด" },
      { href: "/platform/reconciliation",  label: "กระทบยอด Point",      icon: "🔍", desc: "ตรวจดุลพอยต์ทอง (Total Minted)" },
      { href: "/reconciliation",           label: "กระทบยอด Settlement", icon: "⚙️", desc: "ตรวจสอบ settlement worker" },
    ],
  },
  {
    label: "พอยต์",
    desc: "บัญชีพอยต์และโปรโมชัน",
    items: [
      { href: "/points",               label: "บัญชี Point",   icon: "💰", desc: "Ledger รายการเดิน Point" },
      { href: "/points/manual-adjust", label: "ปรับยอดด้วยมือ", icon: "✏️", desc: "Super Admin: ปรับ Gold พร้อม audit log" },
      { href: "/promotions",           label: "โปรโมชัน",        icon: "🎁", desc: "ตั้งค่าโบนัสสมัครและโปรโมชัน" },
    ],
  },
  {
    label: "ซ่อม",
    desc: "งานซ่อม 4 รูปแบบ + ข้อพิพาท",
    items: [
      { href: "/repair/jobs",                    label: "งานซ่อม",        icon: "🔧", desc: "รายการงานซ่อมทั้งหมด" },
      { href: "/repair/analytics",               label: "สถิติการซ่อม",    icon: "📊", desc: "สถิติงานซ่อมหน้าร้าน" },
      { href: "/repair/disputes",                label: "ข้อพิพาท",        icon: "⚖️", desc: "ข้อพิพาทงานซ่อม (C9)" },
      { href: "/repair/walk-in/queue",           label: "คิวหน้าร้าน",     icon: "🚶", desc: "คิวงานซ่อมแบบเดินเข้าร้าน" },
      { href: "/repair/walk-in/abandoned",       label: "เครื่องตกค้าง",   icon: "📦", desc: "เครื่องที่ลูกค้าไม่มารับ" },
      { href: "/repair/pickup/queue",            label: "คิวรับ-ส่ง",      icon: "🚛", desc: "คิวงานรับ-ส่งถึงบ้าน" },
      { href: "/repair/pickup/dispatch-monitor", label: "ติดตามขนส่ง",     icon: "📡", desc: "ติดตามคนขับแบบเรียลไทม์" },
      { href: "/repair/parcel/queue",            label: "คิวพัสดุ",        icon: "📬", desc: "คิวงานซ่อมแบบส่งพัสดุ" },
      { href: "/repair/parcel/disputes",         label: "ข้อพิพาทพัสดุ",   icon: "⚠️", desc: "ข้อพิพาทพัสดุเสียหาย/สูญหาย" },
    ],
  },
  {
    label: "บำรุงรักษา",
    desc: "งานบำรุงรักษาและงานประจำ",
    items: [
      { href: "/maintain/jobs",      label: "งานบำรุงรักษา", icon: "🧰", desc: "รายการงานบำรุงรักษา" },
      { href: "/maintain/recurring", label: "งานประจำ",       icon: "🔁", desc: "ตารางงานบำรุงรักษาแบบประจำ" },
      { href: "/maintain/analytics", label: "สถิติ",          icon: "📊", desc: "สถิติงานบำรุงรักษา" },
    ],
  },
  {
    label: "อะไหล่",
    desc: "คลังอะไหล่และความเคลื่อนไหว",
    items: [
      { href: "/parts",           label: "คลังอะไหล่",     icon: "🔩", desc: "รายการอะไหล่ในคลัง" },
      { href: "/parts/movements", label: "ความเคลื่อนไหว", icon: "📦", desc: "รับเข้า/เบิกออกอะไหล่" },
      { href: "/parts/analytics", label: "สถิติ",          icon: "📊", desc: "สถิติการใช้อะไหล่" },
    ],
  },
  {
    label: "ขายต่อ",
    desc: "ประกาศขายต่อ ข้อเสนอ และข้อพิพาท",
    items: [
      { href: "/resell/listings",  label: "รายการขาย", icon: "🛍️", desc: "ประกาศขายต่อทั้งหมด" },
      { href: "/resell/offers",    label: "ข้อเสนอ",    icon: "🤝", desc: "ข้อเสนอซื้อจากผู้ซื้อ" },
      { href: "/resell/disputes",  label: "ข้อพิพาท",   icon: "⚖️", desc: "ข้อพิพาทการขายต่อ" },
      { href: "/resell/analytics", label: "สถิติ",      icon: "📊", desc: "สถิติการขายต่อ" },
    ],
  },
  {
    label: "รับซาก",
    desc: "รับซาก E-Waste และใบรับรอง",
    items: [
      { href: "/scrap/listings",     label: "รายการซาก", icon: "♻️", desc: "ประกาศรับซากทั้งหมด" },
      { href: "/scrap/jobs",         label: "งานรับซาก", icon: "🔨", desc: "งานรับซากจาก WeeeR" },
      { href: "/scrap/disputes",     label: "ข้อพิพาท",   icon: "⚖️", desc: "ข้อพิพาทการรับซาก (S11)" },
      { href: "/scrap/certificates", label: "ใบรับรอง",   icon: "📜", desc: "ใบรับรองการกำจัด E-Waste" },
    ],
  },
  {
    label: "รายการรวม",
    desc: "ข้อมูลรวมงานบริการและประกาศ",
    items: [
      { href: "/services", label: "งานบริการ", icon: "🔧", desc: "งานบริการทุกประเภทรวม" },
      { href: "/listings", label: "ประกาศขาย", icon: "🛍️", desc: "ประกาศขายรวมทุกโมดูล" },
      { href: "/audit",    label: "บันทึกระบบ", icon: "📋", desc: "Audit log การกระทำของแอดมิน" },
    ],
  },
  {
    label: "จัดการเนื้อหา",
    desc: "เนื้อหาเว็บไซต์ บทความ และโฆษณา",
    items: [
      { href: "/content",                label: "จัดการเนื้อหา",      icon: "📝", desc: "เนื้อหาหน้าเว็บไซต์สาธารณะ" },
      { href: "/testimonials",           label: "รีวิวลูกค้า",        icon: "⭐", desc: "จัดการรีวิว/คำชมจากลูกค้า" },
      { href: "/articles",               label: "บทความ (AI Assist)", icon: "✍️", desc: "เขียนบทความด้วยตัวช่วย AI" },
      { href: "/products",               label: "จัดการสินค้า (C10)", icon: "📦", desc: "สินค้าโชว์เคสบนเว็บไซต์" },
      { href: "/ads",                    label: "โฆษณา (C12)",        icon: "📢", desc: "จัดการแบนเนอร์โฆษณา" },
      { href: "/notifications/download", label: "แจ้งเตือนดาวน์โหลด",  icon: "📲", desc: "แบนเนอร์ชวนดาวน์โหลดแอป" },
    ],
  },
  {
    label: "ติดต่อ",
    desc: "กล่องข้อความและข้อมูลติดต่อ",
    items: [
      { href: "/contact",      label: "กล่องข้อความ", icon: "📨", desc: "ข้อความจากผู้ใช้/ลูกค้า" },
      { href: "/contact/info", label: "ข้อมูลติดต่อ",  icon: "📇", desc: "ตั้งค่าข้อมูลติดต่อบริษัท" },
    ],
  },
  {
    label: "ระบบ",
    desc: "ตั้งค่าระบบและข้อมูลอ้างอิง",
    items: [
      { href: "/pricing",        label: "ราคารับซื้อ",    icon: "💲", desc: "ตารางราคารับซื้อซาก" },
      { href: "/reference",      label: "ข้อมูลอ้างอิง",   icon: "📚", desc: "Master data / reference" },
      { href: "/system/storage", label: "พื้นที่จัดเก็บ",  icon: "💾", desc: "การใช้พื้นที่ไฟล์/รูปภาพ" },
      { href: "/config",         label: "ตั้งค่าระบบ",     icon: "⚙️", desc: "ตั้งค่าทั่วไป (Bad Record Policy)" },
    ],
  },
];

const STORAGE_KEY = "admin-sidebar-collapsed"; // RC5 — จำสถานะกลุ่มที่ย่อไว้

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // RC5 — เซ็ตของ group label ที่ถูกย่อ (collapsed)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // โหลดสถานะที่จำไว้จาก localStorage (ครั้งแรกหลัง mount)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function logout() {
    removeToken();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  // กลุ่มที่มี route ปัจจุบันอยู่ข้างใน → เปิดเสมอ (แม้จะเคยย่อไว้)
  function groupHasActive(group: NavGroup) {
    return group.items.some((i) => isActive(i.href));
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
        <Image src="/admin-logo.png" alt="App3R Admin" width={32} height={32}
          className="rounded-lg" onError={() => {}} />
        <div>
          <span className="text-sm font-bold text-admin-text">App3R Admin</span>
          <p className="text-xs text-gray-500">แดชบอร์ดผู้ดูแลระบบ</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
        {navGroups.map((group, gi) => {
          const hasLabel = !!group.label;
          // ก่อน hydrate → เปิดทุกกลุ่ม (กัน mismatch) · มี active → เปิดเสมอ
          const isCollapsed =
            hydrated && hasLabel && collapsed.has(group.label as string) && !groupHasActive(group);

          return (
            <div key={gi}>
              {hasLabel && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label as string)}
                  title={group.desc}
                  className="w-full flex items-center justify-between px-3 mb-1 py-1 rounded-md text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-50 hover:text-gray-600 transition-colors"
                >
                  <span className="truncate">{group.label}</span>
                  <span className={`text-[10px] transition-transform ${isCollapsed ? "" : "rotate-90"}`}>▶</span>
                </button>
              )}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.desc}
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
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={logout}
          title="ออกจากระบบและกลับหน้าเข้าสู่ระบบ"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span> ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
