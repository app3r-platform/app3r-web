"use client";

import { useState } from "react";
import Link from "next/link";

type WalletTab = "all" | "gold" | "silver";

// Mock data (Mockup — ไม่ fetch API จริง)
const MOCK_GOLD_BALANCE = 350;
const MOCK_SILVER_BALANCE = 1250;

const MOCK_TRANSACTIONS = [
  { type: "credit",  icon: "🥇", label: "เติม Gold Point (admin อนุมัติ)", amount: "+500",   date: "23 พ.ค. 69", wallet: "gold"   },
  { type: "debit",   icon: "🔒", label: "Lock Gold — Escrow ธุรกรรม TX-001", amount: "-350", date: "22 พ.ค. 69", wallet: "gold"   },
  { type: "credit",  icon: "💎", label: "เติม Silver Point",                 amount: "+500",   date: "2 พ.ค. 69",  wallet: "silver" },
  { type: "debit",   icon: "🔧", label: "ชำระค่าบำรุงรักษา",                 amount: "-200",   date: "1 พ.ค. 69",  wallet: "silver" },
  { type: "credit",  icon: "🥇", label: "รับ Gold จาก Escrow (ธุรกรรมจบ)", amount: "+1,200", date: "30 เม.ย. 69", wallet: "gold"   },
  { type: "debit",   icon: "💳", label: "ถอน Gold → บัญชีธนาคาร",           amount: "-300",   date: "28 เม.ย. 69", wallet: "gold"   },
  { type: "credit",  icon: "💎", label: "Signup Bonus Silver",               amount: "+100",   date: "25 เม.ย. 69", wallet: "silver" },
];

// Mock top-up amounts for Gold (R4 scenario)
const GOLD_TOPUP_PRESETS = [100, 500, 1000, 2000];

