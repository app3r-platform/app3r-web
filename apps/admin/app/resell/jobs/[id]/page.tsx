"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

/* ─── local types (Mockup — Lesson #33) ─── */
type ResellListingStatus =
  | "announced" | "receiving_offers" | "offer_selected"
  | "awaiting_payment" | "buyer_confirmed" | "in_progress"
  | "delivered" | "inspection_period" | "completed"
  | "cancelled" | "disputed";

type FaultParty  = "buyer" | "seller" | "split";
type Resolution  = "to_buyer" | "to_seller" | "split" | "pending";

interface OfferTerms {
  shipping_cost:    "buyer" | "seller" | "split";
  secondhand_warranty: boolean;
  mismatch_liability:  "seller" | "none";
}

interface DisputeLayer {
  /* L1 */
  offer_terms: OfferTerms;
  /* L2 */
  fault_party: FaultParty | null;
  fault_note:  string;
  /* L3 */
  resolution:  Resolution;
  split_pct?:  number | null;   // buyer gets N%
  /* L4 */
  precedent_note: string | null;
}

interface TimelineStep {
  status:    ResellListingStatus;
  label:     string;
  actor:     string;
  note:      string;
  timestamp: string;
}

interface Evidence {
  role:  "seller" | "buyer";
  type:  "photo" | "video";
  label: string;
  url:   string;
}

interface ResellJobDetail {
  id:           string;
  listing_code: string;
  title:        string;
  status:       ResellListingStatus;
  seller_name:  string;
  seller_type:  "U" | "R";
  buyer_name:   string | null;
  buyer_type:   "U" | "R" | null;
  price:        number;
  escrow_locked: boolean;
  escrow_amount: number;
  dispute_flag:  boolean;
  created_at:    string;
  timeline:      TimelineStep[];
  evidences:     Evidence[];
  dispute?:      DisputeLayer | null;
}

/* ─── Status meta ─── */
const STATUS_META: Record<ResellListingStatus, { label: string; color: string }> = {
  announced:        { label: "ประกาศแล้ว",       color: "bg-gray-100 text-gray-500" },
  receiving_offers: { label: "รับ offer",         color: "bg-blue-50 text-blue-700" },
  offer_selected:   { label: "เลือก offer แล้ว", color: "bg-admin-surface text-admin-primary" },
  awaiting_payment: { label: "รอชำระเงิน",       color: "bg-yellow-50 text-yellow-700" },
  buyer_confirmed:  { label: "ผู้ซื้อยืนยัน",   color: "bg-cyan-50 text-cyan-700" },
  in_progress:      { label: "กำลังดำเนินการ",   color: "bg-brand-info/15 text-brand-info" },
  delivered:        { label: "จัดส่งแล้ว",        color: "bg-admin-surface text-admin-primary" },
  inspection_period:{ label: "ตรวจสอบสินค้า",    color: "bg-orange-50 text-orange-700" },
  completed:        { label: "เสร็จสิ้น",         color: "bg-green-50 text-green-700" },
  cancelled:        { label: "ยกเลิก",            color: "bg-red-50 text-red-700" },
  disputed:         { label: "ข้อพิพาท",          color: "bg-red-50 text-red-700" },
};

const TIMELINE_ORDER: ResellListingStatus[] = [
  "announced", "receiving_offers", "offer_selected", "awaiting_payment",
  "buyer_confirmed", "in_progress", "delivered", "inspection_period", "completed",
];

