import type { Metadata } from "next";
import "./globals.css";
import { DevNav } from "@/components/DevNav";
import { ScreenBadge } from "@/components/ScreenBadge";
import { MockAnno } from "@/components/MockAnno";
import { DevAuthInit } from "@/components/DevAuthInit";

export const metadata: Metadata = {
  title: "App3R Admin",
  description: "Admin Dashboard — App3R Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        {/* TODO: REMOVE BEFORE PROD — dev auth bypass seed (TD-05) */}
        <DevAuthInit />
        <DevNav />
        <ScreenBadge />
        <MockAnno />
      </body>
    </html>
  );
}
