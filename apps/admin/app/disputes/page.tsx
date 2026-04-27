"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisputeItem {
  listing_id: number;
  title: string;
  service_type: string;
  poster_id: number;
  poster_name: string;
  buyer_id: number | null;
  buyer_name: string;
  seller_id: number | null;
  seller_name: string;
  final_price: number;
  escrow_amount: number;
  transaction_id: number | null;
  disputed_at: string;
}

interface PaginatedDisputes {
  items: DisputeItem[];
  total: number;
  page: number;
  pages: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DisputesPage() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedDisputes | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [page, setPage] = useState(1);

  // Resolve modal
  const [resolveModal, setResolveModal] = useState<DisputeItem | null>(null);
  const [resolution, setResolution] = useState<"to_buyer" | "to_seller" | "">("");
  const [adminNote, setAdminNote] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
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

  // ── Resolve ────────────────────────────────────────────────────────────────
  async function handleResolve() {
    if (!resolveModal || !resolution) {
      showToast("กรุณาเลือกฝ่ายที่ชนะ", "err");
      return;
    }
    setActionLoading(resolveModal.listing_id);
    try {
      const res = await api.patch<{ resolved: string; message: string }>(
        `/admin/disputes/${resolveModal.listing_id}/resolve`,
        { resolution, admin_note: adminNote || null }
      );
      showToast(res.message, "ok");
      setResolveModal(null);
      setResolution("");
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

  const serviceTypeLabel: Record<string, string> = {
    A: "Secondhand", B: "Scrap", C: "Repair", D: "Maintenance",
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">จัดการข้อพิพาท</h1>
          {data && (
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              data.total > 0 ? "bg-red-700 text-white" : "bg-gray-800 text-gray-400"
            }`}>
              {data.total > 0 ? `⚠ รอตัดสิน ${data.total} รายการ` : "ไม่มีข้อพิพาท"}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Listings ที่ buyer ยื่นข้อพิพาท — escrow ค้างจนกว่า Admin จะตัดสิน
        </p>

        {/* Info Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-5 text-sm">
          <p className="text-gray-400 mb-2 font-medium">กฎการตัดสิน:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3">
              <div className="font-semibold text-blue-300 mb-1">ตัดสินให้ Buyer ชนะ</div>
              <div className="text-xs text-gray-400">คืน escrow เต็มจำนวนให้ buyer • seller ไม่ได้รับอะไร • listing เป็น CANCELLED</div>
            </div>
            <div className="bg-green-950 border border-green-800 rounded-lg p-3">
              <div className="font-semibold text-green-300 mb-1">ตัดสินให้ Seller ชนะ</div>
              <div className="text-xs text-gray-400">โอน escrow เต็มจำนวนให้ seller • ไม่หัก platform fee • listing เป็น COMPLETED</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <span className="animate-spin mr-3 text-xl">⟳</span> กำลังโหลด...
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="text-5xl mb-3">⚖️</div>
              <p className="text-lg font-medium text-white mb-1">ไม่มีข้อพิพาทที่รอตัดสิน</p>
              <p className="text-sm">ทุก listing อยู่ในสภาพปกติ</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">ประเภท</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Seller</th>
                  <th className="px-5 py-3">Escrow</th>
                  <th className="px-5 py-3">เวลาที่พิพาท</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.items.map((item) => (
                  <tr key={item.listing_id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID: {item.listing_id} · TX: {item.transaction_id ?? "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <ServiceTypeBadge type={item.service_type} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-blue-300">{item.buyer_name}</div>
                      <div className="text-xs text-gray-500">UID: {item.buyer_id}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-green-300">{item.seller_name}</div>
                      <div className="text-xs text-gray-500">UID: {item.seller_id}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-lg font-bold text-yellow-400">
                        {item.escrow_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">Points ค้างอยู่</div>
                    </td>

                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(item.disputed_at).toLocaleDateString("th-TH", {
                        day: "2-digit", month: "short", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => setResolveModal(item)}
                        disabled={actionLoading === item.listing_id}
                        className="px-4 py-2 text-xs bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                      >
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg">
                ← ก่อนหน้า
              </button>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg">
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-1">ตัดสินข้อพิพาท</h3>
            <p className="text-sm text-gray-400 mb-5">
              Listing: <span className="text-white font-medium">{resolveModal.title}</span>
            </p>

            {/* Summary */}
            <div className="bg-gray-800 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">Buyer</div>
                <div className="text-blue-300 font-medium">{resolveModal.buyer_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Seller</div>
                <div className="text-green-300 font-medium">{resolveModal.seller_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Escrow ที่ค้างอยู่</div>
                <div className="text-yellow-400 font-bold text-lg">
                  {resolveModal.escrow_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} Points
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">ประเภทงาน</div>
                <ServiceTypeBadge type={resolveModal.service_type} />
              </div>
            </div>

            {/* Choice */}
            <p className="text-sm text-gray-400 mb-3 font-medium">เลือกฝ่ายที่ชนะ <span className="text-red-400">*</span></p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setResolution("to_buyer")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  resolution === "to_buyer"
                    ? "border-blue-500 bg-blue-950"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="font-semibold text-blue-300 mb-1">Buyer ชนะ</div>
                <div className="text-xs text-gray-400">
                  คืน {resolveModal.escrow_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} Points ให้ {resolveModal.buyer_name}
                </div>
                <div className="text-xs text-gray-600 mt-1">→ listing เป็น CANCELLED</div>
              </button>
              <button
                onClick={() => setResolution("to_seller")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  resolution === "to_seller"
                    ? "border-green-500 bg-green-950"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="font-semibold text-green-300 mb-1">Seller ชนะ</div>
                <div className="text-xs text-gray-400">
                  โอน {resolveModal.escrow_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} Points ให้ {resolveModal.seller_name}
                </div>
                <div className="text-xs text-gray-600 mt-1">→ listing เป็น COMPLETED</div>
              </button>
            </div>

            {/* Note */}
            <label className="block text-sm text-gray-400 mb-2">บันทึกของ Admin (ไม่บังคับ)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="เหตุผลการตัดสิน, หลักฐานที่พิจารณา..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-600 resize-none mb-5"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setResolveModal(null); setResolution(""); setAdminNote(""); }}
                className="flex-1 py-3 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution || actionLoading !== null}
                className={`flex-1 py-3 text-sm text-white rounded-xl transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                  resolution === "to_buyer"
                    ? "bg-blue-700 hover:bg-blue-600"
                    : resolution === "to_seller"
                    ? "bg-green-700 hover:bg-green-600"
                    : "bg-gray-700"
                }`}
              >
                {actionLoading !== null
                  ? "กำลังดำเนินการ..."
                  : resolution === "to_buyer"
                  ? "✓ ยืนยัน — Buyer ชนะ"
                  : resolution === "to_seller"
                  ? "✓ ยืนยัน — Seller ชนะ"
                  : "เลือกฝ่ายที่ชนะก่อน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium ${
          toast.type === "ok" ? "bg-green-700 text-white" : "bg-red-700 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    A: { label: "Secondhand", cls: "bg-blue-900 text-blue-300" },
    B: { label: "Scrap",      cls: "bg-gray-800 text-gray-300" },
    C: { label: "Repair",     cls: "bg-orange-900 text-orange-300" },
    D: { label: "Maintenance",cls: "bg-purple-900 text-purple-300" },
  };
  const s = map[type] ?? { label: type, cls: "bg-gray-800 text-gray-400" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
