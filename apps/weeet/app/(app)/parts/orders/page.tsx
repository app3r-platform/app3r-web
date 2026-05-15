/**
 * app/(app)/parts/orders/page.tsx
 * Sub-CMD-9 Wave 3 — WeeeT Buyer Order List Page
 *
 * GET /api/v1/parts/orders/ → list buyer's orders (paginated)
 * Fallback: localStorage weeet_part_order_ids (Sub-8 compat)
 */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { partsOrdersApi } from "@/lib/api";
import type { PartsOrderDto, PartsOrderStatus } from "@/lib/types";

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<PartsOrderStatus, string> = {
  pending: "รอ Escrow",
  held: "ถือเงินแล้ว",
  fulfilled: "ส่งของแล้ว",
  closed: "ปิดออเดอร์",
  disputed: "มีข้อพิพาท",
  resolved: "แก้ไขแล้ว",
  refunded: "คืนเงิน",
  cancelled: "ยกเลิก",
};

const STATUS_COLORS: Record<PartsOrderStatus, string> = {
  pending: "bg-yellow-900/40 text-yellow-300",
  held: "bg-blue-900/40 text-blue-300",
  fulfilled: "bg-cyan-900/40 text-cyan-300",
  closed: "bg-green-900/40 text-green-300",
  disputed: "bg-red-900/40 text-red-300",
  resolved: "bg-purple-900/40 text-purple-300",
  refunded: "bg-gray-700/40 text-gray-300",
  cancelled: "bg-gray-800/40 text-gray-500",
};

const FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "ทั้งหมด", value: "" },
  { label: "รอดำเนินการ", value: "pending" },
  { label: "ถือเงิน", value: "held" },
  { label: "ส่งของแล้ว", value: "fulfilled" },
  { label: "ปิดแล้ว", value: "closed" },
  { label: "พิพาท", value: "disputed" },
];

function getLocalOrderIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem("weeet_part_order_ids") ?? "[]") as string[];
  } catch {
    return [];
  }
}

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PartsOrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async (pageNum: number, status: string) => {
    setLoading(true);
    setApiError(false);
    setUsingFallback(false);
    try {
      const result = await partsOrdersApi.listMyOrders({
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: pageNum * PAGE_SIZE,
      });
      setOrders(result.items);
      setTotal(result.total);
    } catch {
      setApiError(true);
      setUsingFallback(true);
      // Fallback: localStorage order IDs (Sub-8 backward compat)
      const ids = getLocalOrderIds();
      const start = pageNum * PAGE_SIZE;
      const sliced = ids.slice(start, start + PAGE_SIZE);
      const stubOrders: PartsOrderDto[] = sliced.map((id) => ({
        id,
        partId: "",
        buyerId: "",
        serviceId: null,
        quantity: 0,
        unitPriceThb: "0.00",
        totalThb: "0.00",
        status: "pending" as PartsOrderStatus,
        fulfillmentNote: null,
        trackingNumber: null,
        fulfilledAt: null,
        closedAt: null,
        idempotencyKey: "",
        createdAt: "",
        updatedAt: "",
      }));
      setOrders(stubOrders);
      setTotal(ids.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, statusFilter);
  }, [load, page, statusFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
          aria-label="กลับ"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">ออเดอร์ของฉัน</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {usingFallback ? "ข้อมูลจากอุปกรณ์" : `${total} รายการ`}
          </p>
        </div>
      </div>

      {/* Fallback banner */}
      {usingFallback && (
        <div
          role="alert"
          className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl px-4 py-2.5 text-sm text-yellow-300"
        >
          ⚠️ ไม่สามารถโหลดออเดอร์จาก API ได้ — แสดงข้อมูลจากอุปกรณ์
        </div>
      )}

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setStatusFilter(opt.value);
              setPage(0);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-orange-600 text-white"
                : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse space-y-2"
            >
              <div className="h-4 bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Order list */}
      {!loading && (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => router.push(`/parts/orders/${order.id}`)}
              className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 hover:border-orange-600/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">
                    {order.id.slice(0, 8).toUpperCase()}…
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  จำนวน{" "}
                  <span className="text-white">
                    {order.quantity > 0 ? order.quantity : "—"}
                  </span>
                </span>
                {parseFloat(order.totalThb) > 0 && (
                  <span className="text-orange-400 font-medium">
                    ฿{parseFloat(order.totalThb).toLocaleString()}
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Empty state */}
          {orders.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-3xl">📦</p>
              <p className="text-gray-400 text-sm">ยังไม่มีออเดอร์</p>
              <button
                type="button"
                onClick={() => router.push("/parts")}
                className="mt-2 text-orange-400 text-sm underline"
              >
                เลือกซื้ออะไหล่
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 disabled:opacity-40"
          >
            ← ก่อนหน้า
          </button>
          <span className="text-xs text-gray-500">
            หน้า {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 disabled:opacity-40"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
}
