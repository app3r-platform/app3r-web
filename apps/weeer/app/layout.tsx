import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeeeR",
  description: "WeeeR — ระบบสำหรับร้านค้า/บริษัท",
  icons: { icon: "/logo/WeeeR.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
