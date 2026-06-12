"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

type ParcelStatus =
  | "pending" | "label_created" | "shipped_out" | "in_transit_out"
  | "at_shop" | "repaired" | "shipped_back" | "in_transit_back"
  | "delivered" | "completed" | "failed" | "lost" | "cancelled";

interface ParcelJob {
  id: string;
  job_number: string;
  repair_job_id: string;
  shop_name: string;
  courier_name: string;
  tracking_out: string | null;
  tracking_back: string | null;
  customer_name: string;
  customer_address: string;
  device_model: string;
  status: ParcelStatus;
  shipped_out_at: string | null;
  delivered_to_shop_at: string | null;
  shipped_back_at: string | null;
  delivered_to_customer_at: string | null;
  shipping_cost: number | null;
  has_dispute: boolean;
  created_at: string;
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_PARCEL_JOBS: ParcelJob[] = [
  {
    id: "pj-001",
    job_number: "PJ-2026-0001",
    repair_job_id: "rj-001",
    shop_name: "ร้านซ่อม iCare สยาม",
    courier_name: "Kerry Express",
    tracking_out: "KE1234567890TH",
    tracking_back: null,
    customer_name: "สมชาย ใจดี",
    customer_address: "123 ถ.สุขุมวิท กรุงเทพฯ",
    device_model: "iPhone 14 Pro",
    status: "at_shop",
    shipped_out_at: "2026-06-05T09:00:00Z",
    delivered_to_shop_at: "2026-06-06T10:30:00Z",
    shipped_back_at: null,
    delivered_to_customer_at: null,
    shipping_cost: 120,
    has_dispute: false,
    created_at: "2026-06-04T08:00:00Z",
  },
  {
    id: "pj-002",
    job_number: "PJ-2026-0002",
    repair_job_id: "rj-002",
    shop_name: "TechFix เซ็นทรัล",
    courier_name: "Flash Express",
    tracking_out: "FL9876543210TH",
    tracking_back: "FL1111222233TH",
    customer_name: "วิภา สุขสันต์",
    customer_address: "456 ถ.รัชดาภิเษก กรุงเทพฯ",
    device_model: "Samsung Galaxy S24",
    status: "in_transit_back",
    shipped_out_at: "2026-06-01T08:00:00Z",
    delivered_to_shop_at: "2026-06-02T11:00:00Z",
    shipped_back_at: "2026-06-08T09:00:00Z",
    delivered_to_customer_at: null,
    shipping_cost: 95,
    has_dispute: false,
    created_at: "2026-05-31T14:00:00Z",
  },
  {
    id: "pj-003",
    job_number: "PJ-2026-0003",
    repair_job_id: "rj-003",
    shop_name: "ร้านซ่อม iCare สยาม",
    courier_name: "J&T Express",
    tracking_out: "JT5555666677TH",
    tracking_back: null,
    customer_name: "ประสิทธิ์ มีสุข",
    customer_address: "789 ถ.พระราม 9 กรุงเทพฯ",
    device_model: "MacBook Air M2",
    status: "in_transit_out",
    shipped_out_at: "2026-06-09T07:00:00Z",
    delivered_to_shop_at: null,
    shipped_back_at: null,
    delivered_to_customer_at: null,
    shipping_cost: 180,
    has_dispute: true,
    created_at: "2026-06-08T16:00:00Z",
  },
  {
    id: "pj-004",
    job_number: "PJ-2026-0004",
    repair_job_id: "rj-004",
    shop_name: "GadgetDoc ลาดพร้าว",
    courier_name: "Kerry Express",
    tracking_out: "KE2222333344TH",
    tracking_back: "KE4444555566TH",
    customer_name: "นิภา รักไทย",
    customer_address: "321 ถ.ลาดพร้าว กรุงเทพฯ",
    device_model: "iPad Pro 12.9",
    status: "completed",
    shipped_out_at: "2026-05-28T08:00:00Z",
    delivered_to_shop_at: "2026-05-29T10:00:00Z",
    shipped_back_at: "2026-06-03T09:00:00Z",
    delivered_to_customer_at: "2026-06-04T14:00:00Z",
    shipping_cost: 150,
    has_dispute: false,
    created_at: "2026-05-27T10:00:00Z",
  },
  {
    id: "pj-005",
    job_number: "PJ-2026-0005",
    repair_job_id: "rj-005",
    shop_name: "TechFix เซ็นทรัล",
    courier_name: "Thailand Post EMS",
    tracking_out: "EMS7777888899TH",
    tracking_back: null,
    customer_name: "อรุณ ดีงาม",
    customer_address: "654 ถ.ศรีนครินทร์ สมุทรปราการ",
    device_model: "Sony PlayStation 5",
    status: "lost",
    shipped_out_at: "2026-05-20T08:00:00Z",
    delivered_to_shop_at: null,
    shipped_back_at: null,
    delivered_to_customer_at: null,
    shipping_cost: 250,
    has_dispute: true,
    created_at: "2026-05-19T12:00:00Z",
  },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:               { label: "รอดำเนินการ",      color: "bg-gray-100 text-gray-500" },
  label_created:         { label: "สร้าง label แล้ว", color: "bg-gray-100 text-gray-600" },
  shipped_out:           { label: "ส่งออกแล้ว",       color: "bg-blue-50 text-blue-700" },
  in_transit_out:        { label: "กำลังส่งไปร้าน",  color: "bg-yellow-50 text-yellow-700" },
  at_shop:               { label: "อยู่ที่ร้าน",       color: "bg-admin-primary/15 text-admin-primary" },
  repaired:              { label: "ซ่อมเสร็จ",        color: "bg-brand-success/15 text-brand-success" },
  shipped_back:          { label: "ส่งคืนแล้ว",       color: "bg-brand-info/15 text-brand-info" },
  in_transit_back:       { label: "กำลังส่งกลับ",     color: "bg-cyan-50 text-cyan-700" },
  delivered:             { label: "ส่งถึงลูกค้า",     color: "bg-green-50 text-green-700" },
  completed:             { label: "เสร็จสิ้น",        color: "bg-green-50 text-green-700" },
  failed:                { label: "ล้มเหลว",           color: "bg-red-50 text-red-700" },
  lost:                  { label: "พัสดุหาย",         color: "bg-red-50 text-red-700 font-semibold" },
  cancelled:             { label: "ยกเลิก",            color: "bg-gray-100 text-gray-500" },
};

const STATUS_TABS = [
  { label: "ทั้งหมด", value: "" },
  { label: "กำลังส่ง", value: "in_transit_out" },
  { label: "อยู่ที่ร้าน", value: "at_shop" },
  { label: "กำลังส่งกลับ", value: "in_transit_back" },
  { label: "เสร็จสิ้น", value: "completed" },
  { label: "หาย/ล้มเหลว", value: "lost" },
];

const PAGE_SIZE = 20;

export default function ParcelQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<ParcelJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [filterCourier, setFilterCourier] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus  && { status: filterStatus }),
        ...(filterShop    && { shop: filterShop }),
        ...(filterCourier && { courier: filterCourier }),
        ...(filterDate    && { date: filterDate }),
      });
      const d = await api.get<{ items: ParcelJob[]; total: number }>(
        "/admin/repair/parcel/queue?" + params
      );
      setItems(d.items);
      setTotal(d.total);
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      const filtered = filterStatus
        ? MOCK_PARCEL_JOBS.filter(j => j.status === filterStatus)
        : MOCK_PARCEL_JOBS;
      setItems(filtered);
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterShop, filterCourier, filterDate, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📦 คิวพัสดุ (Parcel Queue)</h1>
            <p className="text-gray-500 text-sm mt-1">
              ตาราง parcel jobs — filter ร้าน / courier / สถานะ / วัน
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/repair/parcel/disputes"
              className="px-3 py-1.5 text-xs bg-orange-900/40 hover:bg-orange-900/60 border border-orange-700/50 text-orange-700 rounded-lg transition-colors">
              ⚠️ ข้อพิพาท
            </Link>
            <Link href="/repair/parcel/analytics"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              📊 สถิติ →
            </Link>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === t.value ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="ร้านซ่อม"
            value={filterShop} onChange={e => { setFilterShop(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-44 focus:outline-none focus:border-blue-500"
          />
          <input type="text" placeholder="ขนส่ง (Kerry / Flash…)"
            value={filterCourier} onChange={e => { setFilterCourier(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-52 focus:outline-none focus:border-blue-500"
          />
          <input type="date"
            value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-44 focus:outline-none focus:border-blue-500"
          />
          {(filterShop || filterCourier || filterDate) && (
            <button onClick={() => { setFilterShop(""); setFilterCourier(""); setFilterDate(""); setPage(1); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg">
              ล้าง filter
            </button>
          )}
        </div>

        {/* Table */}
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
                  <th className="px-4 py-3">Job #</th>
                  <th className="px-4 py-3">ร้านซ่อม</th>
                  <th className="px-4 py-3">อุปกรณ์</th>
                  <th className="px-4 py-3">ลูกค้า</th>
                  <th className="px-4 py-3">ขนส่ง</th>
                  <th className="px-4 py-3">เลขติดตาม</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">ค่าส่ง</th>
                  <th className="px-4 py-3">ข้อพิพาท</th>
                  <th className="px-4 py-3">วันที่</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(job => {
                  const sm = STATUS_META[job.status] ?? { label: job.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={job.id} className={`hover:bg-gray-100/40 ${job.has_dispute ? "border-l-2 border-l-orange-500" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{job.job_number}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{job.shop_name}</td>
                      <td className="px-4 py-3 text-sm">{job.device_model}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{job.customer_name}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-200">{job.courier_name}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {job.tracking_out && (
                            <div className="text-xs font-mono text-gray-500">
                              ↗ {job.tracking_out}
                            </div>
                          )}
                          {job.tracking_back && (
                            <div className="text-xs font-mono text-gray-500">
                              ↙ {job.tracking_back}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-yellow-700">
                        {job.shipping_cost != null ? `${job.shipping_cost.toLocaleString()} ฿` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {job.has_dispute && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                            ⚠️ ข้อพิพาท
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(job.created_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/repair/parcel/${job.id}`}
                          className="text-xs text-admin-primary hover:text-admin-dark whitespace-nowrap">
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
