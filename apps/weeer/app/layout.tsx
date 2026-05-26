import type { Metadata } from "next";
import "./globals.css";
import DevNav, { type DevNavLink } from "@/components/DevNav";

export const metadata: Metadata = {
  title: "WeeeR",
  description: "WeeeR — ระบบสำหรับร้านค้า/บริษัท",
  icons: { icon: "/logo/WeeeR.png" },
};

// ── Dev Navigator link map ────────────────────────────────────────────────────
const devNavLinks: DevNavLink[] = [
  // Repair module — /repair/announcements
  { label: "→ เปิดหน้ายื่นข้อเสนอ", href: "/repair/announcements/r001/offer", type: "next-step", forPath: "/repair/announcements" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        {process.env.NEXT_PUBLIC_DEV_NAV === "true" && (
          <DevNav links={devNavLinks} />
        )}
      </body>
    </html>
  );
}
