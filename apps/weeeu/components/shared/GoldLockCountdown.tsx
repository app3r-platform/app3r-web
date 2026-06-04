"use client";

/**
 * GoldLockCountdown — shared [gold-lock] bundle UI (Disposition Matrix · rule-bundle)
 *
 * ใช้ซ้ำทุกจอที่มี "พอยต์ทองที่ล็อก" รอ action ภายในกรอบเวลา (24 ชม.):
 *   countdown "เหลือ X ชม." + แถบ progress + note เตือนทุก 6 ชม. (mock UI · logic BE)
 *
 * เคสที่ใช้: R4 resell awaiting-payment · C8 repair offers · M2 maintain · S5 scrap
 * ⚠️ mockup UI เท่านั้น — auto-cancel / แจ้งเตือนจริงทุก 6 ชม. = เฟส BE
 */

import { useState, useEffect } from "react";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";

// ─── Countdown hook (เหมือน resell/awaiting-payment) ────────────────────────
function useCountdown(deadline: string) {
  const calc = () => Math.max(0, new Date(deadline).getTime() - Date.now());
  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    const iv = setInterval(() => setRemaining(calc), 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);
  return remaining;
}

function formatHm(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} ชม. ${m} นาที`;
  return `${m} นาที`;
}

export function GoldLockCountdown({
  deadline,
  totalHours = 24,
  goldAmount,
  title = "พอยต์ทองที่ล็อก — เหลือเวลา",
  note,
  className = "",
}: {
  deadline: string;
  totalHours?: number;
  goldAmount?: number;
  title?: string;
  /** override ข้อความเตือน 6 ชม. (เช่น scrap ที่ผู้ขายไม่ได้ล็อกพอยต์ทอง) */
  note?: string;
  className?: string;
}) {
  const remaining = useCountdown(deadline);
  const totalMs = totalHours * 60 * 60 * 1000;
  const pct = Math.min(100, (remaining / totalMs) * 100);
  const isLow = remaining > 0 && remaining < 3 * 60 * 60 * 1000; // < 3 ชม.
  const expired = remaining === 0;

  if (expired) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-2xl p-4 space-y-1 ${className}`}>
        <p className="text-sm font-semibold text-gray-700">⌛ หมดเวลาแล้ว</p>
        <p className="text-xs text-gray-500">
          พอยต์ทองที่ล็อก{goldAmount != null ? ` (${goldAmount.toLocaleString()} พอยต์ทอง)` : ""} ถูกปลดและรายการถูกยกเลิกอัตโนมัติ
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 space-y-2.5 border ${
        isLow ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${isLow ? "text-red-800" : "text-yellow-800"}`}>
          🔒 {title}
        </p>
        <p className={`text-base font-mono font-bold tabular-nums ${isLow ? "text-red-700" : "text-yellow-700"}`}>
          {formatHm(remaining)}
        </p>
      </div>

      {goldAmount != null && (
        <p className={`text-xs ${isLow ? "text-red-600" : "text-yellow-700"}`}>
          {goldAmount.toLocaleString()} พอยต์ทอง ถูกล็อกใน ระบบพักเงินกลาง (Escrow) <EscrowInfoIcon className="inline-flex" />
        </p>
      )}

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isLow ? "bg-red-500" : "bg-yellow-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* [gold-lock] เตือนทุก 6 ชม. ภายในกรอบ 24 ชม. (mock UI · logic BE) */}
      <p className="text-[11px] text-gray-500 border-t border-black/5 pt-1.5">
        🔔 {note ?? `ระบบจะแจ้งเตือนทุก 6 ชม. ภายในกรอบ ${totalHours} ชม. — หากเกินกำหนด พอยต์ทองที่ล็อกจะถูกปลดและรายการถูกยกเลิกอัตโนมัติ`}
      </p>
    </div>
  );
}

export default GoldLockCountdown;
