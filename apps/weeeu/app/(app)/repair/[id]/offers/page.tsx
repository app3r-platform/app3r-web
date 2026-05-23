"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// ── 9 แกนเงื่อนไข (Blueprint B2.5) ────────────────────────────────────────────
// แกน 1: มัดจำ (deposit)
// แกน 2: ค่าตรวจ (inspection_fee)
// แกน 3: ค่าเดินทาง (travel_fee)
// แกน 4: ค่าแรงยุติ (labor_cancel_fee)
// แกน 5: ค่าอะไหล่ (parts_markup_policy)
// แกน 6: รับประกัน (warranty_days)
// แกน 7: no-show / ฝาก (no_show_policy)
// แกน 8: งานบานปลาย (scope_creep_policy)
// แกน 9: ความรับผิด (liability_cap)

type RepairOffer = {
  id: string;
  weeer_id: string;
  weeer_name: string;
  weeer_rating: number;
  weeer_review_count: number;
  quoted_price: number;
  // แกน 2
  inspection_fee: number;
  // แกน 1
  deposit_amount: number | null;
  deposit_policy_when_unrepairable: "free" | "forfeit" | "refund" | "refund_partial";
  deposit_partial_refund_pct: number | null; // % คืนเมื่อ refund_partial
  // แกน 3
  travel_fee: number | null;
  travel_fee_policy: string | null; // e.g. "included" | "extra" | "waived_if_repair"
  // แกน 4
  labor_cancel_fee: number | null; // ค่าแรงยุติงาน (เมื่อลูกค้าเลิกกลางคัน)
  labor_cancel_fee_policy: string | null;
  // แกน 5
  parts_markup_pct: number | null; // % markup อะไหล่
  parts_policy: string | null; // e.g. "at_cost" | "market" | "markup"
  // แกน 6
  warranty_days: number | null;
  warranty_scope: string | null; // e.g. "labor" | "parts" | "both"
  // แกน 7
  no_show_fee: number | null; // ค่าปรับ no-show / ฝาก
  no_show_policy: string | null;
  // แกน 8
  scope_creep_policy: string | null; // นโยบายงานบานปลาย
  scope_creep_threshold_pct: number | null; // % เกินงานเดิมที่ต้องแจ้งก่อน
  // แกน 9
  liability_cap: number | null; // วงเงินสูงสุดความรับผิด (Point)
  liability_policy: string | null;
  // ทั่วไป
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

// ── แกน 1: deposit policy labels ──────────────────────────────────────────────
const DEPOSIT_POLICY_LABEL: Record<string, string> = {
  free:            "ฟรี (ไม่ยึดถ้าซ่อมไม่ได้)",
  forfeit:         "ยึดมัดจำ (ถ้าซ่อมไม่ได้)",
  refund:          "คืนมัดจำเต็ม (ถ้าซ่อมไม่ได้)",
  refund_partial:  "คืนมัดจำบางส่วน (ถ้าซ่อมไม่ได้)",
};

// ── แกน 5: parts policy labels ────────────────────────────────────────────────
const PARTS_POLICY_LABEL: Record<string, string> = {
  at_cost: "ราคาต้นทุน",
  market:  "ราคาตลาด",
  markup:  "ราคาตลาด + markup",
};

// ── แกน 6: warranty scope labels ──────────────────────────────────────────────
const WARRANTY_SCOPE_LABEL: Record<string, string> = {
  labor: "ค่าแรงเท่านั้น",
  parts: "อะไหล่เท่านั้น",
  both:  "ค่าแรง + อะไหล่",
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
        <div className="bg-weeeu-surface border border-weeeu-surface rounded-2xl p-4">
          <p className="text-sm font-semibold text-weeeu-dark">{listing.appliance_name}</p>
          <p className="text-xs text-weeeu-primary mt-0.5">{listing.issue_summary}</p>
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
            <OfferCard
              key={offer.id}
              offer={offer}
              selecting={selecting}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Offer card (9 แกนเงื่อนไข) ────────────────────────────────────────────────
function OfferCard({
  offer,
  selecting,
  onSelect,
}: {
  offer: RepairOffer;
  selecting: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
            <p className="text-lg font-bold text-weeeu-primary">{offer.quoted_price.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Point</p>
          </div>
        </div>
      </div>

      {/* ── เงื่อนไขหลัก (always visible) ─────────────────────────────────── */}
      <div className="px-5 py-4 space-y-2">
        {/* แกน 2: ค่าตรวจ */}
        <OfferRow label="แกน 2 · ค่าตรวจ" value={`${offer.inspection_fee.toLocaleString()} Point (ไม่คืน)`} />

        {/* แกน 1: มัดจำ */}
        {offer.deposit_amount != null && (
          <div className="space-y-0.5">
            <OfferRow
              label="แกน 1 · มัดจำ"
              value={`${offer.deposit_amount.toLocaleString()} Point`}
            />
            <div className="flex justify-end">
              <span className="text-xs text-amber-600">
                {DEPOSIT_POLICY_LABEL[offer.deposit_policy_when_unrepairable] ?? offer.deposit_policy_when_unrepairable}
                {offer.deposit_policy_when_unrepairable === "refund_partial" && offer.deposit_partial_refund_pct != null
                  ? ` (${offer.deposit_partial_refund_pct}%)`
                  : ""}
              </span>
            </div>
          </div>
        )}

        {/* แกน 3: ค่าเดินทาง */}
        {(offer.travel_fee != null || offer.travel_fee_policy) && (
          <OfferRow
            label="แกน 3 · ค่าเดินทาง"
            value={
              offer.travel_fee != null
                ? `${offer.travel_fee.toLocaleString()} Point${offer.travel_fee_policy ? ` (${offer.travel_fee_policy})` : ""}`
                : offer.travel_fee_policy ?? "—"
            }
          />
        )}

        {/* แกน 6: รับประกัน */}
        {offer.warranty_days != null && (
          <OfferRow
            label="แกน 6 · รับประกัน"
            value={`${offer.warranty_days} วัน${offer.warranty_scope ? ` · ${WARRANTY_SCOPE_LABEL[offer.warranty_scope] ?? offer.warranty_scope}` : ""}`}
          />
        )}

        {/* ระยะเวลาซ่อม */}
        <OfferRow label="ระยะเวลา (ประมาณ)" value={`${offer.estimated_duration_days} วัน`} />
      </div>

      {/* ── เงื่อนไขขั้นสูง (collapsible) ─────────────────────────────────── */}
      <div className="border-t border-gray-50">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span>เงื่อนไขเพิ่มเติม ({expanded ? "ซ่อน" : "ดู"})</span>
          <span className="text-base leading-none">{expanded ? "▴" : "▾"}</span>
        </button>

        {expanded && (
          <div className="px-5 pb-4 space-y-2 border-t border-gray-50 pt-3">
            {/* แกน 4: ค่าแรงยุติ */}
            {(offer.labor_cancel_fee != null || offer.labor_cancel_fee_policy) && (
              <OfferRow
                label="แกน 4 · ค่าแรงยุติ"
                value={
                  offer.labor_cancel_fee != null
                    ? `${offer.labor_cancel_fee.toLocaleString()} Point${offer.labor_cancel_fee_policy ? ` — ${offer.labor_cancel_fee_policy}` : ""}`
                    : offer.labor_cancel_fee_policy ?? "—"
                }
              />
            )}

            {/* แกน 5: ค่าอะไหล่ */}
            {(offer.parts_markup_pct != null || offer.parts_policy) && (
              <OfferRow
                label="แกน 5 · ค่าอะไหล่"
                value={
                  offer.parts_policy
                    ? `${PARTS_POLICY_LABEL[offer.parts_policy] ?? offer.parts_policy}${offer.parts_markup_pct != null ? ` (+${offer.parts_markup_pct}%)` : ""}`
                    : `markup +${offer.parts_markup_pct}%`
                }
              />
            )}

            {/* แกน 7: no-show / ฝาก */}
            {(offer.no_show_fee != null || offer.no_show_policy) && (
              <OfferRow
                label="แกน 7 · No-show / ฝาก"
                value={
                  offer.no_show_fee != null
                    ? `${offer.no_show_fee.toLocaleString()} Point${offer.no_show_policy ? ` — ${offer.no_show_policy}` : ""}`
                    : offer.no_show_policy ?? "—"
                }
              />
            )}

            {/* แกน 8: งานบานปลาย */}
            {(offer.scope_creep_policy || offer.scope_creep_threshold_pct != null) && (
              <OfferRow
                label="แกน 8 · งานบานปลาย"
                value={
                  offer.scope_creep_threshold_pct != null
                    ? `แจ้งลูกค้าเมื่อเกิน ${offer.scope_creep_threshold_pct}%${offer.scope_creep_policy ? ` — ${offer.scope_creep_policy}` : ""}`
                    : offer.scope_creep_policy ?? "—"
                }
              />
            )}

            {/* แกน 9: ความรับผิด */}
            {(offer.liability_cap != null || offer.liability_policy) && (
              <OfferRow
                label="แกน 9 · วงเงินความรับผิด"
                value={
                  offer.liability_cap != null
                    ? `ไม่เกิน ${offer.liability_cap.toLocaleString()} Point${offer.liability_policy ? ` — ${offer.liability_policy}` : ""}`
                    : offer.liability_policy ?? "—"
                }
              />
            )}

            {/* หมายเหตุจากร้าน */}
            {offer.notes && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-1">หมายเหตุจากร้าน</p>
                <p className="text-sm text-gray-600">{offer.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Select button */}
      <div className="px-5 pb-5 pt-2">
        <button
          disabled={!!selecting}
          onClick={() => onSelect(offer.id)}
          className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {selecting === offer.id ? (
            <><span className="animate-spin">⟳</span> กำลังเลือก...</>
          ) : (
            "เลือกร้านนี้"
          )}
        </button>
      </div>
    </div>
  );
}

function OfferRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-gray-400 flex-shrink-0">{label}</p>
      <p className="text-xs text-gray-700 font-medium text-right">{value}</p>
    </div>
  );
}
