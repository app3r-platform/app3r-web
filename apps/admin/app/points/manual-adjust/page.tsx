"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface AdjustHistory {
  id: string;
  user_id: number;
  user_name: string;
  currency: "gold" | "silver";
  amount: number;
  reason: string;
  admin_id: number;
  created_at: string;
}

const MAX_PER_TX = 1000; // D28 default

export default function ManualAdjustPage() {
  const router = useRouter();
  const [isSuper, setIsSuper] = useState(false);
  const [userId, setUserId] = useState("");
  const [currency, setCurrency] = useState<"gold" | "silver">("gold");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<AdjustHistory[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [maxLimit, setMaxLimit] = useState(MAX_PER_TX);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  async function fetchHistory() {
    try {
      const d = await api.get<{ items: AdjustHistory[] }>("/admin/platform/points/manual-adjust/history");
      setHistory(d.items);
    } catch { /* ignore */ }
  }

  async function fetchConfig() {
    try {
      const d = await api.get<{ manual_adjust_max_per_transaction: number }>("/admin/config/keys/manual_adjust_max_per_transaction");
      setMaxLimit(d.manual_adjust_max_per_transaction);
    } catch { /* use default */ }
  }

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    const sa = isSuperAdmin();
    setIsSuper(sa);
    if (!sa) return; // don't fetch if not super
    fetchConfig();
    fetchHistory();
  }, [router]);

  const amountNum = Number(amount);
  const amountValid = !isNaN(amountNum) && amountNum !== 0 && Math.abs(amountNum) <= maxLimit;

  async function handleSubmit() {
    if (confirmText !== "CONFIRM") return;
    setSubmitting(true);
    try {
      await api.post("/admin/platform/points/manual-adjust", {
        user_id: Number(userId),
        currency,
        amount: amountNum,
        reason,
      });
      showToast("✅ ปรับยอดสำเร็จ");
      setShowModal(false);
      setUserId(""); setAmount(""); setReason(""); setConfirmText("");
      fetchHistory();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  // Not super admin: show access denied
  if (!isSuper && typeof window !== "undefined") {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Super Admin Only</h2>
            <p className="text-gray-400 text-sm">หน้านี้ต้องการสิทธิ์ Super Admin เท่านั้น (D27)</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-1">Manual Adjust Points</h1>
        <p className="text-gray-400 text-sm mb-6">ปรับยอด Gold/Silver Point ด้วยตนเอง — Super Admin Only (D27)</p>

        {/* D28 Limit Indicator */}
        <div className="mb-6 bg-orange-900/20 border border-orange-800/50 rounded-xl p-4 flex items-center gap-3">
          <span className="text-orange-400 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-orange-300">D28 — Limit ต่อครั้ง: {maxLimit.toLocaleString()} points</p>
            <p className="text-xs text-gray-500 mt-0.5">ค่าบวก = เพิ่ม, ค่าลบ = ลด | ทุกการเปลี่ยนแปลงจะถูกบันทึกใน Audit Log</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8 max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">User ID *</label>
              <input type="number" value={userId} onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                placeholder="เช่น 12345" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">สกุลเงิน</label>
              <div className="flex gap-2">
                {(["gold", "silver"] as const).map((c) => (
                  <button key={c} onClick={() => setCurrency(c)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currency === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}>
                    {c === "gold" ? "🥇 Gold" : "🥈 Silver"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">จำนวน *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm focus:outline-none text-white ${
                  amount && !amountValid ? "border-red-600" : "border-gray-700 focus:border-blue-500"
                }`}
                placeholder={`เช่น 500 (สูงสุด ±${maxLimit.toLocaleString()})`} />
              {amount && !amountValid && (
                <p className="text-xs text-red-400 mt-1">จำนวนต้องไม่เกิน ±{maxLimit.toLocaleString()}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">เหตุผล * (≥ 10 ตัวอักษร)</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white resize-none"
                placeholder="ระบุเหตุผลการปรับยอด..." />
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={!userId || !amountValid || reason.length < 10}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
              ดำเนินการ
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold">📋 ประวัติ Manual Adjust</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="px-6 py-3">เวลา</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">สกุลเงิน</th>
                <th className="px-6 py-3 text-right">จำนวน</th>
                <th className="px-6 py-3">เหตุผล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(h.created_at).toLocaleString("th-TH")}
                  </td>
                  <td className="px-6 py-3">{h.user_name} <span className="text-gray-500">#{h.user_id}</span></td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.currency === "gold" ? "bg-yellow-900/50 text-yellow-400" : "bg-gray-800 text-gray-300"}`}>
                      {h.currency}
                    </span>
                  </td>
                  <td className={`px-6 py-3 text-right font-mono font-semibold ${h.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {h.amount >= 0 ? "+" : ""}{h.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs max-w-[200px] truncate">{h.reason}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">ไม่มีประวัติ</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Confirm Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 text-orange-400">⚠️ ยืนยันการปรับยอด</h3>
              <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-2 text-sm">
                <p><span className="text-gray-400">User ID:</span> <span className="font-mono">{userId}</span></p>
                <p><span className="text-gray-400">สกุล:</span> {currency === "gold" ? "🥇 Gold" : "🥈 Silver"}</p>
                <p>
                  <span className="text-gray-400">จำนวน:</span>{" "}
                  <span className={`font-bold font-mono ${amountNum >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {amountNum >= 0 ? "+" : ""}{amountNum.toLocaleString()}
                  </span>
                </p>
                <p><span className="text-gray-400">เหตุผล:</span> {reason}</p>
              </div>

              <p className="text-sm text-gray-400 mb-2">พิมพ์ <strong className="text-white">CONFIRM</strong> เพื่อยืนยัน:</p>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white font-mono mb-4"
                placeholder="CONFIRM" />

              <div className="flex gap-3">
                <button onClick={() => { setShowModal(false); setConfirmText(""); }}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                  ยกเลิก
                </button>
                <button onClick={handleSubmit} disabled={confirmText !== "CONFIRM" || submitting}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
                  {submitting ? "กำลังดำเนินการ..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-sm shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
