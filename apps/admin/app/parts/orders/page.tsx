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

// MOCK_PARTS_ORDERS — fallback เมื่อ API ไม่พร้อม (dev/staging)
const MOCK_PARTS_ORDERS: PartsOrder[] = [
  { id: "p001", part_name: "คอมเพรสเซอร์แอร์",  buyer: "ร้านซ่อม A+", quantity: 2, status: "pending",   created_at: "2026-05-26T09:00:00Z" },
  { id: "p002", part_name: "มอเตอร์เครื่องซัก", buyer: "ร้านซ่อม B+", quantity: 1, status: "confirmed", created_at: "2026-05-25T11:00:00Z" },
  { id: "p003", part_name: "บอร์ดควบคุม",        buyer: "ร้านซ่อม C+", quantity: 3, status: "shipped",   created_at: "2026-05-24T14:00:00Z" },
];

const STATUS_META: Record<PartsOrder["status"], { label: string; color: string }> = {
  pending:   { label: "รอดำเนินการ", color: "bg-yellow-50 text-yellow-700" },
  confirmed: { label: "ยืนยันแล้ว",  color: "bg-blue-50 text-blue-700" },
  shipped:   { label: "จัดส่งแล้ว",  color: "bg-admin-primary/15 text-admin-primary" },
  delivered: { label: "ส่งถึงแล้ว",  color: "bg-green-50 text-green-700" },
  cancelled: { label: "ยกเลิก",      color: "bg-gray-100 text-gray-500" },
};

export default function PartsOrdersPage() {
  const [items] = useState<PartsOrder[]>(MOCK_PARTS_ORDERS);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📦 Parts Orders</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการสั่งซื้ออะไหล่ — B2B marketplace orders
            </p>
          </div>
          <Link href="/parts"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← Inventory
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 text-sm text-gray-500">
            {items.length} รายการ
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200">
                <th className="px-4 py-3">Order ID</th>
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
              ) : items.map(order => {
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
        </div>

      </main>
    </div>
  );
}
