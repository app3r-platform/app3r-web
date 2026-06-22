"use client";

/**
 * /scrap/disputes/[id] — Scrap Dispute detail (display-only)
 * Mockup phase: shows dispute data + read-only mirror of the 2-way resolution.
 * The actual resolve action lives in the list page modal (/scrap/disputes).
 * Escrow is REVERSE for Scrap (service_type=B): WeeeR buyer pays WeeeU seller.
 *   to_buyer  = คืน escrow ให้ WeeeR (buyer ชนะ → Scrap Job CANCELLED)
 *   to_seller = โอน escrow ให้ WeeeU (seller ชนะ → Scrap Job COMPLETED)
 */

import { use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

interface ScrapDisputeDetail {
  listing_id:     number;
  title:          string;
  service_type:   "B";
  buyer_id:       number;   // WeeeR — ร้านรับซาก
  buyer_name:     string;
  seller_id:      number;   // WeeeU — เจ้าของซาก
  seller_name:    string;
  escrow_amount:  number;   // Gold Point ค้างใน escrow
  reason:         string;
  status:         "pending" | "resolved";
  resolution:     "to_buyer" | "to_seller" | null;
  disputed_at:    string;
  timeline:       { at: string; label: string }[];
}

// mock — consistent กับ MOCK_SCRAP_DISPUTES ใน list page (ลบตอน Phase 4 / TD-06)
const MOCK_DISPUTE: ScrapDisputeDetail = {
  listing_id:    201,
  title:         "เครื่องซักผ้า Samsung 10kg เสียหาย",
  service_type:  "B",
  buyer_id:      3001,
  buyer_name:    "WeeeR ซากดี",
  seller_id:     1003,
  seller_name:   "WeeeU กิตติ",
  escrow_amount: 1200,
  reason:        "ร้านรับซากแจ้งว่าของไม่ตรงประกาศ (S8) ขอคืนพักเงินกลาง",
  status:        "pending",
  resolution:    null,
  disputed_at:   "2026-05-18T09:00:00Z",
  timeline: [
    { at: "2026-05-15T10:00:00Z", label: "WeeeU ลงประกาศซาก · escrow ถูกพักไว้" },
    { at: "2026-05-17T14:30:00Z", label: "WeeeR รับงาน · ตรวจของไม่ตรงประกาศ" },
    { at: "2026-05-18T09:00:00Z", label: "WeeeR เปิดข้อพิพาท (S11)" },
  ],
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-200/60 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function ScrapDisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // mockup: ใช้ mock เดียว ทุก id (backend wiring DEFER)
  const d = MOCK_DISPUTE;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl min-w-0">

        {/* Back link */}
        <Link href="/scrap/disputes" className="text-sm text-admin-primary hover:text-admin-dark">
          ← กลับรายการ Scrap Disputes
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">♻️ Scrap Dispute — S11</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                service_type B
              </span>
              {d.status === "pending" ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                  🔍 รอ Admin ตัดสิน
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  ✅ ตัดสินแล้ว
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm font-mono">#{id} · Listing {d.listing_id}</p>
          </div>
          <span className="text-xs text-gray-400 self-center">📺 display-only (mockup)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Parties */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">คู่กรณี</h2>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-600 mb-0.5">Buyer (WeeeR) — ร้านรับซาก</div>
                <div className="text-sm font-medium text-gray-800">{d.buyer_name}</div>
                <div className="text-xs text-gray-500 font-mono">UID: {d.buyer_id}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs text-green-700 mb-0.5">Seller (WeeeU) — เจ้าของซาก</div>
                <div className="text-sm font-medium text-gray-800">{d.seller_name}</div>
                <div className="text-xs text-gray-500 font-mono">UID: {d.seller_id}</div>
              </div>
            </div>
          </section>

          {/* Job / dispute info */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูลข้อพิพาท</h2>
            <InfoRow label="รายการซาก" value={
              <Link href={`/scrap/listings/${d.listing_id}`}
                className="text-admin-primary hover:text-admin-dark">
                {d.title} ↗
              </Link>
            } />
            <InfoRow label="Service Type" value="B (Scrap)" />
            <InfoRow label="เปิดข้อพิพาทเมื่อ" value={new Date(d.disputed_at).toLocaleString("th-TH")} />
          </section>

          {/* Escrow — REVERSE */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
                  ระบบพักเงินกลาง (Escrow) — REVERSE
                </p>
                <p className="text-sm text-gray-700">
                  WeeeR (buyer) จ่ายเข้า escrow → ค้างรอตัดสิน · จำนวน{" "}
                  <span className="font-bold text-yellow-700">
                    {d.escrow_amount.toLocaleString()} Gold Point
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Reason */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">เหตุผล Dispute</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{d.reason}</p>
          </section>

          {/* Resolution outcome — read-only mirror of list modal */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              ผลการตัดสิน (อ่านอย่างเดียว)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border-2 ${
                d.resolution === "to_buyer" ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"
              }`}>
                <div className="font-semibold text-blue-600 mb-1">to_buyer — Buyer (WeeeR) ชนะ</div>
                <div className="text-xs text-gray-600">คืน escrow ให้ {d.buyer_name}</div>
                <div className="text-xs text-gray-500 mt-1">→ Scrap Job: CANCELLED</div>
              </div>
              <div className={`p-4 rounded-xl border-2 ${
                d.resolution === "to_seller" ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}>
                <div className="font-semibold text-green-700 mb-1">to_seller — Seller (WeeeU) ชนะ</div>
                <div className="text-xs text-gray-600">โอน escrow ให้ {d.seller_name}</div>
                <div className="text-xs text-gray-500 mt-1">→ Scrap Job: COMPLETED</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-gray-500">
                {d.resolution === null
                  ? "ยังไม่ได้ตัดสิน — การตัดสินทำที่หน้ารายการ"
                  : `ตัดสินแล้ว: ${d.resolution}`}
              </p>
              {d.status === "pending" && (
                <Link href="/scrap/disputes"
                  className="px-4 py-2 text-xs bg-admin-primary hover:bg-admin-dark text-white rounded-lg font-medium transition-colors">
                  ⚖️ ไปหน้าตัดสิน →
                </Link>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h2>
            <ol className="space-y-3">
              {d.timeline.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-admin-primary shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800">{t.label}</p>
                    <p className="text-xs text-gray-500">{new Date(t.at).toLocaleString("th-TH")}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

        </div>
      </main>
    </div>
  );
}
