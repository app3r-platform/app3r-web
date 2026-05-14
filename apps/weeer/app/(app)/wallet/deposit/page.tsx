"use client";
// ── Wallet Deposit — WeeeR (Manual Bank Transfer) ─────────────────────────────
// Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d
// ระยะแรก: โอนเงินตรงเข้าบัญชีบริษัท → upload สลิป → POST /api/v1/transfers/deposit/
// ไม่ผ่าน Payment Gateway ภายนอกในระยะนี้

import { useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api-client";

// ── Bank account ข้อมูลจริง — อัปเดตจาก Admin ────────────────────────────────
const BANK_INFO = {
  bank:       "ธนาคารกสิกรไทย (KBank)",
  accountNo:  "123-4-56789-0",
  accountName: "บริษัท แอป3อาร์ จำกัด",
  promptPay:  "0812345678",
};

// ── อัตราแลกเปลี่ยน (1 บาท = 1 Silver Point) ────────────────────────────────
const THB_PER_POINT = 1;

type DepositStatus = "idle" | "uploading" | "submitting" | "success" | "error";

export default function DepositPage() {
  const [amount, setAmount]           = useState("");
  const [slipUrl, setSlipUrl]         = useState<string | null>(null);
  const [status, setStatus]           = useState<DepositStatus>("idle");
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [refCode, setRefCode]         = useState<string | null>(null);
  const inputRef                       = useRef<HTMLInputElement>(null);

  const pointsPreview = amount ? Math.floor(Number(amount) * (1 / THB_PER_POINT)) : 0;

  // ── Upload slip ────────────────────────────────────────────────────────────
  async function handleSlipUpload(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("กรุณาเลือกไฟล์รูปภาพ (jpg / png / webp)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("ไฟล์สลิปต้องไม่เกิน 5MB");
      return;
    }

    setStatus("uploading");
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", "deposit_slip");

    try {
      const res = await apiFetch("/api/v1/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { url: string };
      setSlipUrl(data.url);
      setStatus("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "อัพโหลดสลิปล้มเหลว");
      setStatus("error");
    }
  }

  // ── Submit deposit ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) {
      setErrorMsg("กรุณาระบุจำนวนเงินที่โอน");
      return;
    }
    if (!slipUrl) {
      setErrorMsg("กรุณาอัพโหลดสลิปการโอนเงิน");
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await apiFetch("/api/v1/transfers/deposit/", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          slipUrl,
          currency: "THB",
          note: `WeeeR deposit ${new Date().toISOString()}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = (await res.json()) as { referenceCode?: string };
      setRefCode(data.referenceCode ?? null);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "ส่งคำขอเติมแต้มล้มเหลว — กรุณาลองอีกครั้ง");
      setStatus("error");
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="space-y-6 max-w-xl">
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-bold text-green-800">ส่งคำขอเติมแต้มสำเร็จ</h2>
          <p className="text-sm text-green-700">
            ทีม App3R กำลังตรวจสอบสลิปของคุณ<br />
            แต้มจะเข้าบัญชีภายใน 1-2 ชั่วโมง (วันทำการ)
          </p>
          {refCode && (
            <div className="bg-white rounded-xl px-4 py-2 text-sm text-gray-600 border border-green-100">
              รหัสอ้างอิง: <strong className="text-gray-900">{refCode}</strong>
            </div>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/wallet/history" className="text-sm text-green-700 underline">
              ดูประวัติ
            </Link>
            <Link href="/wallet" className="text-sm text-gray-500 underline">
              กลับกระเป๋าเงิน
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-gray-400 hover:text-gray-600 text-sm">← กลับ</Link>
        <h1 className="text-xl font-bold text-gray-900">เติมแต้ม</h1>
      </div>

      {/* ขั้นตอน */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
        <div className="text-sm font-semibold text-blue-800 mb-2">ขั้นตอนการเติมแต้ม</div>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>โอนเงินเข้าบัญชีบริษัทด้านล่าง</li>
          <li>กรอกจำนวนเงินที่โอน</li>
          <li>อัพโหลดสลิปการโอน</li>
          <li>กด &ldquo;ยืนยันการเติมแต้ม&rdquo;</li>
        </ol>
      </div>

      {/* Bank Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">โอนเงินเข้าบัญชี</h3>

        {/* QR PromptPay placeholder */}
        <div className="flex justify-center">
          <div className="w-36 h-36 bg-gray-100 rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-300 text-gray-400">
            <span className="text-3xl mb-1">📱</span>
            <span className="text-xs text-center">QR PromptPay<br />{BANK_INFO.promptPay}</span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: "ธนาคาร",         value: BANK_INFO.bank },
            { label: "เลขบัญชี",       value: BANK_INFO.accountNo },
            { label: "ชื่อบัญชี",      value: BANK_INFO.accountName },
            { label: "พร้อมเพย์",      value: BANK_INFO.promptPay },
          ].map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{r.label}</span>
              <span className="font-medium text-gray-900">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">รายละเอียดการโอน</h3>

        {/* จำนวนเงิน */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            จำนวนเงินที่โอน (บาท)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrorMsg(null); }}
            placeholder="เช่น 500"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {pointsPreview > 0 && (
            <p className="text-xs text-green-600 mt-1.5">
              จะได้รับ <strong>{pointsPreview.toLocaleString()} Silver Points</strong>
              {" "}(อัตรา {THB_PER_POINT} บาท/แต้ม)
            </p>
          )}
        </div>

        {/* Upload slip */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            สลิปการโอนเงิน
          </label>
          {slipUrl ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-green-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slipUrl} alt="สลิปโอนเงิน" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setSlipUrl(null); setErrorMsg(null); }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={status === "uploading"}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-60"
            >
              {status === "uploading" ? (
                <span className="text-sm text-green-600">กำลังอัพโหลด...</span>
              ) : (
                <>
                  <div className="text-2xl mb-1">🧾</div>
                  <div className="text-sm text-gray-600">แตะเพื่ออัพโหลดสลิป</div>
                  <div className="text-xs text-gray-400 mt-1">jpg / png / webp, สูงสุด 5MB</div>
                </>
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleSlipUpload(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === "submitting" || status === "uploading" || !amount || !slipUrl}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "กำลังส่งคำขอ..." : "✅ ยืนยันการเติมแต้ม"}
        </button>
      </div>

      {/* Note */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
        <div className="text-xs text-amber-700 space-y-1">
          <div className="font-semibold text-amber-800">หมายเหตุ</div>
          <div>• แต้มจะเข้าบัญชีหลังทีม Admin ตรวจสอบสลิป (วันทำการ 1-2 ชม.)</div>
          <div>• กรุณาโอนเงินตรงตามจำนวนที่กรอก</div>
          <div>• หากยังไม่ได้รับแต้มภายใน 24 ชม. ติดต่อ support@app3r.co</div>
        </div>
      </div>
    </div>
  );
}
