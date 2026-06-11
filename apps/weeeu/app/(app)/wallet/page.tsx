"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpTip } from "@app3r/ui";
import { FileUpload } from "@/components/upload/FileUpload";
import { useAuth } from "@/lib/auth-context";

type WalletTab = "all" | "gold" | "silver";

// Mock data (Mockup — ไม่ fetch API จริง)
const MOCK_GOLD_BALANCE = 350;
const MOCK_SILVER_BALANCE = 1250;

const MOCK_TRANSACTIONS = [
  { type: "credit",  icon: "🥇", label: "เติมพอยต์ทอง (admin อนุมัติ)", amount: "+500",   date: "23 พ.ค. 69", wallet: "gold"   },
  { type: "debit",   icon: "🔒", label: "ล็อกพอยต์ทอง — พักเงินกลาง (Escrow) ธุรกรรม TX-001", amount: "-350", date: "22 พ.ค. 69", wallet: "gold"   },
  { type: "credit",  icon: "💎", label: "เติมพอยต์เงิน",                 amount: "+500",   date: "2 พ.ค. 69",  wallet: "silver" },
  { type: "debit",   icon: "🔧", label: "ชำระค่าบำรุงรักษา",                 amount: "-200",   date: "1 พ.ค. 69",  wallet: "silver" },
  { type: "credit",  icon: "🥇", label: "รับพอยต์ทองจากระบบพักเงินกลาง (ธุรกรรมจบ)", amount: "+1,200", date: "30 เม.ย. 69", wallet: "gold"   },
  { type: "debit",   icon: "💳", label: "ถอนพอยต์ทอง → บัญชีธนาคาร",           amount: "-300",   date: "28 เม.ย. 69", wallet: "gold"   },
  { type: "credit",  icon: "💎", label: "โบนัสสมัคร พอยต์เงิน",               amount: "+100",   date: "25 เม.ย. 69", wallet: "silver" },
];

// Mock top-up amounts for Gold (U-57#3 — sync wallet/deposit:161 = [3000,4000,5000])
const GOLD_TOPUP_PRESETS = [3000, 4000, 5000];
// Guardrail ขั้นต่ำ/ขั้นสูง (mock · admin config จริง = BE)
const MIN_TOPUP = 100;
const MAX_TOPUP = 100000;
// Bank info แพลตฟอร์ม (mock — sync wallet/deposit MOCK_DEPOSIT_INFO · source จริง = BE)
const PLATFORM_BANK_INFO = {
  promptPayId: "0XX-XXX-XXXX (Admin)",
  accountName: "บริษัท App3R จำกัด",
  accountNumber: "XXX-X-XXXXX-X",
  bankName: "ธนาคารกสิกรไทย (KBank)",
};

