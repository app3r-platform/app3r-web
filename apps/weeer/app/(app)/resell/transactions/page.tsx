"use client";

// ── WeeeR Resell Transactions — 2.2 Mockup (cancelled/disputed tabs + colors) ─

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { ResellTransaction, ListingStatus } from "../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../_lib/types";
import { MockAnnoOrigin } from "@/components/MockAnno";

const ACTIVE_STATUSES: ListingStatus[] = ["in_progress", "delivered", "inspection_period"];

const TABS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "delivered", label: "ส่งมอบแล้ว" },
  { value: "inspection_period", label: "ช่วงตรวจสอบ" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "disputed", label: "⚠️ พิพาท" },
  { value: "cancelled", label: "ยกเลิก" },
];

// Mock transaction data (Mockup 2.2)
const MOCK_TRANSACTIONS: ResellTransaction[] = [
  {
    id: "TX001", listingId: "L004", applianceName: "MacBook Air M2",
    sellerName: "ร้านของฉัน", buyerName: "วิชัย สุขใจ",
    price: 32000, status: "in_progress", deliveryMethod: "ส่ง Kerry",
    createdAt: "2026-05-10", updatedAt: "2026-05-23", role: "seller",
  },
  {
    id: "TX002", listingId: "LMKT1", applianceName: "Sony Bravia XR 55\"",
    sellerName: "ร้าน ElecWorld", buyerName: "ร้านของฉัน",
    price: 16500, status: "delivered", deliveryMethod: "ส่ง Kerry",
    createdAt: "2026-05-15", updatedAt: "2026-05-22", role: "buyer",
  },
  {
    id: "TX003", listingId: "L_OLD1", applianceName: "iPad Pro 11\" M2",
    sellerName: "ร้านของฉัน", buyerName: "นภา พรมดี",
    price: 18000, status: "completed", deliveryMethod: "รับเอง",
    createdAt: "2026-05-01", updatedAt: "2026-05-18", role: "seller",
  },
  {
    id: "TX004", listingId: "L_OLD2", applianceName: "DJI Mini 3 Pro",
    sellerName: "ร้าน FlyHigh", buyerName: "ร้านของฉัน",
    price: 12000, status: "disputed", deliveryMethod: "ส่ง Kerry",
    createdAt: "2026-05-05", updatedAt: "2026-05-21", role: "buyer",
    disputeReason: "สินค้าไม่ตรงปกที่โฆษณา",
  },
];

export default function ResellTransactionsPage() {
  const [transactions, setTransactions] = useState<ResellTransaction[]>(() =>
    process.env.NEXT_PUBLIC_DEV_NAV === "true" ? MOCK_TRANSACTIONS : []
  );
  const [loading, setLoading] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV !== "true");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "">("");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return;
    resellApi.transactionsList({ status: statusFilter || undefined })
      .then(setTransactions)
      .catch(() => setTransactions(MOCK_TRANSACTIONS))  // Mockup fallback
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = statusFilter ? transactions.filter(t => t.status === statusFilter) : transactions;
  const activeCount = transactions.filter(t => ACTIVE_STATUSES.includes(t.status)).length;
  const disputedCount = transactions.filter(t => t.status === "disputed").length;

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-5">
      <MockAnnoOrigin from="R-66" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">รายการซื้อขาย</h1>
        </div>
        <div className="flex gap-2">
          {activeCount > 0 && (
            <span className="text-xs bg-[#FCEAE3] text-[#FF663A] font-semibold px-2.5 py-1 rounded-full">
              {activeCount} กำลังดำเนินการ
            </span>
          )}
          {disputedCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">
              {disputedCount} พิพาท
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === t.value ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีรายการ</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map(tx => (
            <Link key={tx.id} href={`/resell/transactions/${tx.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{tx.applianceName}</p>
                <p className="text-xs text-gray-400">
                  {tx.role === "seller" ? `ผู้ซื้อ: ${tx.buyerName}` : `ผู้ขาย: ${tx.sellerName}`}
                  <span className="ml-1 text-gray-300">· {tx.role === "seller" ? "ฉันขาย" : "ฉันซื้อ"}</span>
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block ${LISTING_STATUS_COLOR[tx.status]}`}>
                  {LISTING_STATUS_LABEL[tx.status]}
                </span>
              </div>
              <div className="shrink-0 ml-3 text-right">
                <p className="text-sm font-bold text-[#FF663A]">{tx.price.toLocaleString()} พอยต์</p>
                <p className="text-xs text-gray-400">
                  {new Date(tx.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
