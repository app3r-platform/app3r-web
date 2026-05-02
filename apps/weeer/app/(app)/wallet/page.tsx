import type { Metadata } from "next";

export const metadata: Metadata = { title: "กระเป๋าเงิน — WeeeR" };

const TX = [
  { type: "credit", currency: "silver", amount: 500,  desc: "ค่าบริการซ่อมแอร์ (JOB-0421)", date: "2026-05-02" },
  { type: "debit",  currency: "silver", amount: 50,   desc: "ค่าลงประกาศ (LIST-092)",        date: "2026-05-01" },
  { type: "credit", currency: "gold",   amount: 200,  desc: "โบนัสรีวิว 5 ดาว",             date: "2026-04-30" },
  { type: "debit",  currency: "gold",   amount: 5000, desc: "ค่าสมัคร WeeeT Mode 2",        date: "2026-04-28" },
];

export default function WalletPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">กระเป๋าเงิน</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-5 border border-gray-200">
          <div className="text-2xl mb-1">🪙</div>
          <div className="text-3xl font-bold text-gray-900">4,250</div>
          <div className="text-sm text-gray-600 mt-1">Silver Points</div>
          <div className="text-xs text-gray-500 mt-2">ใช้สำหรับค่าประกาศ / ค่าบริการระบบ</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-5 border border-yellow-200">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-3xl font-bold text-gray-900">1,800</div>
          <div className="text-sm text-yellow-800 mt-1">Gold Points</div>
          <div className="text-xs text-yellow-700 mt-2">ใช้สมัคร WeeeT Mode 2 (5,000 Gold/ปี)</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">ประวัติธุรกรรม</h3>
        <div className="space-y-2">
          {TX.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                {tx.type === "credit" ? <span className="text-green-600 font-bold text-sm">↓</span> : <span className="text-red-600 font-bold text-sm">↑</span>}
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
