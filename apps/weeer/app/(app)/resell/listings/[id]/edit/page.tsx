"use client";

// ── WeeeR Resell Listing Edit / Repost v2 — Mockup (RSL-R02) ────────────────
// SUSPENDED listing → "✏️ แก้ไข + ประกาศใหม่ v2" → this screen.
// Loads existing listing values (same mock source as detail page), presents an
// editable form, and a "ประกาศใหม่ (v2)" submit that (mock) reposts → success.
// No real backend — consistent with the app's existing mock pattern.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../../_lib/api";
import type { Listing, Offer } from "../../../_lib/types";

// RC-B: relative date helper (mirrors detail page)
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

const DELIVERY_OPTIONS = ["ส่ง Kerry", "ส่ง Flash", "รับเอง", "ส่งเอง (ช่างไปส่ง)"];

// ── Mock data — same source the detail page uses (Mockup 2.2) ───────────────
const MOCK_LISTINGS: Record<string, Listing & { offers?: Offer[] }> = {
  L001: {
    id: "L001", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "Samsung Q9 QLED 65\"", price: 18900, deliveryMethods: ["ส่ง Kerry"],
    status: "receiving_offers", expiresAt: addDays(new Date(), 30).toISOString(), createdAt: addDays(new Date(), -7).toISOString(), updatedAt: addDays(new Date(), -7).toISOString(), offerCount: 2,
    description: "สภาพ 95% มีกล่อง ใช้งาน 1 ปี ไม่มีรอยขีด",
    warranty: { sourceWarranty: 6, additionalWarranty: 3 },
  },
  L002: {
    id: "L002", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "Dyson V15 Detect", price: 8500, deliveryMethods: ["รับเอง"],
    status: "offer_selected", expiresAt: addDays(new Date(), 30).toISOString(), createdAt: addDays(new Date(), -10).toISOString(), updatedAt: addDays(new Date(), -3).toISOString(), offerCount: 1,
  },
  L003: {
    id: "L003", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "iPhone 14 Pro 256GB", price: 22000, deliveryMethods: ["ส่ง Kerry", "รับเอง"],
    status: "suspended", expiresAt: "2026-06-01", createdAt: "2026-05-15", updatedAt: "2026-05-21",
    suspendReason: "รูปภาพไม่ครบตามนโยบาย — ต้องการรูปด้านหน้า ด้านหลัง และกล่อง (อย่างน้อย 3 รูป)",
    description: "iPhone 14 Pro สี Deep Purple สภาพดี แบต 90%",
    warranty: { sourceWarranty: 0, additionalWarranty: 0 },
  },
  L004: {
    id: "L004", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "MacBook Air M2", price: 32000, deliveryMethods: ["ส่ง Kerry"],
    status: "in_progress", expiresAt: "2026-06-10", createdAt: "2026-05-10", updatedAt: "2026-05-23",
  },
};

