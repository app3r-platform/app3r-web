"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

/* ─── local types (Mockup — Lesson #33) ─── */
type SellerType = "U" | "R";  // WeeeU / WeeeR
type BuyerType  = "U" | "R";

interface FeeRate {
  seller_type: SellerType;
  buyer_type:  BuyerType;
  label:       string;
  platform_pct: number;  // % หักจาก escrow → กระเป๋า Platform
  vat_pct:      number;  // % VAT บน platform fee
  note:         string;
}

/* Refund tiers — เมื่อผู้ขายยกเลิก */
interface RefundTier {
  tier:        string;
  label:       string;
  condition:   string;
  buyer_refund: string;  // % buyer ได้คืน
  seller_penalty: string; // penalty ผู้ขาย
  color:       string;
}

/* ─── Mock Fee Matrix ─── */
const FEE_MATRIX: FeeRate[] = [
  {
    seller_type: "U", buyer_type: "U", label: "U→U (บุคคลขายให้บุคคล)",
    platform_pct: 5, vat_pct: 7,
    note: "คู่ที่ 1: WeeeU ↔ WeeeU — ทั้งซื้อและขายเป็นบุคคลทั่วไป",
  },
  {
    seller_type: "U", buyer_type: "R", label: "U→R (บุคคลขายให้ร้าน)",
    platform_pct: 4, vat_pct: 7,
    note: "คู่ที่ 2: WeeeU ขาย → WeeeR ซื้อ — ร้านมีแต้มต่อ",
  },
  {
    seller_type: "R", buyer_type: "U", label: "R→U (ร้านขายให้บุคคล)",
    platform_pct: 6, vat_pct: 7,
    note: "คู่ที่ 3: WeeeR ขาย → WeeeU ซื้อ — ร้านมีรายได้สูงกว่า",
  },
  {
    seller_type: "R", buyer_type: "R", label: "R→R (ร้านขายให้ร้าน)",
    platform_pct: 3, vat_pct: 7,
    note: "คู่ที่ 4: WeeeR ↔ WeeeR — B2B rate พิเศษ",
  },
];

/* ─── Refund Tiers T1-T4 ─── */
const REFUND_TIERS: RefundTier[] = [
  {
    tier: "T1", label: "ยกเลิกก่อนมีผู้ซื้อ",
    condition: "ผู้ขายยกเลิก ก่อนมีผู้ซื้อยืนยัน (สถานะ announced/receiving_offers)",
    buyer_refund: "N/A", seller_penalty: "ไม่มี penalty",
    color: "bg-green-50 border-green-200",
  },
  {
    tier: "T2", label: "ยกเลิกหลัง offer selected",
    condition: "ผู้ขายยกเลิก หลังเลือก offer แล้ว แต่ยังไม่ได้รับ Escrow",
    buyer_refund: "100% (Escrow ยังไม่ถูก lock)",
    seller_penalty: "Warning 1 ครั้ง — ทำบ่อย suspend listing",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    tier: "T3", label: "ยกเลิกหลัง Escrow locked",
    condition: "ผู้ขายยกเลิก หลังผู้ซื้อโอน Escrow แล้ว (สถานะ buyer_confirmed ขึ้นไป)",
    buyer_refund: "100% Escrow คืนผู้ซื้อ",
    seller_penalty: "Platform fee 3% ของราคา — หักจากกระเป๋าผู้ขาย + Warning",
    color: "bg-orange-50 border-orange-200",
  },
  {
    tier: "T4", label: "ผู้ซื้อ Dispute — seller แพ้",
    condition: "Admin ตัดสิน to_buyer — ผู้ขายแพ้ dispute",
    buyer_refund: "100% (หรือตาม split%) Escrow คืนผู้ซื้อ",
    seller_penalty: "Platform fee เต็มตาม fee matrix + ค่าจัดการ dispute 2%",
    color: "bg-red-50 border-red-200",
  },
];

