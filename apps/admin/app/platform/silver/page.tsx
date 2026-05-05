"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface SilverSummary {
  total_supply: number;
  total_distributed: number;
  total_expired: number;
  active_holders: number;
}
interface TriggerSetting {
  key: string;
  label: string;
  points: number;
  enabled: boolean;
}
interface RecentTx {
  id: string;
  user_id: number;
  user_name: string;
  type: string;
  amount: number;
  created_at: string;
}
interface ExpiryBatchResult {
  expired_count: number;
  total_points_expired: number;
  ran_at: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  silver_reward_scrap: "รับซาก (Scrap)",
  silver_reward_review: "รีวิว (Review)",
  silver_reward_referral: "แนะนำเพื่อน (Referral)",
  silver_reward_firsttime: "ครั้งแรก (First-time)",
  silver_reward_milestone_5: "Milestone 5 งาน",
  silver_reward_milestone_10: "Milestone 10 งาน",
  silver_reward_milestone_20: "Milestone 20 งาน",
  silver_reward_birthday: "วันเกิด (Birthday)",
};

type Tab = "summary" | "triggers" | "expiry" | "recent";

export default function SilverPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("summary");
  const [summary, setSummary] = useState<SilverSummary | null>(null);
  const [triggers, setTriggers] = useState<TriggerSetting[]>([]);
  const [recent, setRecent] = useState<RecentTx[]>([]);
  const [expiryResult, setExpiryResult] = useState<ExpiryBatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningExpiry, setRunningExpiry] = useState(false);
  const [signupBonus, setSignupBonus] = useState(false);
  const [signupPoints, setSignupPoints] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3000);
  };

  const fetchSummary = useCallback(async () => {
    const d = await api.get<SilverSummary>("/admin/platform/silver/summary");
    setSummary(d);
  }, []);

  const fetchTriggers = useCallback(async () => {
    const d = await api.get<{ triggers: TriggerSetting[]; signup_bonus_enabled: boolean; signup_bonus_points: number }>(
      "/admin/platform/silver/triggers"
    );
    setTriggers(d.triggers);
    setSignupBonus(d.signup_bonus_enabled);
    setSignupPoints(d.signup_bonus_points);
  }, []);

  const fetchRecent = useCallback(async () => {
    const d = await api.get<{ items: RecentTx[] }>("/admin/platform/silver/recent");
    setRecent(d.items);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    Promise.all([fetchSummary(), fetchTriggers(), fetchRecent()]).finally(() => setLoading(false));
  }, [router, fetchSummary, fetchTriggers, fetchRecent]);

  async function runExpiry() {
    setRunningExpiry(true);
    try {
      const r = await api.post<ExpiryBatchResult>("/admin/platform/silver/expiry/run", {});
      setExpiryResult(r);
      showToast("✅ Expiry batch รันเสร็จ");
      fetchSummary();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setRunningExpiry(false);
    }
  }

  async function saveTrigger(key: string, points: number, enabled: boolean) {
    try {
      await api.patch("/admin/platform/silver/triggers/" + key, { points, enabled });
      showToast("✅ บันทึกสำเร็จ");
      fetchTriggers();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    }
  }

  async function saveSignupBonus() {
    try {
      await api.patch("/admin/platform/silver/signup-bonus", { enabled: signupBonus, points: signupPoints });
      showToast("✅ บันทึก Signup Bonus สำเร็จ");
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "summary", label: "📊 Summary" },
    { key: "triggers", label: "⚙️ Trigger Settings" },
    { key: "expiry", label: "⏰ Expiry Batch" },
    { key: "recent", label: "📋 Recent" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-1">Silver Points</h1>
        <p className="text-gray-400 text-sm mb-6">จัดการ Silver Point (non-cashable) ตาม D29 + D30</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : (
          <>
            {/* Summary Tab */}
            {tab === "summary" && summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SCard label="Total Supply" value={summary.total_supply.toLocaleString() + " S"} color="gray" />
                <SCard label="Total Distributed" value={summary.total_distributed.toLocaleString() + " S"} color="blue" />
                <SCard label="Total Expired" value={summary.total_expired.toLocaleString() + " S"} color="red" />
                <SCard label="Active Holders" value={summary.active_holders.toLocaleString()} color="green" />
              </div>
            )}

            {/* Triggers Tab */}
            {tab === "triggers" && (
              <div className="space-y-6">
                {/* D29 Engagement Triggers */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-800">
                    <h3 className="font-semibold">🎯 D29 — Silver Engagement Rewards</h3>
                    <p className="text-xs text-gray-500 mt-0.5">8 triggers กำหนดได้ผ่าน system_config</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="px-6 py-3">Trigger</th>
                        <th className="px-6 py-3">Points</th>
                        <th className="px-6 py-3">สถานะ</th>
                        <th className="px-6 py-3">บันทึก</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {triggers.map((t) => (
                        <TriggerRow key={t.key} trigger={t} onSave={saveTrigger} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* D30 Signup Bonus */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold mb-4">🎁 D30 — Signup Bonus</h3>
                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`relative w-10 h-6 rounded-full transition-colors ${signupBonus ? "bg-blue-600" : "bg-gray-700"}`}
                        onClick={() => setSignupBonus(!signupBonus)}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${signupBonus ? "translate-x-5" : "translate-x-1"}`} />
                      </div>
                      <span className="text-sm">{signupBonus ? "เปิดใช้งาน" : "ปิด (default)"}</span>
                    </label>
                    {signupBonus && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Points:</label>
                        <input type="number" value={signupPoints} onChange={(e) => setSignupPoints(Number(e.target.value))}
                          className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none" />
                      </div>
                    )}
                    <button onClick={saveSignupBonus}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors">
                      บันทึก
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expiry Batch Tab */}
            {tab === "expiry" && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold mb-2">⏰ Run Expiry Batch</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    รัน batch หมดอายุ Silver Point ด้วยตนเอง (ปกติรันอัตโนมัติทุกคืน 02:00)
                  </p>
                  <button onClick={runExpiry} disabled={runningExpiry}
                    className="px-5 py-2.5 bg-orange-700 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
                    {runningExpiry ? "กำลังรัน..." : "▶ Run Expiry Batch Now"}
                  </button>
                </div>

                {expiryResult && (
                  <div className="bg-green-900/20 border border-green-800 rounded-xl p-5">
                    <p className="font-semibold text-green-400 mb-2">✅ ผลการรัน</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">จำนวน records</p>
                        <p className="font-bold text-white">{expiryResult.expired_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Points หมดอายุ</p>
                        <p className="font-bold text-white">{expiryResult.total_points_expired.toLocaleString()} S</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      รันเมื่อ: {new Date(expiryResult.ran_at).toLocaleString("th-TH")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Tab */}
            {tab === "recent" && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h3 className="font-semibold">📋 Recent Silver Transactions</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left">
                      <th className="px-6 py-3">เวลา</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">ประเภท</th>
                      <th className="px-6 py-3 text-right">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {recent.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-3 text-gray-400 text-xs">
                          {new Date(tx.created_at).toLocaleString("th-TH")}
                        </td>
                        <td className="px-6 py-3">{tx.user_name}</td>
                        <td className="px-6 py-3">
                          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{tx.type}</span>
                        </td>
                        <td className={`px-6 py-3 text-right font-mono font-semibold ${tx.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()} S
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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

function SCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    gray: "text-gray-300", blue: "text-blue-400", red: "text-red-400", green: "text-green-400",
  };
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[color] ?? "text-white"}`}>{value}</p>
    </div>
  );
}

function TriggerRow({
  trigger, onSave
}: {
  trigger: TriggerSetting;
  onSave: (key: string, points: number, enabled: boolean) => void;
}) {
  const [pts, setPts] = useState(trigger.points);
  const [enabled, setEnabled] = useState(trigger.enabled);

  return (
    <tr className="hover:bg-gray-800/30">
      <td className="px-6 py-3">
        {TRIGGER_LABELS[trigger.key] ?? trigger.key}
      </td>
      <td className="px-6 py-3">
        <input type="number" value={pts} onChange={(e) => setPts(Number(e.target.value))}
          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none" />
      </td>
      <td className="px-6 py-3">
        <button onClick={() => setEnabled(!enabled)}
          className={`w-10 h-6 rounded-full transition-colors relative ${enabled ? "bg-blue-600" : "bg-gray-700"}`}>
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </td>
      <td className="px-6 py-3">
        <button onClick={() => onSave(trigger.key, pts, enabled)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors">
          บันทึก
        </button>
      </td>
    </tr>
  );
}