export default function WalletPage() {
  const [tab, setTab] = useState<WalletTab>("all");
  const [goldBalance, setGoldBalance] = useState(MOCK_GOLD_BALANCE);
  const [silverBalance] = useState(MOCK_SILVER_BALANCE);

  // Mock top-up Gold state (R4 scenario)
  const [goldTopUpAmount, setGoldTopUpAmount] = useState("");
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  const handleGoldTopUp = () => {
    const amount = Number(goldTopUpAmount);
    if (!amount || amount <= 0) return;
    setTopUpSubmitting(true);
    setTimeout(() => {
      setGoldBalance(prev => prev + amount);
      setTopUpSuccess(true);
      setGoldTopUpAmount("");
      setTopUpSubmitting(false);
    }, 1000); // Mock delay
  };

  const filteredTx = MOCK_TRANSACTIONS.filter(t =>
    tab === "all" ? true : t.wallet === tab
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">กระเป๋าตังค์</h1>

      {/* R4 notice — ถ้ามี offer awaiting_payment */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl">💰</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-800">มีธุรกรรมรอเติม Gold (R4)</p>
          <p className="text-xs text-orange-700 mt-0.5">ข้อเสนอที่ถูกเลือก — Gold ขาด 1,200 — เติมก่อนหมดเวลา</p>
          <Link href="/offers" className="inline-block text-xs text-orange-800 font-semibold underline mt-1">ดูรายละเอียด →</Link>
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gold Card — ซื้อขายได้ (Escrow) */}
        <div className="wallet-gold rounded-3xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium opacity-80">Gold Point</p>
              <p className="text-4xl font-bold mt-1">{goldBalance.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-1">≈ ฿{goldBalance.toLocaleString()}</p>
            </div>
            <div className="text-4xl opacity-80">🥇</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2 mb-4">
            <p className="text-xs opacity-90">🔒 Gold = ซื้อขายได้ · เข้า Escrow · ถอนได้</p>
            <p className="text-xs opacity-70">1 Gold = 1 บาท · ไม่หมดอายุ</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="#gold-topup"
              className="flex-1 text-center bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
            >
              + เติม Gold
            </Link>
            {/* R1: WeeeU ถอน Gold ได้ — ลิงก์ไปหน้า withdraw */}
            <Link
              href="/wallet/withdraw"
              className="flex-1 text-center bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
            >
              ↑ แจ้งถอน
            </Link>
          </div>
        </div>

        {/* Silver Card */}
        <div className="wallet-silver rounded-3xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium opacity-80">Silver Point</p>
              <p className="text-4xl font-bold mt-1">{silverBalance.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-1">ใช้ค่าประกาศ/offer ได้</p>
            </div>
            <div className="text-4xl opacity-80">💎</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2 mb-4">
            <p className="text-xs opacity-90">❌ Silver ซื้อขายไม่ได้ · ถอนไม่ได้</p>
            <p className="text-xs opacity-70">ใช้ได้แค่: ค่าประกาศ + ค่า offer · หมดอายุ 90 วัน</p>
          </div>
          {/* R1: Silver เติมเองไม่ได้ · ถอนไม่ได้ */}
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-xs opacity-90">💎 Silver รับจาก: Signup · Engagement · Admin แจก</p>
            <p className="text-xs opacity-70 mt-0.5">❌ ถอนเป็นเงินไม่ได้ · ใช้ชำระค่าบริการเท่านั้น</p>
          </div>
        </div>
      </div>

      {/* Gold Top-up Section — R4 scenario */}
      <div id="gold-topup" className="bg-white rounded-2xl border border-yellow-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥇</span>
          <h2 className="text-base font-semibold text-gray-800">เติม Gold Point</h2>
        </div>

        {topUpSuccess && (
          <div className="bg-weeeu-surface border border-weeeu-primary/30 rounded-xl p-3 flex items-center gap-2">
            <span className="text-weeeu-primary">✅</span>
            <p className="text-xs text-weeeu-text font-medium">ส่งคำขอเติม Gold แล้ว — รอ Admin อนุมัติ (1-3 วันทำการ)</p>
          </div>
        )}

        <div className="bg-yellow-50 rounded-xl p-3 space-y-1">
          <p className="text-xs text-yellow-800 font-medium">📋 ขั้นตอนเติม Gold</p>
          <p className="text-xs text-yellow-700">1. เลือกจำนวน → 2. โอนเงินเข้าบัญชีแพลตฟอร์ม → 3. ส่งสลิป → 4. Admin อนุมัติ (1-3 วัน)</p>
        </div>

        {/* Preset amounts */}
        <div className="grid grid-cols-4 gap-2">
          {GOLD_TOPUP_PRESETS.map(amt => (
            <button
              key={amt}
              onClick={() => setGoldTopUpAmount(String(amt))}
              className={`border text-sm font-medium py-2 rounded-xl transition-colors ${
                goldTopUpAmount === String(amt)
                  ? "bg-yellow-400 border-yellow-400 text-white"
                  : "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              }`}
            >
              {amt.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={goldTopUpAmount}
            onChange={e => setGoldTopUpAmount(e.target.value)}
            placeholder="จำนวน Gold ที่ต้องการ"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
          <button
            onClick={handleGoldTopUp}
            disabled={topUpSubmitting || !goldTopUpAmount}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {topUpSubmitting ? "⟳" : "เติม"}
          </button>
        </div>
        <p className="text-xs text-gray-400">* Mockup — กดเติมเพื่อดู flow (ไม่โอนเงินจริง)</p>
      </div>

      {/* R1: Silver info section — เติมเองไม่ได้ ถอนไม่ได้ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-3">💎 Silver Point — รับอย่างไร?</h2>
        <div className="space-y-2">
          {[
            { icon: "👤", label: "Signup Bonus", desc: "รับเมื่อสมัครครั้งแรก" },
            { icon: "🔧", label: "Engagement", desc: "รับเมื่อทำธุรกรรม (ซ่อม/ขาย/บำรุง)" },
            { icon: "🎁", label: "Admin แจก", desc: "โปรโมชั่นพิเศษจากระบบ" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-red-50 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-600 font-medium">❌ Silver ถอนเป็นเงินไม่ได้ · ใช้ได้แค่ชำระค่าบริการ · หมดอายุ 90 วัน</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-800">ประวัติการทำรายการ</h2>
          <div className="flex gap-1.5">
            {(["all", "gold", "silver"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  tab === t
                    ? "bg-weeeu-primary text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t === "all" ? "ทั้งหมด" : t === "gold" ? "🥇 Gold" : "💎 Silver"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTx.map((tx, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{tx.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">{tx.date}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                    tx.wallet === "gold"
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {tx.wallet === "gold" ? "🥇 Gold" : "💎 Silver"}
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
