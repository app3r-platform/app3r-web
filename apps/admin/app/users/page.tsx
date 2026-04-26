"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeeRProfile {
  shop_name: string;
  address: string | null;
  approved_at: string | null;
}

interface User {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  weeer_profile: WeeeRProfile | null;
}

interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (approvedFilter !== "") params.set("is_approved", approvedFilter);

      const result = await api.get<PaginatedUsers>(`/admin/users?${params}`);
      setData(result);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [page, search, role, approvedFilter, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchUsers();
  }, [fetchUsers, router]);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleApprove(userId: number) {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      showToast("อนุมัติ WeeeR สำเร็จ ✓", "ok");
      fetchUsers();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeactivate(userId: number) {
    if (!confirm("ต้องการระงับการใช้งานของผู้ใช้คนนี้?")) return;
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/deactivate`);
      showToast("ระงับผู้ใช้สำเร็จ", "ok");
      fetchUsers();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setActionLoading(null);
    }
  }

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleFilterChange(newRole: string, newApproved: string) {
    setPage(1);
    setRole(newRole);
    setApprovedFilter(newApproved);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">จัดการผู้ใช้งาน</h1>
          {data && (
            <span className="text-sm text-gray-400">
              ทั้งหมด{" "}
              <span className="text-white font-semibold">{data.total}</span>{" "}
              คน
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-6">
          อนุมัติ WeeeR · ระงับผู้ใช้ · ค้นหาและกรองข้อมูล
        </p>

        {/* Search + Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[240px]">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ค้นหาชื่อ หรือ email..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              ค้นหา
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                className="text-gray-400 hover:text-white text-sm px-3 py-2.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
              >
                ✕
              </button>
            )}
          </form>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => handleFilterChange(e.target.value, approvedFilter)}
            className="bg-gray-800 border border-gray-700 text-sm text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุก Role</option>
            <option value="admin">Admin</option>
            <option value="weeer">WeeeR (ร้านซ่อม)</option>
            <option value="weeeu">WeeeU (ลูกค้า)</option>
            <option value="weeet">WeeeT (ช่าง)</option>
          </select>

          {/* Approval Filter */}
          <select
            value={approvedFilter}
            onChange={(e) => handleFilterChange(role, e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="false">รออนุมัติ</option>
            <option value="true">อนุมัติแล้ว</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <span className="animate-spin mr-3 text-xl">⟳</span> กำลังโหลด...
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p>ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-5 py-3 w-12">ID</th>
                  <th className="px-5 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-5 py-3">ติดต่อ</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">สถานะ</th>
                  <th className="px-5 py-3">สมัครเมื่อ</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.items.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-800/50 transition-colors ${!user.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{user.id}</td>

                    {/* ชื่อ + ชื่อร้าน */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{user.full_name}</div>
                      {user.weeer_profile && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          🏪 {user.weeer_profile.shop_name}
                        </div>
                      )}
                    </td>

                    {/* ติดต่อ */}
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {user.email && <div>{user.email}</div>}
                      {user.phone && <div>{user.phone}</div>}
                    </td>

                    {/* Role Badge */}
                    <td className="px-5 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* สถานะ */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        {!user.is_active && (
                          <span className="text-xs text-red-400">⛔ ระงับแล้ว</span>
                        )}
                        {user.role === "weeer" && (
                          user.is_approved
                            ? <span className="text-xs text-green-400">✓ อนุมัติแล้ว</span>
                            : <span className="text-xs text-yellow-400">⏳ รออนุมัติ</span>
                        )}
                        {user.role !== "weeer" && user.is_active && (
                          <span className="text-xs text-gray-500">ปกติ</span>
                        )}
                      </div>
                    </td>

                    {/* วันสมัคร */}
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString("th-TH", {
                        day: "2-digit", month: "short", year: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 justify-end">
                        {/* Approve — แสดงเฉพาะ WeeeR ที่ยังไม่อนุมัติ และ active */}
                        {user.role === "weeer" && !user.is_approved && user.is_active && (
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 disabled:bg-green-900 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                          >
                            {actionLoading === user.id ? "..." : "✓ Approve"}
                          </button>
                        )}

                        {/* Deactivate — แสดงเฉพาะ user ที่ active และไม่ใช่ตัวเอง */}
                        {user.is_active && (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white rounded-lg transition-colors"
                          >
                            {actionLoading === user.id ? "..." : "⛔ ระงับ"}
                          </button>
                        )}
                      </div>
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
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                ← ก่อนหน้า
              </button>

              {/* Page numbers */}
              {Array.from({ length: data.pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}

              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all ${
            toast.type === "ok"
              ? "bg-green-700 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin:  "bg-purple-900 text-purple-300",
    weeer:  "bg-green-900  text-green-300",
    weeeu:  "bg-blue-900   text-blue-300",
    weeet:  "bg-orange-900 text-orange-300",
  };
  const labels: Record<string, string> = {
    admin: "Admin",
    weeer: "WeeeR",
    weeeu: "WeeeU",
    weeet: "WeeeT",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role] ?? "bg-gray-800 text-gray-300"}`}>
      {labels[role] ?? role}
    </span>
  );
}
