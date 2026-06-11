import Image from "next/image";
import Link from "next/link";
import Footer from "../../components/Footer";
import DevNav, { type DevNavLink } from "../../components/DevNav";
import { ScreenBadge } from "../../components/ScreenBadge";
import SidebarNav from "../../components/SidebarNav";
import WalletDisplay from "../../components/WalletDisplay";
import AuthUserInfo from "../../components/AuthUserInfo";
import LogoutButton from "../../components/LogoutButton";

// ── Dev Navigator link map ────────────────────────────────────────────────────
// Phase 3 Sign-off: ครอบคลุม Repair / Maintain / Resell / Scrap / Parts
// ── Dev Navigator link map v2 (Advisor Gen 94 — Gap Fill ครบ 6 โมดูล) ─────────
const devNavLinks: DevNavLink[] = [
  // ── Repair — WeeeR ผู้รับงานซ่อม ─────────────────────────────────────────────
  { label: "→ ดูรายละเอียดประกาศ",             href: "/repair/announcements/c001",                type: "next-step", forPath: "/repair/announcements" },
  { label: "→ [ยื่นข้อเสนอ]",                  href: "/repair/announcements/c001/offer",           type: "branch",    forPath: "/repair/announcements/c001" },
  { label: "→ [C7-success] ส่งข้อเสนอสำเร็จ", href: "/repair/announcements/c001/offer/success",   type: "next-step", forPath: "/repair/announcements/c001/offer" },
  { label: "→ ดูประกาศทั้งหมด",               href: "/repair/announcements",                       type: "next-step", forPath: "/repair/announcements/c001/offer/success" },
  { label: "→ คิว walk-in (R-01 ลูกค้ามาเอง)", href: "/repair/walk-in/c001",                      type: "next-step", forPath: "/repair/walk-in/queue" },
  { label: "→ คิวพัสดุ (R-03 parcel)",         href: "/repair/parcel/c001",                       type: "next-step", forPath: "/repair/parcel/queue" },
  { label: "→ ดูรายละเอียดงานซ่อม",            href: "/repair/jobs/c001",                         type: "next-step", forPath: "/repair/jobs" },
  { label: "→ [มอบหมายช่าง]",                  href: "/repair/jobs/c001/assign",                  type: "branch",    forPath: "/repair/jobs/c001" },
  { label: "→ [ถอนงานหลังยืนยัน-C10]",         href: "/repair/jobs",                              type: "branch",    forPath: "/repair/jobs/c001" },
  { label: "🔗 WeeeT รับงาน",                  href: "http://localhost:3003/jobs/c001",            type: "cross-app", forPath: "/repair/jobs/c001/assign" },
  { label: "🔗 WeeeU ดูสถานะ",                 href: "http://localhost:3002/repair/c001/progress", type: "cross-app", forPath: "/repair/jobs/c001" },

  // ── Maintain ─────────────────────────────────────────────────────────────────
  { label: "→ ดูรายละเอียด",                   href: "/maintain/jobs/m001",                       type: "next-step", forPath: "/maintain/jobs" },
  { label: "→ [ยืนยันรับงาน]",                 href: "/maintain/jobs/m001/assign",                type: "branch",    forPath: "/maintain/jobs/m001" },
  { label: "→ [ปฏิเสธ]",                       href: "/maintain/jobs",                            type: "branch",    forPath: "/maintain/jobs/m001" },
  { label: "→ [ถอนงานหลังยืนยัน-M6]",          href: "/maintain/jobs",                            type: "branch",    forPath: "/maintain/jobs/m001" },
  { label: "🔗 WeeeU ดูสถานะ",                 href: "http://localhost:3002/maintain/jobs/m001",   type: "cross-app", forPath: "/maintain/jobs/m001" },
  { label: "→ มอบหมายช่าง",                    href: "/maintain/jobs/m001/assign",                 type: "next-step", forPath: "/maintain/jobs/m001/assign" },
  { label: "→ [C8-success] รับงาน Maintain",   href: "/maintain/queue/m001/offer/success",         type: "next-step", forPath: "/maintain/queue/m001/offer" },
  { label: "→ ดูคิวงาน",                       href: "/maintain/queue",                            type: "next-step", forPath: "/maintain/queue/m001/offer/success" },

  // ── Resell — WeeeR ผู้ขาย (Seller) ──────────────────────────────────────────
  { label: "[C10-success] ลงประกาศ Resell",     href: "/resell/listings/new/success",              type: "next-step", forPath: "/resell/listings/new" },
  { label: "→ ดูประกาศของฉัน",                  href: "/resell/listings",                          type: "next-step", forPath: "/resell/listings/new/success" },
  { label: "→ ดูรายละเอียด listing ของฉัน",    href: "/resell/listings/r001",                     type: "next-step", forPath: "/resell/listings" },
  { label: "🔗 WeeeU ดูรายการ (ผู้ซื้อ)",      href: "http://localhost:3002/listings/r001",        type: "cross-app", forPath: "/resell/listings/r001" },

  // ── Resell — WeeeR ผู้ซื้อ Flow A: B6 รับซื้อจากลูกค้า ──────────────────────
  { label: "→ [B6] เริ่ม wizard รับซื้อ",      href: "/resell/buy/wizard",                        type: "next-step", forPath: "/resell/buy" },

  // ── Resell — WeeeR ผู้ซื้อ Flow B: Marketplace ───────────────────────────────
  { label: "→ ดูรายละเอียด listing",           href: "/resell/marketplace/r001",                  type: "next-step", forPath: "/resell/marketplace" },
  { label: "→ [ยื่นข้อเสนอ]",                  href: "/resell/marketplace/r001/offer",             type: "branch",    forPath: "/resell/marketplace/r001" },
  { label: "🔗 WeeeU ดูข้อเสนอ",               href: "http://localhost:3002/listings/r001/offers", type: "cross-app", forPath: "/resell/marketplace/r001/offer" },
  { label: "→ ดูรายละเอียด order",             href: "/resell/purchases/r001",                    type: "next-step", forPath: "/resell/purchases" },
  { label: "→ [รับของ + ตรวจ]",                href: "/resell/purchases/r001/inspect",             type: "branch",    forPath: "/resell/purchases/r001" },
  { label: "→ [A] ยืนยันรับ (ตรงปก)",          href: "/resell/purchases",                         type: "branch",    forPath: "/resell/purchases/r001/inspect" },
  { label: "→ [B] ไม่ตรงปก dispute-R8",         href: "/resell/purchases/r001/dispute",            type: "branch",    forPath: "/resell/purchases/r001/inspect" },

  // ── Scrap (WeeeR — ผู้รับซาก) ────────────────────────────────────────────────
  { label: "→ ดูรายละเอียด",                   href: "/scrap/announcements/s001",                 type: "next-step", forPath: "/scrap/announcements" },
  { label: "→ [ยื่นข้อเสนอรับซื้อ]",            href: "/scrap/announcements/s001/offer",            type: "branch",    forPath: "/scrap/announcements/s001" },
  { label: "→ [รับทิ้งฟรี]",                   href: "/scrap/announcements/s001/offer",            type: "branch",    forPath: "/scrap/announcements/s001" },
  { label: "🔗 WeeeU ดูข้อเสนอ",               href: "http://localhost:3002/scrap/s001/offers",    type: "cross-app", forPath: "/scrap/announcements/s001/offer" },
  { label: "→ [decision: ขายเป็นซาก-S1]",      href: "/scrap/jobs/s001/resell-as-scrap",          type: "branch",    forPath: "/scrap/jobs/s001" },
  { label: "→ [decision: แยกอะไหล่-S2]",       href: "/scrap/jobs/s001/resell-parts",             type: "branch",    forPath: "/scrap/jobs/s001" },
  { label: "→ [decision: ซ่อมขาย-S3]",         href: "/scrap/jobs/s001/repair-and-sell",          type: "branch",    forPath: "/scrap/jobs/s001" },
  { label: "→ [decision: ทิ้ง+Cert-S4]",       href: "/scrap/jobs/s001/dispose",                  type: "branch",    forPath: "/scrap/jobs/s001" },
  { label: "→ [ถอนหลังยืนยัน-S7]",             href: "/scrap/jobs",                               type: "branch",    forPath: "/scrap/jobs/s001" },
  { label: "🔗 WeeeT รับงาน",                  href: "http://localhost:3003/jobs/s001",            type: "cross-app", forPath: "/scrap/jobs/s001" },

  // ── Parts — ผู้ขาย (ShopIdSwitcher: WeeeR seller) ────────────────────────────
  { label: "[C9-success] ลงขายอะไหล่สำเร็จ",   href: "/parts/new/success",                        type: "next-step", forPath: "/parts/new" },
  { label: "→ ดูรายการขายของฉัน",              href: "/parts/my-listings",                        type: "next-step", forPath: "/parts/new/success" },
  // Fix-Wave E: /parts/my-listings/new ไม่มีหน้า → repoint ไปหน้า create-listing จริง /parts/new (mockup มีอยู่)
  { label: "[ผู้ขาย] → สร้าง listing ใหม่",    href: "/parts/new",                                type: "next-step", forPath: "/parts/my-listings" },
  { label: "[ผู้ขาย] → ดู orders ที่เข้ามา",   href: "/parts/orders",                             type: "next-step", forPath: "/parts/my-listings/p001" },
  { label: "[ผู้ขาย] → ดูรายละเอียด order",    href: "/parts/orders/p001",                        type: "next-step", forPath: "/parts/orders" },
  { label: "[ผู้ขาย] → [ยืนยัน order]",        href: "/parts/orders",                             type: "branch",    forPath: "/parts/orders/p001" },
  { label: "[ผู้ขาย] → [ยกเลิก]",             href: "/parts/orders",                             type: "branch",    forPath: "/parts/orders/p001" },
  { label: "🔗 [ผู้ขาย] WeeeR ผู้ซื้อ ดู order", href: "http://localhost:3001/parts/my-orders/p001", type: "cross-app", forPath: "/parts/orders/p001" },

  // ── Parts — ผู้ซื้อ (ShopIdSwitcher: WeeeR buyer) ────────────────────────────
  { label: "[ผู้ซื้อ] → ดูรายละเอียดชิ้นส่วน",  href: "/parts/marketplace/p001",                  type: "next-step", forPath: "/parts/marketplace" },
  // Fix-Wave E: /parts/my-orders/new ไม่มีหน้า → repoint ไป /parts/requests/new (ฝั่งผู้ซื้อ B2B request · exists)
  { label: "[ผู้ซื้อ] → [สั่งซื้อ]",            href: "/parts/requests/new",                       type: "branch",    forPath: "/parts/marketplace/p001" },
  // Fix-Wave E: ลบ — SmartPicker (R-30b) ยังไม่ wire เป็นหน้า (ไม่อยู่ใน checklist 35 จอ)
  // { label: "[ผู้ซื้อ] → [ใช้ SmartPicker]",     href: "/parts/marketplace/p001/smart-pick",        type: "branch",    forPath: "/parts/marketplace/p001" },
  { label: "[ผู้ซื้อ] → ดูรายละเอียด order",    href: "/parts/my-orders/p001",                     type: "next-step", forPath: "/parts/my-orders" },
  { label: "[ผู้ซื้อ] → [รับของแล้ว]",          href: "/parts/my-orders",                          type: "branch",    forPath: "/parts/my-orders/p001" },
  { label: "[ผู้ซื้อ] → [ยกเลิก]",             href: "/parts/my-orders",                          type: "branch",    forPath: "/parts/my-orders/p001" },
  { label: "→ [แจ้งปัญหา dispute-P7]",          href: "http://localhost:3000/disputes",            type: "cross-app", forPath: "/parts/my-orders/p001" },
  { label: "🔗 [ผู้ซื้อ] WeeeR ผู้ขาย ดู order", href: "http://localhost:3001/parts/orders/p001",  type: "cross-app", forPath: "/parts/my-orders/p001" },
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

        {/* User info — Wave1: reads auth state from localStorage */}
        <div className="px-4 py-4 border-b border-gray-100">
          <AuthUserInfo />
        </div>

        {/* Nav — grouped collapsible (INSERT-1 · CMD #115-AJ-WR) */}
        <SidebarNav />

        {/* Logout — Wave1: clears auth + redirects to /login */}
        <div className="px-3 py-4 border-t border-gray-100">
          <LogoutButton />
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
          {/* Wave1: live wallet balance from api-client */}
          <WalletDisplay />
        </header>
        {/* Page */}
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">{children}</main>
        {/* Footer — Sub-4 D78 contact info */}
        <Footer />
      </div>

      {/* Dev Navigator — dev only */}
      {process.env.NEXT_PUBLIC_DEV_NAV === "true" && (
        <DevNav links={devNavLinks} />
      )}
      {/* Screen ID Badge — dev only */}
      <ScreenBadge />
    </div>
  );
}
