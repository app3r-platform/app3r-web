"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

/* ─── local types (Mockup — Lesson #33) ─── */
type ResellListingStatus =
  | "announced"
  | "receiving_offers"
  | "offer_selected"
  | "awaiting_payment"
  | "buyer_confirmed"
  | "in_progress"
  | "delivered"
  | "inspection_period"
  | "completed"
  | "cancelled"
  | "disputed";

type SellerType = "U" | "R";    // WeeeU / WeeeR
type BuyerType  = "U" | "R";

interface ResellJob {
  id:           string;
  listing_code: string;
  title:        string;
  status:       ResellListingStatus;
  seller_name:  string;
  seller_type:  SellerType;
  buyer_name:   string | null;
  buyer_type:   BuyerType | null;
  price:        number;
  escrow_locked: boolean;
  dispute_flag:  boolean;
  awaiting_payment_flag: boolean;
  inspection_expires_at?: string | null;
  created_at:   string;
}

/* ─── Status meta ─── */
const STATUS_META: Record<ResellListingStatus, { label: string; color: string }> = {
  announced:        { label: "ประกาศแล้ว",        color: "bg-gray-100 text-gray-500" },
  receiving_offers: { label: "รับ offer",          color: "bg-blue-50 text-blue-700" },
  offer_selected:   { label: "เลือก offer แล้ว",  color: "bg-admin-surface text-admin-primary" },
  awaiting_payment: { label: "รอชำระเงิน",        color: "bg-yellow-50 text-yellow-700" },
  buyer_confirmed:  { label: "ผู้ซื้อยืนยัน",    color: "bg-cyan-50 text-cyan-700" },
  in_progress:      { label: "กำลังดำเนินการ",    color: "bg-brand-info/15 text-brand-info" },
  delivered:        { label: "จัดส่งแล้ว",         color: "bg-admin-surface text-admin-primary" },
  inspection_period:{ label: "ตรวจสอบสินค้า",     color: "bg-orange-50 text-orange-700" },
  completed:        { label: "เสร็จสิ้น",          color: "bg-green-50 text-green-700" },
  cancelled:        { label: "ยกเลิก",             color: "bg-red-50 text-red-700" },
  disputed:         { label: "ข้อพิพาท",           color: "bg-red-50 text-red-700" },
};

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "ทั้งหมด",           value: "" },
  { label: "ประกาศ/รับ offer",  value: "announced" },
  { label: "รอชำระ",            value: "awaiting_payment" },
  { label: "กำลังดำเนิน",       value: "in_progress" },
  { label: "ตรวจสอบ",          value: "inspection_period" },
  { label: "เสร็จสิ้น",         value: "completed" },
  { label: "ยกเลิก",            value: "cancelled" },
  { label: "⚖️ ข้อพิพาท",      value: "disputed" },
];

