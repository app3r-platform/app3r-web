import type { Metadata } from "next";
import "./globals.css";
import { DevNav } from "@/components/DevNav";

export const metadata: Metadata = {
  title: "App3R Admin",
  description: "Admin Dashboard — App3R Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <DevNav />
      </body>
    </html>
  );
}
