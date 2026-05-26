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

// ── Dev Navigator link map ────────────────────────────────────────────────────
const devNavLinks: DevNavLink[] = [
  // ── Repair ──────────────────────────────────────────────────────────────────
  { label: "→ [A] เลือกข้อเสนอ",       href: "/repair/job-001/progress",              type: "branch",    forPath: "/repair/job-001/offers" },
  { label: "→ [B] ไม่เลือก",           href: "/repair/job-001/suspend",               type: "branch",    forPath: "/repair/job-001/offers" },
  { label: "🔗 WeeeR ดูความคืบหน้า",   href: "http://localhost:3001/repair/jobs",      type: "cross-app", forPath: "/repair/job-001/progress" },

  // ── Maintain ─────────────────────────────────────────────────────────────────
  { label: "→ ยืนยันการจอง",            href: "/maintain/book/confirm",                type: "next-step", forPath: "/maintain/book" },
  { label: "→ [A] ยืนยัน",             href: "/maintain/jobs",                        type: "branch",    forPath: "/maintain/book/confirm" },
  { label: "→ [B] ยกเลิก",             href: "/maintain/book",                        type: "branch",    forPath: "/maintain/book/confirm" },
  { label: "→ ดูรายละเอียดงาน",         href: "/maintain/jobs/m001",                   type: "next-step", forPath: "/maintain/jobs" },
  { label: "🔗 WeeeR ดูงาน",            href: "http://localhost:3001/maintain/jobs/m001", type: "cross-app", forPath: "/maintain/jobs/m001" },
  { label: "🔗 WeeeT ดูงาน",            href: "http://localhost:3003/jobs/m001",        type: "cross-app", forPath: "/maintain/jobs/m001" },
  { label: "→ [A] ให้คะแนน",           href: "/maintain/jobs",                        type: "branch",    forPath: "/maintain/jobs/m001/review" },
  { label: "→ [B] ข้ามการให้คะแนน",    href: "/maintain/jobs",                        type: "branch",    forPath: "/maintain/jobs/m001/review" },

  // ── Resell (ผู้ขาย) ──────────────────────────────────────────────────────────
  { label: "→ ดูประกาศที่สร้าง",        href: "/listings/r001",                        type: "next-step", forPath: "/sell/new" },
  { label: "→ ดูข้อเสนอที่ได้รับ",      href: "/listings/r001/offers",                 type: "next-step", forPath: "/listings/r001" },
  { label: "→ [A] ยืนยันข้อเสนอ",      href: "/listings/r001/confirm",                type: "branch",    forPath: "/listings/r001/offers" },
  { label: "→ [B] ปฏิเสธทุกข้อเสนอ",   href: "/listings/r001",                        type: "branch",    forPath: "/listings/r001/offers" },
  { label: "🔗 WeeeR ดูสถานะ",          href: "http://localhost:3001/resell/purchases/r001", type: "cross-app", forPath: "/listings/r001/confirm" },
  { label: "→ [ส่งมอบแล้ว]",           href: "/listings/r001/complete",               type: "branch",    forPath: "/listings/r001/confirm" },
  { label: "→ ดูประวัติ",              href: "/listings",                             type: "next-step", forPath: "/listings/r001/complete" },

  // ── Scrap (เจ้าของซาก) ───────────────────────────────────────────────────────
  { label: "→ ดูประกาศที่สร้าง",        href: "/scrap/s001",                           type: "next-step", forPath: "/scrap/new" },
  { label: "→ ดูข้อเสนอรับซาก",         href: "/scrap/s001/offers",                    type: "next-step", forPath: "/scrap/s001" },
  { label: "→ [A] เลือกขาย (มีราคา)",   href: "/scrap/s001/confirm",                   type: "branch",    forPath: "/scrap/s001/offers" },
  { label: "→ [B] เลือกทิ้งฟรี",        href: "/scrap/s001/confirm",                   type: "branch",    forPath: "/scrap/s001/offers" },
  { label: "→ [C] ไม่เลือกใคร",         href: "/scrap/s001",                           type: "branch",    forPath: "/scrap/s001/offers" },
  { label: "🔗 WeeeR ดูสถานะ",          href: "http://localhost:3001/scrap/jobs/s001",  type: "cross-app", forPath: "/scrap/s001/confirm" },
  { label: "→ ดู E-Waste Certificate",  href: "/scrap/s001/certificate",               type: "next-step", forPath: "/scrap/s001/complete" },
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