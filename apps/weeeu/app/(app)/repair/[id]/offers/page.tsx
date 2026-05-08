"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type RepairOffer = {
  id: string;
  weeer_id: string;
  weeer_name: string;
  weeer_rating: number;
  weeer_review_count: number;
  quoted_price: number;
  inspection_fee: number;
  deposit_amount: number | null;
  deposit_policy_when_unrepairable: "free" | "forfeit" | "refund";
  estimated_duration_days: number;
  notes: string;
  created_at: string;
};

type ListingDetail = {
  id: string;
  appliance_name: string;
  issue_summary: string;
  status: string;
};

const DEPOSIT_POLICY_LABEL: Record<string, string> = {
  free: "ฟรี (ไม่ยึดถ้าซ่อมไม่ได้)",
  forfeit: "ยึดมัดจำ (ถ้าซ่อมไม่ได้)",
  refund: "คืนมัดจำ (ถ้าซ่อมไม่ได้)",
};

export default function RepairOffersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [offers, setOffers] = useState<RepairOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/v1/repair/listings/${id}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/v1/repair/listings/${id}/offers`).then(r => r.ok ? r.json() : { items: [] }),
    ]).then(([ld, od]) => {
      setListing(ld);
      setOffers(od.items ?? []);
    }).catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async (offerId: string) => {
    setSelecting(offerId);
    try {
      const res = await apiFetch(`/api/v1/repair/offers/${offerId}/select`, {
        method: "POST",
        body: JSON.stringify({ listing_id: id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      router.push(`/repair/${data.job_id ?? id}`);
    } catch {
      setError("เกิดข้อผิดพลาดในการเลือก Offer กรุณาลองใหม่");
    } finally {
      setSelecting(null);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/repair" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">Offer จากร้านซ่อม</h1>
      </div>

      {listing && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-blue-800">{listing.appliance_name}</p>
          <p className="text-xs text-blue-600 mt-0.5">{listing.issue_summary}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">⏳</p>
          <p className="text-gray-500 font-medium">ยังไม่มี Offer</p>
          <p className="text-xs text-gray-400 mt-1">ร้านซ่อมจะส่ง Offer มาให้เร็วๆ นี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{offers.length} Offer จากร้านซ่อม — เลือกร้านที่ต้องการ</p>
          {offers.map(offer => (
            <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Shop header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{offer.weeer_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ⭐ {offer.weeer_rating.toFixed(1)} · {offer.weeer_review_count.toLocaleString()} รีวิว
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-700">{offer.quoted_price.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Point</p>
                  </div>
                </div>
              </div>

              {/* Offer details */}
              <div className="px-5 py-4 space-y-2">
                <OfferRow label="ค่าตรวจ" value={`${offer.inspection_fee.toLocaleString()} Point (ไม่คืน)`} />
                {offer.deposit_amount && (
                  <OfferRow
                    label="มัดจำ"
                    value={`${offer.deposit_amount.toLocaleString()} Point — ${DEPOSIT_POLICY_LABEL[offer.deposit_policy_when_unrepairable]}`}
                  />
                )}
                <OfferRow label="ระยะเวลาซ่อม (ประมาณ)" value={`${offer.estimated_duration_days} วัน`} />
                {offer.notes && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-400 mb-1">หมายเหตุจากร้าน</p>
                    <p className="text-sm text-gray-600">{offer.notes}</p>
                  </div>
                )}
              </div>

              {/* Select button */}
              <div className="px-5 pb-5">
                <button
                  disabled={!!selecting}
                  onClick={() => handleSelect(offer.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {selecting === offer.id ? (
                    <><span className="animate-spin">⟳</span> กำลังเลือก...</>
                  ) : (
                    "เลือกร้านนี้"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OfferRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xs text-gray-700 font-medium text-right">{value}</p>
    </div>
  );
}
