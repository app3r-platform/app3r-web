"use client";

// ── WalletDisplay — header wallet chip ────────────────────────────────────────
// Wave1: fetches balance from api-client GET /api/v1/weeer/wallet (read-only)
// Falls back to mock-data when API unavailable

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchShellWallet, type WalletBalance } from "@/lib/auth-shell";

export default function WalletDisplay() {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShellWallet()
      .then((w) => { if (!cancelled) setWallet(w); })
      .catch(() => { if (!cancelled) setWallet({ gold: 0, silver: 0 }); });
    return () => { cancelled = true; };
  }, []);

  if (wallet === null) {
    // Loading skeleton
    return (
      <div className="flex items-center gap-2 bg-[#FFF1ED] px-3 py-1.5 rounded-xl animate-pulse">
        <span>⭐</span>
        <span className="w-20 h-3 bg-[#FFD0BF] rounded-full inline-block" />
      </div>
    );
  }

  return (
    <Link
      href="/wallet"
      className="flex items-center gap-2 bg-[#FFF1ED] hover:bg-[#FFE0D6] px-3 py-1.5 rounded-xl transition-colors"
    >
      <span>⭐</span>
      <span className="text-sm font-semibold text-[#D63B12]">
        {wallet.gold.toLocaleString()} พอยต์ทอง
      </span>
    </Link>
  );
}
