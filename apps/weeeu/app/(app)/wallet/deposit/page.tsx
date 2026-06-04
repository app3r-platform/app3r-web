"use client";
// ─── เติม Gold Point (/wallet/deposit) — MOCK fallback (T3 fix) ───────────────
// โหลด DepositInfo → MOCK fallback ถ้า API ไม่ตอบ · submit = mock (Backend parallel)

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdapter } from "@/lib/dal";
import { FileUpload } from "@/components/upload/FileUpload";
import type { DepositInfo } from "@app3r/shared/dal/weeeu";

// MOCK fallback — ใช้เมื่อ API ไม่ตอบสนอง (T3 fix)
const MOCK_DEPOSIT_INFO: DepositInfo = {
  promptPayId: "0XX-XXX-XXXX (Admin)",
  accountName: "บริษัท App3R จำกัด",
  accountNumber: "XXX-X-XXXXX-X",
  bankName: "ธนาคารกสิกรไทย (KBank)",
  pointRate: 1,
};

export default function DepositPage() {
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [amount, setAmount] = useState("");
  const [transferAt, setTransferAt] = useState(""); // วันเวลาที่โอน (U-01#4)
  const [slipFileId, setSlipFileId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // โหลดข้อมูล PromptPay + บัญชีธนาคาร — MOCK fallback ถ้า API ไม่ตอบ
  useEffect(() => {
    const dal = getAdapter();
    dal.transfer
      .getDepositInfo()
      .then((result) => {
        setDepositInfo(result.ok ? result.data : MOCK_DEPOSIT_INFO);
      })
      .catch(() => {
        setDepositInfo(MOCK_DEPOSIT_INFO);
      })
      .finally(() => setLoadingInfo(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setSubmitError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (!transferAt) {
      setSubmitError("กรุณาระบุวันเดือนปีและเวลาที่โอนเงิน — หากไม่มีถือว่ายังโอนเงินไม่สำเร็จ");
      return;
    }
    if (!slipFileId) {
      setSubmitError("กรุณาอัพโหลดสลิปการโอนเงินก่อน");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    // Mock submit — Backend CMD-B2 parallel
    setTimeout(() => {
      setSubmitSuccess(true);
      setSubmitting(false);
    }, 1000);
  };

  if (submitSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">เติมพอยต์ทอง (Gold Point)</h1>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <h2 className="text-lg font-bold text-green-800">ส่งคำขอสำเร็จ!</h2>
          <p className="text-sm text-green-600">
            Admin จะตรวจสอบสลิปและยืนยันการเติมพอยต์ทองภายใน 1-2 ชั่วโมง
          </p>
          <p className="text-xs text-green-500">
            อัตรา: 1 บาท = {depositInfo?.pointRate ?? 1} พอยต์ทอง
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/wallet" className="flex-1 text-center bg-weeeu-primary hover:bg-weeeu-dark text-white py-3 rounded-2xl text-sm font-semibold transition-colors">
            กลับ Wallet
          </Link>
          <Link href="/dashboard" className="flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm font-semibold">
            กลับหน้าหลัก
          </Link>
        </div>
        <p className="text-xs text-center text-gray-400">* Mockup — ไม่บันทึกข้อมูลจริง</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">เติมพอยต์ทอง (Gold Point)</h1>
      </div>

      {/* Bank info card */}
      {loadingInfo ? (
        <div className="bg-gray-50 rounded-2xl p-5 text-center text-gray-400 text-sm animate-pulse">
          กำลังโหลดข้อมูลบัญชี...
        </div>
      ) : depositInfo ? (
        <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-5 space-y-4">
          <div className="text-center">
            <p className="text-xs text-weeeu-primary mb-1">PromptPay / โอนผ่านบัญชี</p>
            <p className="text-2xl font-bold text-weeeu-text tracking-wider">{depositInfo.promptPayId}</p>
            {/* QR placeholder — Phase D-2 */}
            <div className="mt-3 mx-auto w-32 h-32 bg-white border-2 border-weeeu-primary/20 rounded-xl flex items-center justify-center">
              <div className="text-center text-weeeu-primary/40">
                <p className="text-3xl">📱</p>
                <p className="text-xs mt-1">QR Code</p>
                <p className="text-xs">(Phase D-2)</p>
              </div>
            </div>
          </div>

          <div className="border-t border-weeeu-primary/10 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-weeeu-primary/70">ชื่อบัญชี</span>
              <span className="font-medium text-weeeu-text">{depositInfo.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-weeeu-primary/70">เลขบัญชี</span>
              <span className="font-medium text-weeeu-text">{depositInfo.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-weeeu-primary/70">ธนาคาร</span>
              <span className="font-medium text-weeeu-text">{depositInfo.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-weeeu-primary/70">อัตราแลก</span>
              <span className="font-medium text-weeeu-primary">1 บาท = {depositInfo.pointRate} พอยต์ทอง</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Deposit form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">รายละเอียดการเติมพอยต์ทอง</h2>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              จำนวนเงินที่โอน (บาท) <span className="text-red-400">*</span>
            </label>
            {/* Preset amounts (U-01#3 · 04:47) */}
            <div className="flex gap-2 mb-2">
              {[3000, 4000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    amount === String(preset)
                      ? "bg-weeeu-primary text-white border-weeeu-primary"
                      : "bg-white text-weeeu-text border-gray-200 hover:border-weeeu-primary"
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                step="1"
                required
                className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
              />
            </div>
            {amount && parseInt(amount) > 0 && depositInfo && (
              <p className="text-xs text-weeeu-primary mt-1">
                ≈ {(parseInt(amount) * depositInfo.pointRate).toLocaleString()} พอยต์ทอง
              </p>
            )}
          </div>

          {/* วันเวลาที่โอน (U-01#4 · 04:46) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              วันเดือนปีและเวลาที่โอนเงิน <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={transferAt}
              onChange={(e) => setTransferAt(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
            />
            <p className="text-xs text-gray-400 mt-1">ระบุเวลาที่โอนจริงตามสลิป — จำเป็นต่อการตรวจสอบ</p>
          </div>

          {/* Slip upload */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              สลิปการโอนเงิน <span className="text-red-400">*</span>
            </label>
            <FileUpload context="slip" accept="image/*" maxSizeMB={5} onUploaded={(file) => setSlipFileId(file.fileId)} />
            {slipFileId && <p className="text-xs text-green-600 mt-1">✅ อัพโหลดสลิปแล้ว</p>}
          </div>
        </div>

        {submitError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !slipFileId || !amount || !transferAt}
          className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
        >
          {submitting ? "⟳ กำลังส่งคำขอ..." : "💰 ยืนยันการเติมพอยต์ทอง (Mockup)"}
        </button>
      </form>

      <p className="text-xs text-center text-gray-400">
        Admin ตรวจสอบสลิปและยืนยันภายใน 1-2 ชั่วโมง · * Mockup
      </p>
    </div>
  );
}
