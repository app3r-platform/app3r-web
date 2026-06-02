"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { MaintainOffer } from "@/lib/types";

// ─── Mock stub — replace with GET /api/v1/maintain/jobs/:id/offers ───────────
const STUB_OFFERS: MaintainOffer[] = [
  {
    id: "mo-001",
    jobId: "mj-001",
    shopId: "shop-001",
    shopName: "ช่างเย็น Pro สาขาพระราม 9",
    shopRating: 4.8,
    shopReviewCount: 312,
    price: 850,
    terms: {
      deposit: 200,
      deposit_refundable: true,
      travel_fee: 0,
      inspection_fee: 0,
      warranty_days: 30,
      no_show_fee: 100,
      liability_cap: 5000,
      notes: "ใช้น้ำยาฆ่าเชื้อมาตรฐาน — ไม่มีค่าอะไหล่เพิ่มเติม",
    },
    status: "pending",
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "mo-002",
    jobId: "mj-001",
    shopId: "shop-002",
    shopName: "ไทยเทคนิค แอร์ ซักผ้า",
    shopRating: 4.5,
    shopReviewCount: 87,
    price: 700,
    terms: {
      deposit: 150,
      deposit_refundable: true,
      travel_fee: 50,
      inspection_fee: 0,
      warranty_days: 14,
      no_show_fee: 80,
      liability_cap: 3000,
      notes: "",
    },
    status: "pending",
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

// ─── Decision กลาง — Offer=SoT principles (5 ข้อ) ────────────────────────────
const OFFER_SOT_PRINCIPLES = [
  "WeeeR กำหนดเงื่อนไขเอง — คุณต้องรับทราบก่อนยืนยัน",
  "ค่าใช้จ่ายแสดงครบก่อนกดยืนยัน — ไม่มีค่าใช้จ่ายซ่อน",
  "สิ่งที่ไม่ระบุในข้อเสนอ = ไม่มีสิทธิ์เรียกร้อง (ใช้ Platform Policy)",
  "เลือกข้อเสนอนี้แล้ว = ยอมรับเงื่อนไขทุกข้อ (SoT สำหรับข้อพิพาท)",
  "ข้อเสนอมีอายุ — หมดอายุแล้วต้องรอข้อเสนอใหม่จาก WeeeR",
];

function formatCountdown(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "หมดอายุแล้ว";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-400 text-xs">★</span>
      <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </span>
  );
}

function TermsRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs font-medium text-right ${highlight ? "text-weeeu-dark" : "text-gray-700"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
type AckStep = "browse" | "acknowledge" | "confirm" | "done";

function StepBar({ step }: { step: AckStep }) {
  const steps: { key: AckStep; label: string }[] = [
    { key: "browse", label: "เลือกข้อเสนอ" },
    { key: "acknowledge", label: "รับทราบเงื่อนไข" },
    { key: "confirm", label: "ยืนยัน" },
  ];
  const idx = steps.findIndex(s => s.key === step);
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < idx ? "bg-weeeu-primary text-white"
              : i === idx ? "bg-weeeu-primary text-white ring-2 ring-weeeu-primary/30"
              : "bg-gray-200 text-gray-400"
            }`}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] mt-1 whitespace-nowrap ${i <= idx ? "text-weeeu-primary font-medium" : "text-gray-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-8 mx-1 mb-4 ${i < idx ? "bg-weeeu-primary" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Offer card ───────────────────────────────────────────────────────────────
function OfferCard({
  offer,
  selected,
  onSelect,
}: {
  offer: MaintainOffer;
  selected: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expired = new Date(offer.expiresAt) <= new Date();

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        selected ? "border-weeeu-primary ring-2 ring-weeeu-primary/20" : "border-gray-100"
      } ${expired ? "opacity-60" : ""}`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => { if (!expired) onSelect(); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {selected && <span className="text-weeeu-primary text-base">✓</span>}
              <p className="text-sm font-bold text-gray-900 truncate">{offer.shopName}</p>
            </div>
            <StarRating rating={offer.shopRating} count={offer.shopReviewCount} />
            <p className="text-xs text-gray-400 mt-1">
              ⏱ หมดอายุใน {formatCountdown(offer.expiresAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-weeeu-dark">{offer.price.toLocaleString()} ฿</p>
            <p className="text-xs text-gray-400">ค่าบริการรวม</p>
          </div>
        </div>
      </div>

      {/* Terms toggle */}
      <div className="border-t border-gray-100">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-weeeu-primary hover:bg-weeeu-surface/50 transition-colors"
          onClick={() => setExpanded(v => !v)}
        >
          <span>📋 ดูเงื่อนไขทั้งหมด</span>
          <span>{expanded ? "▲" : "▼"}</span>
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-0.5">
            <TermsRow
              label="พอยต์ทองที่ล็อก"
              value={offer.terms.deposit ? `${offer.terms.deposit.toLocaleString()} ฿${offer.terms.deposit_refundable ? " (คืนเมื่อเสร็จ)" : " (ไม่คืน)"}` : "ไม่มี"}
              highlight={!!offer.terms.deposit}
            />
            <TermsRow
              label="ค่าเดินทาง"
              value={offer.terms.travel_fee ? `${offer.terms.travel_fee.toLocaleString()} ฿` : "ฟรี"}
            />
            <TermsRow
              label="ค่าตรวจ"
              value={offer.terms.inspection_fee ? `${offer.terms.inspection_fee.toLocaleString()} ฿` : "ไม่มี"}
            />
            <TermsRow
              label="รับประกัน"
              value={offer.terms.warranty_days ? `${offer.terms.warranty_days} วัน` : "ไม่รับประกัน"}
              highlight={!!offer.terms.warranty_days}
            />
            <TermsRow
              label="ค่าฝาก/no-show"
              value={offer.terms.no_show_fee ? `${offer.terms.no_show_fee.toLocaleString()} ฿` : "ไม่มี"}
            />
            <TermsRow
              label="วงเงินความรับผิด"
              value={offer.terms.liability_cap ? `${offer.terms.liability_cap.toLocaleString()} ฿` : "ตาม Platform Policy"}
            />
            {offer.terms.notes && (
              <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-500">💬 {offer.terms.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaintainOffersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [offers, setOffers] = useState<MaintainOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<AckStep>("browse");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Production: GET /api/v1/maintain/jobs/${id}/offers
    setTimeout(() => {
      setOffers(STUB_OFFERS);
      setLoading(false);
    }, 600);
  }, [id]);

  const selectedOffer = offers.find(o => o.id === selected) ?? null;

  const handleAcknowledge = () => {
    if (!selected) { setError("กรุณาเลือกข้อเสนอก่อน"); return; }
    setError("");
    setStep("acknowledge");
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      // Production: POST /api/v1/maintain/jobs/${id}/offers/${selected}/accept
      // Step 1: PATCH offers/:id/acknowledge → acknowledgedAt set
      // Step 2: POST offers/:id/accept → job status = pending (assigned flow begins)
      await new Promise(r => setTimeout(r, 1000));
      setStep("done");
      setTimeout(() => router.push(`/maintain/jobs/${id}`), 1800);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลดข้อเสนอ...</div>;

  // ─── Done state ──────────────────────────────────────────────────────────────
  if (step === "done") return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ข้อเสนองานล้าง</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
        <div className="text-5xl">✅</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">ยืนยันข้อเสนอสำเร็จ</h2>
          <p className="text-sm text-gray-500 mt-2">
            WeeeR จะติดต่อคุณเพื่อนัดหมายเวลาเข้างาน<br />
            กำลังกลับหน้ารายละเอียดงาน...
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step === "browse" ? router.push(`/maintain/jobs/${id}`) : setStep("browse")}
          className="text-gray-500 hover:text-gray-800 text-xl"
        >
          ‹
        </button>
        <h1 className="text-xl font-bold text-gray-900">ข้อเสนองานล้าง</h1>
      </div>

      {/* Step bar */}
      <div className="flex justify-center py-1">
        <StepBar step={step} />
      </div>

      {/* Decision กลาง — Offer=SoT notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-amber-800">📌 หลักการ Offer=SoT — อ่านก่อนยืนยัน</p>
        <ul className="space-y-1">
          {OFFER_SOT_PRINCIPLES.map((p, i) => (
            <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
              <span className="shrink-0 font-semibold">{i + 1}.</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ─── Step: browse ──────────────────────────────────────────────────────── */}
      {step === "browse" && (
        <>
          {offers.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">📬</p>
              <p className="text-gray-500 font-medium">ยังไม่มีข้อเสนอจาก WeeeR</p>
              <p className="text-xs text-gray-400">WeeeR ในพื้นที่กำลังพิจารณางานของคุณ</p>
              <Link
                href={`/maintain/jobs/${id}`}
                className="inline-block mt-2 text-weeeu-primary text-sm font-medium hover:underline"
              >
                ← กลับรายละเอียดงาน
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {offers.length} ข้อเสนอ — เลือก 1 ข้อเสนอแล้วกด "รับทราบ" เพื่อดำเนินการต่อ
              </p>

              <div className="space-y-3">
                {offers.map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    selected={selected === offer.id}
                    onSelect={() => setSelected(offer.id)}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={!selected}
                onClick={handleAcknowledge}
                className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
              >
                รับทราบเงื่อนไข →
              </button>
            </>
          )}
        </>
      )}

      {/* ─── Step: acknowledge ─────────────────────────────────────────────────── */}
      {step === "acknowledge" && selectedOffer && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อเสนอที่เลือก</p>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-sm font-bold text-gray-900">{selectedOffer.shopName}</p>
              <StarRating rating={selectedOffer.shopRating} count={selectedOffer.shopReviewCount} />
              <div className="mt-3 space-y-0.5">
                <TermsRow label="ค่าบริการรวม" value={`${selectedOffer.price.toLocaleString()} ฿`} highlight />
                <TermsRow
                  label="พอยต์ทองที่ล็อก"
                  value={selectedOffer.terms.deposit
                    ? `${selectedOffer.terms.deposit.toLocaleString()} ฿${selectedOffer.terms.deposit_refundable ? " (คืน)" : " (ไม่คืน)"}`
                    : "ไม่มี"}
                />
                <TermsRow label="ค่าเดินทาง" value={selectedOffer.terms.travel_fee ? `${selectedOffer.terms.travel_fee.toLocaleString()} ฿` : "ฟรี"} />
                <TermsRow label="ค่าตรวจ" value={selectedOffer.terms.inspection_fee ? `${selectedOffer.terms.inspection_fee.toLocaleString()} ฿` : "ไม่มี"} />
                <TermsRow label="รับประกัน" value={selectedOffer.terms.warranty_days ? `${selectedOffer.terms.warranty_days} วัน` : "ไม่รับประกัน"} highlight={!!selectedOffer.terms.warranty_days} />
                <TermsRow label="ค่าฝาก/no-show" value={selectedOffer.terms.no_show_fee ? `${selectedOffer.terms.no_show_fee.toLocaleString()} ฿` : "ไม่มี"} />
                <TermsRow label="วงเงินความรับผิด" value={selectedOffer.terms.liability_cap ? `${selectedOffer.terms.liability_cap.toLocaleString()} ฿` : "ตาม Platform Policy"} />
              </div>
              {selectedOffer.terms.notes && (
                <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-500">💬 {selectedOffer.terms.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-weeeu-surface border border-weeeu-primary/30 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-weeeu-text">✅ ฉันรับทราบเงื่อนไขต่อไปนี้แล้ว</p>
            <ul className="space-y-1">
              {[
                "ค่าบริการและเงื่อนไขที่แสดงคือที่ตกลงกับ WeeeR รายนี้",
                "สิ่งที่ไม่ระบุในข้อเสนอ = ไม่มีสิทธิ์เรียกร้องเพิ่มเติม",
                "กดยืนยัน = ยอมรับข้อเสนอนี้เป็น SoT สำหรับข้อพิพาท",
              ].map((item, i) => (
                <li key={i} className="text-xs text-weeeu-dark flex items-start gap-1.5">
                  <span className="text-weeeu-primary shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("browse")}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-3.5 rounded-2xl text-sm transition-colors hover:bg-gray-50"
            >
              ← เปลี่ยนข้อเสนอ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting
                ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</>
                : "✅ ยืนยันข้อเสนอ"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
