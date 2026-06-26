"use client";

// ── WeeeR Resell Listing Detail — 2.2 Mockup ──────────────────────────────────
// R2/R3: SUSPENDED banner + repost/cancel
// R4: offer_selected → escrow 24h countdown (mock)
// R5: ถอนการเลือก (mock)
// R6: upload evidence (mock URL)
// Q&A: placeholder

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import { createAd, estimateGoldCost, AD_POSITION_OPTIONS, type AdPosition } from "../../../../../lib/ads-api";
import type { Listing, Offer } from "../../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR, OFFER_STATUS_LABEL, OFFER_STATUS_COLOR, LISTING_TERMINAL } from "../../_lib/types";

// RC-B: relative date helper
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

// ── Mock data (Mockup 2.2) ──────────────────────────────────────────────────
const MOCK_LISTINGS: Record<string, Listing & { offers?: Offer[] }> = {
  L001: {
    id: "L001", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "Samsung Q9 QLED 65\"", price: 18900, deliveryMethods: ["ส่ง Kerry"],
    status: "receiving_offers", expiresAt: addDays(new Date(), 30).toISOString(), createdAt: addDays(new Date(), -7).toISOString(), updatedAt: addDays(new Date(), -7).toISOString(), offerCount: 2,
    description: "สภาพ 95% มีกล่อง ใช้งาน 1 ปี ไม่มีรอยขีด",
    warranty: { sourceWarranty: 6, additionalWarranty: 3 },
    terms3: { shipping: "ผู้ขายรับผิดชอบ", usedWarranty: "30 วัน", liability: "ผู้ขายรับผิด" },
    offers: [
      { id: "O1", listingId: "L001", buyerId: "U1", buyerType: "WeeeU", offerPrice: 17500, deliveryMethod: "ส่ง Kerry", status: "pending", expiresAt: addDays(new Date(), 7).toISOString(), createdAt: addDays(new Date(), -3).toISOString(), buyerName: "สมชาย ใจดี", message: "ขอต่อราคาหน่อยครับ" },
      { id: "O2", listingId: "L001", buyerId: "U2", buyerType: "WeeeU", offerPrice: 18000, deliveryMethod: "ส่ง Kerry", status: "pending", expiresAt: addDays(new Date(), 7).toISOString(), createdAt: addDays(new Date(), -2).toISOString(), buyerName: "สุดา รักชาติ" },
    ],
  },
  L002: {
    id: "L002", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "Dyson V15 Detect", price: 8500, deliveryMethods: ["รับเอง"],
    status: "offer_selected", expiresAt: addDays(new Date(), 30).toISOString(), createdAt: addDays(new Date(), -10).toISOString(), updatedAt: addDays(new Date(), -3).toISOString(), offerCount: 1,
    terms3: { shipping: "ผู้ซื้อรับผิดชอบ", usedWarranty: "7 วัน", liability: "ไม่รับผิด" },
    offers: [
      { id: "O3", listingId: "L002", buyerId: "U3", buyerType: "WeeeR", offerPrice: 8500, deliveryMethod: "รับเอง", status: "selected", expiresAt: addDays(new Date(), 7).toISOString(), createdAt: addDays(new Date(), -3).toISOString(), buyerName: "ร้าน ElecPlus" },
    ],
  },
  L003: {
    id: "L003", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "iPhone 14 Pro 256GB", price: 22000, deliveryMethods: ["ส่ง Kerry", "รับเอง"],
    status: "suspended", expiresAt: "2026-06-01", createdAt: "2026-05-15", updatedAt: "2026-05-21",
    suspendReason: "รูปภาพไม่ครบตามนโยบาย — ต้องการรูปด้านหน้า ด้านหลัง และกล่อง (อย่างน้อย 3 รูป)",
    offers: [],
  },
  L004: {
    id: "L004", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "MacBook Air M2", price: 32000, deliveryMethods: ["ส่ง Kerry"],
    status: "in_progress", expiresAt: "2026-06-10", createdAt: "2026-05-10", updatedAt: "2026-05-23",
    offers: [],
  },
};

