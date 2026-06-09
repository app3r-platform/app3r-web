"use client";

// ── AuthUserInfo — sidebar user info chip ─────────────────────────────────────
// Wave1: reads shop profile from localStorage (written during login)
// Falls back to MOCK_WEEER_PROFILE when not authenticated

import { useEffect, useState } from "react";
import { getShellProfile } from "@/lib/auth-shell";

export default function AuthUserInfo() {
  const [profile, setProfile] = useState<{ shopName: string; email: string } | null>(null);

  useEffect(() => {
    setProfile(getShellProfile());
  }, []);

  const shopName = profile?.shopName ?? "…";
  const email = profile?.email ?? "";
  const initial = shopName.charAt(0) || "ร";

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#FFE0D6] rounded-full flex items-center justify-center text-[#D63B12] font-bold text-sm shrink-0">
        {initial}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{shopName}</p>
        <p className="text-xs text-gray-400 truncate">{email}</p>
      </div>
    </div>
  );
}
