"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { Offer, OfferStatus } from "../_lib/types";
import { OFFER_STATUS_LABEL, OFFER_STATUS_COLOR } from "../_lib/types";

const TABS: { value: OfferStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "pending", label: "รอตอบ" },
  { value: "selected", label: "ถูกเลือก" },
  { value: "rejected", label: "ถูกปฏิเสธ" },
  { value: "withdrawn", label: "ถอนแล้ว" },
];

export default function ResellOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "">("");
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    resellApi.myOffers({ status: statusFilter || undefined })
      .then(setOffers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function handleWithdraw(offerId: string) {
    setWithdrawing(offerId);
    try {
      await resellApi.withdrawOffer(offerId);
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: "withdrawn" } : o));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWithdrawing(null);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;

  return (
    <div className="space-y-5">
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
              ${statusFilter === t.value ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่มีข้อเสนอ</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {offers.map(o => (
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
                  <p className="text-sm font-bold text-indigo-700">{o.offerPrice.toLocaleString()} pts</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${OFFER_STATUS_COLOR[o.status]}`}>
                    {OFFER_STATUS_LABEL[o.status]}
                  </span>
                </div>
              </div>
              {o.status === "pending" && (
                <button onClick={() => handleWithdraw(o.id)} disabled={withdrawing === o.id}
                  className="mt-2 text-xs text-red-500 hover:underline disabled:opacity-50">
                  {withdrawing === o.id ? "กำลังถอน…" : "ถอนข้อเสนอ"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