// ── R4: Escrow 24h countdown (mock — เริ่มนับจากเวลาปัจจุบัน)
function useEscrowCountdown() {
  const deadline = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 23, d.getMinutes() + 42); // mock 23h42m remaining
    return d;
  })[0];
  const [msLeft, setMsLeft] = useState(() => deadline.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setMsLeft(deadline.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return msLeft;
}

function EscrowCountdown() {
  const msLeft = useEscrowCountdown();
  if (msLeft <= 0) return <span className="text-xs text-red-600 font-medium">⏰ หมดเวลา — offer ถูกปลด</span>;
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  const s = Math.floor((msLeft % 60000) / 1000);
  const urgent = msLeft < 3600000;
  return (
    <span className={`text-xs font-medium ${urgent ? "text-red-600" : "text-[#D63B12]"}`}>
      ⏳ {h}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")} เหลือ
    </span>
  );
}

export default function ResellListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<Listing | null>(() =>
    process.env.NEXT_PUBLIC_DEV_NAV === "true" ? (MOCK_LISTINGS[id] ?? null) : null
  );
  const [offers, setOffers] = useState<Offer[]>(() =>
    process.env.NEXT_PUBLIC_DEV_NAV === "true" ? (MOCK_LISTINGS[id]?.offers ?? []) : []
  );
  const [loading, setLoading] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV !== "true");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock state (R2/R3/R4/R5/R6)
  const [mockCancelled, setMockCancelled] = useState(false);
  const [r5Withdrawn, setR5Withdrawn] = useState(false);
  const [showR5Confirm, setShowR5Confirm] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);

  // ── C12 Ad (Backend ads API · POST /api/v1/ads — ตัด Gold D75 → pending → admin approve) ──
  const [showAd, setShowAd] = useState(false);
  const [adPos, setAdPos] = useState<AdPosition>("module_first_row");
  const [adDays, setAdDays] = useState(7);
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [adError, setAdError] = useState("");
  const [adSuccess, setAdSuccess] = useState(false);
  const adCost = estimateGoldCost(adPos, adDays);

  async function handleCreateAd() {
    setAdSubmitting(true);
    setAdError("");
    const res = await createAd({ listingId: id, position: adPos, durationDays: adDays });
    setAdSubmitting(false);
    if (res.ok) {
      setAdSuccess(true);
      setShowAd(false);
    } else {
      setAdError(res.error ?? "ส่งคำขอโฆษณาไม่สำเร็จ");
    }
  }

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return;
    const mock = MOCK_LISTINGS[id];
    Promise.all([
      resellApi.listingsGet(id).catch(() => mock ?? null),
      resellApi.listingOffers(id).catch(() => mock?.offers ?? []),
    ]).then(([l, o]) => {
      setListing(l ?? mock ?? null);
      setOffers(o ?? mock?.offers ?? []);
    }).catch(() => {
      if (mock) { setListing(mock); setOffers(mock.offers ?? []); }
      else setError("ไม่พบประกาศ");
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleAccept(offerId: string) {
    setActionLoading(offerId);
    try {
      // post-select shape-fix(b) / §2 discipline: acceptOffer คืน THIN select-offer response
      // ({listingId,state,offerId,fundingDeadline}) — ห้าม setListing(thin) ทับ entity (clobber price/desc).
      await resellApi.acceptOffer(id, offerId).catch(() => null);
      if (process.env.NEXT_PUBLIC_DEV_NAV === "true") {
        // mock: merge สถานะอย่างเดียว (คง entity เดิม + offers ของ mock)
        setListing(prev => (prev ? { ...prev, status: "offer_selected" } : prev));
      } else {
        // real: re-fetch canonical (backend คืน field state → toListingDto map เป็น status)
        const refreshed = await resellApi.listingsGet(id).catch(() => null);
        setListing(prev => refreshed ?? (prev ? { ...prev, status: "offer_selected" } : prev));
      }
      setOffers(prev => prev.map(o => ({ ...o, status: o.id === offerId ? "selected" : "rejected" })));
    } catch { /**/ } finally { setActionLoading(null); }
  }

  async function handleReject(offerId: string) {
    setActionLoading(offerId);
    try {
      await resellApi.rejectOffer(id, offerId).catch(() => null);
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: "rejected" } : o));
    } catch { /**/ } finally { setActionLoading(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !listing) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;
  if (!listing) return null;

  const effectiveStatus = mockCancelled ? "cancelled" : listing.status;
  const isTerminal = LISTING_TERMINAL.includes(effectiveStatus);
  const pendingOffers = offers.filter(o => o.status === "pending");

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resell/listings" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{listing.applianceName ?? "ประกาศขาย"}</h1>
          <p className="text-xs text-gray-400">สร้าง {new Date(listing.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}</p>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${LISTING_STATUS_COLOR[effectiveStatus]}`}>
          {LISTING_STATUS_LABEL[effectiveStatus]}
        </span>
      </div>

      {/* R2/R3: SUSPENDED banner */}
      {effectiveStatus === "suspended" && !mockCancelled && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700">🚫 ประกาศถูกระงับ (R2/R3 SUSPENDED)</p>
          <p className="text-xs text-red-600 mt-1">{listing.suspendReason ?? "Admin ระงับ — กรุณาตรวจสอบ"}</p>
          <div className="flex gap-2 mt-3">
            <Link href={`/resell/listings/${id}/edit`}
              className="flex-1 text-center text-xs bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2 rounded-lg transition-colors">
              ✏️ แก้ไข + ประกาศใหม่ v2
            </Link>
            <button onClick={() => setMockCancelled(true)}
              className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition-colors">
              ❌ ยกเลิกประกาศ
            </button>
          </div>
        </div>
      )}

      {/* R4: offer_selected → escrow 24h wait */}
      {effectiveStatus === "offer_selected" && !r5Withdrawn && (
        <div className="bg-[#FFF1ED] border border-[#FFD0BF] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#D63B12]">⏳ รอผู้ซื้อเติมพอยต์ทอง เข้าพักเงินกลาง (Escrow)</p>
              <p className="text-xs text-[#F04E20] mt-0.5">ผู้ซื้อต้องเติมพอยต์ทอง ≤24ชม. มิฉะนั้นข้อเสนอ (offer) จะถูกปลด</p>
            </div>
            <EscrowCountdown />
          </div>
          {/* R5: ถอนการเลือก */}
          <button onClick={() => setShowR5Confirm(true)}
            className="mt-3 w-full text-xs text-[#D63B12] border border-[#FF8B66] hover:bg-[#FFE0D6] font-medium py-2 rounded-lg transition-colors">
            ⏪ ถอนการเลือก (R5)
          </button>
        </div>
      )}

      {/* R5 withdrawn state */}
      {r5Withdrawn && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700 font-medium">✅ ถอนการเลือกแล้ว — ประกาศกลับสู่ receiving_offers</p>
        </div>
      )}

      {/* R6: Evidence upload (in_progress) */}
      {effectiveStatus === "in_progress" && !evidenceSubmitted && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-bold text-orange-800">📸 R6: แนบหลักฐานก่อนส่งสินค้า (บังคับ)</p>
          <p className="text-xs text-orange-600 mt-0.5">ถ่ายรูป+คลิปสินค้าก่อนแพ็คและส่ง — หลักฐานป้องกันข้อพิพาท</p>
          <div className="flex gap-2 mt-3">
            <input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="URL รูป/คลิป (mock)…"
              className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            <button onClick={() => evidenceUrl && setEvidenceSubmitted(true)}
              disabled={!evidenceUrl}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
              ส่ง
            </button>
          </div>
        </div>
      )}
      {effectiveStatus === "in_progress" && evidenceSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <span>✅</span>
          <p className="text-sm text-green-700 font-medium">ส่งหลักฐานแล้ว — กรุณาจัดส่งสินค้าตาม delivery method</p>
        </div>
      )}

      {/* Listing info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ราคา</p>
            <p className="text-2xl font-bold text-[#FF663A]">{listing.price.toLocaleString()} พอยต์</p>
          </div>
          <div><p className="text-xs text-gray-400">จัดส่ง</p><p className="font-medium">{listing.deliveryMethods.join(", ")}</p></div>
          {listing.warranty && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">การรับประกัน</p>
              <p className="font-medium">ต้นทาง {listing.warranty.sourceWarranty} เดือน + เพิ่ม {listing.warranty.additionalWarranty} เดือน</p>
            </div>
          )}
          {listing.description && (
            <div className="col-span-2"><p className="text-xs text-gray-400">รายละเอียด</p><p className="text-gray-700">{listing.description}</p></div>
          )}
          <div><p className="text-xs text-gray-400">หมดอายุ</p><p className="font-medium">{new Date(listing.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</p></div>
          <div><p className="text-xs text-gray-400">ข้อเสนอ</p><p className="font-bold text-amber-600">{offers.length} ข้อเสนอ</p></div>
        </div>

        {/* Terms 3 แกน */}
        {listing.terms3 && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">📋 เงื่อนไข 3 แกน</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">ค่าส่ง</p><p className="font-medium text-gray-700">{listing.terms3.shipping}</p></div>
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">ประกันมือสอง</p><p className="font-medium text-gray-700">{listing.terms3.usedWarranty}</p></div>
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">ไม่ตรงปก</p><p className="font-medium text-gray-700">{listing.terms3.liability}</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Offers */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          ข้อเสนอที่ได้รับ {pendingOffers.length > 0 && <span className="text-amber-600">({pendingOffers.length} รอตอบ)</span>}
        </p>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อเสนอ</p>
        ) : (
          <div className="space-y-3">
            {offers.map(o => (
              <div key={o.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{o.offerPrice.toLocaleString()} พอยต์</p>
                    <p className="text-xs text-gray-500">{o.buyerName ?? o.buyerId} · {o.buyerType}</p>
                    <p className="text-xs text-gray-400">{o.deliveryMethod}</p>
                    {o.message && <p className="text-xs text-gray-500 mt-1 italic">"{o.message}"</p>}
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${OFFER_STATUS_COLOR[o.status]}`}>
                    {OFFER_STATUS_LABEL[o.status]}
                  </span>
                </div>
                {o.status === "pending" && !isTerminal && !r5Withdrawn && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAccept(o.id)} disabled={!!actionLoading}
                      className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-60">
                      {actionLoading === o.id ? "…" : "✅ รับข้อเสนอ"}
                    </button>
                    <button onClick={() => handleReject(o.id)} disabled={!!actionLoading}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-60">
                      ❌ ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Q&A Placeholder (FLAG-3 · D82) */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">💬 Q&A{/* PHASE-4: D82 */}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">ฟีเจอร์ถาม-ตอบกำลังพัฒนา</p>
          <p className="text-xs text-gray-300 mt-1">ผู้ซื้อสามารถถามผู้ขายได้โดยตรง (cross-module · เร็วๆ นี้) {/* PHASE-4 */}</p>
        </div>
      </div>

      {/* C12 · ปุ่มลงโฆษณา (ดันประกาศให้เด่น · ตัดพอยต์ทอง) */}
      {!isTerminal && !adSuccess && (
        <button
          onClick={() => setShowAd(true)}
          className="w-full border border-[#FF663A] text-[#D63B12] hover:bg-[#FFF1ED] rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          📢 ลงโฆษณา — ดันประกาศนี้ให้เด่นขึ้น
        </button>
      )}
      {adSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <span>✅</span>
          <p className="text-sm text-green-700 font-medium">ส่งคำขอโฆษณาแล้ว — ตัดพอยต์ทอง (Gold Point) และเข้าคิวรอผู้ดูแล (Admin) อนุมัติ</p>
        </div>
      )}

      {/* C12 Ad modal (stub — ยังไม่ต่อ Backend ads API) */}
      {showAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAd(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">📢 ลงโฆษณาประกาศ</h3>
              <button onClick={() => setShowAd(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ตำแหน่งโฆษณา</label>
              <select
                value={adPos}
                onChange={(e) => setAdPos(e.target.value as AdPosition)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
              >
                {AD_POSITION_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label} — {p.rate} พอยต์ทอง/วัน</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">จำนวนวัน</label>
              <input
                type="number"
                min={1}
                value={adDays}
                onChange={(e) => setAdDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
              />
            </div>
            <div className="bg-[#FFF1ED] border border-[#FFE0D6] rounded-xl px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-gray-600">รวมที่จะตัด (พอยต์ทอง / Gold Point)</span>
              <span className="font-bold text-[#D63B12]">{adCost.toLocaleString()} พอยต์ทอง</span>
            </div>
            <p className="text-xs text-gray-400">* จ่ายล่วงหน้า · ตัดพอยต์ทอง (Gold Point) แล้วเข้าคิวให้ผู้ดูแล (Admin) อนุมัติก่อนเริ่มแสดง · ไม่อนุมัติคืนพอยต์</p>
            {adError && <p className="text-xs text-red-600 font-medium" role="alert">⚠️ {adError}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAd(false)} disabled={adSubmitting} className="flex-1 border border-gray-200 hover:bg-gray-50 rounded-xl py-2 text-sm font-medium text-gray-700 disabled:opacity-60">
                ยกเลิก
              </button>
              <button
                onClick={handleCreateAd}
                disabled={adSubmitting}
                className="flex-1 bg-[#FF663A] hover:bg-[#F04E20] text-white rounded-xl py-2 text-sm font-medium disabled:opacity-60"
              >
                {adSubmitting ? "กำลังส่ง…" : `ยืนยัน (${adCost.toLocaleString()} พอยต์ทอง)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* R5 Confirm Modal */}
      {showR5Confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            {/* §7 เคส R5 */}
            <h2 className="text-base font-bold text-gray-900">ยืนยันถอนการเลือก</h2>
            <p className="text-sm text-gray-600">ถอนการเลือก — ประกาศจะกลับสู่ "รับข้อเสนอ" และผู้ซื้อรายนี้จะไม่ถูกเลือกอีก</p>
            <div className="flex gap-3">
              <button onClick={() => setShowR5Confirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50">
                กลับ
              </button>
              <button onClick={() => { setR5Withdrawn(true); setShowR5Confirm(false); }}
                className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm">
                ยืนยันถอน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
