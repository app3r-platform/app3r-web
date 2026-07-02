"use client";
// Sub-5a D80 list — points
// D-FE-NO-FAKE-DISPLAY: the previous implementation rendered a 100% fabricated
// point ledger from useAdminPointsStore (seeded by lib/mocks/points.seed.ts,
// 100 synthetic rows) and offered create/update/delete CRUD that mutated only
// local mock state (a false impression of editing a real ledger). Removed.
// Now wired to the canonical admin api.get pattern. No admin point-ledger LIST
// endpoint is mounted yet, so the fetch will fail and the page honestly renders
// an ERROR/EMPTY state instead of fake money — never seed data.
// TODO(backend-expose): admin point-ledger list endpoint not mounted

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface PointRecord {
  id: string;
  userName: string;
  type: string;
  amount: number;
  status: string;
  transactedAt: string;
}
interface PointList {
  items: PointRecord[];
  total: number;
}

export default function PointsPage() {
  const router = useRouter();
  const [items, setItems] = useState<PointRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Intended admin point-ledger list endpoint — NOT mounted yet.
      // TODO(backend-expose): admin point-ledger list endpoint not mounted
      const d = await api.get<PointList>("/admin/platform/points");
      setItems(d.items);
      setTotal(d.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-1">Point Transactions</h1>
        <p className="text-gray-500 text-sm mb-6">
          ประวัติธุรกรรมพอยต์ระดับ Platform
        </p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : error ? (
            <div className="px-6 py-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
                {error}
              </div>
            </div>
          ) : items.length === 0 ? (
            <p className="px-6 py-10 text-center text-gray-600">ไม่พบรายการ</p>
          ) : (
            <>
              <div className="px-6 py-3 border-b border-gray-200 text-sm text-gray-500">
                ทั้งหมด {total.toLocaleString()} รายการ
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-gray-200">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">ผู้ใช้</th>
                    <th className="px-4 py-3">ประเภท</th>
                    <th className="px-4 py-3 text-right">จำนวน</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-100/40">
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{row.id}</td>
                      <td className="px-4 py-3">{row.userName}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{row.type}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {row.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(row.transactedAt).toLocaleDateString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
