"use client";
// ─── หน้าเติมแต้ม (/wallet/deposit) — Decision Record C Phase 1 ───────────────
// QR PromptPay + บัญชีธนาคาร + อัพโหลดสลิป → POST /api/v1/transfers/deposit

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdapter } from "@/lib/dal";
import { FileUpload } from "@/components/upload/FileUpload";
import type { DepositInfo } from "@app3r/shared/dal/weeeu";

export default function DepositPage() {
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState("");

  const [amount, setAmount] = useState("");
  const [slipFileId, setSlipFileId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // โหลดข้อมูล PromptPay + บัญชีธนาคาร
  useEffect(() => {
    const dal = getAdapter();
    dal.transfer.getDepositInfo().then((result) => {
      if (result.ok) setDepositInfo(result.data);
      else setInfoError(result.error);
      setLoadingInfo(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setSubmitError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (!slipFileId) {
      setSubmitError("กรุณาอัพโหลดสลิปการโอนเงินก่อน");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const dal = getAdapter();
      const result = await dal.transfer.deposit({ amount: parsedAmount, slipFileId });
      if (!result.ok) throw new Error(result.error);
      setSubmitSuccess(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "ส่งคำขอเติมแต้มไม่สำเร็จ");
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
          <h1 className="text-xl font-bold text-gray-900">เติมแต้ม</h1>
        </div>

        {/* Success card */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <h2 className="text-lg font-bold text-green-800">ส่งคำขอสำเร็จ!</h2>
          <p className="text-sm text-green-600">
            admin จะตรวจสอบสลิปและยืนยันการเติมแต้มภายใน 1-2 ชั่วโมง
          </p>
          <p className="text-xs text-green-500">
            อัตรา: 1 บาท = {depositInfo?.pointRate ?? 1} แต้ม
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
        <h1 className="text-xl font-bold text-gray-900">เติมแต้ม</h1>
      </div>

      {/* Bank info card */}
      {loadingInfo ? (
        <div className="bg-gray-50 rounded-2xl p-5 text-center text-gray-400 text-sm animate-pulse">
          กำลังโหลดข้อมูลบัญชี...
        </div>
      ) : infoError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600">
          {infoError}
        </div>
      ) : depositInfo ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4">
          <div className="text-center">
            <p className="text-xs text-indigo-500 mb-1">PromptPay</p>
            <p className="text-2xl font-bold text-indigo-800 tracking-wider">
              {depositInfo.promptPayId}
            </p>
            {/* QR placeholder — Phase D-2: ใช้ library generate QR จริง */}
            <div className="mt-3 mx-auto w-32 h-32 bg-white border-2 border-indigo-200 rounded-xl flex items-center justify-center">
              <div className="text-center text-indigo-300">
                <p className="text-3xl">📱</p>
                <p className="text-xs mt-1">QR Code</p>
                <p className="text-xs">(Phase D-2)</p>
              </div>
            </div>
          </div>

          <div className="border-t border-indigo-200 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-indigo-500">ชื่อบัญชี</span>
              <span className="font-medium text-indigo-800">{depositInfo.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-500">เลขบัญชี</span>
              <span className="font-medium text-indigo-800">{depositInfo.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-500">ธนาคาร</span>
              <span className="font-medium text-indigo-800">{depositInfo.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-500">อัตราแลก</span>
              <span className="font-medium text-indigo-800">
                1 บาท = {depositInfo.pointRate} แต้ม
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Deposit form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">รายละเอียดการเติมแต้ม</h2>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              จำนวนเงินที่โอน (บาท) <span className="text-red-400">*</span>
            </label>
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
                className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {amount && parseInt(amount) > 0 && depositInfo && (
              <p className="text-xs text-indigo-500 mt-1">
                ≈ {parseInt(amount) * depositInfo.pointRate} แต้ม
              </p>
            )}
          </div>

          {/* Slip upload */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              สลิปการโอนเงิน <span className="text-red-400">*</span>
            </label>
            <FileUpload
              context="slip"
              accept="image/*"
              maxSizeMB={5}
              onUploaded={(file) => setSlipFileId(file.fileId)}
            />
            {slipFileId && (
              <p className="text-xs text-green-600 mt-1">✅ อัพโหลดสลิปแล้ว (fileId: {slipFileId})</p>
            )}
          </div>
        </div>

        {submitError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !slipFileId || !amount}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
        >
          {submitting ? "กำลังส่งคำขอ..." : "💰 ยืนยันการเติมแต้ม"}
        </button>
      </form>

      <p className="text-xs text-center text-gray-400">
        admin จะตรวจสอบสลิปและยืนยันภายใน 1-2 ชั่วโมง
      </p>
    </div>
  );
}
