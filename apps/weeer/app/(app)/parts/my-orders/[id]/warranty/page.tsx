"use client";

// ── D-6 Warranty Detail (WeeeR Buyer) ─────────────────────────────────────────
// GET /api/v1/parts/orders/:id/warranty

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PART_ORDERS_MOCK } from "../../../_lib/mock-data";
import { getOrders } from "../../../../../../lib/utils/parts-sync";
import type { PartOrder } from "../../../_lib/types";

interface WarrantyInfo {
  warrantyDays: number;
  closedAt: string | null;
  warrantyExpiry: string | null;
  daysRemaining: number | null;
  isUnderWarranty: boolean;
  canClaim: boolean;
}

function getMockWarranty(order: PartOrder): WarrantyInfo {
  // Simulate warranty from D-6 listing (mock: 30 days from received)
  const warrantyDays = 30;
  const closedAt = order.stage === "received"
    ? new Date(Date.now() - 5 * 24 * 3600000).toISOString() // closed 5 days ago
    : null;

  if (!closedAt) {
    return { warrantyDays, closedAt: null, warrantyExpiry: null, daysRemaining: null, isUnderWarranty: false, canClaim: false };
  }

  const expiry = new Date(new Date(closedAt).getTime() + warrantyDays * 24 * 3600000);
  const now = Date.now();
  const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now) / 86400000));
  const isUnderWarranty = now < expiry.getTime();

  return {
    warrantyDays,
    closedAt,
    warrantyExpiry: expiry.toISOString(),
    daysRemaining,
    isUnderWarranty,
    canClaim: isUnderWarranty,
  };
}

export default function WarrantyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<PartOrder | null>(null);
  const [warranty, setWarranty] = useState<WarrantyInfo | null>(null);

  useEffect(() => {
    const stored = getOrders();
    const all = stored.length > 0 ? stored : PART_ORDERS_MOCK;
    const found = all.find((o) => o.id === id) ?? null;
    setOrder(found);
    if (found) setWarranty(getMockWarranty(found));
  }, [id]);

  if (!order) {
    return (
      <div className="px-4 pt-10 text-center text-gray-400">
        <p>ไม่พบออเดอร์ #{id}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">← กลับ</button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">ข้อมูลการรับประกัน</h1>
          <p className="text-xs text-gray-500">ออเดอร์ #{id}</p>
        </div>
      </div>

      {warranty ? (
        <>
          {/* Warranty status card */}
          <div className={`rounded-2xl p-5 space-y-3 ${warranty.isUnderWarranty ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{warranty.isUnderWarranty ? "🛡️" : "🔓"}</span>
              <div>
                <p className={`font-bold text-lg ${warranty.isUnderWarranty ? "text-green-700" : "text-gray-600"}`}>
                  {warranty.isUnderWarranty ? "อยู่ในประกัน" : "หมดประกันแล้ว"}
                </p>
                {warranty.daysRemaining !== null && warranty.isUnderWarranty && (
                  <p className="text-sm text-green-600">เหลืออีก {warranty.daysRemaining} วัน</p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>ระยะเวลารับประกัน</span>
                <span className="font-medium">{warranty.warrantyDays} วัน</span>
              </div>
              {warranty.closedAt && (
                <div className="flex justify-between text-gray-600">
                  <span>วันรับสินค้า</span>
                  <span className="font-medium">{new Date(warranty.closedAt).toLocaleDateString("th")}</span>
                </div>
              )}
              {warranty.warrantyExpiry && (
                <div className="flex justify-between text-gray-600">
                  <span>ประกันหมดวันที่</span>
                  <span className="font-medium">{new Date(warranty.warrantyExpiry).toLocaleDateString("th")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">ข้อมูลออเดอร์</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>สินค้า</span>
                <span className="font-medium text-right max-w-[60%]">{order.partName}</span>
              </div>
              <div className="flex justify-between">
                <span>จำนวน</span>
                <span className="font-medium">{order.quantity} ชิ้น</span>
              </div>
              <div className="flex justify-between">
                <span>สถานะ</span>
                <span className="font-medium capitalize">{order.stage}</span>
              </div>
            </div>
          </div>

          {/* Claim button */}
          {warranty.canClaim && (
            <button
              onClick={() => router.push(`/parts/my-orders/${id}/return`)}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 transition-colors"
            >
              🔧 แจ้งของชำรุด / ขอคืน
            </button>
          )}

          {!warranty.isUnderWarranty && (
            <div className="text-center text-sm text-gray-400 py-2">
              ไม่สามารถเคลมประกันได้ เนื่องจากหมดระยะเวลาประกันแล้ว
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 text-gray-400">
          <p>ยังไม่มีข้อมูลประกัน (ออเดอร์ยังไม่ถึงขั้น received)</p>
        </div>
      )}
    </div>
  );
}
