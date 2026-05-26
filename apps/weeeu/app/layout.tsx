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
// หมายเหตุ: โมดูลอื่น (Maintain/Resell/Scrap/Parts) เพิ่ม link เรอบถัดไป
const devNavLinks: DevNavLink[] = [
  // Repair module — /repair/job-001/offers
  { label: "→ [A] เลือกข้อเสนอ", href: "/repair/job-001/progress", type: "branch",    forPath: "/repair/job-001/offers" },
  { label: "→ [B] ไม่เลือก",     href: "/repair/job-001/suspend",  type: "branch",    forPath: "/repair/job-001/offers" },
  // Repair module — /repair/job-001/progress
  { label: "🔗 WeeeR ดูความคืบหน้า", href: "http://localhost:3001/repair/jobs", type: "cross-app", forPath: "/repair/job-001/progress" },
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
