"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { HelpTip } from "@app3r/ui";

interface KYCApplication {
  user_id: number;
  user_name: string;
  phone: string;
  overall_status: "pending" | "reviewing" | "approved" | "rejected" | "additional_required";
  submitted_at: string;
  reviewed_at: string | null;
  doc_count: number;
  auto_create_weeet_done: boolean;
}

// MOCK_KYC — fallback เมื่อ API ไม่พร้อม (dev/staging)
const MOCK_KYC: KYCApplication[] = [
  { user_id: 101, user_name: "ร้านซ่อม 5 ดาว",  phone: "081-234-5678", overall_status: "pending",   submitted_at: "2026-05-25T10:00:00Z", reviewed_at: null,                   doc_count: 3, auto_create_weeet_done: false },
  { user_id: 102, user_name: "Tech Repair Co.",  phone: "089-876-5432", overall_status: "reviewing", submitted_at: "2026-05-24T08:00:00Z", reviewed_at: "2026-05-25T09:00:00Z", doc_count: 5, auto_create_weeet_done: false },
];

const STATUS_CONFIG = {
  pending:             { label: "รอตรวจ",        color: "bg-yellow-50 text-yellow-700" },
  reviewing:           { label: "กำลังตรวจ",      color: "bg-blue-50 text-blue-700" },
  approved:            { label: "อนุมัติแล้ว",    color: "bg-green-50 text-green-700" },
  rejected:            { label: "ปฏิเสธ",         color: "bg-red-50 text-red-700" },
  additional_required: { label: "ขอเอกสารเพิ่ม",  color: "bg-orange-50 text-orange-700" },
};

export default function KYCQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<KYCApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
      });
      const d = await api.get<{ items: KYCApplication[]; total: number }>("/admin/kyc?" + params);
      setItems(d.items);
      setTotal(d.total);
    } catch {
      // API ไม่พร้อม → ใช้ mock fallback
      setItems(MOCK_KYC);
      setTotal(MOCK_KYC.length);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          ตรวจเอกสารยืนยันตัวตน (KYC)
          <HelpTip content="KYC (Know Your Customer) — ขั้นตอนยืนยันตัวตนผู้ใช้ด้วยเอกสาร" />
        </h1>
        <p className="text-gray-500 text-sm mb-6">ตรวจสอบเอกสาร KYC ของ WeeeR ก่อนอนุมัติเป็นผู้รับงาน</p>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 w-fit">
          <button onClick={() => { setFilterStatus(""); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${!filterStatus ? "bg-admin-surface text-admin-primary font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-admin-text"}`}>
            ทั้งหมด
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => { setFilterStatus(key); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${filterStatus === key ? "bg-admin-surface text-admin-primary font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-admin-text"}`}>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>พบ {total.toLocaleString()} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200 text-gray-700">‹</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200 text-gray-700">›</button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="px-6 py-3">WeeeR</th>
                  <th className="px-6 py-3">เบอร์โทร</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3">เอกสาร</th>
                  <th className="px-6 py-3">ส่งเมื่อ</th>
                  <th className="px-6 py-3">WeeeT สร้างเมื่อ</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((app) => {
                  const sc = STATUS_CONFIG[app.overall_status];
                  return (
                    <tr key={app.user_id} className="hover:bg-gray-100">
                      <td className="px-6 py-3">
                        <p className="font-medium">{app.user_name}</p>
                        <p className="text-xs text-gray-500">#{app.user_id}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{app.phone}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{app.doc_count} ไฟล์</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(app.submitted_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-3">
                        {app.auto_create_weeet_done
                          ? <span className="text-xs text-green-600">✅ สร้างแล้ว</span>
                          : <span className="text-xs text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/users/weeer/${app.user_id}/kyc`}
                          className="text-xs text-admin-primary hover:text-admin-dark transition-colors whitespace-nowrap">
                          ตรวจสอบ →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">ไม่มีรายการ</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
