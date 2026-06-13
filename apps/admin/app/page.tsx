"use client";
/**
 * Dashboard — Wave1 Shell
 * Screen: A-01 (Dashboard)
 *
 * Uses api-client + mock-fixtures (RC-1 fallback) for user stats.
 * WalletDisplay: read-only Gold/Silver balance (D6 mock-fixtures).
 *
 * TODO: REMOVE BEFORE PROD — mock fallback (TD-Wave1)
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getAdminClient } from "@/lib/auth-client";
import { Sidebar } from "@/components/sidebar";
import { WalletDisplay } from "@/components/WalletDisplay";
import type { UserMeResponse } from "@app3r/shared/src/api-client";

// mock fallback user list — ลบตอน Phase 4 (TD-06)
const MOCK_USERS: UserMeResponse[] = [
  { id: "user-weeeu-001", email: "weeeu@app3r.test", role: "weeeu", displayName: "สมชาย ท.", phone: null, avatarUrl: null, goldBalance: 350 },
  { id: "user-weeer-001", email: "weeer@app3r.test", role: "weeer", displayName: "ร้านซ่อมดี", phone: null, avatarUrl: null, goldBalance: 0 },
  { id: "user-weeet-001", email: "weeet@app3r.test", role: "weeet", displayName: "ช่างเอง", phone: null, avatarUrl: null, goldBalance: 0 },
];
const MOCK_TOTAL = 3;

export default function Dashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<UserMeResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }

    // Wave1: use api-client for user data with RC-1 mock fallback
    const client = getAdminClient();
    client.admin
      .getModerationQueue()
      .then((result) => {
        if (result.ok && Array.isArray(result.data.items)) {
          const items = result.data.items as UserMeResponse[];
          setUsers(items.slice(0, 5));
          setTotal(items.length);
        } else {
          throw new Error("moderation queue unavailable");
        }
      })
      .catch((e) => {
        console.warn("[mock fallback] dashboard users:", e);
        setUsers(MOCK_USERS);
        setTotal(MOCK_TOTAL);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">ภาพรวมระบบ</h1>
            <p className="text-gray-500 text-sm">ระบบจัดการแพลตฟอร์ม App3R</p>
          </div>
          {/* Wallet display (read-only, from api-client + mock-fixtures D6) */}
          <WalletDisplay />
        </div>

        {loading ? (
          <p className="text-gray-500 animate-pulse">กำลังโหลด…</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard icon="👥" label="ผู้ใช้ทั้งหมด" value={total} sub="ทั้งระบบ (mock)" />
              <StatCard
                icon="⏳"
                label="WeeeR รออนุมัติ"
                value={users.filter((u) => u.role === "weeer").length}
                sub="รอดำเนินการ"
                alert={users.some((u) => u.role === "weeer")}
              />
              <StatCard icon="✅" label="สถานะระบบ" value="พร้อมใช้งาน" sub="" green />
            </div>

            {/* Recent users */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold">ผู้ใช้ล่าสุด</h2>
                <span className="text-xs text-gray-400">mock data · Wave1</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">ชื่อ</th>
                    <th className="px-6 py-3">อีเมล</th>
                    <th className="px-6 py-3">บทบาท</th>
                    <th className="px-6 py-3 text-right">พอยต์ทอง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-400 text-xs font-mono">
                        {u.id.slice(0, 8)}…
                      </td>
                      <td className="px-6 py-3 font-medium">{u.displayName ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-500">{u.email}</td>
                      <td className="px-6 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-yellow-700">
                        {u.goldBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, alert, green,
}: {
  icon: string; label: string; value: string | number;
  sub: string; alert?: boolean; green?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 ${alert ? "border-yellow-400" : "border-gray-200"}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div
        className={`text-2xl font-bold ${
          green ? "text-green-600" : alert ? "text-yellow-700" : "text-gray-900"
        }`}
      >
        {value}
      </div>
      <div className="text-sm text-gray-600 mt-0.5">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin:  "bg-blue-100 text-blue-800",
    weeer:  "bg-green-100 text-green-800",
    weeeu:  "bg-pink-100 text-pink-800",
    weeet:  "bg-orange-100 text-orange-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[role] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {role}
    </span>
  );
}
