"use client";
// ─── ค่าบริการ & ธุรกรรม (/wallet) — T-14 · WeeeT (ช่าง) · DARK theme · mockup-only
// CMD #117-F-2 (Advisor Gen 117): WeeeT ไม่ถือ point-wallet · view-only เท่านั้น
//  - ไม่มี flow เติม/ถอน · ไม่มี balance card แบบ wallet holder
//  - ค่าบริการ (service fee) ชำระให้ร้าน (WeeeR) ที่ช่างสังกัด — ช่างดูได้อย่างเดียว
//  - แสดงต่อ "งานที่ตนรับผิดชอบ": ค่าบริการ + ค่าอะไหล่ + รายละเอียดธุรกรรม (read-only)

import { useRouter } from "next/navigation";

// TODO(backend-expose): technician job service/parts fee ledger not mounted
// SUPPRESS (D-FE-NO-FAKE-DISPLAY): เดิมหน้านี้ render ตัวเลขค่าบริการ/ค่าอะไหล่/ธุรกรรม
// จาก MOCK_JOBS / MOCK_TX ที่ hardcode ไว้ล้วนๆ — ไม่มี endpoint จริงรองรับ
//   · /wallets/me/* = unmounted
//   · per-job service/parts fee ledger = ไม่มี route
// จึงถอด mock money ทั้งหมด และแสดง honest "unavailable (PHASE-4)" state แทน
// ห้ามใช้ 0-placeholder / ห้าม fabricate ตัวเลข จนกว่า backend จะ expose ledger จริง

export default function WalletPage() {
  const router = useRouter();

  return (
    <div className="pb-6">
      {/* Header + back nav */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
          aria-label="ย้อนกลับ"
        >
          ←
        </button>
        <h1 className="font-bold text-white">ค่าบริการ &amp; ธุรกรรม</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* View-only context banner — ช่างไม่ถือพอยต์เอง */}
        <div className="bg-sky-900/40 border border-sky-700 rounded-2xl px-4 py-3">
          <p className="text-sm text-sky-200 font-medium">👁️ อ่านอย่างเดียว (View-only)</p>
          <p className="text-xs text-sky-300/80 mt-1 leading-relaxed">
            หน้านี้จะแสดงค่าบริการ (Service Fee) และค่าอะไหล่ (Parts) ของงานที่คุณรับผิดชอบ
            ค่าบริการชำระเข้าร้าน (WeeeR) ที่คุณสังกัด — ช่าง (WeeeT) ไม่ได้ถือพอยต์เอง
            จึงไม่มีการเติม/ถอน
          </p>
        </div>

        {/* Unavailable state (PHASE-4) — ยังไม่มี backend endpoint จริงสำหรับ
            บัญชีค่าบริการ/ค่าอะไหล่ต่องานของช่าง จึงยังแสดงตัวเลขจริงไม่ได้
            (D-FE-NO-FAKE-DISPLAY: ไม่ fabricate ตัวเลข · ไม่ 0-placeholder) */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl text-center py-12 px-6">
          <p className="text-3xl mb-3">🚧</p>
          <p className="text-gray-200 text-sm font-semibold">ข้อมูลยังไม่พร้อมใช้งาน (PHASE-4)</p>
          <p className="text-gray-400 text-xs mt-2 leading-relaxed">
            ระบบยังไม่ได้เปิดให้ดึงข้อมูลค่าบริการและค่าอะไหล่ต่องานของช่าง
            เมื่อพร้อมใช้งานแล้ว รายการธุรกรรมและยอดสรุปจริงจะแสดงที่นี่
          </p>
        </div>
      </div>
    </div>
  );
}
