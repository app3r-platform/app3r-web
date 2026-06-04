"use client";
// ─── D91: WeeeU ถอน Gold Point — Mockup (Backend CMD-B2 parallel) ──────────
// Flow: form → submitting → pending (รอ Admin) → settled (demo)
// 1 Gold = 1 บาท · Admin อนุมัติ → โอนเงินจริงเข้าบัญชี user

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OtpInput from "@/components/shared/OtpInput";

const QUICK_AMOUNTS = [100, 200, 500, 1000];

// Mock Gold balance
const MOCK_GOLD_BALANCE = 350;

// บัญชีธนาคารดึงจากฐานข้อมูล (ที่ผู้ใช้บันทึกตอนสมัคร) — mock · ไม่ให้เลือกเอง · แก้ที่หน้าจัดการข้อมูลผู้ใช้ (U-45#2)
const MOCK_USER_BANK = {
  bankName: "ธนาคารกสิกรไทย (KBank)",
  bankAccount: "123-4-56789-0",
  accountHolder: "สมชาย ใจดี",
};

const MOCK_OTP = "123456"; // mockup — provider จริง = BE
const MAX_OTP_ATTEMPTS = 3;

type FlowState = "form" | "otp" | "submitting" | "pending" | "settled";

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const { bankName, bankAccount, accountHolder } = MOCK_USER_BANK;
  const [flowState, setFlowState] = useState<FlowState>("form");
  const [fieldError, setFieldError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpError, setOtpError] = useState("");

  const parsedAmount = parseInt(amount, 10) || 0;
  const canSubmit = parsedAmount > 0 && parsedAmount <= MOCK_GOLD_BALANCE;

  // form → OTP gate (ยืนยันตัวตนเจ้าของบัญชีก่อนถอน · U-45#1)
  const handleSubmit = () => {
    setFieldError("");
    if (parsedAmount <= 0) { setFieldError("กรุณาระบุจำนวนพอยต์ทองที่ต้องการถอน"); return; }
    if (parsedAmount > MOCK_GOLD_BALANCE) { setFieldError(`พอยต์ทองไม่พอ — คงเหลือ ${MOCK_GOLD_BALANCE} พอยต์ทอง`); return; }
    setFlowState("otp");
  };

  // OTP verify — mock 123456 · ผิดครบ 3 ครั้ง → ระงับ + แจ้ง admin + ลิงก์ปลดล็อก (U-45#1)
  const handleVerifyOtp = () => {
    setOtpError("");
    if (otp === MOCK_OTP) {
      setFlowState("submitting");
      setTimeout(() => setFlowState("pending"), 1200);
      return;
    }
    const n = otpAttempts + 1;
    setOtpAttempts(n);
    setOtp("");
    if (n >= MAX_OTP_ATTEMPTS) {
      router.push("/suspended?reason=otp&from=ถอนพอยต์ทอง");
    } else {
      setOtpError(`รหัส OTP ไม่ถูกต้อง — เหลือโอกาสอีก ${MAX_OTP_ATTEMPTS - n} ครั้ง`);
    }
  };

  // ─── Pending state (รอ Admin อนุมัติ) ─────────────────────────────────────
  if (flowState === "pending" || flowState === "settled") {
    const isSettled = flowState === "settled";
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ถอนพอยต์ทอง (Gold Point)</h1>
        </div>

        {/* Status card */}
        <div className={`rounded-2xl p-8 text-center space-y-3 border ${
          isSettled
            ? "bg-green-50 border-green-100"
            : "bg-weeeu-surface border-weeeu-primary/20"
        }`}>
          <p className="text-5xl">{isSettled ? "✅" : "⏳"}</p>
          <p className="text-lg font-bold text-gray-800">
            {isSettled ? "โอนเงินสำเร็จแล้ว!" : "รอ Admin อนุมัติ"}
          </p>
          <p className="text-sm text-gray-500">
            {isSettled
              ? "เงินโอนเข้าบัญชีของคุณเรียบร้อยแล้ว"
              : "Admin จะโอนเงินให้ภายใน 1-3 วันทำการ"}
          </p>
          <div className="bg-white/70 rounded-xl px-4 py-3 inline-block mt-2 space-y-1">
            <p className="text-2xl font-bold text-weeeu-primary">{parsedAmount.toLocaleString()} พอยต์ทอง</p>
            <p className="text-xs text-gray-500">≈ ฿{parsedAmount.toLocaleString("th-TH")}</p>
            <p className="text-xs text-gray-400 mt-1">{bankName}</p>
            <p className="text-xs text-gray-400">บัญชี {bankAccount}</p>
            <p className="text-xs text-gray-400">ชื่อ {accountHolder}</p>
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">สถานะคำขอ</h2>
          {[
            { label: "ส่งคำขอถอนสำเร็จ", done: true, time: "เมื่อกี้" },
            { label: "Admin ตรวจสอบและอนุมัติ", done: isSettled, time: isSettled ? "เมื่อกี้" : "ภายใน 1-3 วันทำการ" },
            { label: "โอนเงินเข้าบัญชีของคุณ", done: isSettled, time: isSettled ? "เมื่อกี้" : "หลัง Admin อนุมัติ" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                step.done ? "bg-weeeu-primary text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {step.done ? "✓" : i + 1}
              </div>
              <div>
                <p className={`text-sm font-medium ${step.done ? "text-gray-800" : "text-gray-400"}`}>{step.label}</p>
                <p className="text-xs text-gray-400">{step.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo: simulate admin approve */}
        {!isSettled && (
          <button
            onClick={() => setFlowState("settled")}
            className="w-full border border-dashed border-weeeu-primary/40 text-weeeu-primary text-xs py-2.5 rounded-xl hover:bg-weeeu-surface transition-colors"
          >
            🛠 Demo: จำลอง Admin อนุมัติ → Settled
          </button>
        )}

        <div className="flex gap-3">
          <Link
            href="/wallet"
            className="flex-1 text-center bg-weeeu-primary hover:bg-weeeu-dark text-white py-3 rounded-2xl text-sm font-semibold transition-colors"
          >
            กลับ Wallet
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm font-semibold"
          >
            หน้าหลัก
          </Link>
        </div>

        <p className="text-xs text-center text-gray-400">* Mockup — ไม่บันทึกข้อมูลจริง · Backend CMD-B2 parallel</p>
      </div>
    );
  }

  // ─── OTP gate (ยืนยันตัวตนก่อนถอน · mock 123456 · U-45#1) ────────────────────
  if (flowState === "otp") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setFlowState("form"); setOtp(""); setOtpError(""); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</button>
          <h1 className="text-xl font-bold text-gray-900">ยืนยันด้วยรหัส OTP</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm text-center">
          <p className="text-3xl">🔐</p>
          <p className="text-sm text-gray-600">
            เพื่อความปลอดภัย กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยังเบอร์โทรศัพท์ที่ลงทะเบียนไว้
          </p>
          <p className="text-xs text-gray-400">(Mockup — ใช้รหัส <span className="font-bold text-weeeu-primary">123456</span> · ผู้ให้บริการ OTP จริง = BE)</p>

          <OtpInput value={otp} onChange={setOtp} />

          {otpError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{otpError}</p>
          )}
          <p className="text-xs text-gray-400">กรอกได้ {MAX_OTP_ATTEMPTS} ครั้ง — หากผิดครบจะถูกระงับและต้องติดต่อผู้ดูแลระบบ</p>

          <button
            onClick={handleVerifyOtp}
            disabled={otp.length < 6}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            ยืนยัน OTP
          </button>
        </div>
        <p className="text-xs text-center text-gray-400">* Mockup — ไม่บันทึกข้อมูลจริง</p>
      </div>
    );
  }

  // ─── Form state ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ถอน Gold Point</h1>
      </div>

      {/* Gold balance banner */}
      <div className="wallet-gold rounded-2xl p-4 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-80">พอยต์ทอง (Gold Point) คงเหลือ</p>
          <p className="text-2xl font-bold">{MOCK_GOLD_BALANCE.toLocaleString()}</p>
          <p className="text-xs opacity-70">≈ ฿{MOCK_GOLD_BALANCE.toLocaleString("th-TH")}</p>
        </div>
        <span className="text-4xl">🥇</span>
      </div>

      {/* Flow info */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">📋 ขั้นตอนการถอนพอยต์ทอง</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-amber-700">
          <li>กรอกจำนวนพอยต์ทอง + บัญชีธนาคารปลายทาง</li>
          <li>Admin ตรวจสอบและอนุมัติ (1-3 วันทำการ)</li>
          <li>Admin โอนเงินจริงเข้าบัญชีของคุณ</li>
        </ol>
        <p className="text-xs text-amber-600 mt-2 font-medium">อัตรา: 1 พอยต์ทอง = ฿1.00</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">รายละเอียดการถอน</h2>

        {/* Amount */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            จำนวนพอยต์ทองที่ต้องการถอน <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🥇</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              max={MOCK_GOLD_BALANCE}
              step="1"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
            />
          </div>
          {parsedAmount > 0 && (
            <p className="text-xs text-weeeu-primary">≈ ฿{parsedAmount.toLocaleString("th-TH")}</p>
          )}
          {parsedAmount > MOCK_GOLD_BALANCE && (
            <p className="text-xs text-red-500">พอยต์ทองไม่พอ — คงเหลือ {MOCK_GOLD_BALANCE} พอยต์ทอง</p>
          )}
          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                disabled={amt > MOCK_GOLD_BALANCE}
                className={`border text-xs py-1.5 rounded-xl transition-colors ${
                  amount === String(amt)
                    ? "border-weeeu-primary bg-weeeu-surface text-weeeu-primary font-semibold"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40"
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* บัญชีปลายทาง — ดึงจากฐานข้อมูล (ไม่ให้เลือกเอง · U-45#2) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            บัญชีรับเงิน (ดึงจากข้อมูลที่ลงทะเบียนไว้)
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ธนาคาร</span>
              <span className="font-medium text-gray-800">{bankName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">เลขบัญชี</span>
              <span className="font-medium text-gray-800">{bankAccount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ชื่อบัญชี</span>
              <span className="font-medium text-gray-800">{accountHolder}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ต้องการแก้ไขบัญชี? ไปที่{" "}
            <Link href="/settings/account" className="text-weeeu-primary underline">หน้าจัดการข้อมูลผู้ใช้</Link>
          </p>
        </div>

        {/* ล็อกจำนวนเมื่อยืนยัน (U-45#3) */}
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          ⚠️ เมื่อยืนยันถอน ระบบจะล็อกจำนวนพอยต์ทองที่แจ้งถอนทันที เพื่อกันยอดไม่พอระหว่างรอ Admin อนุมัติ
        </p>
      </div>

      {/* Confirm summary */}
      {canSubmit && (
        <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-weeeu-text mb-2">สรุปการถอน</p>
          <div className="flex justify-between text-xs text-gray-600">
            <span>จำนวนพอยต์ทอง</span><span className="font-semibold text-weeeu-primary">{parsedAmount.toLocaleString()} พอยต์ทอง</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>มูลค่าเงินจริง</span><span>฿{parsedAmount.toLocaleString("th-TH")}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>ธนาคาร</span><span>{bankName}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>บัญชี</span><span>{bankAccount}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>ชื่อ</span><span>{accountHolder}</span>
          </div>
        </div>
      )}

      {fieldError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {fieldError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || flowState === "submitting"}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        {flowState === "submitting" ? "⟳ กำลังส่งคำขอ..." : "🥇 ถัดไป — ยืนยันด้วย OTP"}
      </button>

      <p className="text-xs text-center text-gray-400">* Mockup — ไม่บันทึกข้อมูลจริง · Backend CMD-B2 parallel</p>
    </div>
  );
}
