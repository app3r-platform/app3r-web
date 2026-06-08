"use client";

// ── WeeeR Resell Offers — 2.2 Mockup (R4 escrow countdown + R9 withdraw) ────

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { Offer, OfferStatus } from "../_lib/types";
import { OFFER_STATUS_LABEL, OFFER_STATUS_COLOR } from "../_lib/types";
import { MockAnnoOrigin } from "@/components/MockAnno";

const TABS: { value: OfferStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "pending", label: "รอตอบ" },
  { value: "selected", label: "ถูกเลือก ⭐" },
  { value: "rejected", label: "ถูกปฏิเสธ" },
  { value: "withdrawn", label: "ถอนแล้ว" },
];

// RC-B: relative date helper (expiresAt 7 วันจากตอนนี้ ไม่ใช้ hardcode date)
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

// Mock offers data (Mockup 2.2)
const MOCK_OFFERS: Offer[] = [
  {
    id: "O3", listingId: "L002", buyerId: "S1", buyerType: "WeeeR",
    offerPrice: 8500, deliveryMethod: "รับเอง",
    status: "selected", expiresAt: addDays(new Date(), 7).toISOString(), createdAt: addDays(new Date(), -3).toISOString(),
    listingTitle: "Dyson V15 Detect", buyerName: "ร้านของฉัน",
    message: "ราคาตามประกาศ",
  },
  {
    id: "O5", listingId: "MKT001", buyerId: "S1", buyerType: "WeeeR",
    offerPrice: 15000, deliveryMethod: "ส่ง Kerry",
    status: "pending", expiresAt: addDays(new Date(), 7).toISOString(), createdAt: addDays(new Date(), -2).toISOString(),
    listingTitle: "Sony Bravia XR 55\"", buyerName: "ร้านของฉัน",
  },
  {
    id: "O6", listingId: "MKT002", buyerId: "S1", buyerType: "WeeeR",
    offerPrice: 5200, deliveryMethod: "รับเอง",
    status: "rejected", expiresAt: addDays(new Date(), -1).toISOString(), createdAt: addDays(new Date(), -6).toISOString(),
    listingTitle: "iPad Pro 11\" M2", buyerName: "ร้านของฉัน",
  },
];

// R4: Escrow countdown (mock ≤24h)
function useEscrowCountdown(hoursLeft = 22) {
  const deadline = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + hoursLeft, d.getMinutes() + 15);
    return d;
  })[0];
  const [msLeft, setMsLeft] = useState(() => deadline.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setMsLeft(deadline.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return msLeft;
}

function EscrowBadge() {
  const msLeft = useEscrowCountdown();
  if (msLeft <= 0) return <span className="text-xs text-red-600 font-medium">⏰ หมดเวลา</span>;
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  const s = Math.floor((msLeft % 60000) / 1000);
  const urgent = msLeft < 3600000;
  return (
    <span className={`text-xs font-bold ${urgent ? "text-red-600" : "text-[#D63B12]"}`}>
      ⏳ {h}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function ResellOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "">("");
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    resellApi.myOffers({ status: statusFilter || undefined })
      .then(setOffers)
      .catch(() => setOffers(MOCK_OFFERS))  // Mockup fallback
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = statusFilter ? offers.filter(o => o.status === statusFilter) : offers;

  function handleWithdraw(offerId: string) {
    setWithdrawing(offerId);
    resellApi.withdrawOffer(offerId)
      .catch(() => null)
      .finally(() => {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: "withdrawn" } : o));
        setWithdrawing(null);
      });
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-5">
      <MockAnnoOrigin from="R-66" />
      <div className="flex items-center gap-3">
        <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ข้อเสนอของฉัน</h1>
        <span className="ml-auto text-xs text-gray-400">{offers.length} รายการ</span>
      </div>

      {/* Status tabs */}
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
        <div className="text-center py-12 text-gray-400 text-sm">ไม่มีข้อเสนอ</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map(o => (
            <div key={o.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/resell/marketplace/${o.listingId}`}
                    className="text-sm font-medium text-gray-800 hover:underline truncate block">
                    {o.listingTitle ?? o.listingId}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{o.deliveryMethod}</p>
                  {o.message && <p className="text-xs text-gray-500 italic mt-0.5">"{o.message}"</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-[#FF663A]">{o.offerPrice.toLocaleString()} pts</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${OFFER_STATUS_COLOR[o.status]}`}>
                    {OFFER_STATUS_LABEL[o.status]}
                  </span>
                </div>
              </div>

              {/* R4: selected → escrow wait */}
              {o.status === "selected" && (
                <div className="mt-2 bg-[#FFF1ED] border border-[#FFD0BF] rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#D63B12]">⭐ ข้อเสนอถูกเลือก — ต้องเติม Gold</p>
                      <p className="text-xs text-[#F04E20] mt-0.5">เติม Gold ≤24ชม. ไม่งั้น offer ถูกปลดอัตโนมัติ</p>
                    </div>
                    <EscrowBadge />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link href="/wallet"
                      className="flex-1 text-center text-xs bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-2 rounded-lg transition-colors">
                      💰 ไป Wallet เติม Gold
                    </Link>
                    <button onClick={() => handleWithdraw(o.id)} disabled={withdrawing === o.id}
                      className="text-xs text-gray-500 hover:underline disabled:opacity-50 px-2">
                      ถอน
                    </button>
                  </div>
                </div>
              )}

              {/* R9: pending → ถอนได้ */}
              {o.status === "pending" && (
                <button onClick={() => handleWithdraw(o.id)} disabled={withdrawing === o.id}
                  className="mt-2 text-xs text-red-500 hover:underline disabled:opacity-50">
                  {withdrawing === o.id ? "กำลังถอน…" : "ถอนข้อเสนอ (R9)"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
