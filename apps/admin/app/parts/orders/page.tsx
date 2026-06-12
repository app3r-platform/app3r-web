"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

// ═══════════════════════════════════════════════════════════════════
// Parts Orders List — Admin
// Phase 3 Sign-off Prep (HUB Gen 33 CMD B)
// Local types only — mockup rule (Lesson #33/#34)
// ═══════════════════════════════════════════════════════════════════

interface PartsOrder {
  id: string;
  part_name: string;
  buyer: string;
  quantity: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
}

// MOCK_PARTS_ORDERS — display mock ครบทุกสถานะ + หลายเคส (logic จริง=BE จังหวะ 2)
// ครอบ 5 สถานะ (pending/confirmed/shipped/delivered/cancelled) + จำนวนแถว >20 ให้ pagination ทำงานจริง
const MOCK_PARTS_ORDERS: PartsOrder[] = [
  { id: "p001", part_name: "คอมเพรสเซอร์แอร์",        buyer: "ร้านซ่อม A+",       quantity: 2,  status: "pending",   created_at: "2026-05-26T09:00:00Z" },
  { id: "p002", part_name: "มอเตอร์เครื่องซักผ้า",     buyer: "ร้านซ่อม B+",       quantity: 1,  status: "confirmed", created_at: "2026-05-25T11:00:00Z" },
  { id: "p003", part_name: "บอร์ดควบคุมแอร์",          buyer: "ร้านซ่อม C+",       quantity: 3,  status: "shipped",   created_at: "2026-05-24T14:00:00Z" },
  { id: "p004", part_name: "พัดลมคอยล์ร้อน",           buyer: "ช่างเอก อิเล็คทริค", quantity: 1,  status: "delivered", created_at: "2026-05-23T08:30:00Z" },
  { id: "p005", part_name: "เทอร์โมสตัทตู้เย็น",        buyer: "ร้านซ่อม A+",       quantity: 5,  status: "cancelled", created_at: "2026-05-22T16:45:00Z" },
  { id: "p006", part_name: "ปั๊มน้ำเครื่องซักผ้า",      buyer: "ร้านซ่อม D+",       quantity: 2,  status: "pending",   created_at: "2026-05-22T10:15:00Z" },
  { id: "p007", part_name: "แผงวงจรไมโครเวฟ",          buyer: "ช่างหนึ่ง บริการ",   quantity: 1,  status: "confirmed", created_at: "2026-05-21T13:20:00Z" },
  { id: "p008", part_name: "คาปาซิเตอร์พัดลม",         buyer: "ร้านซ่อม B+",       quantity: 10, status: "shipped",   created_at: "2026-05-21T09:00:00Z" },
  { id: "p009", part_name: "ฮีตเตอร์เครื่องอบผ้า",      buyer: "ร้านซ่อม E+",       quantity: 1,  status: "delivered", created_at: "2026-05-20T15:30:00Z" },
  { id: "p010", part_name: "วาล์วน้ำเข้าเครื่องซัก",    buyer: "ช่างสมชาย แอร์",     quantity: 4,  status: "pending",   created_at: "2026-05-20T11:00:00Z" },
  { id: "p011", part_name: "รีโมทแอร์อินเวอร์เตอร์",     buyer: "ร้านซ่อม C+",       quantity: 6,  status: "confirmed", created_at: "2026-05-19T14:10:00Z" },
  { id: "p012", part_name: "ใบพัดคอมเพรสเซอร์",        buyer: "ร้านซ่อม A+",       quantity: 2,  status: "shipped",   created_at: "2026-05-19T08:45:00Z" },
  { id: "p013", part_name: "เซ็นเซอร์อุณหภูมิตู้เย็น",   buyer: "ช่างเอก อิเล็คทริค", quantity: 3,  status: "delivered", created_at: "2026-05-18T16:00:00Z" },
  { id: "p014", part_name: "สายพานเครื่องอบผ้า",        buyer: "ร้านซ่อม D+",       quantity: 1,  status: "cancelled", created_at: "2026-05-18T10:30:00Z" },
  { id: "p015", part_name: "ปุ่มกดเครื่องซักผ้า",       buyer: "ร้านซ่อม B+",       quantity: 8,  status: "pending",   created_at: "2026-05-17T13:15:00Z" },
  { id: "p016", part_name: "หลอด LED ตู้เย็น",          buyer: "ช่างหนึ่ง บริการ",   quantity: 12, status: "confirmed", created_at: "2026-05-17T09:20:00Z" },
  { id: "p017", part_name: "มอเตอร์พัดลมแอร์",          buyer: "ร้านซ่อม E+",       quantity: 2,  status: "shipped",   created_at: "2026-05-16T15:00:00Z" },
  { id: "p018", part_name: "ถังน้ำเครื่องทำน้ำอุ่น",    buyer: "ร้านซ่อม A+",       quantity: 1,  status: "delivered", created_at: "2026-05-16T11:40:00Z" },
  { id: "p019", part_name: "แม็กเนตรอนไมโครเวฟ",       buyer: "ช่างสมชาย แอร์",     quantity: 2,  status: "pending",   created_at: "2026-05-15T14:30:00Z" },
  { id: "p020", part_name: "ลูกลอยเครื่องซักผ้า",       buyer: "ร้านซ่อม C+",       quantity: 5,  status: "confirmed", created_at: "2026-05-15T08:00:00Z" },
  { id: "p021", part_name: "คอยล์เย็นแอร์ติดผนัง",      buyer: "ร้านซ่อม D+",       quantity: 1,  status: "shipped",   created_at: "2026-05-14T16:20:00Z" },
  { id: "p022", part_name: "ฝาถังเครื่องซักผ้า",        buyer: "ช่างเอก อิเล็คทริค", quantity: 3,  status: "delivered", created_at: "2026-05-14T10:10:00Z" },
  { id: "p023", part_name: "รีเลย์คอมเพรสเซอร์",        buyer: "ร้านซ่อม B+",       quantity: 7,  status: "cancelled", created_at: "2026-05-13T13:50:00Z" },
  { id: "p024", part_name: "จานหมุนไมโครเวฟ",          buyer: "ร้านซ่อม E+",       quantity: 2,  status: "pending",   created_at: "2026-05-13T09:30:00Z" },
];

