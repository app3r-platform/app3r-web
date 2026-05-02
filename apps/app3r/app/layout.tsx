import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: {
    default: "App3R — แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจร",
    template: "%s | App3R",
  },
  description:
    "App3R แพลตฟอร์มตัวกลางด้านเครื่องใช้ไฟฟ้าครบวงจร — ซื้อขายมือสอง ซ่อม บำรุงรักษา ในที่เดียว",
  keywords: ["เครื่องใช้ไฟฟ้ามือสอง", "ซ่อมเครื่องใช้ไฟฟ้า", "บำรุงรักษา", "App3R", "WeeeR", "WeeeU"],
  authors: [{ name: "App3R Platform" }],
  creator: "App3R Platform",
  metadataBase: new URL("https://app3r.com"),
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://app3r.com",
    siteName: "App3R",
    title: "App3R — แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจร",
    description:
      "App3R แพลตฟอร์มตัวกลางด้านเครื่องใช้ไฟฟ้าครบวงจร — ซื้อขายมือสอง ซ่อม บำรุงรักษา ในที่เดียว",
  },
  twitter: {
    card: "summary_large_image",
    title: "App3R — แพลตฟอร์มเครื่องใช้ไฟฟ้าครบวงจร",
    description:
      "App3R แพลตฟอร์มตัวกลางด้านเครื่องใช้ไฟฟ้าครบวงจร",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
