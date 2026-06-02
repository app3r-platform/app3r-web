"use client";

/**
 * /repair/[id]/fee-settle — C5/C6/C7/C10: Fee Settle Page
 *
 * ใช้แสดง 9-axis locked settle breakdown ก่อนยืนยันชำระ
 *
 * C5:  ค่าตรวจ (inspection_fee)   — lock ทันทีหลังนัด
 * C6:  ค่าแรง (labor_fee)         — lock หลังช่างยืนยันเสร็จ
 * C7:  ค่าแรงยุติ (labor_cancel)  — เมื่อลูกค้ายุติงานกลางคัน
 * C10: ค่าอะไหล่ (parts_fee)     — lock หลังช่างแจ้งอะไหล่ที่ใช้จริง
 *
 * 9-axis settle axes:
 *  เงื่อนไข 1: เงินค้ำประกัน (หักจาก total / คืน / ยึด)
 *  เงื่อนไข 2: ค่าตรวจ
 *  เงื่อนไข 3: ค่าเดินทาง
 *  เงื่อนไข 4: ค่าแรงยุติ (เฉพาะ C7)
 *  เงื่อนไข 5: ค่าอะไหล่ (ตามจริง ± markup)
 *  เงื่อนไข 6: รับประกัน (ไม่มี fee แต่แสดงเพื่อยืนยัน)
 *  เงื่อนไข 7: ค่าปรับ no-show / ฝาก (ถ้ามี)
 *  เงื่อนไข 8: งานบานปลาย (adjust ถ้า scope เกิน threshold)
 *  เงื่อนไข 9: ความรับผิด (cap ถ้า damage เกิด)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────
type SettleMode = "normal" | "abort_c7" | "scrap";

type AxisItem = {
  axis: number;          // 1–9
  label: string;
  amount: number;        // + = ลูกค้าจ่าย, - = ลูกค้าได้รับคืน
  note: string | null;
  locked: boolean;       // locked = ตกลงแล้ว, false = ประมาณการ
};

type FeeSettleData = {
  job_id: string;
  appliance_name: string;
  weeer_name: string;
  settle_mode: SettleMode;
  axes: AxisItem[];
  subtotal: number;      // รวมค่าบริการทั้งหมด
  total_due: number;     // ยอดสุทธิที่ต้องชำระ (พอยต์ทอง) — ตัดมัดจำออก (A5)
  customer_point_balance: number;
  can_confirm: boolean;  // false = ยอดไม่พอ / ยังไม่ lock ครบ
  status: "pending_confirm" | "confirmed" | "cancelled";
  confirmed_at: string | null;
};

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_FEE_SETTLE: FeeSettleData = {
  job_id: "mock-job-001",
  appliance_name: "แอร์ Daikin 12000 BTU",
  weeer_name: "ร้านซ่อมแอร์สมศักดิ์",
  settle_mode: "normal",
  axes: [
    { axis: 2, label: "ค่าตรวจสอบ",  amount: 150,  note: null,                          locked: true  },
    { axis: 3, label: "ค่าแรงซ่อม",  amount: 800,  note: "ซ่อมคอมเพรสเซอร์ + ล้างแผง", locked: true  },
    { axis: 5, label: "ค่าอะไหล่",   amount: 400,  note: "น้ำยาแอร์ R32 + ฟิลเตอร์",   locked: true  },
    { axis: 6, label: "รับประกัน",   amount: 0,    note: "รับประกัน 30 วัน",             locked: true  },
  ],
  subtotal: 1350,
  total_due: 1350,
  customer_point_balance: 1500,
  can_confirm: true,
  status: "pending_confirm",
  confirmed_at: null,
};

const SETTLE_MODE_LABEL: Record<SettleMode, { label: string; color: string; icon: string }> = {
  normal:   { label: "ชำระค่าซ่อมปกติ",     color: "bg-weeeu-surface border-weeeu-primary", icon: "🔧" },
  abort_c7: { label: "ยุติงาน (C7)",         color: "bg-orange-50 border-orange-300",        icon: "⚠️" },
  scrap:    { label: "ทิ้งเครื่อง (Scrap)",  color: "bg-gray-50 border-gray-300",            icon: "🗑️" },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function amountClass(amount: number): string {
  if (amount > 0) return "text-gray-900 font-semibold";
  if (amount < 0) return "text-green-600 font-semibold";
  return "text-gray-400";
}

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  const abs = Math.abs(amount).toLocaleString();
  return amount < 0 ? `+${abs} คืน` : `${abs}`;
}

// ── Axis row ──────────────────────────────────────────────────────────────────
function AxisRow({ ax }: { ax: AxisItem }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-3 border-b border-gray-50 last:border-0 ${!ax.locked ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-weeeu-dark bg-weeeu-surface px-1.5 py-0.5 rounded flex-shrink-0">
            เงื่อนไข {ax.axis}
          </span>
          <p className="text-sm text-gray-700 font-medium">{ax.label}</p>
          {!ax.locked && (
            <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">ประมาณการ</span>
          )}
        </div>
        {ax.note && (
          <p className="text-xs text-gray-400 mt-0.5 ml-8">{ax.note}</p>
        )}
      </div>
      <p className={`text-sm flex-shrink-0 ${amountClass(ax.amount)}`}>
        {formatAmount(ax.amount)} พอยต์ทอง
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeeSettlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<FeeSettleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}/fee-settle`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => {
        setData(prev => prev ?? MOCK_FEE_SETTLE);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmErr(null);
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/fee-settle/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/repair/${id}/review`);
    } catch {
      setConfirmErr("เกิดข้อผิดพลาดในการยืนยัน กรุณาลองใหม่");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ยืนยันการชำระ</h1>
          {data && <p className="text-sm text-gray-400">{data.appliance_name} · {data.weeer_name}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Mode banner */}
          {(() => {
            const m = SETTLE_MODE_LABEL[data.settle_mode];
            return (
              <div className={`rounded-2xl border px-5 py-3.5 flex items-center gap-3 ${m.color}`}>
                <span className="text-2xl">{m.icon}</span>
                <p className="text-sm font-semibold text-gray-800">{m.label}</p>
              </div>
            );
          })()}

          {/* Already confirmed */}
          {data.status === "confirmed" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-green-800">✅ ยืนยันการชำระแล้ว</p>
              <p className="text-xs text-gray-500">{formatDate(data.confirmed_at)}</p>
            </div>
          )}

          {/* 9-axis breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              รายละเอียด 9 เงื่อนไข
            </p>
            <p className="text-xs text-gray-400 mb-4">
              ✓ = ล็อกแล้ว · ประมาณการ = ยังรอยืนยัน
            </p>
            {data.axes.map(ax => (
              <AxisRow key={ax.axis} ax={ax} />
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปยอด (พอยต์ทอง / Gold Point)</p>

            <div className="flex justify-between text-sm">
              <p className="text-gray-500">รวมค่าบริการ</p>
              <p className="text-gray-700 font-medium">{data.subtotal.toLocaleString()} พอยต์ทอง</p>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <p className="text-base font-bold text-gray-900">ยอดสุทธิ</p>
              <p className={`text-xl font-bold ${data.total_due > 0 ? "text-weeeu-primary" : "text-green-600"}`}>
                {data.total_due > 0
                  ? `${data.total_due.toLocaleString()} พอยต์ทอง`
                  : `คืน ${Math.abs(data.total_due).toLocaleString()} พอยต์ทอง`}
              </p>
            </div>

            {/* Point balance */}
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between text-xs">
              <p className="text-gray-500">พอยต์ทอง คงเหลือของคุณ</p>
              <p className={`font-semibold ${data.customer_point_balance >= data.total_due ? "text-gray-700" : "text-red-500"}`}>
                {data.customer_point_balance.toLocaleString()} พอยต์ทอง
                {data.customer_point_balance < data.total_due && " (ไม่เพียงพอ)"}
              </p>
            </div>
          </div>

          {/* Unlock axes notice */}
          {data.axes.some(a => !a.locked) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700">⏳ ยังมี {data.axes.filter(a => !a.locked).length} เงื่อนไขที่ยังไม่ล็อก</p>
              <p className="text-xs text-gray-500 mt-1">รอช่างยืนยันรายละเอียดก่อนยืนยันการชำระ</p>
            </div>
          )}

          {confirmErr && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{confirmErr}</p>
            </div>
          )}

          {/* Confirm button */}
          {data.status === "pending_confirm" && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={!data.can_confirm || confirming}
                onClick={handleConfirm}
                className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-gray-300 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {confirming
                  ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</>
                  : `ยืนยันชำระ ${data.total_due > 0 ? `${data.total_due.toLocaleString()} พอยต์ทอง` : ""}`}
              </button>
              {!data.can_confirm && (
                <p className="text-xs text-center text-gray-400">
                  {data.customer_point_balance < data.total_due
                    ? "พอยต์ทองไม่เพียงพอ — กรุณาเติมพอยต์ทองก่อน"
                    : "ยังมีเงื่อนไขที่รอยืนยัน — รอช่างล็อกก่อน"}
                </p>
              )}
              <Link
                href={`/repair/${id}`}
                className="block text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
              >
                ย้อนกลับ
              </Link>
            </div>
          )}

          {/* Already confirmed actions */}
          {data.status === "confirmed" && (
            <Link
              href={`/repair/${id}/review`}
              className="block w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
            >
              ไปตรวจรับงาน →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