export default function WalletPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<WalletTab>("all");
  const goldBalance = user?.goldBalance ?? MOCK_GOLD_BALANCE;
  const silverBalance = user?.silverBalance ?? MOCK_SILVER_BALANCE;

  // Mock top-up Gold state (R4 scenario)
  const [goldTopUpAmount, setGoldTopUpAmount] = useState("");
  const [transferAt, setTransferAt] = useState("");   // U-57#4 วันเวลาที่โอน
  const [slipFileId, setSlipFileId] = useState("");    // U-57#4 สลิป
  const [topUpError, setTopUpError] = useState("");
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [silverInfoOpen, setSilverInfoOpen] = useState(false); // U-57#5b ย่อเป็น icon
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handleGoldTopUp = () => {
    const amount = Number(goldTopUpAmount);
    setTopUpError("");
    // U-57#3 guardrail validate amount min/max
    if (!amount || amount < MIN_TOPUP) { setTopUpError(`จำนวนขั้นต่ำ ${MIN_TOPUP.toLocaleString()} พอยต์ทอง`); return; }
    if (amount > MAX_TOPUP) { setTopUpError(`จำนวนสูงสุด ${MAX_TOPUP.toLocaleString()} พอยต์ทองต่อครั้ง`); return; }
    // U-57#4 ต้องมีวันเวลาโอน + สลิป
    if (!transferAt) { setTopUpError("กรุณาระบุวันเวลาที่โอนเงิน — หากไม่มีถือว่ายังโอนไม่สำเร็จ"); return; }
    if (!slipFileId) { setTopUpError("กรุณาแนบสลิปการโอนเงินก่อน"); return; }
    setTopUpSubmitting(true);
    setTimeout(() => {
      // mock — ยอดจริงเครดิตเมื่อ Admin อนุมัติ (BE) · ที่นี่แสดง success ส่งคำขอ
      setTopUpSuccess(true);
      setGoldTopUpAmount(""); setTransferAt(""); setSlipFileId("");
      setTopUpSubmitting(false);
    }, 1000); // Mock delay
  };

  const filteredTx = MOCK_TRANSACTIONS.filter(t =>
    tab === "all" ? true : t.wallet === tab
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">พอยต์ของฉัน</h1>

      {/* R4 notice — ถ้ามี offer awaiting_payment */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl">💰</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-800">มีธุรกรรมรอเติมพอยต์ทอง (Gold Point) (R4)</p>
          <p className="text-xs text-orange-700 mt-0.5">ข้อเสนอที่ถูกเลือก — พอยต์ทองขาด 1,200 — เติมก่อนหมดเวลา</p>
          <Link href="/offers" className="inline-block text-xs text-orange-800 font-semibold underline mt-1">ดูรายละเอียด →</Link>
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gold Card — ซื้อขายได้ (Escrow) */}
        <div className="wallet-gold rounded-3xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium opacity-80">พอยต์ทอง (Gold Point)</p>
              <p className="text-4xl font-bold mt-1">{goldBalance.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-1">≈ ฿{goldBalance.toLocaleString()}</p>
            </div>
            <div className="text-4xl opacity-80">🥇</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2 mb-4">
            <p className="text-xs opacity-90">🔒 พอยต์ทอง = ซื้อขายได้ · เข้าระบบพักเงินกลาง (Escrow) <HelpTip content="เงินของคุณจะถูกเก็บไว้ในระบบกลางอย่างปลอดภัย จนกว่างานเสร็จและคุณยืนยัน จึงโอนให้ปลายทาง" /> · ถอนได้</p>
            <p className="text-xs opacity-70">1 พอยต์ทอง = 1 บาท · ไม่หมดอายุ</p>
          </div>
          <div className="flex gap-2">
            {/* RC-E: canonical deposit flow → /wallet/deposit */}
            <Link
              href="/wallet/deposit"
              className="flex-1 text-center bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
            >
              + เติมพอยต์ทอง
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
              <p className="text-sm font-medium opacity-80">พอยต์เงิน (Silver Point)</p>
              <p className="text-4xl font-bold mt-1">{silverBalance.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-1">ใช้ค่าประกาศ/offer ได้</p>
            </div>
            <div className="text-4xl opacity-80">💎</div>
          </div>
          <div className="bg-white/20 rounded-xl p-2 mb-4">
            <p className="text-xs opacity-90">❌ พอยต์เงินซื้อขายไม่ได้ · ถอนไม่ได้</p>
            <p className="text-xs opacity-70">ใช้ได้แค่: ค่าประกาศ + ค่าข้อเสนอ · หมดอายุ 90 วัน</p>
          </div>
          {/* R1: Silver เติมเองไม่ได้ · ถอนไม่ได้ */}
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-xs opacity-90">💎 พอยต์เงินรับจาก: Signup · Engagement · Admin แจก</p>
            <p className="text-xs opacity-70 mt-0.5">❌ ถอนเป็นเงินไม่ได้ · ใช้ชำระค่าบริการเท่านั้น</p>
          </div>
        </div>
      </div>

      {/* Gold Top-up Section — R4 scenario */}
      <div id="gold-topup" className="bg-white rounded-2xl border border-yellow-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥇</span>
          <h2 className="text-base font-semibold text-gray-800">เติมพอยต์ทอง</h2>
        </div>

        {topUpSuccess && (
          <div className="bg-weeeu-surface border border-weeeu-primary/30 rounded-xl p-3 flex items-center gap-2">
            <span className="text-weeeu-primary">✅</span>
            <p className="text-xs text-weeeu-text font-medium">ส่งคำขอเติมพอยต์ทองแล้ว — รอ Admin อนุมัติ (1-3 วันทำการ)</p>
          </div>
        )}

        <div className="bg-yellow-50 rounded-xl p-3 space-y-1">
          <p className="text-xs text-yellow-800 font-medium">📋 ขั้นตอนเติมพอยต์ทอง</p>
          <p className="text-xs text-yellow-700">1. เลือกจำนวน → 2. โอนเงินเข้าบัญชีแพลตฟอร์ม → 3. แนบสลิป + ระบุวันเวลาโอน → 4. Admin อนุมัติ (1-3 วัน)</p>
        </div>

        {/* U-57#4 — บัญชีแพลตฟอร์ม + QR สำหรับโอนเงิน */}
        <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-xl p-4 space-y-3">
          <div className="text-center">
            <p className="text-xs text-weeeu-primary mb-1">PromptPay / โอนผ่านบัญชี</p>
            <p className="text-lg font-bold text-weeeu-text tracking-wider">{PLATFORM_BANK_INFO.promptPayId}</p>
            {/* QR placeholder — Phase D-2 */}
            <div className="mt-2 mx-auto w-28 h-28 bg-white border-2 border-weeeu-primary/20 rounded-xl flex flex-col items-center justify-center text-weeeu-primary/40">
              <p className="text-2xl">📱</p>
              <p className="text-[10px] mt-0.5">QR Code</p>
              {/* PHASE-4: Phase D-2 */}
              <p className="text-[10px]">(เร็วๆ นี้)</p>
            </div>
          </div>
          <div className="border-t border-weeeu-primary/10 pt-2.5 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-weeeu-primary/70">ชื่อบัญชี</span><span className="font-medium text-weeeu-text">{PLATFORM_BANK_INFO.accountName}</span></div>
            <div className="flex justify-between"><span className="text-weeeu-primary/70">เลขบัญชี</span><span className="font-medium text-weeeu-text">{PLATFORM_BANK_INFO.accountNumber}</span></div>
            <div className="flex justify-between"><span className="text-weeeu-primary/70">ธนาคาร</span><span className="font-medium text-weeeu-text">{PLATFORM_BANK_INFO.bankName}</span></div>
            <div className="flex justify-between"><span className="text-weeeu-primary/70">อัตราแลก</span><span className="font-medium text-weeeu-primary">1 บาท = 1 พอยต์ทอง</span></div>
          </div>
        </div>

        {/* Preset amounts (U-57#3 — 3,000/4,000/5,000) */}
        <div className="grid grid-cols-3 gap-2">
          {GOLD_TOPUP_PRESETS.map(amt => (
            <button
              key={amt}
              onClick={() => { setGoldTopUpAmount(String(amt)); setTopUpError(""); }}
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

        {/* Amount input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">จำนวนพอยต์ทอง <span className="text-red-400">*</span></label>
          <input
            type="number"
            min={MIN_TOPUP}
            max={MAX_TOPUP}
            value={goldTopUpAmount}
            onChange={e => { setGoldTopUpAmount(e.target.value); setTopUpError(""); }}
            placeholder={`ขั้นต่ำ ${MIN_TOPUP.toLocaleString()} — สูงสุด ${MAX_TOPUP.toLocaleString()}`}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        {/* U-57#4 — วันเวลาที่โอน */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">วันเดือนปีและเวลาที่โอนเงิน <span className="text-red-400">*</span></label>
          <input
            type="datetime-local"
            value={transferAt}
            onChange={e => { setTransferAt(e.target.value); setTopUpError(""); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        {/* U-57#4 — แนบสลิป (file input) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">สลิปการโอนเงิน <span className="text-red-400">*</span></label>
          <FileUpload context="slip" accept="image/*" maxSizeMB={5} onUploaded={(file) => { setSlipFileId(file.fileId); setTopUpError(""); }} />
          {slipFileId && <p className="text-xs text-green-600 mt-1">✅ แนบสลิปแล้ว</p>}
        </div>

        {topUpError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{topUpError}</p>
        )}

        <button
          onClick={handleGoldTopUp}
          disabled={topUpSubmitting}
          className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
        >
          {topUpSubmitting ? "⟳ กำลังส่งคำขอ..." : "💰 ยืนยันเติมพอยต์ทอง (Mockup)"}
        </button>
        <p className="text-xs text-gray-400">* Mockup — ส่งคำขอเพื่อดู flow · ยอดเครดิตเมื่อ Admin อนุมัติ (BE)</p>
      </div>

      {/* R1: Silver info — U-57#5b ย่อเป็น icon เล็ก (expand เมื่อกด) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setSilverInfoOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
          aria-expanded={silverInfoOpen}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="text-base">💎</span> พอยต์เงิน — รับอย่างไร?
            <span className="text-gray-300">ⓘ</span>
          </span>
          <span className="text-gray-400 text-sm">{silverInfoOpen ? "▲" : "▼"}</span>
        </button>
        {silverInfoOpen && (
          <div className="px-5 pb-5 space-y-2">
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
            <div className="bg-red-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-600 font-medium">❌ พอยต์เงินถอนเป็นเงินไม่ได้ · ใช้ได้แค่ชำระค่าบริการ · หมดอายุ 90 วัน</p>
            </div>
          </div>
        )}
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
                {t === "all" ? "ทั้งหมด" : t === "gold" ? "🥇 พอยต์ทอง" : "💎 พอยต์เงิน"}
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
                    {tx.wallet === "gold" ? "🥇 พอยต์ทอง" : "💎 พอยต์เงิน"}
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
