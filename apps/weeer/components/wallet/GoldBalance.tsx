"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { walletApi } from "@/lib/api/wallet";

/**
 * GoldBalance — renders the seller's REAL Gold (cash) balance from
 * GET /api/v1/wallet/gold-balance. D-FE-NO-FAKE-DISPLAY:
 * when the balance is unavailable (loading / fetch error / no endpoint)
 * the numeric value is SUPPRESSED (never a fake or 0-placeholder).
 *
 * variant:
 *  - "chip"     : header chip (links to /wallet); unavailable → wallet link w/o number
 *  - "stat"     : dashboard stat card; unavailable → render nothing (hidden)
 *  - "headline" : wallet-page balance card; unavailable → render nothing (hidden)
 */
type Variant = "chip" | "stat" | "headline";

export function GoldBalance({ variant }: { variant: Variant }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    walletApi
      .goldBalance()
      .then((d) => { if (alive) setBalance(d.balance); })
      .catch(() => { /* suppress — no fake value shown */ });
    return () => { alive = false; };
  }, []);

  const val = balance != null ? balance.toLocaleString() : null;

  if (variant === "chip") {
    // always a wallet link; show the real number only when known (else link only)
    return (
      <Link
        href="/wallet"
        className="flex items-center gap-2 bg-[#FFF1ED] hover:bg-[#FFE0D6] px-3 py-1.5 rounded-xl transition-colors"
      >
        <span>{val != null ? "🥇" : "🪙"}</span>
        <span className="text-sm font-semibold text-[#D63B12]">
          {val != null ? `${val} พอยต์ทอง` : "กระเป๋าเงิน"}
        </span>
      </Link>
    );
  }

  // stat / headline: suppress entirely when unavailable (no fake, no 0-placeholder)
  if (val == null) return null;

  if (variant === "stat") {
    return (
      <div className="bg-yellow-50 rounded-2xl p-4">
        <div className="text-2xl mb-1">⭐</div>
        <div className="text-xl font-bold text-yellow-700">
          {val} <span className="text-sm font-normal">point</span>
        </div>
        <div className="text-xs text-gray-500">พอยต์ทอง</div>
      </div>
    );
  }

  // headline (wallet page)
  return (
    <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-5 border border-yellow-200">
      <div className="text-2xl mb-1">⭐</div>
      <div className="text-3xl font-bold text-gray-900">{val}</div>
      <div className="text-sm text-yellow-800 mt-1">พอยต์ทอง</div>
      <div className="text-xs text-yellow-700 mt-2">
        รับจากงานบริการ + B2B Parts (1 พอยต์ทอง = 1 บาท)
      </div>
    </div>
  );
}
