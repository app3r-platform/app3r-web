import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App3R",
  description: "App3R — แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจร",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
