"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface PlatformBalances {
  listing_offer_fee_pool: number;
  platform_fee_pool: number;
  advertising_pool: number;
  escrow_pool: number;
  reserve_pool: number;
  written_off: number;
  silver_pool: number;
  reconciliation_status: "BALANCED" | "DISCREPANCY" | "PENDING";
  last_reconciliation_at: string | null;
}

export default function BalancesPage() {
  const router = useRouter();
  const [data, setData] = useState<PlatformBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<PlatformBalances>("/admin/platform/balances");
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [router, fetchData]);

  const fmtG = (v: number) => `${v.toLocaleString()} G`;
  const fmtS = (v: number) => `${v.toLocaleString()} S`;

  const recColor = {
    BALANCED: "bg-green-900/40 text-green-400 border-green-800",
    DISCREPANCY: "bg-red-900/40 text-red-400 border-red-800",
    PENDING: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Platform Balances</h1>
          <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            🔄 Auto-refresh 30s
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-8">ยอดเงินรวมในแต่ละ bucket ของระบบ (Gold = cashable, Silver = non-cashable)</p>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">{error}</div>
        ) : data && (
          <div className="space-y-8">
            {/* Gold Buckets */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🥇 Gold Point Buckets (D17 — 3 Buckets)
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <BucketCard label="Listing Offer Fee Pool" value={fmtG(data.listing_offer_fee_pool)} accent="yellow" />
                <BucketCard label="Platform Fee Pool" value={fmtG(data.platform_fee_pool)} accent="yellow" />
                <BucketCard label="Advertising Pool" value={fmtG(data.advertising_pool)} accent="purple" />
                <BucketCard label="Escrow Pool" value={fmtG(data.escrow_pool)} accent="blue" />
                <BucketCard label="Reserve Pool" value={fmtG(data.reserve_pool)} accent="green" />
                <BucketCard label="Written-Off" value={fmtG(data.written_off)} accent="red" />
              </div>
            </section>

            {/* Silver Pool */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🥈 Silver Point Pool
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <BucketCard label="Silver Pool (ทั้งระบบ)" value={fmtS(data.silver_pool)} accent="gray" />
              </div>
            </section>

            {/* Reconciliation */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🔍 Reconciliation Status
              </h2>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-2">สถานะล่าสุด</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${
                    recColor[data.reconciliation_status]
                  }`}>
                    {data.reconciliation_status === "BALANCED" ? "✅ BALANCED" :
                     data.reconciliation_status === "DISCREPANCY" ? "🚨 DISCREPANCY — ต้องตรวจสอบ" :
                     "⏳ PENDING"}
                  </div>
                  {data.last_reconciliation_at && (
                    <p className="text-xs text-gray-600 mt-2">
                      ตรวจล่าสุด: {new Date(data.last_reconciliation_at).toLocaleString("th-TH")}
                    </p>
                  )}
                </div>
                <Link href="/platform/reconciliation"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                  ดูรายละเอียด →
                </Link>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/platform/gold-management"
                  className="px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-800/50 text-yellow-300 rounded-lg text-sm transition-colors">
                  🥇 Gold Management
                </Link>
                <Link href="/platform/silver"
                  className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                  🥈 Silver Points
                </Link>
                <Link href="/platform/transactions"
                  className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                  📋 Audit Trail
                </Link>
                <Link href="/platform/reconciliation"
                  className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                  🔍 Reconciliation
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function BucketCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  const borders: Record<string, string> = {
    yellow: "border-yellow-800/40",
    purple: "border-purple-800/40",
    blue:   "border-blue-800/40",
    green:  "border-green-800/40",
    red:    "border-red-800/40",
    gray:   "border-gray-700",
  };
  const texts: Record<string, string> = {
    yellow: "text-yellow-300",
    purple: "text-purple-300",
    blue:   "text-blue-300",
    green:  "text-green-300",
    red:    "text-red-300",
    gray:   "text-gray-300",
  };
  return (
    <div className={`bg-gray-900 rounded-xl border p-5 ${borders[accent] ?? "border-gray-800"}`}>
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className={`text-xl font-bold ${texts[accent] ?? "text-white"}`}>{value}</p>
    </div>
  );
}