const STATUS_META: Record<PartsOrder["status"], { label: string; color: string }> = {
  pending:   { label: "รอดำเนินการ", color: "bg-yellow-50 text-yellow-700" },
  confirmed: { label: "ยืนยันแล้ว",  color: "bg-blue-50 text-blue-700" },
  shipped:   { label: "จัดส่งแล้ว",  color: "bg-admin-primary/15 text-admin-primary" },
  delivered: { label: "ส่งถึงแล้ว",  color: "bg-green-50 text-green-700" },
  cancelled: { label: "ยกเลิก",      color: "bg-gray-100 text-gray-500" },
};

type PageSize = 20 | 50 | "all";

export default function PartsOrdersPage() {
  const [items] = useState<PartsOrder[]>(MOCK_PARTS_ORDERS);
  // pagination UI mock — logic จริง (cursor/total จาก API) = BE จังหวะ 2
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [page, setPage] = useState(1);

  const perPage = pageSize === "all" ? items.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pageItems = pageSize === "all"
    ? items
    : items.slice((page - 1) * perPage, page * perPage);

  // สรุปจำนวนตามสถานะ (display mock · BE จังหวะ 2 = count จาก API)
  const statusCounts = (Object.keys(STATUS_META) as PartsOrder["status"][])
    .map(s => ({ status: s, count: items.filter(o => o.status === s).length }));

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📦 คำสั่งซื้ออะไหล่</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการสั่งซื้ออะไหล่ — ตลาดกลาง B2B
            </p>
          </div>
          <Link href="/parts"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← คลังอะไหล่
          </Link>
        </div>

        {/* Status summary (display mock · count จริง=BE จังหวะ 2) */}
        <div className="flex flex-wrap gap-2">
          {statusCounts.map(({ status, count }) => {
            const sm = STATUS_META[status];
            return (
              <div key={status}
                className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                <span className="text-sm font-semibold text-gray-700">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>{items.length} รายการ</span>
            {/* pagination size selector (UI mock) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">แสดง</span>
              {([20, 50, "all"] as PageSize[]).map(sz => (
                <button
                  key={String(sz)}
                  onClick={() => { setPageSize(sz); setPage(1); }}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    pageSize === sz
                      ? "bg-admin-surface text-admin-primary border-admin-primary/40"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}>
                  {sz === "all" ? "ทั้งหมด" : sz}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200">
                <th className="px-4 py-3">รหัสคำสั่งซื้อ</th>
                <th className="px-4 py-3">อะไหล่</th>
                <th className="px-4 py-3">ผู้ซื้อ (WeeeR)</th>
                <th className="px-4 py-3">จำนวน</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">สั่งเมื่อ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">ไม่มีรายการ</td>
                </tr>
              ) : pageItems.map(order => {
                const sm = STATUS_META[order.status];
                return (
                  <tr key={order.id} className="hover:bg-gray-100/40">
                    <td className="px-4 py-3 font-mono text-xs text-admin-primary">{order.id}</td>
                    <td className="px-4 py-3 text-sm">{order.part_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.buyer}</td>
                    <td className="px-4 py-3 text-sm font-mono text-center">{order.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString("th-TH")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/parts/orders/${order.id}`}
                        className="text-xs text-admin-primary hover:text-admin-dark whitespace-nowrap">
                        ดู →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* pagination footer (UI mock · ซ่อนเมื่อ "ทั้งหมด" หรือหน้าเดียว) */}
          {pageSize !== "all" && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
              <span className="text-xs">หน้า {page} / {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:border-gray-500 transition-colors">
                  ← ก่อนหน้า
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:border-gray-500 transition-colors">
                  ถัดไป →
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
