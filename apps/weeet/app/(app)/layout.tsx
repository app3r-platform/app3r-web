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
      return;
    }
    // Rented WeeeT must change password first
    if (auth.forceChangePassword) {
      router.replace("/change-password-first");
    }
  }, [auth.isAuthenticated, auth.forceChangePassword, router]);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-gray-400">กำลังตรวจสอบ...</span>
      </div>
    );
  }

  if (auth.forceChangePassword) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-gray-400">กำลังนำไปยังหน้าเปลี่ยนรหัสผ่าน...</span>
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
