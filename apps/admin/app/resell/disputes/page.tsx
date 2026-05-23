"use client";

/**
 * /resell/disputes — Resell-specific dispute monitoring
 * Pre-filtered service_type=A · 3-way resolution: to_buyer / to_seller / split
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface DisputeItem {
  listing_id:     number;
  title:          string;
  service_type:   string;
  poster_id:      number;
  poster_name:    string;
  buyer_id:       number | null;
  buyer_name:     string;
  seller_id:      number | null;
  seller_name:    string;
  final_price:    number;
  escrow_amount:  number;
  transaction_id: number | null;
  disputed_at:    string;
}

interface PaginatedDisputes {
  items:  DisputeItem[];
  total:  number;
  page:   number;
  pages:  number;
}

type Resolution = "to_buyer" | "to_seller" | "split" | "";

export default function ResellDisputesPage() {
  const router = useRouter();
  const [data,          setData]          = useState<PaginatedDisputes | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast,         setToast]         = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [page,          setPage]          = useState(1);
  const [resolveModal,  setResolveModal]  = useState<DisputeItem | null>(null);
  const [resolution,    setResolution]    = useState<Resolution>("");
  const [splitPct,      setSplitPct]      = useState(50);   // buyer gets N%
  const [adminNote,     setAdminNote]     = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", service_type: "A" });
      const result = await api.get<PaginatedDisputes>(`/admin/disputes?${params}`);
      setData(result);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [page, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [fetchData, router]);

  async function handleResolve() {
    if (!resolveModal || !resolution) {
      showToast("กรุณาเลือกการตัดสิน", "err");
      return;
    }
    setActionLoading(resolveModal.listing_id);
    try {
      const payload: Record<string, unknown> = {
        resolution,
        admin_note: adminNote || null,
      };
      if (resolution === "split") payload.split_pct = splitPct;
      const res = await api.patch<{ resolved: string; message: string }>(
        `/admin/disputes/${resolveModal.listing_id}/resolve`,
        payload,
      );
      showToast(res.message, "ok");
      setResolveModal(null);
      setResolution("");
      setSplitPct(50);
      setAdminNote("");
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setActionLoading(null);
    }
  }

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function closeModal() {
    setResolveModal(null);
    setResolution("");
    setSplitPct(50);
    setAdminNote("");
  }

  /* Derived split amounts */
  const escrowAmt   = resolveModal?.escrow_amount ?? 0;
  const buyerSplit  = Math.round(escrowAmt * splitPct / 100);
  const sellerSplit = escrowAmt - buyerSplit;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold">⚖️ Resell Disputes</h1>
            <p className="text-gray-500 text-sm mt-1">
              ข้อพิพาท Resell — service_type A · ตัดสิน 3 ทาง (buyer/seller/split)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                data.total > 0
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {data.total > 0 ? `⚠ รอตัดสิน ${data.total} รายการ` : "ไม่มีข้อพิพาท"}
              </span>
            )}
            <Link href="/disputes"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              ⚖️ All Disputes →
            </Link>
          </div>
        </div>

        {/* Rules box */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 my-5 text-sm">
          <p className="text-gray-600 font-semibold mb-3">กฎการตัดสิน Resell — 3 ทาง</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="font-semibold text-blue-700 mb-1">🛒 Buyer ชนะ</div>
              <div className="text-xs text-gray-500">คืน escrow เต็มจำนวนให้ buyer · listing → CANCELLED</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="font-semibold text-green-700 mb-1">🧑‍💼 Seller ชนะ</div>
              <div className="text-xs text-gray-500">โอน escrow ให้ seller · listing → COMPLETED</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="font-semibold text-purple-700 mb-1">⚡ แบ่ง (Split)</div>
              <div className="text-xs text-gray-500">Admin กำหนด % — buyer N% + seller (100-N)%</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <span className="mr-3">⟳</span> กำลังโหลด...
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="text-5xl mb-3">⚖️</div>
              <p className="text-lg font-medium text-gray-700 mb-1">ไม่มีข้อพิพาท Resell ที่รอตัดสิน</p>
              <p className="text-sm text-gray-500">Resell listings ทั้งหมดอยู่ในสภาพปกติ</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Seller</th>
                  <th className="px-5 py-3">Escrow</th>
                  <th className="px-5 py-3">เวลาที่พิพาท</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items.map(item => (
                  <tr key={item.listing_id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link href={`/resell/listings/${item.listing_id}`}
                        className="font-medium text-admin-primary hover:text-admin-dark transition-colors">
                        {item.title}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID: {item.listing_id} · TX: {item.transaction_id ?? "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-blue-700">{item.buyer_name}</div>
                      <div className="text-xs text-gray-500">UID: {item.buyer_id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-green-700">{item.seller_name}</div>
                      <div className="text-xs text-gray-500">UID: {item.seller_id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-base font-bold text-admin-primary font-mono">
                        {item.escrow_amount.toLocaleString()} G
                      </div>
                      <div className="text-xs text-gray-500">Escrow ค้างอยู่</div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(item.disputed_at).toLocaleDateString("th-TH", {
                        day: "2-digit", month: "short", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setResolveModal(item)}
                        disabled={actionLoading === item.listing_id}
                        className="px-4 py-2 text-xs bg-admin-primary hover:bg-admin-dark disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
                        {actionLoading === item.listing_id ? "..." : "⚖️ ตัดสิน"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              หน้า {data.page} จาก {data.pages} ({data.total} รายการ)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 rounded-lg">
                ← ก่อนหน้า
              </button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 rounded-lg">
                ถัดไป →
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Resolve Modal — 3-way */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-1">ตัดสินข้อพิพาท Resell</h3>
            <p className="text-sm text-gray-500 mb-5">
              Listing ID: <span className="font-medium text-admin-primary">{resolveModal.listing_id}</span>
              {resolveModal.title && ` — ${resolveModal.title}`}
            </p>

            {/* Parties + Escrow */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 text-sm border border-gray-200">
              <div>
                <div className="text-xs text-gray-500 mb-1">🛒 Buyer</div>
                <div className="text-blue-700 font-medium">{resolveModal.buyer_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">🧑‍💼 Seller</div>
                <div className="text-green-700 font-medium">{resolveModal.seller_name}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">🔒 Escrow</div>
                <div className="text-admin-primary font-bold text-lg font-mono">
                  {resolveModal.escrow_amount.toLocaleString()} G
                </div>
              </div>
            </div>

            {/* 3-way selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(["to_buyer", "to_seller", "split"] as const).map(r => (
                <button key={r} onClick={() => setResolution(r)}
                  className={`p-3 rounded-xl border-2 text-center text-xs font-medium transition-all ${
                    resolution === r
                      ? r === "to_buyer"  ? "border-blue-400 bg-blue-50 text-blue-700"
                      : r === "to_seller" ? "border-green-400 bg-green-50 text-green-700"
                      : "border-purple-400 bg-purple-50 text-purple-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}>
                  {r === "to_buyer"  ? "🛒 Buyer\nชนะ"
                   : r === "to_seller" ? "🧑‍💼 Seller\nชนะ"
                   : "⚡ แบ่ง\nSplit"}
                </button>
              ))}
            </div>

            {/* Split slider */}
            {resolution === "split" && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-xs font-semibold text-purple-700 mb-2">⚡ กำหนด Split %</p>
                <p className="text-xs text-gray-600">
                  Buyer ได้ <strong>{splitPct}%</strong> = {buyerSplit.toLocaleString()} G
                  &nbsp;·&nbsp;
                  Seller ได้ <strong>{100 - splitPct}%</strong> = {sellerSplit.toLocaleString()} G
                </p>
                <input type="range" min={0} max={100} step={5}
                  value={splitPct}
                  onChange={e => setSplitPct(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Buyer 100%</span>
                  <span>50/50</span>
                  <span>Seller 100%</span>
                </div>
              </div>
            )}

            {/* Admin note */}
            <label className="block text-sm text-gray-500 mb-2">บันทึก Admin (ไม่บังคับ)</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              placeholder="เหตุผลการตัดสิน / precedent..."
              rows={2}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-admin-primary placeholder-gray-400 resize-none mb-5"
            />

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={closeModal}
                className="flex-1 py-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleResolve}
                disabled={!resolution || actionLoading !== null}
                className={`flex-1 py-3 text-sm text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                  resolution === "to_buyer"  ? "bg-blue-600 hover:bg-blue-700"
                  : resolution === "to_seller" ? "bg-green-600 hover:bg-green-700"
                  : resolution === "split"    ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-gray-400"
                }`}>
                {actionLoading !== null ? "กำลังดำเนินการ..."
                  : resolution === "to_buyer"  ? "✓ Buyer ชนะ"
                  : resolution === "to_seller" ? "✓ Seller ชนะ"
                  : resolution === "split"     ? `✓ แบ่ง ${splitPct}/${100 - splitPct}`
                  : "เลือกการตัดสินก่อน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium ${
          toast.type === "ok"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
