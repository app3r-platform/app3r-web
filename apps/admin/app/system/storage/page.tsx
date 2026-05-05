"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface StorageSummary {
  total_bytes: number;
  total_files: number;
  total_photos: number;
  total_videos: number;
  by_entity: { entity_type: string; files: number; bytes: number }[];
}
interface TopUser {
  user_id: number;
  user_name: string;
  role: string;
  file_count: number;
  total_bytes: number;
}
interface ApplianceTransfer {
  id: string;
  transferred_at: string;
  appliance_id: string;
  from_user: string;
  from_role: string;
  to_user: string;
  to_role: string;
  price_points: number;
  announcement_id: string;
}
interface CleanupSchedule {
  file_type: string;
  retention: string;
  pending_count: number;
  last_cleanup_at: string | null;
}
interface AuditFile {
  id: string;
  file_path: string;
  owner_name: string;
  entity_type: string;
  size_bytes: number;
  uploaded_at: string;
  visibility: string;
  file_type: string;
}

type Tab = "overview" | "top-users" | "appliance" | "pdpa" | "audit";

const fmtBytes = (b: number): string => {
  if (b >= 1024 ** 3) return (b / 1024 ** 3).toFixed(2) + " GB";
  if (b >= 1024 ** 2) return (b / 1024 ** 2).toFixed(1) + " MB";
  if (b >= 1024) return (b / 1024).toFixed(0) + " KB";
  return b + " B";
};

