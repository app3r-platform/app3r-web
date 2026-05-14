// ── Wallet — WeeeR (D-2 Earner Payment UI + Manual Bank Transfer D-3) ──────────
// WeeeR = ผู้รับเงิน (earner) — รับเงินจาก WeeeU escrow release
// D-3: เพิ่ม Manual Bank Transfer — deposit/withdraw/history pages
// Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "กระเป๋าเงิน — WeeeR" };

const TX = [
  { type: "credit", currency: "silver", amount: 500,  desc: "ค่าบริการซ่อมแอร์ (JOB-0421) — WeeeU escrow release", date: "2026-05-02", source: "escrow" },
  { type: "credit", currency: "silver", amount: 1455, desc: "ค่าอะไหล่ B2B Parts — ORDER-0089 (net หลังหัก 3%)",       date: "2026-05-01", source: "parts" },
  { type: "debit",  currency: "silver", amount: 50,   desc: "ค่าลงประกาศ (LIST-092)",                                  date: "2026-05-01", source: "fee" },
  { type: "credit", currency: "gold",   amount: 200,  desc: "โบนัสรีวิว 5 ดาว",                                       date: "2026-04-30", source: "bonus" },
  { type: "debit",  currency: "gold",   amount: 5000, desc: "ค่าสมัคร WeeeT Mode 2",                                   date: "2026-04-28", source: "fee" },
];

const sourceIcon: Record<string, string> = {
  escrow: "🔓",
  parts:  "📦",
  fee:    "🧾",
  bonus:  "⭐",
};

export default function WalletPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">กระเป๋าเงิน</h1>

      {/* ยอดคงเหลือ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-5 border border-gray-200">
          <div className="text-2xl mb-1">🪙</div>
          <div className="text-3xl font-bold text-gray-900">6,205</div>
          <div className="text-sm text-gray-600 mt-1">Silver Points</div>
          <div className="text-xs text-gray-500 mt-2">รวมยอดรับจากงานบริการ + B2B Parts</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-5 border border-yellow-200">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-3xl font-bold text-gray-900">1,800</div>
          <div className="text-sm text-yellow-800 mt-1">Gold Points</div>
          <div className="text-xs text-yellow-700 mt-2">ใช้สมัคร WeeeT Mode 2 (5,000 Gold/ปี)</div>
        </div>
      </div>

      {/* Payment Earner Info (D-2) */}
      <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">💰</span>
          <div>
            <div className="text-sm font-semibold text-green-800 mb-1">วิธีรับเงิน (WeeeR Earner)</div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• งานบริการ (Repair / Maintain): WeeeU ยืนยัน → escrow release → ได้รับ Silver อัตโนมัติ</li>
              <li>• B2B Parts (D81): ผู้ซื้อกด "รับของ" → escrow release → หักค่าธรรมเนียม 3% → รับ Silver</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick actions — Sub-6: เพิ่ม Settlements (Settlement API) */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/wallet/deposit"
          className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center hover:bg-green-100 transition-colors"
        >
          <div className="text-2xl mb-1">📥</div>
          <div className="text-xs font-semibold text-green-800">เติมแต้ม</div>
          <div className="text-xs text-green-600 mt-0.5">โอนเงิน</div>
        </Link>
        <Link
          href="/wallet/withdraw"
          className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center hover:bg-gray-100 transition-colors"
        >
          <div className="text-2xl mb-1">📤</div>
          <div className="text-xs font-semibold text-gray-800">ถอนแต้ม</div>
          <div className="text-xs text-gray-500 mt-0.5">Settlement</div>
        </Link>
        <Link
          href="/wallet/settlements"
          className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center hover:bg-gray-100 transition-colors"
        >
          <div className="text-2xl mb-1">💸</div>
          <div className="text-xs font-semibold text-gray-800">ประวัติถอน</div>
          <div className="text-xs text-gray-500 mt-0.5">Settlements</div>
        </Link>
      </div>

      {/* ประวัติธุรกรรม */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">ประวัติธุรกรรม</h3>
        <div className="space-y-2">
          {TX.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                {sourceIcon[tx.source] ?? (tx.type === "credit" ? "↓" : "↑")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{tx.desc}</div>
                <div className="text-xs text-gray-400">{tx.date} · {tx.currency === "silver" ? "🪙 Silver" : "⭐ Gold"}</div>
              </div>
              <div className={`text-sm font-bold tabular-nums ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
