"use client";

// ── LogoutButton — sidebar logout action ──────────────────────────────────────
// Wave1: clears auth state via auth-shell.logout(), redirects to /login

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-shell";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
    >
      <span>🚪</span>ออกจากระบบ
    </button>
  );
}