export default function ResellListingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reposted, setReposted] = useState(false);

  // Editable fields (loaded from existing listing)
  const [applianceName, setApplianceName] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>([]);
  const [sourceWarranty, setSourceWarranty] = useState("0");
  const [additionalWarranty, setAdditionalWarranty] = useState("0");
  const [description, setDescription] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load existing listing values (mock source mirrors detail page)
  useEffect(() => {
    const mock = MOCK_LISTINGS[id];
    resellApi.listingsGet(id)
      .catch(() => mock ?? null)
      .then((l) => {
        const data = l ?? mock ?? null;
        if (!data) { setError("ไม่พบประกาศ"); return; }
        setListing(data);
        setApplianceName(data.applianceName ?? "");
        setPrice(String(data.price ?? ""));
        setDeliveryMethods(data.deliveryMethods ?? []);
        setSourceWarranty(String(data.warranty?.sourceWarranty ?? 0));
        setAdditionalWarranty(String(data.warranty?.additionalWarranty ?? 0));
        setDescription(data.description ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  function toggleDelivery(method: string) {
    setDeliveryMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!price || Number(price) <= 0) e.price = "กรุณากรอกราคา";
    if (deliveryMethods.length === 0) e.delivery = "กรุณาเลือกวิธีจัดส่ง";
    return e;
  }

  async function handleRepost(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    // Mock repost — no real backend (consistent with app mock pattern)
    setTimeout(() => {
      setSubmitting(false);
      setReposted(true);
    }, 400);
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !listing) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;
  if (!listing) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/resell/listings/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">แก้ไข + ประกาศใหม่ (v2)</h1>
          <p className="text-xs text-gray-400 truncate">{listing.applianceName ?? "ประกาศขาย"}</p>
        </div>
      </div>

      {/* Repost context note (mock) */}
      {!reposted && (
        <div className="bg-[#FFF1ED] border border-[#FFD0BF] rounded-xl p-3">
          <p className="text-xs text-[#D63B12]">
            ✏️ แก้ไขรายละเอียดให้ตรงตามนโยบาย แล้วกด "ประกาศใหม่ (v2)" เพื่อโพสต์ประกาศใหม่จากข้อมูลเดิม
          </p>
        </div>
      )}

      {reposted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <p className="text-sm font-bold text-green-700">ประกาศใหม่ (v2) สำเร็จ</p>
          </div>
          <p className="text-xs text-green-600">ประกาศของคุณถูกโพสต์ใหม่และกลับเข้าสู่สถานะ "รับข้อเสนอ" เรียบร้อยแล้ว</p>
          <div className="flex gap-2 pt-1">
            <Link href={`/resell/listings/${id}`}
              className="flex-1 text-center text-xs bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-lg transition-colors">
              ดูประกาศ
            </Link>
            <Link href="/resell/listings"
              className="flex-1 text-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors">
              กลับรายการประกาศ
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRepost} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">

          {/* Appliance (read-only — repost keeps the same item) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สินค้าที่จะขาย</label>
            <input type="text" value={applianceName} disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500" />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาขาย (pts) <span className="text-red-500">*</span>
            </label>
            <input type="number" min={0} value={price}
              onChange={e => { setPrice(e.target.value); setFormErrors(f => ({ ...f, price: "" })); }}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] ${formErrors.price ? "border-red-400" : "border-gray-200"}`} />
            {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
          </div>

          {/* Delivery methods */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">วิธีจัดส่ง <span className="text-red-500">*</span></p>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_OPTIONS.map(m => (
                <label key={m}
                  className={`px-3 py-2 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all
                    ${deliveryMethods.includes(m) ? "border-[#FF8B66] bg-[#FFF1ED] text-[#B8300E]" : "border-gray-100 text-gray-600"}`}>
                  <input type="checkbox" className="sr-only" checked={deliveryMethods.includes(m)} onChange={() => toggleDelivery(m)} />
                  {m}
                </label>
              ))}
            </div>
            {formErrors.delivery && <p className="text-xs text-red-500 mt-1">{formErrors.delivery}</p>}
          </div>

          {/* Warranty */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">การรับประกัน (เดือน)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ประกันต้นทาง</label>
                <input type="number" min={0} value={sourceWarranty} onChange={e => setSourceWarranty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ประกันเพิ่มเติม</label>
                <input type="number" min={0} value={additionalWarranty} onChange={e => setAdditionalWarranty(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
            </div>
          </div>

          {/* Expires in */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมดอายุประกาศใน (วัน)</label>
            <select value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]">
              <option value="7">7 วัน</option>
              <option value="14">14 วัน</option>
              <option value="30">30 วัน</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="สภาพ อาการ จุดเด่น ข้อบกพร่อง ฯลฯ"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none" />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {submitting ? "กำลังประกาศใหม่…" : "📢 ประกาศใหม่ (v2)"}
          </button>
        </form>
      )}
    </div>
  );
}
