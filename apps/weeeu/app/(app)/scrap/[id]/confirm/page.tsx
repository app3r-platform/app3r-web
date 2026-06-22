"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SuccessTrackingBanner } from "@/components/shared/SuccessTrackingBanner";
import { MockAnnoOrigin, MockAnnoXApp } from "@/components/shared/MockAnnoBar";

const MOCK_OFFER = {
  shop: "ร้านรับซากดีเจริญ",
  price: 850,
  transport: "รับไปเอง",
};

export default function ScrapConfirmPage() {
  const { id } = useParams<{ id: string }>();
  // L5: ใช้ข้อเสนอที่เลือกจากหน้า offers (query param) — fallback MOCK_OFFER ถ้าไม่มี (Mockup)
  const sp = useSearchParams();
  const offer = {
    shop: sp.get("buyer") ?? MOCK_OFFER.shop,
    price: sp.get("price") ? Number(sp.get("price")) : MOCK_OFFER.price,
    transport: sp.get("transport") ?? MOCK_OFFER.transport,
  };
  // B3: success banner แสดงหลังกดยืนยันเท่านั้น (ไม่ใช่ก่อนยืนยัน)
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* §5 Origin + §8 Cross-app annotations */}
        <MockAnnoOrigin text='◀ มาจาก: U-30 · /scrap/[id]/offers (กด "เลือกข้อเสนอนี้") หรือ U-33 · /scrap/[id] (รับ offer โดยตรง)' />
        <MockAnnoXApp screenLabel="U-31: ยืนยัน (S1)">
          <p>• <strong>WeeeR :3001</strong> [R-28] ร้านรับแจ้งเตือน offer ถูกเลือก → งาน pending_pickup
            <a href="http://localhost:3001/scrap/jobs/SJ001" className="underline ml-1">/scrap/jobs/SJ001</a>
          </p>
          <p>• <strong>WeeeT :3003</strong> [T-04] ช่างได้รับ task รับซาก → กำหนดวันรับ
            <a href="http://localhost:3003/jobs/J001/pickup" className="underline ml-1">/jobs/[id]/pickup</a>
          </p>
        </MockAnnoXApp>

        {/* Back link */}
        <Link href={`/scrap/${id}/offers`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับดูข้อเสนอ
        </Link>

        {/* Tracking ref banner — แสดงหลังยืนยันสำเร็จเท่านั้น (B3) */}
        {confirmed && <SuccessTrackingBanner title="ยืนยันสำเร็จ" variant="weeeu" />}

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ยืนยันการเลือกข้อเสนอ</h1>

        {/* Offer summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ร้านรับซาก</p>
              <p className="text-sm font-semibold text-weeeu-dark">{offer.shop}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ราคารับซาก</p>
              <p className="text-lg font-bold text-weeeu-primary">{offer.price.toLocaleString()} ฿</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">การขนส่ง</p>
              <p className="text-sm text-gray-700">{offer.transport}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700">
            หลังยืนยัน ร้านจะนัดหมายเพื่อรับซากจากคุณ
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <div>
            <button
              onClick={() => setConfirmed(true)}
              disabled={confirmed}
              className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {confirmed ? "✅ ยืนยันแล้ว" : "✅ ยืนยัน"}
            </button>
            {/* §6 Nav annotation */}
            <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-0.5 text-center">→ U-55 /scrap (listing status → accepted)</p>
          </div>
          {confirmed ? (
            <Link href="/scrap">
              <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
                กลับหน้าซากของฉัน →
              </button>
            </Link>
          ) : (
            <Link href={`/scrap/${id}/offers`}>
              <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
                ยกเลิก — กลับไปดูข้อเสนออื่น
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
