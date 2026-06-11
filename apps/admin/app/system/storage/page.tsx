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

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_SUMMARY: StorageSummary = {
  total_bytes: 12_884_901_888,
  total_files: 34820,
  total_photos: 28650,
  total_videos: 420,
  by_entity: [
    { entity_type: "jobs",     files: 18400, bytes: 7_516_192_768 },
    { entity_type: "profile",  files:  6200, bytes: 2_147_483_648 },
    { entity_type: "kyc",      files:  4100, bytes: 1_610_612_736 },
    { entity_type: "ads",      files:  2800, bytes:   858_993_459 },
    { entity_type: "disputes", files:  1920, bytes:   536_870_912 },
    { entity_type: "scrap",    files:  1400, bytes:   214_748_364 },
  ],
};
const MOCK_TOP_USERS: TopUser[] = [
  { user_id: 1001, user_name: "ร้านสยามแอร์เซอร์วิส",  role: "weeer", file_count: 1842, total_bytes: 921_600_000 },
  { user_id: 1002, user_name: "ช่างวิชัย เก่งล้าง",       role: "weeet", file_count: 1234, total_bytes: 617_000_000 },
  { user_id: 1003, user_name: "คุณสมศรี วงษ์ดี",          role: "weeeu", file_count:  876, total_bytes: 438_000_000 },
  { user_id: 1004, user_name: "ร้านเครื่องใช้ไฟฟ้าดี",   role: "weeer", file_count:  654, total_bytes: 327_000_000 },
  { user_id: 1005, user_name: "ช่างสมชาย มีฝีมือ",         role: "weeet", file_count:  512, total_bytes: 256_000_000 },
];
const MOCK_TRANSFERS: ApplianceTransfer[] = [
  { id: "tr-001", transferred_at: "2026-05-10T11:00:00Z", appliance_id: "AP-20230015",
    from_user: "คุณนภา รักษ์บ้าน",  from_role: "weeeu",
    to_user:   "ร้านสยามแอร์เซอร์วิส", to_role: "weeer",
    price_points: 2500, announcement_id: "ANN-2026-0312" },
  { id: "tr-002", transferred_at: "2026-05-18T14:30:00Z", appliance_id: "AP-20220078",
    from_user: "คุณประทีป สุขใจ",     from_role: "weeeu",
    to_user:   "ร้านเครื่องใช้ไฟฟ้าดี", to_role: "weeer",
    price_points: 1800, announcement_id: "ANN-2026-0389" },
  { id: "tr-003", transferred_at: "2026-06-02T09:15:00Z", appliance_id: "AP-20240103",
    from_user: "คุณมาลี พันธ์สวรรค์",  from_role: "weeeu",
    to_user:   "ร้านสยามแอร์เซอร์วิส", to_role: "weeer",
    price_points: 3200, announcement_id: "ANN-2026-0451" },
];
const MOCK_CLEANUP: CleanupSchedule[] = [
  { file_type: "KYC Documents",    retention: "7 ปี",  pending_count: 0,   last_cleanup_at: "2026-06-01T02:00:00Z" },
  { file_type: "Job Photos",       retention: "3 ปี",  pending_count: 0,   last_cleanup_at: "2026-06-01T02:00:00Z" },
  { file_type: "Dispute Evidence", retention: "10 ปี", pending_count: 0,   last_cleanup_at: "2026-05-01T02:00:00Z" },
  { file_type: "Profile Photos",   retention: "ถาวร",  pending_count: 0,   last_cleanup_at: null },
  { file_type: "Temp Uploads",     retention: "7 วัน", pending_count: 142, last_cleanup_at: "2026-06-09T02:00:00Z" },
];
const MOCK_AUDIT: { items: AuditFile[]; total: number } = {
  total: 34820,
  items: [
    { id: "af-001", file_path: "kyc/1001/id_card_front.jpg",       owner_name: "ร้านสยามแอร์เซอร์วิส",  entity_type: "kyc",     size_bytes: 512_000, uploaded_at: "2026-04-01T10:00:00Z", visibility: "private",    file_type: "image" },
    { id: "af-002", file_path: "jobs/mjd-014/before_1.jpg",         owner_name: "ช่างวิชัย เก่งล้าง",       entity_type: "jobs",    size_bytes: 1_200_000, uploaded_at: "2026-06-01T14:00:00Z", visibility: "restricted", file_type: "image" },
    { id: "af-003", file_path: "ads/banner/shop_siam_may26.png",    owner_name: "ร้านสยามแอร์เซอร์วิส",  entity_type: "ads",     size_bytes: 320_000, uploaded_at: "2026-05-12T09:30:00Z", visibility: "public",     file_type: "image" },
    { id: "af-004", file_path: "profile/1003/avatar.jpg",           owner_name: "คุณสมศรี วงษ์ดี",          entity_type: "profile", size_bytes: 98_304,  uploaded_at: "2026-03-20T08:00:00Z", visibility: "public",     file_type: "image" },
    { id: "af-005", file_path: "disputes/dsp-007/evidence_1.jpg",   owner_name: "admin@app3r.co",           entity_type: "disputes",size_bytes: 2_100_000, uploaded_at: "2026-05-28T16:00:00Z", visibility: "private",    file_type: "image" },
    { id: "af-006", file_path: "kyc/1004/business_license.pdf",     owner_name: "ร้านเครื่องใช้ไฟฟ้าดี",   entity_type: "kyc",     size_bytes: 870_000, uploaded_at: "2026-04-15T11:00:00Z", visibility: "private",    file_type: "pdf" },
  ],
};

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
      .catch((e: unknown) => {
        if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
        console.warn("[mock fallback]", e);
        setSummary(MOCK_SUMMARY);
        setTopUsers(MOCK_TOP_USERS);
        setTransfers(MOCK_TRANSFERS);
        setCleanup(MOCK_CLEANUP);
        setAuditFiles(MOCK_AUDIT.items);
        setAuditTotal(MOCK_AUDIT.total);
      })
      .finally(() => setLoading(false));
  }, [router, fetchSummary, fetchTopUsers, fetchTransfers, fetchCleanup, fetchAudit]);

  async function runCleanup() {
    setRunningCleanup(true);
    try {
      const r = await api.post<{ deleted_count: number; bytes_freed: number }>("/admin/storage/cleanup/run", {});
      showToast(`✅ Cleanup เสร็จ: ลบ ${r.deleted_count} ไฟล์, คืน ${fmtBytes(r.bytes_freed)}`);
      fetchSummary();
      fetchCleanup();
    } catch {
      showToast("โหมดสาธิต: backend ยังไม่พร้อม");
    } finally {
      setRunningCleanup(false);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "📊 ภาพรวม" },
    { key: "top-users", label: "👑 ผู้ใช้ใช้พื้นที่สูงสุด" },
    { key: "appliance", label: "🔄 ประวัติโอน Appliance" },
    { key: "pdpa", label: "🗑️ ล้างข้อมูล PDPA" },
    { key: "audit", label: "📁 ตรวจสอบไฟล์" },
  ];

  const auditTotalPages = Math.ceil(auditTotal / 20);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">จัดการพื้นที่จัดเก็บ (Storage)</h1>
          <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            🔄 Auto-refresh 5 นาที
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-6">จัดการไฟล์ระบบ, PDPA Cleanup, และ Appliance Transfer</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"
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
                  <BigCard label="พื้นที่ทั้งหมด" value={fmtBytes(summary.total_bytes)} />
                  <BigCard label="ไฟล์ทั้งหมด" value={summary.total_files.toLocaleString()} />
                  <BigCard label="รูปภาพ" value={summary.total_photos.toLocaleString()} />
                  <BigCard label="วิดีโอ" value={summary.total_videos.toLocaleString()} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold">แยกตามประเภท Entity</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="px-6 py-3">รายการ</th>
                        <th className="px-6 py-3 text-right">ไฟล์</th>
                        <th className="px-6 py-3 text-right">พื้นที่</th>
                        <th className="px-6 py-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summary.by_entity.map((row) => (
                        <tr key={row.entity_type} className="hover:bg-gray-100">
                          <td className="px-6 py-3 font-mono text-xs">{row.entity_type}</td>
                          <td className="px-6 py-3 text-right text-gray-700">{row.files.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right text-gray-700">{fmtBytes(row.bytes)}</td>
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
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left">
                      <th className="px-6 py-3">อันดับ</th>
                      <th className="px-6 py-3">ผู้ใช้</th>
                      <th className="px-6 py-3">บทบาท</th>
                      <th className="px-6 py-3 text-right">ไฟล์</th>
                      <th className="px-6 py-3 text-right">พื้นที่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topUsers.map((u, i) => (
                      <tr key={u.user_id} className="hover:bg-gray-100">
                        <td className="px-6 py-3 text-gray-500 font-mono">#{i + 1}</td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{u.user_name}</p>
                          <p className="text-xs text-gray-500">#{u.user_id}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{u.role}</span>
                        </td>
                        <td className="px-6 py-3 text-right text-gray-700">{u.file_count.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-700">{fmtBytes(u.total_bytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Appliance History (D22) */}
            {tab === "appliance" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold">ประวัติการเป็นเจ้าของ Appliance</h3>
                  <p className="text-xs text-gray-500 mt-0.5">ประวัติการ Transfer ของ appliance ผ่าน Resell flow</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left">
                      <th className="px-6 py-3">เวลา</th>
                      <th className="px-6 py-3">เครื่องใช้ไฟฟ้า</th>
                      <th className="px-6 py-3">จาก → ถึง</th>
                      <th className="px-6 py-3 text-right">ราคา (G)</th>
                      <th className="px-6 py-3">ประกาศ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-100">
                        <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(t.transferred_at).toLocaleString("th-TH")}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs">{t.appliance_id}</td>
                        <td className="px-6 py-3 text-xs">
                          <span className="text-gray-500">{t.from_user} ({t.from_role})</span>
                          <span className="text-gray-600 mx-1.5">→</span>
                          <span className="text-gray-800">{t.to_user} ({t.to_role})</span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-yellow-700 font-semibold">
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
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold">กำหนดการเก็บข้อมูล PDPA</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="px-6 py-3">ประเภทไฟล์</th>
                        <th className="px-6 py-3">ระยะเวลาเก็บ</th>
                        <th className="px-6 py-3 text-right">รอลบ</th>
                        <th className="px-6 py-3">ทำความสะอาดล่าสุด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cleanup.map((row) => (
                        <tr key={row.file_type} className="hover:bg-gray-100">
                          <td className="px-6 py-3 font-medium">{row.file_type}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              row.retention === "ถาวร" ? "bg-gray-100 text-gray-500" :
                              row.retention.includes("10") ? "bg-orange-900/40 text-orange-700" :
                              "bg-red-900/30 text-red-600"
                            }`}>
                              {row.retention}
                            </span>
                          </td>
                          <td className={`px-6 py-3 text-right font-mono ${
                            row.pending_count > 0 ? "text-red-600 font-bold" : "text-gray-500"
                          }`}>
                            {row.pending_count > 0 ? row.pending_count.toLocaleString() : "—"}
                          </td>
                          <td className="px-6 py-3 text-gray-500 text-xs">
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
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold mb-2">🗑️ Manual Cleanup</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    รัน cleanup ทันที — ข้ามรอ cron 02:00 รายวัน (Super Admin only)
                  </p>
                  {isSuper ? (
                    <button onClick={runCleanup} disabled={runningCleanup}
                      className="px-5 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">
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
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">บทบาท</label>
                    <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setAuditPage(1); }}
                      className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none text-gray-900">
                      <option value="">ทั้งหมด</option>
                      {["weeeu", "weeer", "weeet", "admin"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">ประเภทรายการ</label>
                    <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setAuditPage(1); }}
                      className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none text-gray-900">
                      <option value="">ทั้งหมด</option>
                      {["profile", "kyc", "appliances", "jobs", "disputes", "ads", "scrap"].map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">การมองเห็น</label>
                    <select value={filterVis} onChange={(e) => { setFilterVis(e.target.value); setAuditPage(1); }}
                      className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none text-gray-900">
                      <option value="">ทั้งหมด</option>
                      <option value="public">สาธารณะ</option>
                      <option value="private">ส่วนตัว</option>
                      <option value="restricted">จำกัด</option>
                    </select>
                  </div>
                  {isSuper && (
                    <button
                      className="self-end px-4 py-2 bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-700 rounded-lg text-sm transition-colors">
                      🗑️ Bulk Delete (Super Admin)
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
                    <span>ทั้งหมด {auditTotal.toLocaleString()} ไฟล์</span>
                    {auditTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage === 1}
                          className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40">‹</button>
                        <span>{auditPage} / {auditTotalPages}</span>
                        <button onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))} disabled={auditPage === auditTotalPages}
                          className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40">›</button>
                      </div>
                    )}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="px-6 py-3">พาธ</th>
                        <th className="px-6 py-3">เจ้าของ</th>
                        <th className="px-6 py-3">รายการ</th>
                        <th className="px-6 py-3 text-right">ขนาด</th>
                        <th className="px-6 py-3">การมองเห็น</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {auditFiles.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-100">
                          <td className="px-6 py-3 font-mono text-xs text-gray-500 max-w-[200px] truncate">{f.file_path}</td>
                          <td className="px-6 py-3 text-xs">{f.owner_name}</td>
                          <td className="px-6 py-3">
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{f.entity_type}</span>
                          </td>
                          <td className="px-6 py-3 text-right text-xs text-gray-500">{fmtBytes(f.size_bytes)}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              f.visibility === "public" ? "bg-green-900/40 text-green-600" :
                              f.visibility === "private" ? "bg-gray-100 text-gray-500" :
                              "bg-yellow-900/40 text-yellow-700"
                            }`}>
                              {f.visibility}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <a href="#" className="text-xs text-admin-primary hover:text-admin-dark">ดู</a>
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
          <div className="fixed bottom-6 right-6 bg-gray-100 border border-gray-300 rounded-xl px-5 py-3 text-sm shadow-xl z-50">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

function BigCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
