"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";
import { apiFetch } from "@/lib/api-client";

// ── 9 เงื่อนไข (Blueprint B2.5) ────────────────────────────────────────────
// เงื่อนไข 1: พอยต์ทองที่ล็อก (deposit)
// เงื่อนไข 2: ค่าตรวจ (inspection_fee)
// เงื่อนไข 3: ค่าเดินทาง (travel_fee)
// เงื่อนไข 4: ค่าแรงยุติ (labor_cancel_fee)
// เงื่อนไข 5: ค่าอะไหล่ (parts_markup_policy)
// เงื่อนไข 6: รับประกัน (warranty_days)
// เงื่อนไข 7: no-show / ฝาก (no_show_policy)
// เงื่อนไข 8: งานบานปลาย (scope_creep_policy)
// เงื่อนไข 9: ความรับผิด (liability_cap)

type RepairOffer = {
  id: string;
  weeer_id: string;
  weeer_name: string;
  weeer_rating: number;
  weeer_review_count: number;
  quoted_price: number;
  // เงื่อนไข 2
  inspection_fee: number;
  // เงื่อนไข 1
  deposit_amount: number | null;
  deposit_policy_when_unrepairable: "free" | "forfeit" | "refund" | "refund_partial";
  deposit_partial_refund_pct: number | null; // % คืนเมื่อ refund_partial
  // เงื่อนไข 3
  travel_fee: number | null;
  travel_fee_policy: string | null; // e.g. "included" | "extra" | "waived_if_repair"
  // เงื่อนไข 4
  labor_cancel_fee: number | null; // ค่าแรงยุติงาน (เมื่อลูกค้าเลิกกลางคัน)
  labor_cancel_fee_policy: string | null;
  // เงื่อนไข 5
  parts_markup_pct: number | null; // % markup อะไหล่
  parts_policy: string | null; // e.g. "at_cost" | "market" | "markup"
  // เงื่อนไข 6
  warranty_days: number | null;
  warranty_scope: string | null; // e.g. "labor" | "parts" | "both"
  // เงื่อนไข 7
  no_show_fee: number | null; // ค่าปรับ no-show / ฝาก
  no_show_policy: string | null;
  // เงื่อนไข 8
  scope_creep_policy: string | null; // นโยบายงานบานปลาย
  scope_creep_threshold_pct: number | null; // % เกินงานเดิมที่ต้องแจ้งก่อน
  // เงื่อนไข 9
  liability_cap: number | null; // วงเงินสูงสุดความรับผิด (พอยต์ทอง)
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

// ── เงื่อนไข 1: deposit policy labels ──────────────────────────────────────────────
const DEPOSIT_POLICY_LABEL: Record<string, string> = {
  free:            "ฟรี (ไม่ยึดถ้าซ่อมไม่ได้)",
  forfeit:         "ยึดพอยต์ทองที่ล็อก (ถ้าซ่อมไม่ได้)",
  refund:          "คืนพอยต์ทองที่ล็อกเต็ม (ถ้าซ่อมไม่ได้)",
  refund_partial:  "คืนพอยต์ทองที่ล็อกบางส่วน (ถ้าซ่อมไม่ได้)",
};

// ── เงื่อนไข 5: parts policy labels ────────────────────────────────────────────────
const PARTS_POLICY_LABEL: Record<string, string> = {
  at_cost: "ราคาต้นทุน",
  market:  "ราคาตลาด",
  markup:  "ราคาตลาด + markup",
};

// ── เงื่อนไข 6: warranty scope labels ──────────────────────────────────────────────
const WARRANTY_SCOPE_LABEL: Record<string, string> = {
  labor: "ค่าแรงเท่านั้น",
  parts: "อะไหล่เท่านั้น",
  both:  "ค่าแรง + อะไหล่",
};

// ── Mock fallback (CMD-FIX-2a) — try API → catch/empty → fallback MOCK ────────
const MOCK_LISTING_FALLBACK: ListingDetail = {
  id: "job-001",
  appliance_name: "แอร์ Daikin 12000 BTU",
  issue_summary: "เสียงดังผิดปกติ — คาดว่าคอมเพรสเซอร์เสื่อม",
  status: "pending_offer",
};

const MOCK_OFFERS: RepairOffer[] = [
  {
    id: "offer-001",
    weeer_id: "r-101",
    weeer_name: "ร้านซ่อมดีเจริญ",
    weeer_rating: 4.8,
    weeer_review_count: 312,
    quoted_price: 1800,
    inspection_fee: 150,
    deposit_amount: 500,
    deposit_policy_when_unrepairable: "refund",
    deposit_partial_refund_pct: null,
    travel_fee: null,
    travel_fee_policy: "included",
    labor_cancel_fee: 300,
    labor_cancel_fee_policy: "เก็บค่าแรงตรวจ",
    parts_markup_pct: 10,
    parts_policy: "market",
    warranty_days: 90,
    warranty_scope: "both",
    no_show_fee: 150,
    no_show_policy: "เก็บค่าเดินทาง",
    scope_creep_policy: "แจ้งลูกค้าก่อนดำเนินการ",
    scope_creep_threshold_pct: 20,
    liability_cap: 5000,
    liability_policy: "ไม่เกินราคาเครื่อง",
    estimated_duration_days: 2,
    notes: "มีช่างเฉพาะทางแอร์ ประสบการณ์ 10 ปี อะไหล่แท้ทุกชิ้น",
    created_at: "2026-05-25T08:00:00.000Z",
  },
  {
    id: "offer-002",
    weeer_id: "r-102",
    weeer_name: "ช่างแอร์ไทย",
    weeer_rating: 4.5,
    weeer_review_count: 187,
    quoted_price: 1500,
    inspection_fee: 100,
    deposit_amount: 300,
    deposit_policy_when_unrepairable: "forfeit",
    deposit_partial_refund_pct: null,
    travel_fee: 100,
    travel_fee_policy: "extra",
    labor_cancel_fee: 200,
    labor_cancel_fee_policy: "เก็บค่าเดินทาง + ค่าตรวจ",
    parts_markup_pct: 15,
    parts_policy: "market",
    warranty_days: 60,
    warranty_scope: "labor",
    no_show_fee: 100,
    no_show_policy: "เก็บค่าเดินทาง",
    scope_creep_policy: "แจ้งก่อนเปลี่ยนอะไหล่เพิ่ม",
    scope_creep_threshold_pct: 30,
    liability_cap: null,
    liability_policy: null,
    estimated_duration_days: 1,
    notes: "รับงานด่วนได้ — บริการถึงบ้าน ภายในกรุงเทพฯ",
    created_at: "2026-05-25T09:30:00.000Z",
  },
  {
    id: "offer-003",
    weeer_id: "r-103",
    weeer_name: "อาร์แอร์เซอร์วิส",
    weeer_rating: 4.9,
    weeer_review_count: 521,
    quoted_price: 2200,
    inspection_fee: 200,
    deposit_amount: 600,
    deposit_policy_when_unrepairable: "refund_partial",
    deposit_partial_refund_pct: 50,
    travel_fee: null,
    travel_fee_policy: "waived_if_repair",
    labor_cancel_fee: 400,
    labor_cancel_fee_policy: "เก็บค่าแรงตรวจ + อะไหล่ที่ใช้ไป",
    parts_markup_pct: 5,
    parts_policy: "at_cost",
    warranty_days: 180,
    warranty_scope: "both",
    no_show_fee: 200,
    no_show_policy: "เก็บค่าเดินทาง + ค่าแรง 1 ชั่วโมง",
    scope_creep_policy: "แจ้งลูกค้าทุกครั้งก่อนขยายงาน",
    scope_creep_threshold_pct: 10,
    liability_cap: 10000,
    liability_policy: "รับผิดชอบสูงสุดตามราคาเครื่องใหม่",
    estimated_duration_days: 3,
    notes: "บริษัทจดทะเบียน อะไหล่แท้ มี QC ทุกขั้นตอน รับประกันนานที่สุด",
    created_at: "2026-05-25T10:15:00.000Z",
  },
];

export default function RepairOffersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [offers, setOffers] = useState<RepairOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState("");
  // CMD-FIX-2a: track mock mode เพื่อ handleSelect fallback
  const isMockRef = useRef(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/v1/repair/listings/${id}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/v1/repair/listings/${id}/offers`).then(r => r.ok ? r.json() : { items: [] }),
    ]).then(([ld, od]) => {
      // listing fallback: API returns null (404) → ใช้ mock listing
      setListing(ld ?? MOCK_LISTING_FALLBACK);
      const items: RepairOffer[] = od.items ?? [];
      // offers fallback: API empty → ใช้ MOCK (CMD-FIX-2a No-seed fix)
      if (items.length === 0) isMockRef.current = true;
      setOffers(items.length > 0 ? items : MOCK_OFFERS);
    }).catch(() => {
      // Network error → fallback MOCK ทั้งหมด
      isMockRef.current = true;
      setListing(MOCK_LISTING_FALLBACK);
      setOffers(MOCK_OFFERS);
    }).finally(() => setLoading(false));
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
      if (isMockRef.current) {
        // Mock mode: navigate to job detail (accept state เปลี่ยน)
        router.push(`/repair/${id}`);
      } else {
        setError("เกิดข้อผิดพลาดในการเลือกข้อเสนอ กรุณาลองใหม่");
      }
    } finally {
      setSelecting(null);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      {/* ── mock-anno §5 origin (U-05 REPAIR-OFFERS) ────────────────────────── */}
      <div className="mock-anno mock-anno-origin">
        ◀ §5 มาจาก: <code>U-02</code> REPAIR-HOME (listing card &apos;ดูข้อเสนอ&apos;)
      </div>
      {/* ── mock-anno §8 cross-app ───────────────────────────────────────────── */}
      <div className="mock-anno mock-anno-xapp">
        §8 👁 WeeeR เห็น:{" "}
        <a href="http://localhost:3001/repair/announcements" target="_blank" rel="noopener noreferrer">
          <code>R-02/R-04</code> REPAIR-ANNOUNCE (offer submitted)
        </a>
        {" "}— หลังเลือกร้าน:{" "}
        <a href="http://localhost:3001/repair/jobs" target="_blank" rel="noopener noreferrer">
          <code>R-09</code> REPAIR-JOBS (new entry)
        </a>
      </div>
      {/* §6 nav: เลือกร้าน → U-04 REPAIR-DETAIL (state: assigned) */}
      <div className="flex items-center gap-3">
        <Link href="/repair" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ข้อเสนอ (Offer) จากร้านซ่อม</h1>
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
          <p className="text-gray-500 font-medium">ยังไม่มีข้อเสนอ</p>
          <p className="text-xs text-gray-400 mt-1">ร้านซ่อมจะส่งข้อเสนอ มาให้เร็วๆ นี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{offers.length} ข้อเสนอ จากร้านซ่อม — เลือกร้านที่ต้องการ</p>
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

// ── Offer card (9 เงื่อนไข) ────────────────────────────────────────────────
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
  // A5 Gold-lock: ต้อง acknowledge Escrow amount ก่อนกดเลือกร้าน
  const [goldAcknowledged, setGoldAcknowledged] = useState(false);
  const goldAmount = offer.quoted_price + (offer.deposit_amount ?? 0);

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
            <p className="text-xs text-gray-400">พอยต์ทอง</p>
          </div>
        </div>
      </div>

      {/* ── เงื่อนไขหลัก (always visible) ─────────────────────────────────── */}
      <div className="px-5 py-4 space-y-2">
        {/* เงื่อนไข 2: ค่าตรวจ */}
        <OfferRow label="เงื่อนไข 2 · ค่าตรวจ" value={`${offer.inspection_fee.toLocaleString()} พอยต์ทอง (ไม่คืน)`} />

        {/* เงื่อนไข 1: พอยต์ทองที่ล็อก */}
        {offer.deposit_amount != null && (
          <div className="space-y-0.5">
            <OfferRow
              label="เงื่อนไข 1 · พอยต์ทองที่ล็อก"
              value={`${offer.deposit_amount.toLocaleString()} พอยต์ทอง`}
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

        {/* เงื่อนไข 3: ค่าเดินทาง */}
        {(offer.travel_fee != null || offer.travel_fee_policy) && (
          <OfferRow
            label="เงื่อนไข 3 · ค่าเดินทาง"
            value={
              offer.travel_fee != null
                ? `${offer.travel_fee.toLocaleString()} พอยต์ทอง${offer.travel_fee_policy ? ` (${offer.travel_fee_policy})` : ""}`
                : offer.travel_fee_policy ?? "—"
            }
          />
        )}

        {/* เงื่อนไข 6: รับประกัน */}
        {offer.warranty_days != null && (
          <OfferRow
            label="เงื่อนไข 6 · รับประกัน"
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
            {/* เงื่อนไข 4: ค่าแรงยุติ */}
            {(offer.labor_cancel_fee != null || offer.labor_cancel_fee_policy) && (
              <OfferRow
                label="เงื่อนไข 4 · ค่าแรงยุติ"
                value={
                  offer.labor_cancel_fee != null
                    ? `${offer.labor_cancel_fee.toLocaleString()} พอยต์ทอง${offer.labor_cancel_fee_policy ? ` — ${offer.labor_cancel_fee_policy}` : ""}`
                    : offer.labor_cancel_fee_policy ?? "—"
                }
              />
            )}

            {/* เงื่อนไข 5: ค่าอะไหล่ */}
            {(offer.parts_markup_pct != null || offer.parts_policy) && (
              <OfferRow
                label="เงื่อนไข 5 · ค่าอะไหล่"
                value={
                  offer.parts_policy
                    ? `${PARTS_POLICY_LABEL[offer.parts_policy] ?? offer.parts_policy}${offer.parts_markup_pct != null ? ` (+${offer.parts_markup_pct}%)` : ""}`
                    : `markup +${offer.parts_markup_pct}%`
                }
              />
            )}

            {/* เงื่อนไข 7: no-show / ฝาก */}
            {(offer.no_show_fee != null || offer.no_show_policy) && (
              <OfferRow
                label="เงื่อนไข 7 · No-show / ฝาก"
                value={
                  offer.no_show_fee != null
                    ? `${offer.no_show_fee.toLocaleString()} พอยต์ทอง${offer.no_show_policy ? ` — ${offer.no_show_policy}` : ""}`
                    : offer.no_show_policy ?? "—"
                }
              />
            )}

            {/* เงื่อนไข 8: งานบานปลาย */}
            {(offer.scope_creep_policy || offer.scope_creep_threshold_pct != null) && (
              <OfferRow
                label="เงื่อนไข 8 · งานบานปลาย"
                value={
                  offer.scope_creep_threshold_pct != null
                    ? `แจ้งลูกค้าเมื่อเกิน ${offer.scope_creep_threshold_pct}%${offer.scope_creep_policy ? ` — ${offer.scope_creep_policy}` : ""}`
                    : offer.scope_creep_policy ?? "—"
                }
              />
            )}

            {/* เงื่อนไข 9: ความรับผิด */}
            {(offer.liability_cap != null || offer.liability_policy) && (
              <OfferRow
                label="เงื่อนไข 9 · วงเงินความรับผิด"
                value={
                  offer.liability_cap != null
                    ? `ไม่เกิน ${offer.liability_cap.toLocaleString()} พอยต์ทอง${offer.liability_policy ? ` — ${offer.liability_policy}` : ""}`
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

      {/* ── A5 Gold-lock: Escrow acknowledge ก่อนกดเลือกร้าน ────────────── */}
      <div className="px-5 pb-3">
        <div className={`border rounded-xl p-3 space-y-2 transition-colors ${goldAcknowledged ? "bg-weeeu-surface border-weeeu-primary/40" : "bg-amber-50 border-amber-300"}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-weeeu-dark">🔒 พอยต์ทอง (Gold Point) ที่จะถูกล็อก</p>
            <p className="text-sm font-bold text-weeeu-primary">
              {goldAmount.toLocaleString()} พอยต์ทอง
            </p>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            ระบบพักเงินกลาง (Escrow) <EscrowInfoIcon /> จะล็อกพอยต์ทองชั่วคราวเมื่อเลือกร้าน — ปลดล็อกอัตโนมัติหากงานไม่สำเร็จ
          </p>
          {/* [gold-lock] เตือนทุก 6 ชม. ภายในกรอบ 24 ชม. (mock UI · logic BE) */}
          <p className="text-[10px] text-gray-400 border-t border-black/5 pt-1.5 leading-relaxed">
            🔔 หลังเลือกร้าน พอยต์ทองที่ล็อกมีกรอบเวลา 24 ชม. ให้อนุมัติ/ชำระ — ระบบจะแจ้งเตือนทุก 6 ชม. หากเกินกำหนด พอยต์ทองที่ล็อกจะถูกปลดและการเลือกถูกยกเลิกอัตโนมัติ
          </p>
          {/* Acknowledge checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={goldAcknowledged}
              onChange={e => setGoldAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-weeeu-primary focus:ring-weeeu-primary/40"
            />
            <span className="text-xs text-gray-700 font-medium">
              รับทราบว่า <span className="text-weeeu-primary font-semibold">{goldAmount.toLocaleString()} พอยต์ทอง</span> จะถูกล็อกเมื่อยืนยัน
            </span>
          </label>
        </div>
      </div>

      {/* Select button — disabled จนกว่าจะ acknowledge Gold lock (A5) */}
      <div className="px-5 pb-5 pt-2">
        <button
          disabled={!!selecting || !goldAcknowledged}
          onClick={() => onSelect(offer.id)}
          className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          title={!goldAcknowledged ? "กรุณารับทราบการล็อกพอยต์ทองก่อน" : undefined}
        >
          {selecting === offer.id ? (
            <><span className="animate-spin">⟳</span> กำลังเลือก...</>
          ) : !goldAcknowledged ? (
            "🔒 รับทราบการล็อกพอยต์ทองก่อนเลือกร้าน"
          ) : (
            "✅ เลือกร้านนี้"
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
