"use client";
// ─── พอยต์ของฉัน (/wallet) — T-14 · WeeeT (ช่าง) · DARK theme · mockup-only
// Pattern จาก apps/weeeu/app/(app)/wallet/page.tsx แต่:
//  - DARK theme (#1696F9 weeet-primary)
//  - D91: ช่าง (WeeeT) ใช้พอยต์ทองสำหรับค่าธรรมเนียม/บริการ — ไม่มี flow ถอน (เฉพาะ WeeeU/WeeeR ถอนได้)
//  - Silver = read-only (ไม่มีเติม)

import { useState } from "react";
import { useRouter } from "next/navigation";

type WalletTab = "all" | "gold" | "silver";

// Mock data (Mockup — ไม่ fetch API จริง) · integer ทั้งหมด (D75 Math.round-friendly)
const MOCK_GOLD_BALANCE = 420;
const MOCK_SILVER_BALANCE = 1850;

const MOCK_TRANSACTIONS = [
  { type: "credit", icon: "🥇", label: "รับพอยต์ทองจากงานซ่อมเสร็จ TX-204", amount: "+250", date: "3 มิ.ย. 69", wallet: "gold" },
  { type: "debit",  icon: "🧾", label: "ค่าธรรมเนียมบริการระบบ",            amount: "-30",  date: "2 มิ.ย. 69", wallet: "gold" },
  { type: "credit", icon: "💎", label: "โบนัสพอยต์เงิน — ครบ 10 งาน",       amount: "+80",  date: "1 มิ.ย. 69", wallet: "silver" },
  { type: "credit", icon: "🥇", label: "เติมพอยต์ทอง (Admin อนุมัติ)",       amount: "+500", date: "30 พ.ค. 69", wallet: "gold" },
  { type: "debit",  icon: "🧾", label: "ค่าธรรมเนียมรับงานด่วน",            amount: "-50",  date: "28 พ.ค. 69", wallet: "gold" },
  { type: "credit", icon: "💎", label: "พอยต์เงินสมัครสมาชิกช่าง",          amount: "+100", date: "20 พ.ค. 69", wallet: "silver" },
];

// Mock top-up amounts for Gold
const GOLD_TOPUP_PRESETS = [100, 500, 1000, 2000];