/* ─── Example calculator ─── */
function FeeCalculator() {
  const [price,       setPrice]       = useState(10000);
  const [sellerType,  setSellerType]  = useState<SellerType>("U");
  const [buyerType,   setBuyerType]   = useState<BuyerType>("U");

  const rate = FEE_MATRIX.find(f => f.seller_type === sellerType && f.buyer_type === buyerType)!;
  const platformFee  = Math.round(price * rate.platform_pct / 100);
  const vat          = Math.round(platformFee * rate.vat_pct / 100);
  const totalFee     = platformFee + vat;
  const sellerGets   = price - totalFee;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-sm font-bold text-gray-700">🧮 Fee Calculator (Mock)</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">ราคาขาย (G)</label>
          <input type="number" min={100} step={100}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-admin-primary"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">ประเภทผู้ขาย</label>
          <select value={sellerType}
            onChange={e => setSellerType(e.target.value as SellerType)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-admin-primary">
            <option value="U">WeeeU (บุคคล)</option>
            <option value="R">WeeeR (ร้าน)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">ประเภทผู้ซื้อ</label>
          <select value={buyerType}
            onChange={e => setBuyerType(e.target.value as BuyerType)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-admin-primary">
            <option value="U">WeeeU (บุคคล)</option>
            <option value="R">WeeeR (ร้าน)</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">ราคาขาย</span>
          <span className="font-mono text-gray-700">{price.toLocaleString()} G</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Platform Fee ({rate.platform_pct}%)</span>
          <span className="font-mono text-red-600">−{platformFee.toLocaleString()} G</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">VAT {rate.vat_pct}% (on fee)</span>
          <span className="font-mono text-red-600">−{vat.toLocaleString()} G</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
          <span className="text-gray-700">ผู้ขายได้รับสุทธิ</span>
          <span className="font-mono text-green-600">{sellerGets.toLocaleString()} G</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-gray-700">Platform รับ</span>
          <span className="font-mono text-admin-primary">{totalFee.toLocaleString()} G</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Rate: {rate.label} — {rate.note}
      </p>
    </div>
  );
}

export default function ResellFeesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">💰 Resell Fees — D-Resell-1</h1>
            <p className="text-gray-500 text-sm mt-1">
              Fee matrix 4 คู่ (U↔U/U→R/R→U/R↔R) + Refund Tiers T1–T4
            </p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
              🔶 Mockup — ข้อมูลจำลอง
            </span>
          </div>
          <div className="flex gap-2">
            <Link href="/resell/jobs"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              🔄 Jobs →
            </Link>
            <Link href="/resell/analytics"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              📊 Analytics →
            </Link>
          </div>
        </div>

        {/* Fee Matrix */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-700">📋 Fee Matrix — 4 คู่ D-Resell-1</h2>
            <p className="text-xs text-gray-500 mt-0.5">Platform fee หักจาก Escrow ตอน completed → กระเป๋า Platform</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3">คู่</th>
                <th className="px-4 py-3">ผู้ขาย</th>
                <th className="px-4 py-3">ผู้ซื้อ</th>
                <th className="px-4 py-3 text-right">Platform Fee</th>
                <th className="px-4 py-3 text-right">VAT</th>
                <th className="px-4 py-3">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {FEE_MATRIX.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-700">
                      {f.seller_type}→{f.buyer_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.seller_type === "R"
                        ? "bg-admin-primary/15 text-admin-primary"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {f.seller_type === "U" ? "WeeeU บุคคล" : "WeeeR ร้าน"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.buyer_type === "R"
                        ? "bg-admin-primary/15 text-admin-primary"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {f.buyer_type === "U" ? "WeeeU บุคคล" : "WeeeR ร้าน"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-admin-primary">{f.platform_pct}%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-gray-500">{f.vat_pct}%</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculator */}
        <FeeCalculator />

        {/* Refund Tiers */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">🔁 Refund Tiers — T1–T4 (กรณีผู้ขายยกเลิก / แพ้ Dispute)</h2>
          <div className="space-y-3">
            {REFUND_TIERS.map(tier => (
              <div key={tier.tier} className={`rounded-xl border p-4 ${tier.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 bg-white rounded-full text-gray-700 border border-gray-200">
                    {tier.tier}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{tier.label}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{tier.condition}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">🛒 ผู้ซื้อได้รับคืน</p>
                    <p className="text-sm font-semibold text-blue-700">{tier.buyer_refund}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">🧑‍💼 Penalty ผู้ขาย</p>
                    <p className="text-sm font-semibold text-red-600">{tier.seller_penalty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow flow note */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-semibold text-gray-700 mb-2">📌 Escrow Flow (Resell)</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {["ผู้ซื้อโอน Escrow", "→", "lock 24 ชม. (awaiting_payment)", "→", "buyer_confirmed", "→",
              "ดำเนินการ / ส่งสินค้า", "→", "inspection 48 ชม.", "→", "completed", "→",
              "หัก fee → กระเป๋า 2 Platform", "→", "โอนเงินให้ผู้ขาย"].map((step, i) => (
              <span key={i} className={step === "→" ? "text-gray-400" : "bg-white border border-gray-200 rounded px-2 py-0.5"}>
                {step}
              </span>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
