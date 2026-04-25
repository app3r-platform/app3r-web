"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface User { id: number; full_name: string; role: string; is_approved: boolean; }

export default function Dashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    api.get<User[]>("/admin/users?limit=5")
      .then(setUsers)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const pending = users.filter((u) => u.role === "weeer" && !u.is_approved).length;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm mb-8">ภาพรวมระบบ App3R</p>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard icon="👥" label="ผู้ใช้ทั้งหมด" value={users.length} sub="5 ล่าสุด" />
              <StatCard icon="⏳" label="WeeeR รออนุมัติ" value={pending} sub="รอดำเนินการ" alert={pending > 0} />
              <StatCard icon="✅" label="API Status" value="Online" sub="port 8000" green />
            </div>

            {/* Recent users */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold">ผู้ใช้ล่าสุด</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">ชื่อ</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-3 text-gray-400">{u.id}</td>
                      <td className="px-6 py-3">{u.full_name}</td>
                      <td className="px-6 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-3">
                        {u.is_approved
                          ? <span className="text-green-400 text-xs">✓ อนุมัติแล้ว</span>
                          : <span className="text-yellow-400 text-xs">⏳ รออนุมัติ</span>}
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

function StatCard({ icon, label, value, sub, alert, green }: {
  icon: string; label: string; value: string | number;
  sub: string; alert?: boolean; green?: boolean;
}) {
  return (
    <div className={`bg-gray-900 rounded-xl border p-5 ${alert ? "border-yellow-700" : "border-gray-800"}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${green ? "text-green-400" : alert ? "text-yellow-400" : "text-white"}`}>
        {value}
      </div>
      <div className="text-sm text-gray-400 mt-0.5">{label}</div>
      <div className="text-xs text-gray-600 mt-1">{sub}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-purple-900 text-purple-300",
    weeer: "bg-green-900 text-green-300",
    weeeu: "bg-blue-900 text-blue-300",
    weeet: "bg-orange-900 text-orange-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] ?? "bg-gray-800 text-gray-300"}`}>
      {role}
    </span>
  );
}
