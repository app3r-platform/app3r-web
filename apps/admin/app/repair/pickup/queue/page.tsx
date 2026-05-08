"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

type PickupStatus =
  | "pending" | "assigned" | "en_route_pickup" | "picked_up"
  | "en_route_delivery" | "delivered" | "completed" | "failed" | "cancelled";

interface PickupJob {
  id: string;
  job_number: string;
  repair_job_id: string;
  shop_name: string;
  weeet_name: string | null;
  weeet_phone: string | null;
  customer_name: string;
  customer_address: string;
  device_model: string;
  status: PickupStatus;
  direction: "shop_to_customer" | "customer_to_shop";
  scheduled_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  travel_cost: number | null;
  distance_km: number | null;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:             { label: "รอมอบหมาย",    color: "bg-gray-800 text-gray-400" },
  assigned:            { label: "มอบหมายแล้ว",  color: "bg-blue-900/50 text-blue-300" },
  en_route_pickup:     { label: "กำลังไปรับ",   color: "bg-yellow-900/50 text-yellow-400" },
  picked_up:           { label: "รับแล้ว",       color: "bg-cyan-900/50 text-cyan-300" },
  en_route_delivery:   { label: "กำลังส่ง",      color: "bg-indigo-900/50 text-indigo-300" },
  delivered:           { label: "ส่งแล้ว",       color: "bg-teal-900/50 text-teal-300" },
  completed:           { label: "เสร็จสิ้น",     color: "bg-green-900/50 text-green-400" },
  failed:              { label: "ล้มเหลว",       color: "bg-red-900/50 text-red-400" },
  cancelled:           { label: "ยกเลิก",        color: "bg-gray-800 text-gray-500" },
};

const DIRECTION_LABEL: Record<string, string> = {
  shop_to_customer: "ร้าน → ลูกค้า",
  customer_to_shop: "ลูกค้า → ร้าน",
};

const STATUS_TABS = [
  { label: "ทั้งหมด", value: "" },
  { label: "รอมอบหมาย", value: "pending" },
  { label: "กำลังไปรับ", value: "en_route_pickup" },
  { label: "กำลังส่ง", value: "en_route_delivery" },
  { label: "เสร็จสิ้น", value: "completed" },
  { label: "ล้มเหลว", value: "failed" },
];

const PAGE_SIZE = 20;

export default function PickupQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<PickupJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [filterTech, setFilterTech] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
        ...(filterShop   && { shop: filterShop }),
        ...(filterTech   && { weeet: filterTech }),
        ...(filterDate   && { date: filterDate }),
      });
      const d = await api.get<{ items: PickupJob[]; total: number }>(
        "/admin/repair/pickup/queue?" + params
      );
      setItems(d.items);
      setTotal(d.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterShop, filterTech, filterDate]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🚛 Pickup Queue</h1>
            <p className="text-gray-400 text-sm mt-1">
              ตารางรวม pickup jobs — filter ร้าน / WeeeT / สถานะ / วัน
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/repair/pickup/dispatch-monitor"
              className="px-3 py-1.5 text-xs bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 rounded-lg transition-colors">
              📡 Dispatch Monitor
            </Link>
            <Link href="/repair/pickup/analytics"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              📊 Analytics →
            </Link>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === t.value ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="ร้านซ่อม"
            value={filterShop}
            onChange={e => { setFilterShop(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-44 focus:outline-none focus:border-blue-500"
          />
          <input type="text" placeholder="WeeeT"
            value={filterTech}
            onChange={e => { setFilterTech(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-44 focus:outline-none focus:border-blue-500"
          />
          <input type="date"
            value={filterDate}
            onChange={e => { setFilterDate(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-44 focus:outline-none focus:border-blue-500"
          />
          {(filterShop || filterTech || filterDate) && (
            <button onClick={() => { setFilterShop(""); setFilterTech(""); setFilterDate(""); setPage(1); }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg">
              ล้าง filter
            </button>
          )}
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
            <div className="px-6 py-8 text-red-400">{error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-4 py-3">Job #</th>
                  <th className="px-4 py-3">ทิศทาง</th>
                  <th className="px-4 py-3">ร้านซ่อม</th>
                  <th className="px-4 py-3">อุปกรณ์</th>
                  <th className="px-4 py-3">ลูกค้า</th>
                  <th className="px-4 py-3">WeeeT</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">ระยะทาง</th>
                  <th className="px-4 py-3">ค่าเดินทาง</th>
                  <th className="px-4 py-3">วันที่</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(job => {
                  const sm = STATUS_META[job.status] ?? { label: job.status, color: "bg-gray-800 text-gray-300" };
                  return (
                    <tr key={job.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{job.job_number}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          job.direction === "shop_to_customer"
                            ? "bg-teal-900/40 text-teal-300"
                            : "bg-purple-900/40 text-purple-300"
                        }`}>
                          {DIRECTION_LABEL[job.direction] ?? job.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">{job.shop_name}</td>
                      <td className="px-4 py-3 text-sm">{job.device_model}</td>
                      <td className="px-4 py-3 text-xs text-gray-300">{job.customer_name}</td>
                      <td className="px-4 py-3">
                        {job.weeet_name
                          ? <div>
                              <div className="text-sm">{job.weeet_name}</div>
                              <div className="text-xs text-gray-500">{job.weeet_phone}</div>
                            </div>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">
                        {job.distance_km != null ? `${job.distance_km.toFixed(1)} km` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-yellow-400">
                        {job.travel_cost != null ? `${job.travel_cost.toLocaleString()} ฿` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(job.created_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/repair/pickup/${job.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
                          ดู →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={11} className="px-6 py-10 text-center text-gray-500">ไม่มีข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