/* ─── Mock data — 12 เคส R1-R12 ─── */
const MOCK_JOBS: ResellJob[] = [
  {
    id: "rj-001", listing_code: "RS-20260101-001",
    title: "Samsung AC 12000 BTU ปี 2022",
    status: "completed", seller_type: "U", seller_name: "นายสมชาย ใจดี",
    buyer_type: "U", buyer_name: "นางสาวอรุณ แสงทอง",
    price: 8500, escrow_locked: false, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-01-10T09:00:00Z",
  },
  {
    id: "rj-002", listing_code: "RS-20260115-002",
    title: "LG เครื่องซักผ้า 10kg",
    status: "receiving_offers", seller_type: "R", seller_name: "ร้าน ABC Cool",
    buyer_type: null, buyer_name: null,
    price: 5200, escrow_locked: false, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-01-15T10:30:00Z",
  },
  {
    id: "rj-003", listing_code: "RS-20260120-003",
    title: "Mitsubishi AC 18000 BTU",
    status: "awaiting_payment", seller_type: "U", seller_name: "นายวิชัย มีทรัพย์",
    buyer_type: "R", buyer_name: "ร้าน TechFix",
    price: 12000, escrow_locked: false, dispute_flag: false,
    awaiting_payment_flag: true, created_at: "2026-01-20T14:00:00Z",
  },
  {
    id: "rj-004", listing_code: "RS-20260201-004",
    title: "Daikin AC 24000 BTU สภาพดี",
    status: "inspection_period", seller_type: "R", seller_name: "ร้าน CoolPro",
    buyer_type: "U", buyer_name: "นางมาลี สุขสวัสดิ์",
    price: 18000, escrow_locked: true, dispute_flag: false,
    awaiting_payment_flag: false,
    inspection_expires_at: "2026-05-25T23:59:00Z",
    created_at: "2026-02-01T08:00:00Z",
  },
  {
    id: "rj-005", listing_code: "RS-20260210-005",
    title: "Panasonic เครื่องซักผ้า 2 ถัง 7kg",
    status: "disputed", seller_type: "U", seller_name: "นายประสิทธิ์ ขยัน",
    buyer_type: "U", buyer_name: "นายเกียรติ มีสุข",
    price: 3200, escrow_locked: true, dispute_flag: true,
    awaiting_payment_flag: false, created_at: "2026-02-10T11:00:00Z",
  },
  {
    id: "rj-006", listing_code: "RS-20260215-006",
    title: "Sharp AC 9000 BTU ปี 2021",
    status: "in_progress", seller_type: "R", seller_name: "ร้าน IceCool",
    buyer_type: "U", buyer_name: "นางสาวพิมพ์ใจ ดีงาม",
    price: 6800, escrow_locked: true, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-02-15T09:00:00Z",
  },
  {
    id: "rj-007", listing_code: "RS-20260301-007",
    title: "Samsung เครื่องซักผ้า Front Load 9kg",
    status: "cancelled", seller_type: "U", seller_name: "นายจรูญ ใจกล้า",
    buyer_type: null, buyer_name: null,
    price: 9500, escrow_locked: false, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-03-01T12:00:00Z",
  },
  {
    id: "rj-008", listing_code: "RS-20260310-008",
    title: "Carrier AC 12000 BTU มือสอง",
    status: "offer_selected", seller_type: "R", seller_name: "ร้าน AirPower",
    buyer_type: "R", buyer_name: "ร้าน FixIt",
    price: 7200, escrow_locked: false, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-03-10T15:00:00Z",
  },
  {
    id: "rj-009", listing_code: "RS-20260315-009",
    title: "Toshiba เครื่องซักผ้า 8kg",
    status: "delivered", seller_type: "U", seller_name: "นางสาวจันทร์ เพ็ญ",
    buyer_type: "U", buyer_name: "นายธนา ทรัพย์ดี",
    price: 4100, escrow_locked: true, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "rj-010", listing_code: "RS-20260401-010",
    title: "Hitachi AC 15000 BTU",
    status: "disputed", seller_type: "R", seller_name: "ร้าน ColdAir",
    buyer_type: "U", buyer_name: "นายวิฑูรย์ ใจเย็น",
    price: 14500, escrow_locked: true, dispute_flag: true,
    awaiting_payment_flag: false, created_at: "2026-04-01T09:00:00Z",
  },
  {
    id: "rj-011", listing_code: "RS-20260410-011",
    title: "Electrolux เครื่องซักผ้า 11kg",
    status: "buyer_confirmed", seller_type: "U", seller_name: "นายอภิชาต สง่า",
    buyer_type: "R", buyer_name: "ร้าน ElecFix",
    price: 11200, escrow_locked: true, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-04-10T14:00:00Z",
  },
  {
    id: "rj-012", listing_code: "RS-20260501-012",
    title: "Fujitsu AC 18000 BTU สภาพดีมาก",
    status: "announced", seller_type: "R", seller_name: "ร้าน FujiCool",
    buyer_type: null, buyer_name: null,
    price: 16000, escrow_locked: false, dispute_flag: false,
    awaiting_payment_flag: false, created_at: "2026-05-01T08:00:00Z",
  },
];

const PAGE_SIZE = 20;