export default function StoragePage() {
  const router = useRouter();
  const isSuper = isSuperAdmin();
  const [tab, setTab] = useState<Tab>("overview");

  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [transfers, setTransfers] = useState<ApplianceTransfer[]>([]);
  const [cleanup, setCleanup] = useState<CleanupSchedule[]>([]);
  const [auditFiles, setAuditFiles] = useState<AuditFile[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Filters for audit tab
  const [filterRole, setFilterRole] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterVis, setFilterVis] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchSummary = useCallback(async () => {
    const d = await api.get<StorageSummary>("/admin/storage/summary");
    setSummary(d);
  }, []);

  const fetchTopUsers = useCallback(async () => {
    const d = await api.get<{ items: TopUser[] }>("/admin/storage/top-users");
    setTopUsers(d.items);
  }, []);

  const fetchTransfers = useCallback(async () => {
    const d = await api.get<{ items: ApplianceTransfer[] }>("/admin/appliances/transfers");
    setTransfers(d.items);
  }, []);

  const fetchCleanup = useCallback(async () => {
    const d = await api.get<{ items: CleanupSchedule[] }>("/admin/storage/cleanup-schedule");
    setCleanup(d.items);
  }, []);

  const fetchAudit = useCallback(async () => {
    const params = new URLSearchParams({
      limit: "20",
      offset: String((auditPage - 1) * 20),
      ...(filterRole && { role: filterRole }),
      ...(filterEntity && { entity_type: filterEntity }),
      ...(filterVis && { visibility: filterVis }),
    });
    const d = await api.get<{ items: AuditFile[]; total: number }>("/admin/storage/files?" + params);
    setAuditFiles(d.items);
    setAuditTotal(d.total);
  }, [auditPage, filterRole, filterEntity, filterVis]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    Promise.all([fetchSummary(), fetchTopUsers(), fetchTransfers(), fetchCleanup(), fetchAudit()])
      .finally(() => setLoading(false));
  }, [router, fetchSummary, fetchTopUsers, fetchTransfers, fetchCleanup, fetchAudit]);

  async function runCleanup() {
    setRunningCleanup(true);
    try {
      const r = await api.post<{ deleted_count: number; bytes_freed: number }>("/admin/storage/cleanup/run", {});
      showToast(`✅ Cleanup เสร็จ: ลบ ${r.deleted_count} ไฟล์, คืน ${fmtBytes(r.bytes_freed)}`);
      fetchSummary();
      fetchCleanup();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setRunningCleanup(false);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "📊 Overview" },
    { key: "top-users", label: "👑 Top Users" },
    { key: "appliance", label: "🔄 Appliance History" },
    { key: "pdpa", label: "🗑️ PDPA Cleanup" },
    { key: "audit", label: "📁 File Audit" },
  ];

  const auditTotalPages = Math.ceil(auditTotal / 20);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Storage Admin</h1>
          <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            🔄 Auto-refresh 5 นาที
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-6">จัดการไฟล์ระบบ, PDPA Cleanup, และ Appliance Transfer (D20–D25)</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
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
            {/* Tab 1: Overview */}
            {tab === "overview" && summary && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <BigCard label="Total Storage" value={fmtBytes(summary.total_bytes)} />
                  <BigCard label="Total Files" value={summary.total_files.toLocaleString()} />
                  <BigCard label="Photos" value={summary.total_photos.toLocaleString()} />
                  <BigCard label="Videos" value={summary.total_videos.toLocaleString()} />
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-800">
                    <h3 className="font-semibold">Breakdown by Entity Type (D20)</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="px-6 py-3">Entity</th>
                        <th className="px-6 py-3 text-right">ไฟล์</th>
                        <th className="px-6 py-3 text-right">Storage</th>
                        <th className="px-6 py-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {summary.by_entity.map((row) => (
                        <tr key={row.entity_type} className="hover:bg-gray-800/50">
                          <td className="px-6 py-3 font-mono text-xs">{row.entity_type}</td>
                          <td className="px-6 py-3 text-right text-gray-300">{row.files.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right text-gray-300">{fmtBytes(row.bytes)}</td>
                          <td className="px-6 py-3 text-right text-gray-500 text-xs">
                            {((row.bytes / summary.total_bytes) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Top Users */}
            {tab === "top-users" && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left">
                      <th className="px-6 py-3">Rank</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3 text-right">ไฟล์</th>
                      <th className="px-6 py-3 text-right">Storage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {topUsers.map((u, i) => (
                      <tr key={u.user_id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-3 text-gray-500 font-mono">#{i + 1}</td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{u.user_name}</p>
                          <p className="text-xs text-gray-500">#{u.user_id}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{u.role}</span>
                        </td>
                        <td className="px-6 py-3 text-right text-gray-300">{u.file_count.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-300">{fmtBytes(u.total_bytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Appliance History (D22) */}
            {tab === "appliance" && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h3 className="font-semibold">Appliance Ownership History (D22)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">ประวัติการ Transfer ของ appliance ผ่าน Resell flow</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left">
                      <th className="px-6 py-3">เวลา</th>
                      <th className="px-6 py-3">Appliance</th>
                      <th className="px-6 py-3">จาก → ถึง</th>
                      <th className="px-6 py-3 text-right">ราคา (G)</th>
                      <th className="px-6 py-3">Announcement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(t.transferred_at).toLocaleString("th-TH")}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs">{t.appliance_id}</td>
                        <td className="px-6 py-3 text-xs">
                          <span className="text-gray-400">{t.from_user} ({t.from_role})</span>
                          <span className="text-gray-600 mx-1.5">→</span>
                          <span className="text-white">{t.to_user} ({t.to_role})</span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-yellow-400 font-semibold">
                          {t.price_points.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{t.announcement_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 4: PDPA Cleanup (D25) */}
            {tab === "pdpa" && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-800">
                    <h3 className="font-semibold">PDPA Retention Schedule (D25)</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="px-6 py-3">ประเภทไฟล์</th>
                        <th className="px-6 py-3">Retention</th>
                        <th className="px-6 py-3 text-right">รอลบ</th>
                        <th className="px-6 py-3">Last Cleanup</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {cleanup.map((row) => (
                        <tr key={row.file_type} className="hover:bg-gray-800/50">
                          <td className="px-6 py-3 font-medium">{row.file_type}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              row.retention === "ถาวร" ? "bg-gray-800 text-gray-400" :
                              row.retention.includes("10") ? "bg-orange-900/40 text-orange-400" :
                              "bg-red-900/30 text-red-400"
                            }`}>
                              {row.retention}
                            </span>
                          </td>
                          <td className={`px-6 py-3 text-right font-mono ${
                            row.pending_count > 0 ? "text-red-400 font-bold" : "text-gray-500"
                          }`}>
                            {row.pending_count > 0 ? row.pending_count.toLocaleString() : "—"}
                          </td>
                          <td className="px-6 py-3 text-gray-400 text-xs">
                            {row.last_cleanup_at
                              ? new Date(row.last_cleanup_at).toLocaleString("th-TH")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Manual Cleanup */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold mb-2">🗑️ Manual Cleanup</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    รัน cleanup ทันที — ข้ามรอ cron 02:00 รายวัน (Super Admin only)
                  </p>
                  {isSuper ? (
                    <button onClick={runCleanup} disabled={runningCleanup}
                      className="px-5 py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
                      {runningCleanup ? "กำลัง Cleanup..." : "▶ Run Cleanup Now"}
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">⚠️ ต้องการสิทธิ์ Super Admin</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: File Audit (D20) */}
            {tab === "audit" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-wrap gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setAuditPage(1); }}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white">
                      <option value="">ทั้งหมด</option>
                      {["weeeu", "weeer", "weeet", "admin"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Entity Type</label>
                    <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setAuditPage(1); }}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white">
                      <option value="">ทั้งหมด</option>
                      {["profile", "kyc", "appliances", "jobs", "disputes", "ads", "scrap"].map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Visibility</label>
                    <select value={filterVis} onChange={(e) => { setFilterVis(e.target.value); setAuditPage(1); }}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white">
                      <option value="">ทั้งหมด</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="restricted">Restricted</option>
                    </select>
                  </div>
                  {isSuper && (
                    <button
                      className="self-end px-4 py-2 bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-sm transition-colors">
                      🗑️ Bulk Delete (Super Admin)
                    </button>
                  )}
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between text-sm text-gray-400">
                    <span>ทั้งหมด {auditTotal.toLocaleString()} ไฟล์</span>
                    {auditTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage === 1}
                          className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40">‹</button>
                        <span>{auditPage} / {auditTotalPages}</span>
                        <button onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))} disabled={auditPage === auditTotalPages}
                          className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40">›</button>
                      </div>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="px-6 py-3">Path</th>
                        <th className="px-6 py-3">Owner</th>
                        <th className="px-6 py-3">Entity</th>
                        <th className="px-6 py-3 text-right">ขนาด</th>
                        <th className="px-6 py-3">Visibility</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {auditFiles.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-800/50">
                          <td className="px-6 py-3 font-mono text-xs text-gray-400 max-w-[200px] truncate">{f.file_path}</td>
                          <td className="px-6 py-3 text-xs">{f.owner_name}</td>
                          <td className="px-6 py-3">
                            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{f.entity_type}</span>
                          </td>
                          <td className="px-6 py-3 text-right text-xs text-gray-400">{fmtBytes(f.size_bytes)}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              f.visibility === "public" ? "bg-green-900/40 text-green-400" :
                              f.visibility === "private" ? "bg-gray-800 text-gray-400" :
                              "bg-yellow-900/40 text-yellow-400"
                            }`}>
                              {f.visibility}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <a href="#" className="text-xs text-blue-400 hover:text-blue-300">ดู</a>
                          </td>
                        </tr>
                      ))}
                      {auditFiles.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">ไม่มีไฟล์</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-sm shadow-xl z-50">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

function BigCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
