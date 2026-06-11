"use client";
// R-25 — ยื่นข้อเสนอรับซาก / รับทิ้งฟรี (WeeeR)
// S2a = ยื่นราคาซื้อ · S2b = รับทิ้งฟรี
// B3: Escrow คือ WeeeR ล็อกพอยต์ทองค้ำประกันไว้ (ก่อนรับสินค้าจริง)

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MockAnnoOrigin, MockAnnoNav, MockAnnoXApp } from "@/components/MockAnno";

type OfferMode = "buy" | "free";

export default function ScrapAnnouncementOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [mode, setMode] = useState<OfferMode>("buy");
  const [form, setForm] = useState({
    offer_price: "",
    escrow_amount: "",
    pickup_date: "",
    capacity_kg: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (mode === "buy") {
      if (!form.offer_price || isNaN(Number(form.offer_price)) || Number(form.offer_price) < 0)
        e.offer_price = "กรุณาระบุราคาที่เสนอ (0 = ฟรี ใช้โหมดรับทิ้งฟรีแทน)";
    }
    if (!form.pickup_date) e.pickup_date = "กรุณาระบุวันที่ต้องการรับของ";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      // Mock: simulate API call
      await new Promise((r) => setTimeout(r, 800));
      setSuccess(true);
      setTimeout(() => router.push("/scrap/jobs"), 1500);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 max-w-sm mx-auto text-center">
        <MockAnnoXApp
          entries={[
            { app: "WeeeU", screen: "U-15 ดูข้อเสนอรับซาก", url: "http://localhost:3002/scrap/offers" },
          ]}
        />
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">ส่งข้อเสนอสำเร็จ</h1>
          <p className="text-sm font-medium text-green-700">
            {mode === "free" ? "ยื่นเสนอรับทิ้งฟรีแล้ว" : "ยื่นราคารับซื้อแล้ว"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl px-5 py-4 w-full space-y-2 text-left">
          <p className="text-sm text-gray-600">รอเจ้าของซากตอบรับ — ระบบจะแจ้งเตือนคุณเมื่อมีการตอบสนอง</p>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-400">ประกาศ ID</span>
            <span className="text-xs font-mono text-gray-500">{id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">โหมดข้อเสนอ</span>
            <span className="text-xs font-medium text-gray-700">
              {mode === "free" ? "🆓 รับทิ้งฟรี" : "💰 ซื้อ"}
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push("/scrap/jobs")}
          className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          ดูงานซากทั้งหมด
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* §5 Origin */}
      <MockAnnoOrigin from="R-26" />

      {/* Header + back */}
      <div className="flex items-center gap-3">
        <MockAnnoNav to="R-26">
          <Link href={`/scrap/announcements/${id}`} className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
        </MockAnnoNav>
        <h1 className="text-xl font-bold text-gray-900">ยื่นข้อเสนอรับซาก</h1>
      </div>

      {/* Item summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">♻️</span>
          <p className="text-sm font-semibold text-blue-800">เครื่องซักผ้า Samsung 8kg</p>
        </div>
        <p className="text-xs text-blue-600">ชำรุด ใช้ไม่ได้ — มอเตอร์น่าจะพัง</p>
        <div className="flex gap-4 mt-1 flex-wrap">
          <span className="text-xs text-blue-500">📍 ลาดพร้าว กรุงเทพฯ (~8 กม.)</span>
          <span className="text-xs text-blue-500">⚖️ ~50 กก.</span>
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("buy")}
          className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
            mode === "buy"
              ? "border-[#FF663A] bg-[#FFF1ED] text-[#D63B12]"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          💰 ยื่นราคาซื้อ
        </button>
        <button
          type="button"
          onClick={() => setMode("free")}
          className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
            mode === "free"
              ? "border-[#FF663A] bg-[#FFF1ED] text-[#D63B12]"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          🆓 รับทิ้งฟรี (S2b)
        </button>
      </div>

      {mode === "free" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <strong>รับทิ้งฟรี:</strong> คุณรับซากโดยไม่คิดค่าใช้จ่ายจากเจ้าของ — เหมาะสำหรับซากที่นำวัสดุคืนทุนได้จากการรีไซเคิล/อะไหล่
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Price (buy mode only) */}
        {mode === "buy" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาที่เสนอซื้อ — พอยต์เงิน (Silver Point) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.offer_price}
              onChange={(e) => setForm((f) => ({ ...f, offer_price: e.target.value }))}
              placeholder="เช่น 500"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] ${
                formErrors.offer_price ? "border-red-400" : "border-gray-200"
              }`}
            />
            {formErrors.offer_price && (
              <p className="text-xs text-red-500 mt-1">{formErrors.offer_price}</p>
            )}
          </div>
        )}

        {/* Escrow (B3 — number input) */}
        {mode === "buy" && (
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ล็อกพอยต์ทองพักเงินกลาง (Escrow)
            </label>
            <input
              type="number"
              min="0"
              value={form.escrow_amount}
              onChange={(e) => setForm((f) => ({ ...f, escrow_amount: e.target.value }))}
              placeholder="จำนวนพอยต์ทองที่ล็อก (ไม่บังคับ)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
            />
            <p className="text-xs text-gray-400 mt-1">
              พอยต์ทองจะถูกล็อกค้ำประกันจนกว่าจะรับของจริง — คืนอัตโนมัติหลัง WeeeU ยืนยัน
            </p>
          </div>
        )}

        {/* Pickup capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ความสามารถรับน้ำหนัก (กก.)
          </label>
          <input
            type="number"
            min="1"
            value={form.capacity_kg}
            onChange={(e) => setForm((f) => ({ ...f, capacity_kg: e.target.value }))}
            placeholder="เช่น 100 (ตันรถที่นำมา)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
          />
        </div>

        {/* Pickup date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่ต้องการเข้ารับ <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.pickup_date}
            onChange={(e) => setForm((f) => ({ ...f, pickup_date: e.target.value }))}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] ${
              formErrors.pickup_date ? "border-red-400" : "border-gray-200"
            }`}
          />
          {formErrors.pickup_date && (
            <p className="text-xs text-red-500 mt-1">{formErrors.pickup_date}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="เงื่อนไขพิเศษ ข้อตกลงเพิ่มเติม (ถ้ามี)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none"
          />
        </div>

        {/* Submit */}
        <MockAnnoNav to="R-27">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {submitting
              ? "กำลังส่ง…"
              : mode === "free"
              ? "🆓 ส่งข้อเสนอรับทิ้งฟรี"
              : "💰 ส่งราคาซื้อ"}
          </button>
        </MockAnnoNav>
      </form>

      {/* §8 Cross-app */}
      <MockAnnoXApp
        entries={[
          { app: "WeeeU", screen: "U-14 ดูข้อเสนอซาก", url: "http://localhost:3002/scrap/s001/offers" },
        ]}
      />
    </div>
  );
}
