import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-950 text-white antialiased">
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen relative">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
