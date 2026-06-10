"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface RepairDispute {
  id: string;
  repair_job_id: string;
  weeeu_name: string;
  weeer_name: string;
  status: "open" | "in_review" | "resolved" | "escalated";
  opened_by: string;
  reason: string;
  created_at: string;
  resolved_at: string | null;
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_REPAIR_DISPUTES: RepairDispute[] = [
  {
    id: "rd-001aabbcc",
    repair_job_id: "rj-010ddeeff",
    weeeu_name: "สมชาย ใจดี",
    weeer_name: "ร้าน iCare สยาม",
    status: "open",
    opened_by: "WeeeU",
    reason: "ช่างไม่มาตามนัดหมายและไม่แจ้งล่วงหน้า ทำให้ลูกค้าต้องรอที่บ้านเป็นเวลา 3 ชั่วโมง",
    created_at: "2026-06-09T10:00:00Z",
    resolved_at: null,
  },
  {
    id: "rd-002gghhii",
    repair_job_id: "rj-011jjkkll",
    weeeu_name: "วิภา สุขสันต์",
    weeer_name: "TechFix เซ็นทรัล",
    status: "in_review",
    opened_by: "WeeeU",
    reason: "ราคาซ่อมสูงกว่าที่ตกลงไว้ในตอนต้น 500 บาท ไม่มีการแจ้งก่อน",
    created_at: "2026-06-07T14:30:00Z",
    resolved_at: null,
  },
  {
    id: "rd-003mmnnoo",
    repair_job_id: "rj-012ppqqrr",
    weeeu_name: "ประสิทธิ์ มีสุข",
    weeer_name: "GadgetDoc ลาดพร้าว",
    status: "escalated",
    opened_by: "WeeeR",
    reason: "ลูกค้าปฏิเสธการชำระเงินหลังซ่อมเสร็จ อ้างว่าอาการไม่หายขาดทั้งที่ตรวจสอบแล้วว่าปกติ",
    created_at: "2026-06-05T09:00:00Z",
    resolved_at: null,
  },
  {
    id: "rd-004ssttuu",
    repair_job_id: "rj-013vvwwxx",
    weeeu_name: "นิภา รักไทย",
    weeer_name: "ProRepair สีลม",
    status: "resolved",
    opened_by: "WeeeU",
    reason: "อะไหล่ที่ใช้ซ่อมไม่ใช่อะไหล่แท้ตามที่ตกลงไว้",
    created_at: "2026-06-01T11:00:00Z",
    resolved_at: "2026-06-04T16:00:00Z",
  },
  {
    id: "rd-005yyzz11",
    repair_job_id: "rj-014223344",
    weeeu_name: "อรุณ ดีงาม",
    weeer_name: "QuickFix อารีย์",
    status: "resolved",
    opened_by: "WeeeU",
    reason: "งานซ่อมเสร็จแล้วแต่ช่างทิ้งเศษอะไหล่ไว้ในบ้านโดยไม่เก็บกวาด",
    created_at: "2026-05-28T15:00:00Z",
    resolved_at: "2026-05-30T10:00:00Z",
  },
];

const DISPUTE_STATUS: Record<string, { label: string; color: string }> = {
  open:       { label: "เปิด",         color: "bg-red-50 text-red-700" },
  in_review:  { label: "กำลังตรวจ",   color: "bg-yellow-50 text-yellow-700" },
  resolved:   { label: "แก้ไขแล้ว",   color: "bg-green-50 text-green-700" },
  escalated:  { label: "Escalated",    color: "bg-orange-50 text-orange-700" },
};

const PAGE_SIZE = 20;

export default function RepairDisputesPage() {
  const router = useRouter();
  const [items, setItems] = useState<RepairDispute[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("open");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        module: "repair",
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
      });
      const d = await api.get<{ items: RepairDispute[]; total: number }>(
        "/admin/disputes?" + params
      );
      setItems(d.items);
      setTotal(d.total);
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      const filtered = filterStatus
        ? MOCK_REPAIR_DISPUTES.filter(d => d.status === filterStatus)
        : MOCK_REPAIR_DISPUTES;
      setItems(filtered);
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">⚖️ ข้อพิพาทการซ่อม</h1>
          <Link href="/disputes"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ดูข้อพิพาททั้งหมด →
          </Link>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          ข้อพิพาทที่เกี่ยวกับโมดูลซ่อม — filter จาก /admin/disputes?module=repair
        </p>

        {/* Status filter */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 w-fit">
          {[
            { label: "ทั้งหมด", value: "" },
            { label: "เปิด", value: "open" },
            { label: "กำลังตรวจ", value: "in_review" },
            { label: "Escalated", value: "escalated" },
            { label: "แก้ไขแล้ว", value: "resolved" },
          ].map(f => (
            <button key={f.value}
              onClick={() => { setFilterStatus(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs transition-colors ${
                filterStatus === f.value ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>พบ {total.toLocaleString()} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200">‹</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200">›</button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-6 py-3">Dispute ID</th>
                  <th className="px-6 py-3">งานซ่อม</th>
                  <th className="px-6 py-3">WeeeU</th>
                  <th className="px-6 py-3">WeeeR</th>
                  <th className="px-6 py-3">เปิดโดย</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3">เหตุผล</th>
                  <th className="px-6 py-3">วันที่</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(d => {
                  const sc = DISPUTE_STATUS[d.status] ?? { label: d.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={d.id} className="hover:bg-gray-100/40">
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs text-gray-500">{d.id.slice(0, 8)}…</span>
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/repair/jobs/${d.repair_job_id}`}
                          className="font-mono text-xs text-admin-primary hover:text-admin-dark">
                          {d.repair_job_id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-sm">{d.weeeu_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{d.weeer_name}</td>
                      <td className="px-6 py-3 text-xs text-gray-500">{d.opened_by}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500 max-w-xs truncate">{d.reason}</td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {new Date(d.created_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/disputes`}
                          className="text-xs text-admin-primary hover:text-admin-dark transition-colors whitespace-nowrap">
                          จัดการ →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">ไม่มีข้อพิพาท</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
