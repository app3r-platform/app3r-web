"use client";
// ─── AdPromoteButton (C12 · Ad System Spec Gen 100) ───────────────────────────
// ปุ่ม "ลงโฆษณา" ในหน้าประกาศของตัวเอง → เลือกตำแหน่ง+จำนวนวัน → แสดง Gold Point ที่จะตัด (D75)
// → ยืนยัน → POST /api/v1/ads (Backend debit Gold + status pending) → เข้าคิว Admin อนุมัติ
// ตัดพอยต์ตอนซื้อ (จ่ายล่วงหน้า) · Admin ไม่อนุมัติ → refund เต็ม · cancel → refund (pending=เต็ม/active=ตามสัดส่วน)

import { useState } from "react";
import { adsApi, estimateAdCost, type AdPosition } from "@/lib/api/ads";

const AD_POSITIONS: { id: AdPosition; label: string; rate: number; desc: string }[] = [
  { id: "home_first_row", label: "แถวแรกหน้าแรก", rate: 5, desc: "เด่นสุด — โชว์แถวแรกหน้าหลัก" },
  { id: "module_first_row", label: "แถวแรกโมดูลขาย", rate: 3, desc: "ดันขึ้นแถวแรกในหน้าตลาดมือสอง" },
  { id: "sidebar", label: "แถบด้านข้าง (Sidebar)", rate: 3, desc: "โชว์ข้างจอหน้ารายละเอียด" },
];

export function AdPromoteButton({ listingId, listingName }: { listingId: string; listingName?: string }) {
  const [open, setOpen] = useState(false);
  const [positionId, setPositionId] = useState<AdPosition>("module_first_row");
  const [days, setDays] = useState("7");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ goldCost: number } | null>(null);

  const position = AD_POSITIONS.find((p) => p.id === positionId) ?? AD_POSITIONS[1];
  const dayCount = Math.max(0, parseInt(days || "0", 10) || 0);
  const estimate = estimateAdCost(positionId, dayCount); // D75 round (ประมาณการ)

  const handleConfirm = async () => {
    if (dayCount < 1) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await adsApi.buy({ listingId, position: positionId, durationDays: dayCount });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const code = data?.error?.code;
        setError(
          code === "AD_BUY_FAILED"
            ? "พอยต์ทอง (Gold Point) ไม่พอ หรือสร้างโฆษณาไม่สำเร็จ — กรุณาตรวจยอดพอยต์"
            : "เกิดข้อผิดพลาด กรุณาลองใหม่",
        );
        return;
      }
      // 201 → { id, goldCost, status: 'pending' } — Gold ถูกตัดแล้ว (จ่ายล่วงหน้า)
      setResult({ goldCost: typeof data?.goldCost === "number" ? data.goldCost : estimate });
    } catch {
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-4 text-center space-y-1.5">
        <p className="text-2xl">📢</p>
        <p className="text-sm font-semibold text-weeeu-text">ส่งคำขอลงโฆษณาแล้ว</p>
        <p className="text-xs text-gray-600">
          ตัดพอยต์ทอง (Gold Point) {result.goldCost.toLocaleString()} แล้ว — เข้าคิว Admin อนุมัติ
          (ถ้าไม่อนุมัติจะคืนเต็มจำนวน)
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-weeeu-primary/30 bg-weeeu-surface text-weeeu-dark font-semibold py-3 rounded-2xl text-sm hover:bg-weeeu-surface/70 transition-colors"
      >
        📢 ลงโฆษณา — ดันประกาศให้เด่นขึ้น
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-weeeu-primary/20 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">📢 ลงโฆษณาประกาศ</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 text-sm">✕</button>
      </div>
      {listingName && <p className="text-xs text-gray-400 -mt-2">{listingName}</p>}

      {/* เลือกตำแหน่ง */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">เลือกตำแหน่งโฆษณา</label>
        <div className="space-y-1.5">
          {AD_POSITIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPositionId(p.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                positionId === p.id
                  ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text font-medium"
                  : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{positionId === p.id && "✅ "}{p.label}</span>
                <span className="text-xs text-weeeu-primary font-semibold">{p.rate} พอยต์ทอง/วัน</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* จำนวนวัน */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">จำนวนวัน</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-24 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
          />
          <span className="text-sm text-gray-500">วัน</span>
          <div className="flex gap-1.5 ml-auto">
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(String(d))}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                  days === String(d)
                    ? "bg-weeeu-primary text-white border-weeeu-primary"
                    : "border-gray-200 text-gray-500 hover:border-weeeu-primary/40"
                }`}
              >
                {d}ว
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* สรุป point ที่จะตัด (ประมาณการ — ยอดจริงคำนวณฝั่ง Backend D75) */}
      <div className="bg-weeeu-surface rounded-xl p-3 flex items-center justify-between">
        <span className="text-sm text-weeeu-text">ประมาณการที่จะตัด ({position.rate} × {dayCount} วัน)</span>
        <span className="text-base font-bold text-weeeu-primary">{estimate.toLocaleString()} พอยต์ทอง</span>
      </div>
      <p className="text-[11px] text-gray-400 -mt-2">
        จ่ายล่วงหน้า · เข้าคิว Admin อนุมัติก่อนเริ่มแสดง · ไม่อนุมัติ = คืนพอยต์เต็มจำนวน
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={dayCount < 1 || submitting}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
      >
        {submitting ? "กำลังดำเนินการ..." : `ยืนยันลงโฆษณา (${estimate.toLocaleString()} พอยต์ทอง)`}
      </button>
    </div>
  );
}