export default function ResellJobsPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  /* ─── client-side filter (mockup) ─── */
  const filtered = MOCK_JOBS.filter(j => {
    if (filterStatus) {
      if (filterStatus === "announced" && !["announced", "receiving_offers"].includes(j.status)) return false;
      else if (filterStatus !== "announced" && j.status !== filterStatus) return false;
    }
    if (filterSeller && j.seller_type !== filterSeller) return false;
    if (dateFrom && j.created_at < dateFrom) return false;
    if (dateTo   && j.created_at > dateTo + "T23:59:59Z") return false;
    if (search) {
      const q = search.toLowerCase();
      if (!j.listing_code.toLowerCase().includes(q) &&
          !j.title.toLowerCase().includes(q) &&
          !j.seller_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* hours until deadline */
  function hoursUntil(iso: string) {
    const h = Math.ceil((new Date(iso).getTime() - Date.now()) / 3600000);
    if (h <= 0) return { label: "หมดอายุแล้ว", urgent: true };
    if (h <= 24) return { label: `อีก ${h} ชม.`, urgent: true };
    return { label: `อีก ${Math.ceil(h / 24)} วัน`, urgent: false };
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔄 Resell Jobs — Audit</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการ listing ทั้งหมด — 10 สถานะ + flags (escrow/dispute/awaiting)
            </p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
              🔶 Mockup — ข้อมูลจำลอง
            </span>
          </div>
          <div className="flex gap-2">
            <Link href="/resell/lifecycle"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              ⏳ Lifecycle →
            </Link>
            <Link href="/resell/analytics"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              📊 Analytics →
            </Link>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === t.value
                  ? t.value === "disputed"         ? "bg-red-50 text-red-700"
                  : t.value === "awaiting_payment" ? "bg-yellow-50 text-yellow-700"
                  : t.value === "inspection_period"? "bg-orange-50 text-orange-700"
                  : "bg-admin-surface text-admin-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="ค้นหา code / ชื่อ / ร้าน"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-52 focus:outline-none focus:border-admin-primary"
          />
          <select value={filterSeller}
            onChange={e => { setFilterSeller(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-admin-primary">
            <option value="">ทุกประเภทผู้ขาย</option>
            <option value="U">WeeeU (บุคคล)</option>
            <option value="R">WeeeR (ร้าน)</option>
          </select>
          <input type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-admin-primary"
          />
          <span className="self-center text-gray-600 text-xs">ถึง</span>
          <input type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-admin-primary"
          />
          {(filterSeller || dateFrom || dateTo || search) && (
            <button onClick={() => { setFilterSeller(""); setDateFrom(""); setDateTo(""); setSearch(""); setPage(1); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg">
              ล้าง filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>พบ {filtered.length.toLocaleString()} รายการ</span>
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

          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200">
                <th className="px-4 py-3">Listing Code</th>
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ผู้ขาย</th>
                <th className="px-4 py-3">ผู้ซื้อ</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(job => {
                const sm = STATUS_META[job.status];
                return (
                  <tr key={job.id}
                    className={`hover:bg-gray-100/40 ${job.dispute_flag ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-admin-primary">{job.listing_code}</td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="text-sm line-clamp-1">{job.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          job.seller_type === "R"
                            ? "bg-admin-primary/15 text-admin-primary"
                            : "bg-gray-100 text-gray-600"
                        }`}>{job.seller_type}</span>
                        <span className="text-gray-700 truncate max-w-[100px]">{job.seller_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {job.buyer_name ? (
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            job.buyer_type === "R"
                              ? "bg-admin-primary/15 text-admin-primary"
                              : "bg-gray-100 text-gray-600"
                          }`}>{job.buyer_type}</span>
                          <span className="text-gray-700 truncate max-w-[100px]">{job.buyer_name}</span>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-green-600">
                      {job.price.toLocaleString()} G
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 min-w-[72px]">
                        {job.dispute_flag && (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                            ⚖️ พิพาท
                          </span>
                        )}
                        {job.escrow_locked && (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">
                            🔒 Escrow
                          </span>
                        )}
                        {job.awaiting_payment_flag && (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">
                            ⏰ รอชำระ
                          </span>
                        )}
                        {job.status === "inspection_period" && job.inspection_expires_at && (() => {
                          const cd = hoursUntil(job.inspection_expires_at!);
                          return (
                            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                              cd.urgent ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-600"
                            }`}>
                              🔍 {cd.label}
                            </span>
                          );
                        })()}
                        {!job.dispute_flag && !job.escrow_locked && !job.awaiting_payment_flag && job.status !== "inspection_period" && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(job.created_at).toLocaleDateString("th-TH", { dateStyle: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/resell/jobs/${job.id}`}
                        className="text-xs text-admin-primary hover:text-admin-dark whitespace-nowrap">
                        ดู →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
