import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import DevNav, { type DevNavLink } from "@/components/DevNav";

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

// ── Dev Navigator link map ────────────────────────────────────────────────────
const devNavLinks: DevNavLink[] = [
  // ── Repair module ────────────────────────────────────────────────────────────
  // /jobs/job-001/diagnose
  { label: "🔗 WeeeR ดูผลวินิจฉัย", href: "http://localhost:3001/repair/walk-in/job-001/inspect", type: "cross-app", forPath: "/jobs/job-001/diagnose" },
  { label: "→ [ซ่อมได้]",           href: "/jobs/job-001/repair",                                 type: "branch",    forPath: "/jobs/job-001/diagnose" },
  { label: "→ [ปฏิเสธรับซ่อม]",     href: "/jobs/job-001/reject",                                 type: "branch",    forPath: "/jobs/job-001/diagnose" },
  // /jobs/job-001/complete
  { label: "🔗 WeeeU ดูผลสุดท้าย",  href: "http://localhost:3002/repair/job-001/review",           type: "cross-app", forPath: "/jobs/job-001/complete" },

  // ── Maintain module ──────────────────────────────────────────────────────────
  // /jobs
  { label: "→ ดูงานบำรุงรักษา",     href: "/jobs/m001",                                           type: "next-step", forPath: "/jobs" },
  // /jobs/m001
  { label: "→ [รับงาน]",            href: "/jobs/m001/inspect",                                   type: "branch",    forPath: "/jobs/m001" },
  { label: "→ [ไม่รับงาน - M7]",    href: "/jobs",                                                type: "branch",    forPath: "/jobs/m001" },
  // /jobs/m001/inspect
  { label: "→ [บำรุงรักษาเสร็จ]",   href: "/jobs/m001/complete",                                  type: "branch",    forPath: "/jobs/m001/inspect" },
  { label: "→ [พบปัญหาเพิ่ม]",      href: "/jobs/m001/issue",                                     type: "branch",    forPath: "/jobs/m001/inspect" },
  // /jobs/m001/complete
  { label: "🔗 WeeeU ดูผล",         href: "http://localhost:3002/maintain/jobs/m001/review",       type: "cross-app", forPath: "/jobs/m001/complete" },

  // ── Scrap module ─────────────────────────────────────────────────────────────
  // /jobs
  { label: "→ ดูงาน Scrap",         href: "/jobs/s001",                                           type: "next-step", forPath: "/jobs" },
  // /jobs/s001
  { label: "→ [รับงาน + GPS]",      href: "/jobs/s001/pickup",                                    type: "branch",    forPath: "/jobs/s001" },
  // /jobs/s001/pickup
  { label: "→ [ถึงหน้างาน - S6]",   href: "/jobs/s001/inspect",                                   type: "branch",    forPath: "/jobs/s001/pickup" },
  // /jobs/s001/inspect
  { label: "→ [รับซากเสร็จ]",       href: "/jobs/s001/complete",                                  type: "branch",    forPath: "/jobs/s001/inspect" },
  // /jobs/s001/complete
  { label: "🔗 WeeeR ยืนยัน",       href: "http://localhost:3001/scrap/jobs/s001",                 type: "cross-app", forPath: "/jobs/s001/complete" },
  { label: "🔗 WeeeU ดูใบรับรอง",   href: "http://localhost:3002/scrap/s001/certificate",          type: "cross-app", forPath: "/jobs/s001/complete" },
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
      </body>
    </html>
  );
}
