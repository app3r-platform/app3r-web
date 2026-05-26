import type { Metadata, Viewport } from "next";
import "./globals.css";
import DevNav, { type DevNavLink } from "@/components/DevNav";

export const metadata: Metadata = {
  title: {
    default: "WeeeU — แอปสำหรับประชาชน",
    template: "%s | WeeeU",
  },
  description: "WeeeU — จัดการเครื่องใช้ไฟฟ้า ซ่อม ขาย ฝาก ครบในที่เดียว",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/WeeeU.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1D4ED8",
};

// ── Dev Navigator link map v2 (Advisor Gen 94 — Gap Fill ครบ 6 โมดูล) ─────────
const devNavLinks: DevNavLink[] = [
  // ── Repair (WeeeU ลูกค้า) ────────────────────────────────────────────────────
  { label: "→ ดูประกาศที่สร้าง",              href: "/repair/c001",                              type: "next-step", forPath: "/repair/new" },
  { label: "→ ดูข้อเสนอจากร้าน",              href: "/repair/c001/offers",                       type: "next-step", forPath: "/repair/c001" },
  { label: "→ [A] เลือกข้อเสนอ (1 ร้าน)",     href: "/repair/c001/progress",                     type: "branch",    forPath: "/repair/c001/offers" },
  { label: "→ [B] เทียบหลายข้อเสนอ (R-05)",   href: "/repair/c001/offers?compare=1",             type: "branch",    forPath: "/repair/c001/offers" },
  { label: "→ [C] ยกเลิกประกาศ (R-04)",        href: "/repair",                                   type: "branch",    forPath: "/repair/c001/offers" },
  { label: "🔗 WeeeR ดูงาน",                  href: "http://localhost:3001/repair/jobs/c001",     type: "cross-app", forPath: "/repair/c001/progress" },
  { label: "🔗 WeeeT ดูงานช่าง",              href: "http://localhost:3003/jobs/c001",            type: "cross-app", forPath: "/repair/c001/progress" },
  { label: "→ [เสนอซื้อซาก-C4] ดูข้อเสนอซาก", href: "/repair/c001/scrap-offer",                  type: "branch",    forPath: "/repair/c001/progress" },
  { label: "→ [A] ตกลงขายซาก",               href: "/scrap/new",                                type: "branch",    forPath: "/repair/c001/scrap-offer" },
  { label: "→ [B] ปฏิเสธ → Fee Settle (C5)",  href: "/repair/c001/fee-settle",                   type: "branch",    forPath: "/repair/c001/scrap-offer" },
  { label: "→ ดูใบรับประกัน",                 href: "/repair",                                   type: "next-step", forPath: "/repair/c001/review" },

  // ── Maintain ─────────────────────────────────────────────────────────────────
  { label: "→ ยืนยันการจอง",                  href: "/maintain/book/confirm",                    type: "next-step", forPath: "/maintain/book" },
  { label: "→ [A] ยืนยัน",                   href: "/maintain/jobs",                            type: "branch",    forPath: "/maintain/book/confirm" },
  { label: "→ [B] ยกเลิก",                   href: "/maintain/book",                            type: "branch",    forPath: "/maintain/book/confirm" },
  { label: "→ ดูรายละเอียดงาน",               href: "/maintain/jobs/m001",                       type: "next-step", forPath: "/maintain/jobs" },
  { label: "🔗 WeeeR ดูงาน",                  href: "http://localhost:3001/maintain/jobs/m001",   type: "cross-app", forPath: "/maintain/jobs/m001" },
  { label: "🔗 WeeeT ดูงาน",                  href: "http://localhost:3003/jobs/m001",            type: "cross-app", forPath: "/maintain/jobs/m001" },
  { label: "→ [เลื่อนนัด-M3]",                href: "/maintain/jobs/m001/reschedule",             type: "branch",    forPath: "/maintain/jobs/m001" },
  { label: "→ [ยุติงานกลางคัน-M9]",            href: "/maintain/jobs/m001/cancel",                type: "branch",    forPath: "/maintain/jobs/m001" },
  { label: "→ [A] อนุมัติค่าใช้จ่ายเพิ่ม-M4", href: "/maintain/jobs/m001",                       type: "branch",    forPath: "/maintain/jobs/m001/extra-cost" },
  { label: "→ [B] ปฏิเสธ → ยุติ",             href: "/maintain/jobs/m001/cancel",                type: "branch",    forPath: "/maintain/jobs/m001/extra-cost" },
  { label: "→ [A] ให้คะแนน",                  href: "/maintain/jobs",                            type: "branch",    forPath: "/maintain/jobs/m001/review" },
  { label: "→ [B] ข้ามการให้คะแนน",            href: "/maintain/jobs",                            type: "branch",    forPath: "/maintain/jobs/m001/review" },

  // ── Resell — ผู้ขาย (WeeeU seller) ──────────────────────────────────────────
  { label: "→ ดูประกาศที่สร้าง",              href: "/listings/r001",                            type: "next-step", forPath: "/sell/new" },
  { label: "→ ดูข้อเสนอที่ได้รับ",             href: "/listings/r001/offers",                     type: "next-step", forPath: "/listings/r001" },
  { label: "→ [A] ยืนยันข้อเสนอ",             href: "/listings/r001/confirm",                    type: "branch",    forPath: "/listings/r001/offers" },
  { label: "→ [B] ปฏิเสธทุกข้อเสนอ",           href: "/listings/r001",                            type: "branch",    forPath: "/listings/r001/offers" },
  { label: "🔗 WeeeR ดูสถานะ",                href: "http://localhost:3001/resell/purchases/r001", type: "cross-app", forPath: "/listings/r001/confirm" },
  { label: "→ [A] ส่งมอบแล้ว (R7)",           href: "/listings/r001/complete",                   type: "branch",    forPath: "/listings/r001/confirm" },
  { label: "→ [B] seller ถอนการเลือก-R5",      href: "/listings/r001/offers",                     type: "branch",    forPath: "/listings/r001/confirm" },
  { label: "→ [C] ยกเลิกร่วมกัน-R12",          href: "/listings",                                 type: "branch",    forPath: "/listings/r001/confirm" },
  { label: "→ ดูประวัติ",                      href: "/listings",                                 type: "next-step", forPath: "/listings/r001/complete" },

  // ── Resell — ผู้ซื้อ C2C (Pair 3: WeeeU buyer) ───────────────────────────────
  { label: "→ ดูสินค้ามือสอง (C2C)",           href: "/marketplace/r001",                         type: "next-step", forPath: "/marketplace" },
  { label: "→ [ยื่นข้อเสนอซื้อ-Pair3]",        href: "/marketplace/r001/offer",                   type: "branch",    forPath: "/marketplace/r001" },
  { label: "🔗 WeeeU ผู้ขาย ดูข้อเสนอ",        href: "http://localhost:3002/listings/r001/offers", type: "cross-app", forPath: "/marketplace/r001/offer" },
  { label: "→ [รับของ + ตรวจ-R1]",             href: "/purchases/r001/inspect",                   type: "branch",    forPath: "/purchases/r001" },
  { label: "→ [A] ตรงปก ยืนยันรับ",            href: "/purchases/r001/complete",                  type: "branch",    forPath: "/purchases/r001/inspect" },
  { label: "→ [B] ไม่ตรงปก dispute-R8",         href: "/purchases/r001/dispute",                   type: "branch",    forPath: "/purchases/r001/inspect" },

  // ── Scrap (เจ้าของซาก) ───────────────────────────────────────────────────────
  { label: "→ ดูประกาศที่สร้าง",              href: "/scrap/s001",                               type: "next-step", forPath: "/scrap/new" },
  { label: "→ ดูข้อเสนอรับซาก",               href: "/scrap/s001/offers",                        type: "next-step", forPath: "/scrap/s001" },
  { label: "→ [A] เลือกขาย (มีราคา)",          href: "/scrap/s001/confirm",                       type: "branch",    forPath: "/scrap/s001/offers" },
  { label: "→ [B] เลือกทิ้งฟรี",              href: "/scrap/s001/confirm",                       type: "branch",    forPath: "/scrap/s001/offers" },
  { label: "→ [C] ไม่เลือกใคร-S5/S6",         href: "/scrap",                                    type: "branch",    forPath: "/scrap/s001/offers" },
  { label: "🔗 WeeeR ดูสถานะ",                href: "http://localhost:3001/scrap/jobs/s001",      type: "cross-app", forPath: "/scrap/s001/confirm" },
  { label: "→ [ยกเลิกหลัง T รับซาก-S10]",     href: "/scrap",                                    type: "branch",    forPath: "/scrap/s001" },
  { label: "→ ดู E-Waste Certificate",        href: "/scrap/s001/certificate",                   type: "next-step", forPath: "/scrap/s001/complete" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="antialiased bg-gray-50">
        {children}
        {process.env.NEXT_PUBLIC_DEV_NAV === "true" && (
          <DevNav links={devNavLinks} />
        )}
      </body>
    </html>
  );
}