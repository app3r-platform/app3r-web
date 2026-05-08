"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface ParcelDispute {
  id: string;
  parcel_job_id: string;
  job_number: string;
  courier_name: string;
  tracking_number: string | null;
  customer_name: string;
  shop_name: string;
  device_model: string;
  type: "lost" | "damaged_arrival" | "damaged_return" | "wrong_item";
  status: "open" | "in_review" | "resolved" | "closed";
  description: string;
  photos: string[];
  opened_at: string;
  resolved_at: string | null;
  resolution: string | null;
  refund_amount: number | null;
  insurance_value: number | null;
}

const DISPUTE_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  lost:             { label: "พัสดุหาย",          color: "bg-red-900/60 text-red-300",    icon: "🔍" },
  damaged_arrival:  { label: "เสียหายเมื่อถึงร้าน", color: "bg-orange-900/50 text-orange-400", icon: "💥" },
  damaged_return:   { label: "เสียหายเมื่อส่งคืน", color: "bg-orange-900/50 text-orange-300", icon: "💥" },
  wrong_item:       { label: "ส่งผิดชิ้น",         color: "bg-yellow-900/50 text-yellow-400", icon: "❓" },
};

const DISPUTE_STATUS_META: Record<string, { label: string; color: string }> = {
  open:      { label: "เปิด",         color: "bg-red-900/50 text-red-400" },
  in_review: { label: "กำลังตรวจ",   color: "bg-yellow-900/50 text-yellow-400" },
  resolved:  { label: "แก้ไขแล้ว",   color: "bg-green-900/50 text-green-400" },
  closed:    { label: "ปิด",          color: "bg-gray-800 text-gray-400" },
};

const PAGE_SIZE = 20;

export default function ParcelDisputesPage() {
  const router = useRouter();
  const [items, setItems] = useState<ParcelDispute[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("open");
  const [page, setPage] = useState(1);

  // Resolve panel state
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveMsg, setResolveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const superAdmin = isSuperAdmin();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
      });
      const d = await api.get<{ items: ParcelDispute[]; total: number }>(
        "/admin/repair/parcel/disputes?" + params
      );
      setItems(d.items);
      setTotal(d.total);
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

  async function handleResolve(id: string) {
    if (resolution.trim().length < 10) return;
    setResolveLoading(true);
    setResolveMsg(null);
    try {
      const body: Record<string, unknown> = { resolution: resolution.trim() };
      if (refundAmount && !isNaN(Number(refundAmount))) {
        body.refund_amount = Number(refundAmount);
      }
      await api.post(`/admin/repair/parcel/disputes/${id}/resolve`, body);
      setResolveMsg({ type: "success", text: "แก้ไข Dispute สำเร็จ" });
      setResolveId(null);
      setResolution("");
      setRefundAmount("");
      fetchData();
    } catch (e) {
      setResolveMsg({ type: "error", text: (e as Error).message });
    } finally {
      setResolveLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const resolveDispute = items.find(d => d.id === resolveId);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⚠️ Parcel Disputes</h1>
            <p className="text-gray-400 text-sm mt-1">
              พัสดุหาย / เสียหาย / ส่งผิด — admin action panel
            </p>
          </div>
          <Link href="/repair/parcel/queue"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Parcel Queue
          </Link>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {[
            { label: "ทั้งหมด", value: "" },
            { label: "เปิด", value: "open" },
            { label: "กำลังตรวจ", value: "in_review" },
            { label: "แก้ไขแล้ว", value: "resolved" },
            { label: "ปิด", value: "closed" },
          ].map(f => (
            <button key={f.value}
              onClick={() => { setFilterStatus(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs transition-colors ${
                filterStatus === f.value ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Global message */}
        {resolveMsg && (
          <div className={`p-3 rounded-xl text-sm border ${
            resolveMsg.type === "success"
              ? "bg-green-900/30 border-green-800 text-green-300"
              : "bg-red-900/30 border-red-800 text-red-300"
          }`}>
            {resolveMsg.text}
          </div>
        )}

        {/* Resolve Panel */}
        {resolveId && resolveDispute && (
          <section className="bg-gray-900 rounded-xl border border-orange-900/60 p-5">
            <h2 className="text-sm font-semibold text-orange-400 mb-3">
              🔧 แก้ไข Dispute: {resolveDispute.job_number} —{" "}
              {DISPUTE_TYPE_META[resolveDispute.type]?.label ?? resolveDispute.type}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">การแก้ไข *</label>
                <textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="อธิบายการแก้ไข (อย่างน้อย 10 ตัวอักษร)..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  คืนเงิน (฿) <span className="text-gray-600">— optional</span>
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
                />
                {resolveDispute.insurance_value != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    มูลค่าประกัน: {resolveDispute.insurance_value.toLocaleString()} ฿
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleResolve(resolveId)}
                disabled={resolution.trim().length < 10 || resolveLoading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {resolveLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
              <button
                onClick={() => { setResolveId(null); setResolution(""); setRefundAmount(""); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </section>
        )}

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
            <div className="px-6 py-8 text-red-400">{error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-5 py-3">Job #</th>
                  <th className="px-5 py-3">ประเภท</th>
                  <th className="px-5 py-3">Courier</th>
                  <th className="px-5 py-3">ลูกค้า</th>
                  <th className="px-5 py-3">ร้าน</th>
                  <th className="px-5 py-3">อุปกรณ์</th>
                  <th className="px-5 py-3">สถานะ</th>
                  <th className="px-5 py-3">คืนเงิน</th>
                  <th className="px-5 py-3">วันที่เปิด</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(d => {
                  const dtMeta = DISPUTE_TYPE_META[d.type] ?? { label: d.type, color: "bg-gray-800 text-gray-300", icon: "❓" };
                  const dsMeta = DISPUTE_STATUS_META[d.status] ?? { label: d.status, color: "bg-gray-800 text-gray-300" };
                  const canResolve = superAdmin && (d.status === "open" || d.status === "in_review");
                  return (
                    <tr key={d.id} className="hover:bg-gray-800/40">
                      <td className="px-5 py-3">
                        <Link href={`/repair/parcel/${d.parcel_job_id}`}
                          className="font-mono text-xs text-blue-400 hover:text-blue-300">
                          {d.job_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${dtMeta.color}`}>
                          {dtMeta.icon} {dtMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-gray-200">{d.courier_name}</td>
                      <td className="px-5 py-3 text-xs text-gray-300">{d.customer_name}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{d.shop_name}</td>
                      <td className="px-5 py-3 text-xs text-gray-300">{d.device_model}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${dsMeta.color}`}>{dsMeta.label}</span>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-yellow-400">
                        {d.refund_amount != null ? `${d.refund_amount.toLocaleString()} ฿` : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(d.opened_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-5 py-3">
                        {canResolve ? (
                          <button
                            onClick={() => { setResolveId(d.id); setResolveMsg(null); setResolution(""); setRefundAmount(""); }}
                            className="text-xs px-3 py-1 bg-orange-900/40 hover:bg-orange-900/60 border border-orange-700/50 text-orange-300 rounded-lg transition-colors">
                            แก้ไข
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-500">ไม่มีรายการ</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
