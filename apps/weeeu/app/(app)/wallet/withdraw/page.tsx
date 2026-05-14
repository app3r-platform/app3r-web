"use client";
// ─── หน้าขอถอนแต้ม (/wallet/withdraw) — Decision Record C Phase 1 ─────────────
// ระบุจำนวน + บัญชีธนาคารปลายทาง → POST /api/v1/transfers/withdraw
// WeeeU = customer → admin โอนเงินให้ภายหลัง

import { useState } from "react";
import Link from "next/link";
import { getAdapter } from "@/lib/dal";

// รายการธนาคารที่รองรับ
const BANKS = [
  "ธนาคารกสิกรไทย (KBank)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
];

export default function WithdrawPage() {
  const [points, setPoints] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPoints = parseInt(points, 10);
    if (!parsedPoints || parsedPoints <= 0) {
      setSubmitError("กรุณาระบุจำนวนแต้มที่ต้องการถอน");
      return;
    }
    if (!bankName) {
      setSubmitError("กรุณาเลือกธนาคาร");
      return;
    }
    if (!bankAccount.trim()) {
      setSubmitError("กรุณาระบุเลขบัญชีธนาคาร");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const dal = getAdapter();
      const result = await dal.transfer.withdraw({
        points: parsedPoints,
        bankName,
        bankAccount: bankAccount.trim(),
      });
      if (!result.ok) throw new Error(result.error);
      setSubmitSuccess(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "ส่งคำขอถอนแต้มไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/wallet/history" className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">ขอถอนแต้ม</h1>
        </div>

        {/* Success card */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <h2 className="text-lg font-bold text-green-800">ส่งคำขอสำเร็จ!</h2>
          <p className="text-sm text-green-600">
            admin จะโอนเงินให้ภายใน 1-3 วันทำการ
          </p>
          <p className="text-xs text-green-500 mt-2">
            {points} แต้ม ≈ ฿{parseInt(points).toLocaleString("th-TH")}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/wallet/history"
            className="flex-1 text-center bg-indigo-600 text-white py-3 rounded-2xl text-sm font-semibold"
          >
            ดูประวัติรายการ
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm font-semibold"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/wallet/history" className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <h1 className="text-xl font-bold text-gray-900">ขอถอนแต้ม</h1>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
        <p className="font-medium mb-1">📋 ขั้นตอนการถอนแต้ม</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>กรอกจำนวนแต้มและบัญชีธนาคารปลายทาง</li>
          <li>admin ตรวจสอบและโอนเงินให้ภายใน 1-3 วันทำการ</li>
          <li>อัตรา: 1 แต้ม = ฿1.00</li>
        </ol>
      </div>

      {/* Withdraw form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">รายละเอียดการถอนแต้ม</h2>

          {/* Points input */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              จำนวนแต้มที่ต้องการถอน <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">💎</span>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="0"
                min="1"
                step="1"
                required
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {points && parseInt(points) > 0 && (
              <p className="text-xs text-indigo-500 mt-1">
                ≈ ฿{parseInt(points).toLocaleString("th-TH")}
              </p>
            )}
          </div>

          {/* Bank selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              ธนาคาร <span className="text-red-400">*</span>
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">-- เลือกธนาคาร --</option>
              {BANKS.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Bank account */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              เลขบัญชีธนาคาร <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="เช่น 123-4-56789-0"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {submitError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !points || !bankName || !bankAccount}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
        >
          {submitting ? "กำลังส่งคำขอ..." : "💸 ยืนยันการถอนแต้ม"}
        </button>
      </form>

      <p className="text-xs text-center text-gray-400">
        admin จะโอนเงินให้ภายใน 1-3 วันทำการ
      </p>
    </div>
  );
}
