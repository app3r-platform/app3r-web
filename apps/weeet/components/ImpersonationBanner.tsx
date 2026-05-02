"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export function ImpersonationBanner() {
  const { auth, logout } = useAuth();
  const router = useRouter();

  if (!auth.isImpersonated) return null;

  const handleReturn = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="text-base">👤</span>
        <span>
          คุณกำลังใช้งานในฐานะ{" "}
          <strong>{auth.impersonatedByShop ?? "WeeeR"}</strong>
        </span>
      </div>
      <button
        onClick={handleReturn}
        className="bg-amber-950 text-amber-100 px-3 py-1 rounded-full text-xs font-semibold hover:bg-amber-800 transition-colors"
      >
        ← กลับ WeeeR
      </button>
    </div>
  );
}
