import type { Metadata } from "next";

export const metadata: Metadata = { title: "กระเป๋าตังค์" };

const transactions = [
  { type: "credit", icon: "💰", label: "เติม Silver Point", amount: "+500", date: "2 พ.ค. 69", wallet: "silver" },
  { type: "debit", icon: "🔧", label: "ชำระค่าซ่อมแอร์", amount: "-200", date: "1 พ.ค. 69", wallet: "silver" },
  { type: "credit", icon: "🥇", label: "รับ Gold Reward", amount: "+100", date: "30 เม.ย. 69", wallet: "gold" },
  { type: "debit", icon: "💳", label: "ถอน Silver → บัญชีธนาคาร", amount: "-300", date: "28 เม.ย. 69", wallet: "silver" },
  { type: "credit", icon: "💰", label: "เติม Silver Point", amount: "+1,000", date: "25 เม.ย. 69", wallet: "silver" },
];

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">กระเป๋าตังค์</h1>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Silver Card */}
        <div className="wallet-silver rounded-3xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium opacity-80">Silver Point</p>
              <p className="text-4xl font-bold mt-1">1,250</p>
              <p className="text-sm opacity-70 mt-1">≈ ฿125.00</p>
            </div>
            <div className="text-4xl opacity-80">💎</div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
              + เติม
            </button>
            <button className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
              ↑ ถอน
            </button>
          </div>
        </div>

        {/* Gold Card */}
        <div className="wallet-gold rounded-3xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium opacity-80">Gold Point</p>
              <p className="text-4xl font-bold mt-1">350</p>
              <p className="text-sm opacity-70 mt-1">≈ ฿35.00</p>
            </div>
            <div className="text-4xl opacity-80">🥇</div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
              + เติม
            </button>
            <button className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all cursor-not-allowed opacity-50">
              ↑ ถอน
            </button>
          </div>
          {/* Note: Gold ถอนไม่ได้ */}
          <p className="text-xs opacity-60 mt-2 text-center">* Gold Point ใช้ได้ในแพลตฟอร์มเท่านั้น</p>
        </div>
      </div>

      {/* Top-up / Withdraw section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">เติม / ถอน Silver Point</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Top up */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600">เติม Silver Point</h3>
            <div className="grid grid-cols-2 gap-2">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  className="border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium py-2 rounded-xl transition-colors"
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="จำนวนที่ต้องการเติม"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                เติม
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600">ถอน Silver Point</h3>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs text-gray-500">บัญชีที่ผูกไว้</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">🏦</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">กสิกรไทย</p>
                  <p className="text-xs text-gray-400">XXX-X-X5678-X</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="จำนวนที่ต้องการถอน"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                ถอน
              </button>
            </div>
            <p className="text-xs text-gray-400">* ถอนขั้นต่ำ 100 point | ใช้เวลา 1-3 วันทำการ</p>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-800">ประวัติการทำรายการ</h2>
          <div className="flex gap-2">
            {["ทั้งหมด", "Silver", "Gold"].map((tab) => (
              <button
                key={tab}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  tab === "ทั้งหมด"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{tx.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">{tx.date}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                    tx.wallet === "silver"
                      ? "bg-gray-100 text-gray-500"
                      : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {tx.wallet === "silver" ? "💎 Silver" : "🥇 Gold"}
                  </span>
                </div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${
                tx.type === "credit" ? "text-green-600" : "text-red-500"
              }`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