/* ─── Mock data pool ─── */
const MOCK_DETAIL: Record<string, ResellJobDetail> = {
  "rj-001": {
    id: "rj-001", listing_code: "RS-20260101-001",
    title: "Samsung AC 12000 BTU ปี 2022",
    status: "completed", seller_type: "U", seller_name: "นายสมชาย ใจดี",
    buyer_type: "U", buyer_name: "นางสาวอรุณ แสงทอง",
    price: 8500, escrow_locked: false, escrow_amount: 0,
    dispute_flag: false, created_at: "2026-01-10T09:00:00Z",
    timeline: [
      { status: "announced",         label: "ประกาศ",      actor: "นายสมชาย ใจดี",        note: "ลงประกาศขายแอร์", timestamp: "2026-01-10T09:00:00Z" },
      { status: "receiving_offers",  label: "รับ offer",   actor: "ระบบ",                  note: "เปิดรับข้อเสนอ", timestamp: "2026-01-10T09:05:00Z" },
      { status: "offer_selected",    label: "เลือก offer", actor: "นายสมชาย ใจดี",        note: "เลือก offer ของนางสาวอรุณ", timestamp: "2026-01-11T10:00:00Z" },
      { status: "awaiting_payment",  label: "รอชำระ",      actor: "ระบบ",                  note: "รอผู้ซื้อโอนเงิน Escrow", timestamp: "2026-01-11T10:01:00Z" },
      { status: "buyer_confirmed",   label: "ยืนยันซื้อ",  actor: "นางสาวอรุณ แสงทอง",   note: "โอนเงินพักกลาง (Escrow) แล้ว", timestamp: "2026-01-11T11:00:00Z" },
      { status: "in_progress",       label: "ดำเนิน",      actor: "นายสมชาย ใจดี",        note: "จัดส่งสินค้าแล้ว", timestamp: "2026-01-12T08:00:00Z" },
      { status: "delivered",         label: "จัดส่ง",       actor: "ขนส่ง",                note: "ส่งถึงผู้ซื้อ", timestamp: "2026-01-13T14:00:00Z" },
      { status: "inspection_period", label: "ตรวจสอบ",     actor: "นางสาวอรุณ แสงทอง",   note: "รับของแล้ว อยู่ระหว่างตรวจ", timestamp: "2026-01-13T14:30:00Z" },
      { status: "completed",         label: "เสร็จสิ้น",   actor: "นางสาวอรุณ แสงทอง",   note: "ยืนยันรับสินค้า โอนเงินให้ผู้ขาย", timestamp: "2026-01-14T10:00:00Z" },
    ],
    evidences: [
      { role: "seller", type: "photo",  label: "รูปสภาพแอร์ก่อนส่ง",  url: "#mock-photo-1" },
      { role: "seller", type: "video",  label: "คลิปทดสอบการทำงาน",    url: "#mock-video-1" },
      { role: "buyer",  type: "video",  label: "คลิปตรวจสอบเมื่อได้รับ", url: "#mock-video-2" },
    ],
    dispute: null,
  },
  "rj-005": {
    id: "rj-005", listing_code: "RS-20260210-005",
    title: "Panasonic เครื่องซักผ้า 2 ถัง 7kg",
    status: "disputed", seller_type: "U", seller_name: "นายประสิทธิ์ ขยัน",
    buyer_type: "U", buyer_name: "นายเกียรติ มีสุข",
    price: 3200, escrow_locked: true, escrow_amount: 3200,
    dispute_flag: true, created_at: "2026-02-10T11:00:00Z",
    timeline: [
      { status: "announced",         label: "ประกาศ",      actor: "นายประสิทธิ์ ขยัน",  note: "ลงประกาศขายเครื่องซัก", timestamp: "2026-02-10T11:00:00Z" },
      { status: "receiving_offers",  label: "รับ offer",   actor: "ระบบ",                note: "เปิดรับข้อเสนอ", timestamp: "2026-02-10T11:05:00Z" },
      { status: "offer_selected",    label: "เลือก offer", actor: "นายประสิทธิ์ ขยัน",  note: "เลือก offer ของนายเกียรติ", timestamp: "2026-02-11T09:00:00Z" },
      { status: "awaiting_payment",  label: "รอชำระ",      actor: "ระบบ",                note: "รอระบบพักเงินกลาง (Escrow)", timestamp: "2026-02-11T09:01:00Z" },
      { status: "buyer_confirmed",   label: "ยืนยันซื้อ",  actor: "นายเกียรติ มีสุข",   note: "โอนเงินพักกลาง (Escrow) แล้ว", timestamp: "2026-02-11T10:00:00Z" },
      { status: "in_progress",       label: "ดำเนิน",      actor: "นายประสิทธิ์ ขยัน",  note: "ส่งสินค้า", timestamp: "2026-02-12T08:00:00Z" },
      { status: "delivered",         label: "จัดส่ง",       actor: "ขนส่ง",              note: "ถึงผู้ซื้อ", timestamp: "2026-02-13T12:00:00Z" },
      { status: "disputed",          label: "พิพาท",        actor: "นายเกียรติ มีสุข",   note: "สินค้าไม่ตรงปก — มีรอยแตกที่ถัง", timestamp: "2026-02-13T14:00:00Z" },
    ],
    evidences: [
      { role: "seller", type: "photo",  label: "รูปก่อนส่ง (2 ภาพ)",     url: "#mock-photo-3" },
      { role: "seller", type: "video",  label: "คลิปทดสอบก่อนส่ง",       url: "#mock-video-3" },
      { role: "buyer",  type: "video",  label: "คลิปแสดงความเสียหาย",    url: "#mock-video-4" },
      { role: "buyer",  type: "photo",  label: "รูปรอยแตกที่ถัง",         url: "#mock-photo-4" },
    ],
    dispute: {
      offer_terms: {
        shipping_cost: "seller",
        secondhand_warranty: false,
        mismatch_liability: "seller",
      },
      fault_party: "seller",
      fault_note:  "สินค้าไม่ตรงกับรูปในประกาศ — มีรอยแตกชัดเจน ผู้ขายไม่ได้แจ้ง",
      resolution:  "to_buyer",
      split_pct:   null,
      precedent_note: "L4: คดีใกล้เคียง RS-20251105 — ผู้ขายซ่อนรอยแตก Admin ตัดสินคืนผู้ซื้อ",
    },
  },
  "rj-010": {
    id: "rj-010", listing_code: "RS-20260401-010",
    title: "Hitachi AC 15000 BTU",
    status: "disputed", seller_type: "R", seller_name: "ร้าน ColdAir",
    buyer_type: "U", buyer_name: "นายวิฑูรย์ ใจเย็น",
    price: 14500, escrow_locked: true, escrow_amount: 14500,
    dispute_flag: true, created_at: "2026-04-01T09:00:00Z",
    timeline: [
      { status: "announced",         label: "ประกาศ",      actor: "ร้าน ColdAir",       note: "ลงประกาศ AC Hitachi", timestamp: "2026-04-01T09:00:00Z" },
      { status: "receiving_offers",  label: "รับ offer",   actor: "ระบบ",               note: "รับข้อเสนอ", timestamp: "2026-04-01T09:05:00Z" },
      { status: "offer_selected",    label: "เลือก offer", actor: "ร้าน ColdAir",       note: "เลือก offer ของนายวิฑูรย์", timestamp: "2026-04-02T10:00:00Z" },
      { status: "awaiting_payment",  label: "รอชำระ",      actor: "ระบบ",               note: "รอระบบพักเงินกลาง (Escrow) 24 ชม.", timestamp: "2026-04-02T10:01:00Z" },
      { status: "buyer_confirmed",   label: "ยืนยันซื้อ",  actor: "นายวิฑูรย์ ใจเย็น", note: "โอนเงินพักกลาง (Escrow)", timestamp: "2026-04-02T11:00:00Z" },
      { status: "in_progress",       label: "ดำเนิน",      actor: "ร้าน ColdAir",       note: "ส่งสินค้า", timestamp: "2026-04-03T08:00:00Z" },
      { status: "delivered",         label: "จัดส่ง",       actor: "ขนส่ง",             note: "ถึงผู้ซื้อ", timestamp: "2026-04-04T15:00:00Z" },
      { status: "disputed",          label: "พิพาท",        actor: "นายวิฑูรย์ ใจเย็น", note: "แอร์เย็นไม่ได้ — คอมเพรสเซอร์เสีย", timestamp: "2026-04-04T17:00:00Z" },
    ],
    evidences: [
      { role: "seller", type: "photo",  label: "รูปก่อนส่ง",              url: "#mock-photo-5" },
      { role: "seller", type: "video",  label: "คลิปทดสอบการทำงาน",      url: "#mock-video-5" },
      { role: "buyer",  type: "video",  label: "คลิปแสดงว่าเย็นไม่ได้",  url: "#mock-video-6" },
    ],
    dispute: {
      offer_terms: {
        shipping_cost: "buyer",
        secondhand_warranty: true,
        mismatch_liability: "seller",
      },
      fault_party: "split",
      fault_note:  "ไม่ชัดเจน — คอมเพรสเซอร์อาจเสียระหว่างขนส่ง หรือก่อนส่ง (seller มีประกันมือสอง 30 วัน)",
      resolution:  "split",
      split_pct:   60,
      precedent_note: null,
    },
  },
};