export default function WalletPage() {
  const router = useRouter();
  const [tab, setTab] = useState<WalletTab>("all");
  const [goldBalance, setGoldBalance] = useState(MOCK_GOLD_BALANCE);
  const [silverBalance] = useState(MOCK_SILVER_BALANCE);

  // Mock top-up Gold state
  const [goldTopUpAmount, setGoldTopUpAmount] = useState("");
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  const handleGoldTopUp = () => {
    const amount = Math.round(Number(goldTopUpAmount));
    if (!amount || amount <= 0) return;
    setTopUpSubmitting(true);
    setTimeout(() => {
      setGoldBalance((prev) => prev + amount);
      setTopUpSuccess(true);
      setGoldTopUpAmount("");
      setTopUpSubmitting(false);
    }, 800); // Mock delay
  };

  const filteredTx = MOCK_TRANSACTIONS.filter((t) =>
    tab === "all" ? true : t.wallet === tab,
  );

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
        <h1 className="font-bold text-white">พอยต์ของฉัน</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Point Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gold Card */}
          <div className="wallet-gold rounded-3xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium opacity-80">พอยต์ทอง (Gold Point)</p>
                <p className="text-4xl font-bold mt-1">{goldBalance.toLocaleString()}</p>
                <p className="text-sm opacity-70 mt-1">≈ ฿{goldBalance.toLocaleString()}</p>
              </div>
              <div className="text-4xl opacity-80">🥇</div>
            </div>
            <div className="bg-white/20 rounded-xl p-2 mb-3">
              <p className="text-xs opacity-90">🔒 1 พอยต์ทอง = 1 บาท · ไม่หมดอายุ</p>
            </div>
            {/* D91: ช่างไม่มี flow ถอน — แสดง info note แทน */}
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <p className="text-xs opacity-90">
                ช่างใช้พอยต์ทองสำหรับค่าธรรมเนียม/บริการในระบบ
              </p>
            </div>
            <a
              href="#gold-topup"
              className="mt-3 block text-center bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              + เติมพอยต์ทอง
            </a>
          </div>

          {/* Silver Card — read-only */}
          <div className="wallet-silver rounded-3xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium opacity-80">พอยต์เงิน (Silver Point)</p>
                <p className="text-4xl font-bold mt-1">{silverBalance.toLocaleString()}</p>
                <p className="text-sm opacity-70 mt-1">ใช้ชำระค่าบริการในระบบ</p>
              </div>
              <div className="text-4xl opacity-80">💎</div>
            </div>
            <div className="bg-white/20 rounded-xl p-2 mb-3">
              <p className="text-xs opacity-90">❌ พอยต์เงินซื้อขายไม่ได้ · ถอนไม่ได้</p>
              <p className="text-xs opacity-70">หมดอายุ 90 วัน</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <p className="text-xs opacity-90">💎 รับจาก: สมัครสมาชิก · โบนัสทำงาน · Admin แจก</p>
              <p className="text-xs opacity-70 mt-0.5">เติมเองไม่ได้ — ระบบมอบให้อัตโนมัติ</p>
            </div>
          </div>
        </div>

        {/* Gold Top-up Section */}
        <div
          id="gold-topup"
          className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🥇</span>
            <h2 className="text-base font-semibold text-white">เติมพอยต์ทอง</h2>
          </div>

          {topUpSuccess && (
            <div className="bg-weeet-primary/15 border border-weeet-primary/40 rounded-xl p-3 flex items-center gap-2">
              <span className="text-weeet-primary">✅</span>
              <p className="text-xs text-weeet-primary font-medium">
                ส่งคำขอเติมพอยต์ทองแล้ว — รอ Admin อนุมัติ (1-3 วันทำการ)
              </p>
            </div>
          )}

          <div className="bg-gray-800 rounded-xl p-3 space-y-1">
            <p className="text-xs text-gray-300 font-medium">📋 ขั้นตอนเติมพอยต์ทอง</p>
            <p className="text-xs text-gray-400">
              1. เลือกจำนวน → 2. โอนเงินเข้าบัญชีแพลตฟอร์ม → 3. ส่งสลิป → 4. Admin อนุมัติ
            </p>
          </div>

          {/* Preset amounts */}
          <div className="grid grid-cols-4 gap-2">
            {GOLD_TOPUP_PRESETS.map((amt) => (
              <button
                key={amt}
                onClick={() => setGoldTopUpAmount(String(amt))}
                className={`border text-sm font-medium py-2 rounded-xl transition-colors ${
                  goldTopUpAmount === String(amt)
                    ? "bg-weeet-primary border-weeet-primary text-white"
                    : "border-gray-700 text-gray-300 hover:border-weeet-primary"
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={goldTopUpAmount}
              onChange={(e) => setGoldTopUpAmount(e.target.value)}
              placeholder="จำนวนพอยต์ทองที่ต้องการ"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary"
            />
            <button
              onClick={handleGoldTopUp}
              disabled={topUpSubmitting || !goldTopUpAmount}
              className="bg-weeet-primary hover:bg-weeet-dark disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              {topUpSubmitting ? "⟳" : "เติม"}
            </button>
          </div>
          <p className="text-xs text-gray-500">* Mockup — กดเติมเพื่อดู flow (ไม่โอนเงินจริง)</p>
        </div>

        {/* Transaction history */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-white">ประวัติการทำรายการ</h2>
            <div className="flex gap-1.5">
              {(["all", "gold", "silver"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    tab === t
                      ? "bg-weeet-primary text-white"
                      : "text-gray-400 hover:bg-gray-800"
                  }`}
                >
                  {t === "all" ? "ทั้งหมด" : t === "gold" ? "🥇 ทอง" : "💎 เงิน"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {filteredTx.map((tx, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2.5 border-b border-gray-800 last:border-0"
              >
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{tx.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500">{tx.date}</p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md ${
                        tx.wallet === "gold"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {tx.wallet === "gold" ? "🥇 พอยต์ทอง" : "💎 พอยต์เงิน"}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold flex-shrink-0 ${
                    tx.type === "credit" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {tx.amount}
                </span>
              </div>
            ))}

            {filteredTx.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-400 text-sm">ไม่มีรายการในหมวดนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
