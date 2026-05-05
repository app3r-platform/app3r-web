"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface GoldReserve {
  reserve_pool: number;
  total_minted: number;
  total_destroyed: number;
  total_written_off: number;
}
interface FeePools {
  listing_offer_fee_pool: number;
  platform_fee_pool: number;
  advertising_pool: number;
  escrow_pool: number;
}
interface GoldData { reserve: GoldReserve; fee_pools: FeePools; }

type ModalAction = "mint" | "destroy" | "writeoff" | null;

export default function GoldManagementPage() {
  const router = useRouter();
  const [data, setData] = useState<GoldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"reserve" | "fee">("reserve");
  const [modal, setModal] = useState<ModalAction>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirm2, setConfirm2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const isSuper = isSuperAdmin();

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<GoldData>("/admin/platform/gold");
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  async function handleSubmit() {
    if (!confirm2 || !amount || !reason) return;
    setSubmitting(true);
    try {
      const path = modal === "mint" ? "/admin/platform/gold/mint"
                 : modal === "destroy" ? "/admin/platform/gold/destroy"
                 : "/admin/platform/gold/writeoff";
      await api.post(path, { amount: Number(amount), reason });
      showToast(`✅ ${modal} สำเร็จ`);
      closeModal();
      fetchData();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    setModal(null); setAmount(""); setReason(""); setConfirm2(false);
  }

  const fmtG = (v: number) => v.toLocaleString() + " G";

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-1">Gold Management</h1>
        <p className="text-gray-400 text-sm mb-6">จัดการ Gold Point Reserve Pool และ Fee Pools</p>

        {/* Super Admin Notice */}
        {!isSuper && (
          <div className="mb-6 bg-orange-900/30 border border-orange-800 rounded-xl p-4 text-orange-300 text-sm">
            ⚠️ การ Mint / Destroy / Write-off ต้องการสิทธิ์ <strong>Super Admin</strong>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {(["reserve", "fee"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {t === "reserve" ? "🏦 Reserve Pool" : "💰 Fee Pools"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : data && (
          <>
            {tab === "reserve" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoCard label="Reserve Pool" value={fmtG(data.reserve.reserve_pool)} accent="green" />
                  <InfoCard label="Total Minted" value={fmtG(data.reserve.total_minted)} accent="blue" />
                  <InfoCard label="Total Destroyed" value={fmtG(data.reserve.total_destroyed)} accent="red" />
                  <InfoCard label="Written-Off" value={fmtG(data.reserve.total_written_off)} accent="gray" />
                </div>

                {/* D17 Invariant */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-sm text-gray-400">
                  <p className="font-semibold text-gray-300 mb-1">📐 D17 Invariant</p>
                  <code className="text-xs text-green-400">
                    Total Minted = Reserve + Fee Pools + Escrow + Written-Off (ต้องสมดุลเสมอ)
                  </code>
                </div>

                {/* Actions */}
                {isSuper && (
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setModal("mint")}
                      className="px-5 py-2.5 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors">
                      ➕ Mint Gold
                    </button>
                    <button onClick={() => setModal("destroy")}
                      className="px-5 py-2.5 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors">
                      🔥 Destroy Gold
                    </button>
                    <button onClick={() => setModal("writeoff")}
                      className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
                      📝 Write-Off
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === "fee" && (
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Listing Offer Fee Pool" value={fmtG(data.fee_pools.listing_offer_fee_pool)} accent="yellow" />
                <InfoCard label="Platform Fee Pool" value={fmtG(data.fee_pools.platform_fee_pool)} accent="yellow" />
                <InfoCard label="Advertising Pool" value={fmtG(data.fee_pools.advertising_pool)} accent="purple" />
                <InfoCard label="Escrow Pool" value={fmtG(data.fee_pools.escrow_pool)} accent="blue" />
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={closeModal}>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">
                {modal === "mint" ? "➕ Mint Gold" : modal === "destroy" ? "🔥 Destroy Gold" : "📝 Write-Off Gold"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">จำนวน (Gold)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="เช่น 1000" min="1" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">เหตุผล (จำเป็น)</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="ระบุเหตุผลการดำเนินการ..." />
                </div>

                <div className="bg-orange-900/30 border border-orange-800 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={confirm2} onChange={(e) => setConfirm2(e.target.checked)}
                      className="mt-0.5 rounded" />
                    <span className="text-sm text-orange-300">
                      ⚠️ ฉันเข้าใจว่าการดำเนินการนี้จะถูกบันทึกใน Audit Log และไม่สามารถยกเลิกได้
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                  ยกเลิก
                </button>
                <button onClick={handleSubmit}
                  disabled={!confirm2 || !amount || !reason || submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
                  {submitting ? "กำลังดำเนินการ..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-sm shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    green: "text-green-400", blue: "text-blue-400", red: "text-red-400",
    yellow: "text-yellow-400", purple: "text-purple-400", gray: "text-gray-300",
  };
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[accent] ?? "text-white"}`}>{value}</p>
    </div>
  );
}