/* fallback generic detail */
function buildFallback(id: string): ResellJobDetail {
  return {
    id, listing_code: `RS-MOCK-${id}`,
    title: "สินค้า Mockup", status: "in_progress",
    seller_type: "U", seller_name: "ผู้ขาย (mock)",
    buyer_type: "U", buyer_name: "ผู้ซื้อ (mock)",
    price: 5000, escrow_locked: false, escrow_amount: 0,
    dispute_flag: false, created_at: new Date().toISOString(),
    timeline: [
      { status: "announced",   label: "ประกาศ",    actor: "ผู้ขาย (mock)", note: "—", timestamp: new Date().toISOString() },
      { status: "in_progress", label: "ดำเนิน",   actor: "ระบบ",          note: "—", timestamp: new Date().toISOString() },
    ],
    evidences: [],
    dispute: null,
  };
}

/* ─── sub-components ─── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}

/* ─── Dispute Panel (R10) ─── */
function DisputePanel({ d, escrow, price }: { d: DisputeLayer; escrow: number; price: number }) {
  const [activeResolution, setActiveResolution] = useState<Resolution>(d.resolution);
  const [splitPct, setSplitPct] = useState(d.split_pct ?? 50);
  const [saved, setSaved] = useState(false);

  const buyerAmt  = Math.round(escrow * (splitPct / 100));
  const sellerAmt = escrow - buyerAmt;

  function handleSave() {
    /* Mockup — no real API */
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="bg-white rounded-xl border border-red-200 p-5 space-y-5">
      <div className="flex items-center gap-2">
        {/* PHASE-4: SoT = Source of Truth (Offer terms) */}
        <h2 className="text-sm font-bold text-red-700">⚖️ Dispute Resolution — Offer = ข้อตกลงหลัก</h2>
        <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">🔶 Mockup</span>
      </div>

      {/* L1 — Offer Terms */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          L1 — Offer Terms (ข้อตกลงหลัก)
        </p>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="text-center">
            <p className="text-xs text-gray-500">ค่าส่ง</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              d.offer_terms.shipping_cost === "seller"
                ? "bg-admin-primary/15 text-admin-primary"
                : d.offer_terms.shipping_cost === "buyer"
                ? "bg-gray-100 text-gray-600"
                : "bg-admin-surface text-admin-primary"
            }`}>
              {d.offer_terms.shipping_cost === "seller" ? "ผู้ขายออก"
               : d.offer_terms.shipping_cost === "buyer" ? "ผู้ซื้อออก"
               : "แบ่งกัน"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">ประกันมือสอง</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              d.offer_terms.secondhand_warranty
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {d.offer_terms.secondhand_warranty ? "✅ มีประกัน" : "❌ ไม่มี"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">รับผิดไม่ตรงปก</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              d.offer_terms.mismatch_liability === "seller"
                ? "bg-orange-50 text-orange-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {d.offer_terms.mismatch_liability === "seller" ? "ผู้ขายรับผิด" : "ไม่ระบุ"}
            </span>
          </div>
        </div>
      </div>

      {/* L2 — Fault Party */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">L2 — ใครเหตุ</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            d.fault_party === "seller" ? "bg-red-100 text-red-700"
            : d.fault_party === "buyer" ? "bg-yellow-100 text-yellow-700"
            : "bg-admin-surface text-admin-primary"
          }`}>
            {d.fault_party === "seller" ? "🧑‍💼 ผู้ขายเหตุ"
             : d.fault_party === "buyer" ? "🛒 ผู้ซื้อเหตุ"
             : "⚡ แบ่งความรับผิด"}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">{d.fault_note}</p>
      </div>

      {/* L3 — Resolution (3-way) */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          L3 — ตัดสิน 3 ทาง (Admin Action)
        </p>
        <p className="text-xs text-gray-500">L3 default: คืนผู้ซื้อ เว้นแต่ Admin override</p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {(["to_buyer", "to_seller", "split"] as Resolution[]).map(r => (
            <button key={r} onClick={() => setActiveResolution(r)}
              className={`p-3 rounded-lg border-2 text-center text-xs font-medium transition-all ${
                activeResolution === r
                  ? r === "to_buyer"  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : r === "to_seller" ? "border-green-400 bg-green-50 text-green-700"
                  : "border-admin-primary bg-admin-surface text-admin-primary"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}>
              {r === "to_buyer"  ? "🛒 ผู้ซื้อชนะ\nคืน escrow"
               : r === "to_seller" ? "🧑‍💼 ผู้ขายชนะ\nโอน escrow"
               : "⚡ แบ่ง\nsplit%"}
            </button>
          ))}
        </div>

        {/* Split slider */}
        {activeResolution === "split" && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-600">ผู้ซื้อได้รับ <strong>{splitPct}%</strong> = {buyerAmt.toLocaleString()} G
              &nbsp;/&nbsp; ผู้ขายได้รับ <strong>{100 - splitPct}%</strong> = {sellerAmt.toLocaleString()} G
            </p>
            <input type="range" min={0} max={100} step={5}
              value={splitPct}
              onChange={e => setSplitPct(Number(e.target.value))}
              className="w-full accent-admin-primary"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>ผู้ซื้อ 100%</span>
              <span>แบ่งเท่ากัน 50/50</span>
              <span>ผู้ขาย 100%</span>
            </div>
          </div>
        )}

        {/* Escrow summary */}
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">เงินพักกลาง (Escrow) ทั้งหมด</span>
            <span className="font-mono font-semibold text-gray-700">{escrow.toLocaleString()} G</span>
          </div>
          {activeResolution === "to_buyer" && (
            <div className="flex justify-between text-blue-700">
              <span>→ คืนผู้ซื้อ</span>
              <span className="font-mono font-bold">{escrow.toLocaleString()} G</span>
            </div>
          )}
          {activeResolution === "to_seller" && (
            <div className="flex justify-between text-green-700">
              <span>→ โอนผู้ขาย</span>
              <span className="font-mono font-bold">{escrow.toLocaleString()} G</span>
            </div>
          )}
          {activeResolution === "split" && (
            <>
              <div className="flex justify-between text-blue-700">
                <span>→ ผู้ซื้อ ({splitPct}%)</span>
                <span className="font-mono font-bold">{buyerAmt.toLocaleString()} G</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>→ ผู้ขาย ({100 - splitPct}%)</span>
                <span className="font-mono font-bold">{sellerAmt.toLocaleString()} G</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* L4 — Precedent */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">L4 — Precedent</p>
        {d.precedent_note ? (
          <p className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-200">{d.precedent_note}</p>
        ) : (
          <p className="text-xs text-gray-400 italic">ไม่มีคดีเทียบเคียง</p>
        )}
      </div>

      {/* Confirm */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
          {saved ? "✅ บันทึกแล้ว (Mock)" : "บันทึกคำตัดสิน (Mock)"}
        </button>
        <p className="text-xs text-gray-400">🔶 Mockup — ไม่ส่ง API จริง</p>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function ResellJobDetailPage() {
  const params = useParams();
  const id     = (params?.id as string) ?? "";

  const job = MOCK_DETAIL[id] ?? buildFallback(id);

  const currentIdx = TIMELINE_ORDER.indexOf(job.status as ResellListingStatus);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/resell/jobs" className="hover:text-gray-600">Resell Jobs</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{job.listing_code}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔄 {job.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_META[job.status].color}`}>
                {STATUS_META[job.status].label}
              </span>
              {job.escrow_locked && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  🔒 Escrow {job.escrow_amount.toLocaleString()} G
                </span>
              )}
              {job.dispute_flag && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  ⚖️ ข้อพิพาท
                </span>
              )}
              <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
                🔶 Mockup
              </span>
            </div>
          </div>
          <Link href="/resell/jobs"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← กลับ
          </Link>
        </div>

        {/* Job info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">รายละเอียด</p>
          <InfoRow label="Listing Code" value={<span className="font-mono text-xs text-admin-primary">{job.listing_code}</span>} />
          <InfoRow label="ผู้ขาย" value={
            <div className="flex items-center gap-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                job.seller_type === "R" ? "bg-admin-primary/15 text-admin-primary" : "bg-gray-100 text-gray-600"
              }`}>{job.seller_type}</span>
              {job.seller_name}
            </div>
          } />
          <InfoRow label="ผู้ซื้อ" value={
            job.buyer_name ? (
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  job.buyer_type === "R" ? "bg-admin-primary/15 text-admin-primary" : "bg-gray-100 text-gray-600"
                }`}>{job.buyer_type}</span>
                {job.buyer_name}
              </div>
            ) : "—"
          } />
          <InfoRow label="ราคาตกลง" value={<span className="font-mono text-green-600">{job.price.toLocaleString()} G</span>} />
          <InfoRow label="วันที่สร้าง" value={new Date(job.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })} />
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Timeline — 9 ขั้นตอน</p>
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {job.timeline.map((step, i) => {
                const stepIdx = TIMELINE_ORDER.indexOf(step.status);
                const isActive = step.status === job.status;
                const isDone   = stepIdx < currentIdx || (job.status === "completed" || job.status === "cancelled" || job.status === "disputed");
                return (
                  <div key={i} className="flex items-start gap-4 pl-10 relative">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 -translate-x-1/2 mt-1 ${
                      isActive  ? "bg-admin-primary border-admin-primary ring-2 ring-admin-primary/30"
                      : isDone  ? "bg-admin-primary border-admin-primary"
                      : "bg-white border-gray-300"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isActive ? "text-admin-primary" : isDone ? "text-gray-700" : "text-gray-400"}`}>
                          {step.label}
                        </span>
                        {isActive && (
                          <span className="text-xs px-1.5 py-0.5 bg-admin-surface text-admin-primary rounded-full">ปัจจุบัน</span>
                        )}
                        {step.status === "disputed" && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full">⚖️</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{step.actor} — {step.note}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(step.timestamp).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Evidence */}
        {job.evidences.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              หลักฐาน — รูป/คลิป (seller+buyer บังคับ)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {job.evidences.map((ev, i) => (
                <div key={i} className={`rounded-lg border p-3 flex items-center gap-3 ${
                  ev.role === "seller"
                    ? "border-admin-primary/30 bg-admin-surface/30"
                    : "border-blue-200 bg-blue-50/30"
                }`}>
                  <span className="text-2xl">{ev.type === "photo" ? "📸" : "🎬"}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{ev.label}</p>
                    <p className={`text-xs mt-0.5 ${ev.role === "seller" ? "text-admin-primary" : "text-blue-600"}`}>
                      {ev.role === "seller" ? "👨‍🔧 ผู้ขาย" : "🛒 ผู้ซื้อ"}
                    </p>
                    <a href={ev.url} className="text-xs text-gray-400 underline hover:text-gray-600 mt-0.5 inline-block">
                      [mock url]
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dispute Panel */}
        {job.dispute_flag && job.dispute && (
          <DisputePanel d={job.dispute} escrow={job.escrow_amount} price={job.price} />
        )}

      </main>
    </div>
  );
}
