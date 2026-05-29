import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import DevNav, { type DevNavLink } from "@/components/DevNav";
import { ScreenBadge } from "@/components/ScreenBadge";

export const metadata: Metadata = {
  title: "WeeeT — แอปช่าง",
  description: "WeeeT — แอปสำหรับช่างในร้านซ่อม | App3R Platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/WeeeT.png",
    apple: "/logo/WeeeT.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1c0a00",
};

// ── Dev Navigator link map v2 (Advisor Gen 94 — Gap Fill ครบ 6 โมดูล) ─────────
const devNavLinks: DevNavLink[] = [
  // ── Repair (WeeeT ช่าง) ──────────────────────────────────────────────────────
  { label: "→ ดูงานซ่อม",                     href: "/jobs/c001",                                type: "next-step", forPath: "/jobs" },
  { label: "→ [รับงาน + GPS]",                href: "/jobs/c001/diagnose",                       type: "branch",    forPath: "/jobs/c001" },
  { label: "→ [ปฏิเสธรับซ่อม-C6]",            href: "/jobs",                                     type: "branch",    forPath: "/jobs/c001" },
  { label: "→ [ซ่อมได้ จบหน้างาน-C1]",        href: "/jobs/c001/repair",                         type: "branch",    forPath: "/jobs/c001/diagnose" },
  { label: "→ [ต้องยกเครื่อง-C2]",            href: "/jobs/c001/pickup",                         type: "branch",    forPath: "/jobs/c001/diagnose" },
  { label: "→ [รออะไหล่ นัดใหม่-C3]",         href: "/jobs/c001/schedule",                       type: "branch",    forPath: "/jobs/c001/diagnose" },
  { label: "→ [เสนอซื้อซาก-C4]",              href: "/jobs/c001/scrap-offer",                    type: "branch",    forPath: "/jobs/c001/diagnose" },
  { label: "🔗 WeeeR ดูผลวินิจฉัย",           href: "http://localhost:3001/repair/jobs/c001",    type: "cross-app", forPath: "/jobs/c001/diagnose" },
  { label: "→ [ส่งมอบ + OTP ✅]",             href: "/jobs/c001/repair/success",                 type: "branch",    forPath: "/jobs/c001/repair" },
  { label: "→ กลับหน้างาน",                   href: "/jobs",                                     type: "next-step", forPath: "/jobs/c001/repair/success" },
  { label: "🔗 WeeeU ดูผลสุดท้าย",            href: "http://localhost:3002/repair/c001/review",  type: "cross-app", forPath: "/jobs/c001/complete" },

  // ── Maintain (WeeeT ช่าง) ─────────────────────────────────────────────────────
  { label: "→ ดูงานบำรุงรักษา",               href: "/jobs/m001",                                type: "next-step", forPath: "/jobs" },
  { label: "→ [รับงาน]",                      href: "/jobs/m001/inspect",                        type: "branch",    forPath: "/jobs/m001" },
  { label: "→ [ไม่รับงาน-M7]",               href: "/jobs",                                     type: "branch",    forPath: "/jobs/m001" },
  { label: "→ [บำรุงรักษาเสร็จ]",             href: "/jobs/m001/complete",                       type: "branch",    forPath: "/jobs/m001/inspect" },
  { label: "→ [พบปัญหาเพิ่ม-M4]",             href: "/jobs/m001/issue",                          type: "branch",    forPath: "/jobs/m001/inspect" },
  { label: "🔗 [M5] WeeeU แจ้งซ่อมใหม่",     href: "http://localhost:3002/repair/new?from=maintain-m001", type: "cross-app", forPath: "/jobs/m001/inspect" },
  { label: "🔗 WeeeU อนุมัติค่าใช้จ่าย-M4",  href: "http://localhost:3002/maintain/jobs/m001/extra-cost", type: "cross-app", forPath: "/jobs/m001/issue" },
  { label: "🔗 WeeeU ดูผล",                   href: "http://localhost:3002/maintain/jobs/m001/review",     type: "cross-app", forPath: "/jobs/m001/complete" },

  // ── Scrap (WeeeT ช่าง รับซาก) ────────────────────────────────────────────────
  { label: "→ ดูงาน Scrap",                   href: "/jobs/s001",                                type: "next-step", forPath: "/jobs" },
  { label: "→ [รับงาน + GPS]",                href: "/jobs/s001/pickup",                         type: "branch",    forPath: "/jobs/s001" },
  { label: "→ [ถึงหน้างาน-S6]",              href: "/jobs/s001/inspect",                        type: "branch",    forPath: "/jobs/s001/pickup" },
  { label: "→ [ลูกค้าไม่อยู่ No-show-S9]",    href: "/jobs/s001",                                type: "branch",    forPath: "/jobs/s001/pickup" },
  { label: "→ [ของไม่ตรงประกาศ-S8]",          href: "/jobs/s001/mismatch",                       type: "branch",    forPath: "/jobs/s001/inspect" },
  { label: "→ [รับซากเสร็จ]",                 href: "/jobs/s001/complete",                       type: "branch",    forPath: "/jobs/s001/inspect" },
  { label: "🔗 WeeeR ยืนยัน",                href: "http://localhost:3001/scrap/jobs/s001",      type: "cross-app", forPath: "/jobs/s001/complete" },
  { label: "🔗 WeeeU ดูใบรับรอง",            href: "http://localhost:3002/scrap/s001/certificate", type: "cross-app", forPath: "/jobs/s001/complete" },

  // ── Service Listing (W-Round-1 Wave 2 · listing_meta + D83 + Escrow) ──────────
  { label: "→ ประกาศบริการของฉัน",           href: "/listings",                                 type: "next-step", forPath: "/jobs" },
  { label: "→ [งานจับคู่แล้ว-matched]",       href: "/listings/demo-svc-001",                    type: "branch",    forPath: "/listings" },
  { label: "→ [งานเสร็จแล้ว-completed]",      href: "/listings/demo-svc-003",                    type: "branch",    forPath: "/listings" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-950 text-white antialiased">
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen relative">
            {children}
          </div>
        </AuthProvider>
        {process.env.NEXT_PUBLIC_DEV_NAV === "true" && (
          <DevNav links={devNavLinks} />
        )}
        <ScreenBadge />
      </body>
    </html>
  );
}
