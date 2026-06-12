"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api, ERR_UNAUTHORIZED } from "@/lib/api";
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

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_BALANCES: PlatformBalances = {
  listing_offer_fee_pool:  87500,
  platform_fee_pool:       62000,
  advertising_pool:        35000,
  escrow_pool:             20000,
  reserve_pool:           480000,
  written_off:              2500,
  silver_pool:            980000,
  reconciliation_status:  "PENDING",
  last_reconciliation_at: null,
};

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
    } catch (e: unknown) {
      if ((e as Error).message === ERR_UNAUTHORIZED) { router.push("/login"); return; }
      // API ไม่พร้อม → ใช้ mock fallback
      console.warn("[mock fallback]", e);
      setData(MOCK_BALANCES);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [router, fetchData]);

  const fmtG = (v: number) => `${v.toLocaleString()} G`;
  const fmtS = (v: number) => `${v.toLocaleString()} S`;

  const recColor = {
    BALANCED: "bg-green-50 text-green-700 border-green-200",
    DISCREPANCY: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">ยอดเงินคงเหลือ Platform</h1>
          <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            🔄 Auto-refresh 30s
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-8">ยอดเงินรวมในแต่ละ bucket ของระบบ (Gold = cashable, Silver = non-cashable)</p>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>
        ) : data && (
          <div className="space-y-8">
            {/* Gold Buckets */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🥇 พอยต์ทอง (Gold Point) — 3 กลุ่ม
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <BucketCard label="กองทุนค่าธรรมเนียมประกาศ" value={fmtG(data.listing_offer_fee_pool)} accent="yellow" />
                <BucketCard label="กองทุนค่าธรรมเนียมแพลตฟอร์ม" value={fmtG(data.platform_fee_pool)} accent="yellow" />
                <BucketCard label="กองทุนโฆษณา" value={fmtG(data.advertising_pool)} accent="admin-primary" />
                <BucketCard label="พักเงินกลาง (Escrow) Pool" value={fmtG(data.escrow_pool)} accent="blue" />
                <BucketCard label="กองทุนสำรอง" value={fmtG(data.reserve_pool)} accent="green" />
                <BucketCard label="ตัดจำหน่าย" value={fmtG(data.written_off)} accent="red" />
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
                🔍 สถานะกระทบยอด (Reconciliation)
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-2">สถานะล่าสุด</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${
                    recColor[data.reconciliation_status]
                  }`}>
                    {data.reconciliation_status === "BALANCED" ? "✅ สมดุล" :
                     data.reconciliation_status === "DISCREPANCY" ? "🚨 ไม่สอดคล้อง — ต้องตรวจสอบ" :
                     "⏳ รอกระทบยอด"}
                  </div>
                  {data.last_reconciliation_at && (
                    <p className="text-xs text-gray-600 mt-2">
                      ตรวจล่าสุด: {new Date(data.last_reconciliation_at).toLocaleString("th-TH")}
                    </p>
                  )}
                </div>
                <Link href="/platform/reconciliation"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
                  ดูรายละเอียด →
                </Link>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                ลิงก์ด่วน
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/platform/gold-management"
                  className="px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-800/50 text-yellow-700 rounded-lg text-sm transition-colors">
                  🥇 จัดการ Gold Point
                </Link>
                <Link href="/platform/silver"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm transition-colors">
                  🥈 Silver Point
                </Link>
                <Link href="/platform/transactions"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm transition-colors">
                  📋 บันทึกตรวจสอบ
                </Link>
                <Link href="/platform/reconciliation"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm transition-colors">
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
    "admin-primary": "border-admin-primary/30",
    blue:   "border-blue-800/40",
    green:  "border-green-800/40",
    red:    "border-red-800/40",
    gray:   "border-gray-300",
  };
  const texts: Record<string, string> = {
    yellow: "text-yellow-700",
    "admin-primary": "text-admin-primary",
    blue:   "text-blue-300",
    green:  "text-green-700",
    red:    "text-red-700",
    gray:   "text-gray-700",
  };
  return (
    <div className={`bg-white rounded-xl border p-5 ${borders[accent] ?? "border-gray-200"}`}>
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className={`text-xl font-bold ${texts[accent] ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}
