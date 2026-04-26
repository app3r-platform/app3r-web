"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PointsSummary {
  total_wallets: number;
  total_user_wallet: number;
  total_locked_escrow: number;
  total_pending_withdrawal: number;
  total_points_issued: number;
  platform_reserve: number;
  tx_today: number;
}

interface TxItem {
  id: number;
  amount: number;
  direction: string;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
  user_id: number | null;
  user_name: string;
}

interface PaginatedTx {
  items: TxItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ─── Transaction type labels (Thai) ──────────────────────────────────────────

const TX_LABELS: Record<string, string> = {
  topup:                    "เติม Point",
  withdrawal:               "ถอนเงิน",
  listing_fee:              "ค่า listing",
  offer_deposit:            "มัดจำ offer",
  purchase_lock:            "ล็อค escrow",
  release_to_seller:        "จ่ายให้ผู้ขาย",
  refund_to_buyer:          "คืนเงินผู้ซื้อ",
  penalty:                  "ค่าปรับ",
  platform_fee:             "ค่าธรรมเนียม",
  monthly_fee:              "ค่าสมาชิก",
  reconciliation_adjustment:"ปรับยอด",
};

const TX_TYPE_COLORS: Record<string, string> = {
  topup:             "bg-green-900 text-green-300",
  withdrawal:        "bg-orange-900 text-orange-300",
  platform_fee:      "bg-purple-900 text-purple-300",
  penalty:           "bg-red-900 text-red-300",
  release_to_seller: "bg-blue-900 text-blue-300",
  refund_to_buyer:   "bg-yellow-900 text-yellow-300",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PointsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [txData, setTxData] = useState<PaginatedTx | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  // Filters
  const [page, setPage] = useState(1);
  const [txType, setTxType] = useState("");
  const [direction, setDirection] = useState("");

  // ── Fetch summary ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    api.get<PointsSummary>("/admin/points/summary")
      .then(setSummary)
      .catch(() => router.push("/login"))
      .finally(() => setLoadingSummary(false));
  }, [router]);

  // ── Fetch transactions ─────────────────────────────────────────────────────
  const fetchTx = useCallback(async () => {
    setLoadingTx(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (txType) params.set("transaction_type", txType);
      if (direction) params.set("direction", direction);
      const data = await api.get<PaginatedTx>(`/admin/points/transactions?${params}`);
      setTxData(data);
    } catch {
      /* silent */
    } finally {
      setLoadingTx(false);
    }
  }, [page, txType, direction]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8 min-w-0">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-1">Point Ledger</h1>
        <p className="text-gray-400 text-sm mb-8">
          ภาพรวม Point ทั้งระบบ · ประวัติธุรกรรมทุก user
        </p>

        {/* ── Summary Cards ── */}
        {loadingSummary ? (
          <div className="text-gray-500 mb-8">กำลังโหลด...</div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              icon="👛"
              label="Point ในระบบ (user)"
              value={fmt(summary.total_user_wallet)}
              unit="pt"
              color="text-white"
            />
            <SummaryCard
              icon="🔒"
              label="ล็อค Escrow"
              value={fmt(summary.total_locked_escrow)}
              unit="pt"
              color="text-yellow-400"
            />
            <SummaryCard
              icon="💰"
              label="Platform Reserve"
              value={fmt(summary.platform_reserve)}
              unit="pt"
              color="text-green-400"
            />
            <SummaryCard
              icon="📊"
              label="Tx วันนี้"
              value={String(summary.tx_today)}
              unit="รายการ"
              color="text-blue-400"
            />
          </div>
        ) : null}

        {/* Platform health bar */}
        {summary && summary.total_points_issued > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">สัดส่วน Point ทั้งระบบ</span>
              <span className="text-gray-500 text-xs">
                ออกทั้งหมด {fmt(summary.total_points_issued)} pt
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex gap-0.5">
              <div
                className="bg-blue-600 rounded-full"
                style={{ width: pct(summary.total_user_wallet, summary.total_points_issued) }}
                title={`User wallet: ${fmt(summary.total_user_wallet)} pt`}
              />
              <div
                className="bg-yellow-600 rounded-full"
                style={{ width: pct(summary.total_locked_escrow, summary.total_points_issued) }}
                title={`Escrow: ${fmt(summary.total_locked_escrow)} pt`}
              />
              <div
                className="bg-green-600 rounded-full"
                style={{ width: pct(summary.platform_reserve, summary.total_points_issued) }}
                title={`Platform: ${fmt(summary.platform_reserve)} pt`}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span><span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1"/>User wallet</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-600 mr-1"/>Escrow</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1"/>Platform</span>
            </div>
          </div>
        )}

        {/* ── Transaction Table ── */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {/* Table header + filters */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-wrap gap-3">
            <h2 className="font-semibold">ประวัติธุรกรรม</h2>
            <div className="flex gap-2">
              <select
                value={txType}
                onChange={(e) => { setTxType(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทุกประเภท</option>
                {Object.entries(TX_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={direction}
                onChange={(e) => { setDirection(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เข้า & ออก</option>
                <option value="credit">เข้า (Credit)</option>
                <option value="debit">ออก (Debit)</option>
              </select>
            </div>
          </div>

          {loadingTx ? (
            <div className="flex items-center justify-center py-16 text-gray-500 gap-3">
              <span className="animate-spin text-xl">⟳</span> กำลังโหลด...
            </div>
          ) : !txData || txData.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>ยังไม่มีธุรกรรม</p>
              <p className="text-xs mt-1">จะแสดงข้อมูลเมื่อมีการเติม/ใช้ Point ในระบบ</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">ผู้ใช้</th>
                  <th className="px-5 py-3">ประเภท</th>
                  <th className="px-5 py-3 text-right">จำนวน</th>
                  <th className="px-5 py-3 text-right">คงเหลือ</th>
                  <th className="px-5 py-3">หมายเหตุ</th>
                  <th className="px-5 py-3 text-right">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {txData.items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 text-gray-600 text-xs">{tx.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm">{tx.user_name}</div>
                      {tx.user_id && (
                        <div className="text-xs text-gray-600">id:{tx.user_id}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TX_TYPE_COLORS[tx.transaction_type] ?? "bg-gray-800 text-gray-400"}`}>
                        {TX_LABELS[tx.transaction_type] ?? tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-medium">
                      <span className={tx.direction === "credit" ? "text-green-400" : "text-red-400"}>
                        {tx.direction === "credit" ? "+" : "−"}
                        {fmt(tx.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-400 text-xs">
                      {fmt(tx.balance_after)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[180px] truncate">
                      {tx.description ?? tx.reference_id ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 text-xs">
                      {new Date(tx.created_at).toLocaleDateString("th-TH", {
                        day: "2-digit", month: "short", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {txData && txData.pages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              หน้า {txData.page} จาก {txData.pages} ({txData.total} รายการ)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                ← ก่อนหน้า
              </button>
              {Array.from({ length: txData.pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      p === page ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(txData.pages, p + 1))}
                disabled={page === txData.pages}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(part: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.min(100, (part / total) * 100).toFixed(1)}%`;
}

function SummaryCard({
  icon, label, value, unit, color,
}: {
  icon: string; label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{unit}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}
