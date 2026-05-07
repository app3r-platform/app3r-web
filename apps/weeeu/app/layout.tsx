import type { Metadata, Viewport } from "next";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
