"use client";
// ── Wallet Withdraw — WeeeR (Manual Bank Transfer) ────────────────────────────
// Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d
// ระยะแรก: ผู้ใช้ขอถอนแต้ม → Admin อนุมัติ → โอนเงินตรงไปบัญชีปลายทาง
// POST /api/v1/transfers/withdraw/

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api-client";

const BANK_OPTIONS = [
  "ธนาคารกสิกรไทย (KBank)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน",
];

// อัตรา (1 Silver Point = 1 บาท)
const THB_PER_POINT = 1;
// ขั้นต่ำถอน (Silver Points)
const MIN_WITHDRAW = 100;

type WithdrawStatus = "idle" | "submitting" | "success" | "error";

export default function WithdrawPage() {
  const [points, setPoints]           = useState("");
  const [bankName, setBankName]       = useState("");
  const [accountNo, setAccountNo]     = useState("");
  const [accountName, setAccountName] = useState("");
  const [status, setStatus]           = useState<WithdrawStatus>("idle");
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [refCode, setRefCode]         = useState<string | null>(null);

  const thbPreview = points ? Math.floor(Number(points) * THB_PER_POINT) : 0;

  function validate(): string | null {
    const p = Number(points);
    if (!points || isNaN(p) || p <= 0) return "กรุณาระบุจำนวนแต้มที่ต้องการถอน";
    if (p < MIN_WITHDRAW) return `ถอนขั้นต่ำ ${MIN_WITHDRAW.toLocaleString()} แต้ม`;
    if (!bankName) return "กรุณาเลือกธนาคาร";
    if (!accountNo.trim()) return "กรุณากรอกเลขบัญชีธนาคาร";
    if (!accountName.trim()) return "กรุณากรอกชื่อบัญชีธนาคาร";
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await apiFetch("/api/v1/transfers/withdraw/", {
        method: "POST",
        body: JSON.stringify({
          points: Number(points),
          bankName,
          accountNo: accountNo.trim(),
          accountName: accountName.trim(),
          note: `WeeeR withdraw ${new Date().toISOString()}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = (await res.json()) as { referenceCode?: string };
      setRefCode(data.referenceCode ?? null);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "ส่งคำขอถอนแต้มล้มเหลว — กรุณาลองอีกครั้ง");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-6 max-w-xl">
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-bold text-green-800">ส่งคำขอถอนแต้มสำเร็จ</h2>
          <p className="text-sm text-green-700">
            ทีม App3R กำลังตรวจสอบคำขอ<br />
            เงินจะโอนเข้าบัญชีภายใน 1-3 วันทำการ
          </p>
          {refCode && (
            <div className="bg-white rounded-xl px-4 py-2 text-sm text-gray-600 border border-green-100">
              รหัสอ้างอิง: <strong className="text-gray-900">{refCode}</strong>
            </div>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/wallet/history" className="text-sm text-green-700 underline">ดูประวัติ</Link>
            <Link href="/wallet" className="text-sm text-gray-500 underline">กลับกระเป๋าเงิน</Link>
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
        <h1 className="text-xl font-bold text-gray-900">ถอนแต้ม</h1>
      </div>

      {/* Note */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
        <div className="text-xs text-amber-700 space-y-1">
          <div className="font-semibold text-amber-800">⏳ ระยะเวลาดำเนินการ</div>
          <div>• Admin ตรวจสอบคำขอและโอนเงินภายใน 1-3 วันทำการ</div>
          <div>• ถอนขั้นต่ำ {MIN_WITHDRAW.toLocaleString()} Silver Points</div>
          <div>• อัตราแลกเปลี่ยน: {THB_PER_POINT} แต้ม/บาท (Silver Points)</div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">รายละเอียดการถอนแต้ม</h3>

        {/* จำนวนแต้ม */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            จำนวนแต้มที่ต้องการถอน (Silver Points)
          </label>
          <input
            type="number"
            min={MIN_WITHDRAW}
            step="1"
            value={points}
            onChange={(e) => { setPoints(e.target.value); setErrorMsg(null); }}
            placeholder={`ขั้นต่ำ ${MIN_WITHDRAW} แต้ม`}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {thbPreview > 0 && (
            <p className="text-xs text-green-600 mt-1.5">
              จะได้รับ <strong>{thbPreview.toLocaleString()} บาท</strong> โอนเข้าบัญชีธนาคาร
            </p>
          )}
        </div>

        {/* ธนาคาร */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ธนาคาร</label>
          <select
            value={bankName}
            onChange={(e) => { setBankName(e.target.value); setErrorMsg(null); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            <option value="">-- เลือกธนาคาร --</option>
            {BANK_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* เลขบัญชี */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขบัญชีธนาคาร</label>
          <input
            type="text"
            value={accountNo}
            onChange={(e) => { setAccountNo(e.target.value); setErrorMsg(null); }}
            placeholder="เช่น 123-4-56789-0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* ชื่อบัญชี */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อบัญชี (ต้องตรงกับบัตรประชาชน)</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => { setAccountName(e.target.value); setErrorMsg(null); }}
            placeholder="เช่น นายสมชาย ใจดี"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
          disabled={status === "submitting"}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "กำลังส่งคำขอ..." : "💸 ยืนยันการถอนแต้ม"}
        </button>
      </div>
    </div>
  );
}
