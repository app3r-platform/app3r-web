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
// Repair module — หมายเหตุ: โมดูลอื่น devNavLinks = [] ไว้ก่อน
const devNavLinks: DevNavLink[] = [
  // /jobs/job-001/diagnose
  { label: "🔗 WeeeR ดูผลวินิจฉัย", href: "http://localhost:3001/repair/walk-in/job-001/inspect", type: "cross-app", forPath: "/jobs/job-001/diagnose" },
  { label: "→ [ซ่อมได้]",           href: "/jobs/job-001/repair",                                 type: "branch",    forPath: "/jobs/job-001/diagnose" },
  { label: "→ [ปฏิเสธรับซ่อม]",     href: "/jobs/job-001/reject",                                 type: "branch",    forPath: "/jobs/job-001/diagnose" },
  // /jobs/job-001/complete
  { label: "🔗 WeeeU ดูผลสุดท้าย",  href: "http://localhost:3002/repair/job-001/review",           type: "cross-app", forPath: "/jobs/job-001/complete" },
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
