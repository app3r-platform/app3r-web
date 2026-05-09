"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { EWasteCertificate } from "@/lib/types";

const STATUS_META: Record<EWasteCertificate["status"], { label: string; color: string }> = {
  pending:  { label: "รอออกใบรับรอง", color: "bg-yellow-900/50 text-yellow-400" },
  issued:   { label: "ออกแล้ว",       color: "bg-green-900/50 text-green-400" },
  rejected: { label: "ปฏิเสธ",        color: "bg-red-900/50 text-red-400" },
};

const PAGE_SIZE = 20;

interface CertListResponse {
  results: EWasteCertificate[];
  count: number;
}

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">{message}</td>
    </tr>
  );
}

export default function CertificatesPage() {
  const router = useRouter();
  const [items, setItems] = useState<EWasteCertificate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
      });
      const d = await api.get<CertListResponse>("/admin/scrap/certificates/?" + params);
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pendingCount = items.filter(c => c.status === "pending").length;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📜 E-Waste Certificates</h1>
            <p className="text-gray-400 text-sm mt-1">
              คิวออกใบรับรองทำลาย E-Waste — review / issue / reject
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-800">
                ⏳ รอออก {pendingCount} ใบ
              </span>
            )}
            <Link href="/scrap/jobs"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              🔨 Jobs →
            </Link>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2">
          {(["", "pending", "issued", "rejected"] as const).map(s => (
            <button key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filterStatus === s
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              {s === "" ? "ทั้งหมด" : STATUS_META[s].label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between text-sm text-gray-400">
            <span>พบ {total.toLocaleString()} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40 hover:bg-gray-700">‹</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40 hover:bg-gray-700">›</button>
              </div>
            )}
          </div>

          {error ? (
            <div className="px-6 py-8 text-red-400">ระบบ E-Waste Certificate กำลังพัฒนา — {error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-4 py-3">เลขที่ใบรับรอง</th>
                  <th className="px-4 py-3">คำอธิบาย</th>
                  <th className="px-4 py-3">Scrap Job</th>
                  <th className="px-4 py-3">ออกโดย</th>
                  <th className="px-4 py-3">วันที่ออก</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.length === 0 ? (
                  <EmptyState message="ยังไม่มีใบรับรอง" />
                ) : items.map(cert => {
                  const sm = STATUS_META[cert.status];
                  return (
                    <tr key={cert.id} className={`hover:bg-gray-800/40 ${cert.status === "pending" ? "bg-yellow-950/10" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-purple-400">{cert.certNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-200 max-w-xs truncate">{cert.itemDescription}</td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/jobs/${cert.scrapJobId}`}
                          className="text-xs font-mono text-blue-400 hover:text-blue-300">
                          {cert.scrapJobId.slice(0, 8)}… ↗
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{cert.issuedById}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(cert.issuedAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/certificates/${cert.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
                          {cert.status === "pending" ? "ตรวจสอบ →" : "ดู →"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
