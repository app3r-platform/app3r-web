"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface PlatformTx {
  id: string;
  tx_type: string;
  amount: number;
  currency: "gold" | "silver";
  actor_id: number | null;
  actor_role: string | null;
  target_user_id: number | null;
  reference_id: string | null;
  note: string | null;
  created_at: string;
}
interface TxList { items: PlatformTx[]; total: number; }

const TX_TYPE_COLORS: Record<string, string> = {
  "platform.gold.minted":           "text-green-400 bg-green-900/30",
  "platform.gold.destroyed":        "text-red-400 bg-red-900/30",
  "platform.gold.fee_to_reserve":   "text-yellow-400 bg-yellow-900/30",
  "platform.gold.writeoff":         "text-gray-400 bg-gray-800",
  "platform.points.manual_adjust":  "text-orange-400 bg-orange-900/30",
  "platform.silver.distributed":    "text-blue-400 bg-blue-900/30",
  "platform.silver.expired":        "text-gray-400 bg-gray-800",
  "platform.silver.expiry_batch_run": "text-purple-400 bg-purple-900/30",
  "platform.reconciliation.run":    "text-cyan-400 bg-cyan-900/30",
  "platform.reconciliation.alert":  "text-red-400 bg-red-900/40",
};

const PAGE_SIZE = 50;

export default function TransactionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<PlatformTx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlatformTx | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterType && { tx_type: filterType }),
        ...(filterCurrency && { currency: filterCurrency }),
        ...(filterDateFrom && { date_from: filterDateFrom }),
        ...(filterDateTo && { date_to: filterDateTo }),
      });
      const d = await api.get<TxList>("/admin/platform/transactions?" + params);
      setItems(d.items);
      setTotal(d.total);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterCurrency, filterDateFrom, filterDateTo]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  async function exportCsv() {
    const params = new URLSearchParams({
      format: "csv",
      ...(filterType && { tx_type: filterType }),
      ...(filterCurrency && { currency: filterCurrency }),
      ...(filterDateFrom && { date_from: filterDateFrom }),
      ...(filterDateTo && { date_to: filterDateTo }),
    });
    window.open("/api/v1/admin/platform/transactions/export?" + params, "_blank");
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Platform Audit Trail</h1>
          <button onClick={exportCsv}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors">
            📥 Export CSV
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-6">ประวัติธุรกรรมระดับ Platform ทั้งหมด (D19 — Append-only, ลบไม่ได้)</p>

        {/* Filter Bar */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ประเภท</label>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white">
              <option value="">ทั้งหมด</option>
              {Object.keys(TX_TYPE_COLORS).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">สกุลเงิน</label>
            <select value={filterCurrency} onChange={(e) => { setFilterCurrency(e.target.value); setPage(1); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white">
              <option value="">ทั้งหมด</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">วันที่เริ่ม</label>
            <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">วันที่สิ้นสุด</label>
            <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white" />
          </div>
          <button onClick={() => { setFilterType(""); setFilterCurrency(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            ล้าง
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between text-sm text-gray-400">
            <span>ทั้งหมด {total.toLocaleString()} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40 hover:bg-gray-700 transition-colors">‹</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40 hover:bg-gray-700 transition-colors">›</button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="px-6 py-3">เวลา</th>
                  <th className="px-6 py-3">ประเภท</th>
                  <th className="px-6 py-3 text-right">จำนวน</th>
                  <th className="px-6 py-3">Actor</th>
                  <th className="px-6 py-3">Note</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString("th-TH")}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TX_TYPE_COLORS[tx.tx_type] ?? "text-gray-400 bg-gray-800"}`}>
                        {tx.tx_type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-mono font-semibold ${
                      tx.amount >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      <span className="text-xs text-gray-500 ml-1">{tx.currency === "gold" ? "G" : "S"}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">
                      {tx.actor_role && <span className="bg-gray-800 px-1.5 py-0.5 rounded mr-1">{tx.actor_role}</span>}
                      {tx.actor_id ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs max-w-[160px] truncate">{tx.note ?? "—"}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => setSelected(tx)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors">ดู</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Transaction Detail</h3>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["ID", selected.id],
                  ["Type", selected.tx_type],
                  ["Amount", `${selected.amount >= 0 ? "+" : ""}${selected.amount.toLocaleString()} ${selected.currency === "gold" ? "G" : "S"}`],
                  ["Actor ID", String(selected.actor_id ?? "—")],
                  ["Actor Role", selected.actor_role ?? "—"],
                  ["Target User", String(selected.target_user_id ?? "—")],
                  ["Reference", selected.reference_id ?? "—"],
                  ["Note", selected.note ?? "—"],
                  ["Created At", new Date(selected.created_at).toLocaleString("th-TH")],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-4">
                    <span className="text-gray-500 w-28 shrink-0">{k}</span>
                    <span className="text-white break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
