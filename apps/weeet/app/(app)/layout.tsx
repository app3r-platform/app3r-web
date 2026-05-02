"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth.isAuthenticated, router]);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-gray-400">กำลังตรวจสอบ...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <ImpersonationBanner />
      {children}
      <BottomNav />
    </div>
  );
}
