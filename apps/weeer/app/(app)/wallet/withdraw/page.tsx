"use client";
// ── Wallet Withdraw — Sub-CMD-6 Wave 2: Settlement API Integration ────────────
// ถอนแต้ม → Settlement API (POST /api/v1/settlements/)
// Backend: audit log + Mock bank adapter (Sub-6 R1 Mitigation)
//
// Flow: เลือก service (serviceId) + กรอกบัญชี + จำนวนบาท → POST
// Happy path R3: รองรับ happy flow — edge case (service picker) ใน Sub-7

import { useState } from "react";
import Link from "next/link";
import {
  createSettlement,
  getSettlement,
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_COLOR,
} from "../../../../lib/settlement-api";
import type { SettlementDetailDto } from "../../../../lib/settlement-api";

const BANK_OPTIONS = [
  "ธนาคารกสิกรไทย (KBank)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน",
];

const MIN_AMOUNT_THB = 100; // บาท

type WithdrawStep = "form" | "submitting" | "success" | "error";

/** validate เลขบัญชีธนาคารไทย: ตัวเลข 10–12 หลัก (รวมขีด) */
function isValidAccountNo(v: string): boolean {
  return /^\d{10,12}$/.test(v.replace(/[-\s]/g, ""));
}

// TODO Sub-7: แทนที่ด้วย service picker จาก completed services API
// placeholder userId — production ใช้ค่าจาก auth context
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000001";

export default function WithdrawPage() {
  const [serviceId, setServiceId]     = useState("");
  const [amountThb, setAmountThb]     = useState("");
  const [bankName, setBankName]       = useState("");
  const [accountNo, setAccountNo]     = useState("");
  const [accountName, setAccountName] = useState("");
  const [step, setStep]               = useState<WithdrawStep>("form");
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [settlement, setSettlement]   = useState<SettlementDetailDto | null>(null);
  const [polling, setPolling]         = useState(false);

  const amountNum = Number(amountThb);

  function validate(): string | null {
    if (!serviceId.trim()) return "กรุณาระบุ Service ID (UUID ของงานที่เสร็จแล้ว)";
    // UUID v4 format check
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(serviceId.trim()))
      return "Service ID ต้องเป็น UUID format ที่ถูกต้อง";
    if (!amountThb || isNaN(amountNum) || amountNum <= 0)
      return "กรุณาระบุจำนวนเงินที่ต้องการถอน";
    if (amountNum < MIN_AMOUNT_THB)
      return `ถอนขั้นต่ำ ${MIN_AMOUNT_THB.toLocaleString()} บาท`;
    if (!bankName) return "กรุณาเลือกธนาคาร";
    if (!accountNo.trim()) return "กรุณากรอกเลขบัญชีธนาคาร";
    if (!isValidAccountNo(accountNo)) return "เลขบัญชีต้องมี 10-12 หลัก";
    if (!accountName.trim()) return "กรุณากรอกชื่อบัญชีธนาคาร";
    if (accountName.trim().length < 3) return "ชื่อบัญชีต้องมีอย่างน้อย 3 ตัวอักษร";
    return null;
  }

  /** Poll GET /api/v1/settlements/:id/ จนกว่า status เป็น completed/failed (max 5 ครั้ง) */
  async function pollSettlementStatus(id: string, attempt = 0): Promise<void> {
    const MAX_ATTEMPTS = 5;
    const POLL_DELAY_MS = 3000;

    if (attempt >= MAX_ATTEMPTS) { setPolling(false); return; }
    await new Promise((r) => setTimeout(r, POLL_DELAY_MS));

    try {
      const updated = await getSettlement(id);
      setSettlement(updated);
      if (updated.status === "pending" || updated.status === "processing") {
        await pollSettlementStatus(id, attempt + 1);
      } else {
        setPolling(false);
      }
    } catch {
      setPolling(false);
    }
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    setStep("submitting");
    setErrorMsg(null);

    try {
      const result = await createSettlement({
        serviceId: serviceId.trim(),
        weeerUserId: PLACEHOLDER_USER_ID, // TODO Sub-7: ใช้ userId จาก auth context
        amountThb: amountNum,
        weeerBankAccount: accountNo.trim(),
        weeerBankName: accountName.trim(),
        bankAdapter: "mock", // Sub-6 R1: ใช้ Mock bank adapter ก่อน
      });

      setSettlement(result);
      setStep("success");

      if (result.status === "pending" || result.status === "processing") {
        setPolling(true);
        void pollSettlementStatus(result.id);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "ส่งคำขอถอนเงินล้มเหลว — กรุณาลองอีกครั้ง");
      setStep("error");
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (step === "success" && settlement) {
    const statusLabel = SETTLEMENT_STATUS_LABEL[settlement.status];
    const statusColor = SETTLEMENT_STATUS_COLOR[settlement.status];

    return (
      <div className="space-y-6 max-w-xl">
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center space-y-3">
          <div className="text-4xl">
            {settlement.status === "completed" ? "✅" :
             settlement.status === "failed"    ? "❌" : "⏳"}
          </div>
          <h2 className="text-lg font-bold text-green-800">
            {settlement.status === "completed" ? "โอนเงินสำเร็จ" :
             settlement.status === "failed"    ? "โอนเงินล้มเหลว" :
             "ส่งคำขอถอนเงินสำเร็จ"}
          </h2>

          <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${statusColor}`}>
            {statusLabel}{polling && " …"}
          </span>

          {/* Settlement details */}
          <div className="bg-white rounded-xl border border-green-100 px-4 py-3 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">จำนวนเงิน</span>
              <span className="font-bold text-green-700">
                {Number(settlement.amountThb).toLocaleString()} บาท
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ช่องทาง</span>
              <span className="text-gray-700 capitalize">{settlement.bankAdapter}</span>
            </div>
            {settlement.bankRef && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bank Ref</span>
                <span className="text-gray-700 font-mono text-xs">{settlement.bankRef}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-xs">
              <span className="text-gray-400">Settlement ID</span>
              <span className="text-gray-600 font-mono">{settlement.id.slice(0, 8)}…</span>
            </div>
          </div>

          {/* Audit log summary */}
          {settlement.auditLog.length > 0 && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-left space-y-1">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Audit Trail</p>
              {settlement.auditLog.slice(0, 3).map((log) => (
                <div key={log.id} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full shrink-0" />
                  <span>{log.action}</span>
                  {log.detail && <span className="text-gray-400">— {log.detail}</span>}
                </div>
              ))}
            </div>
          )}

          {settlement.status === "pending" && (
            <p className="text-xs text-green-700">
              {polling ? "กำลังตรวจสอบสถานะ…" : "เงินจะโอนเข้าบัญชีภายใน 1-3 วันทำการ"}
            </p>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <Link href="/wallet/settlements" className="text-sm text-green-700 underline">
              ดูประวัติ Settlement
            </Link>
            <Link href="/wallet" className="text-sm text-gray-500 underline">
              กลับกระเป๋าเงิน
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-gray-400 hover:text-gray-600 text-sm">← กลับ</Link>
        <h1 className="text-xl font-bold text-gray-900">ถอนเงิน (Settlement)</h1>
      </div>

      {/* Info note */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
        <div className="text-xs text-amber-700 space-y-1">
          <div className="font-semibold text-amber-800">⚡ Settlement API — Sub-CMD-6</div>
          <div>• ถอนขั้นต่ำ {MIN_AMOUNT_THB.toLocaleString()} บาท</div>
          <div>• ต้องระบุ Service ID ของงานที่ชำระเงินเสร็จแล้ว</div>
          <div>• ระบบโอนเงินผ่าน Mock bank adapter (Sub-6) — real bank ใน Sub-7+</div>
          <div>• ทุกรายการมี Audit Log (Security Rule #5)</div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">รายละเอียดการถอนเงิน</h3>

        {/* Service ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Service ID (งานที่เสร็จแล้ว) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={serviceId}
            onChange={(e) => { setServiceId(e.target.value); setErrorMsg(null); }}
            placeholder="xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            {/* TODO Sub-7: แทนด้วย dropdown service picker */}
            UUID ของ service จาก หน้า Services ของคุณ
          </p>
        </div>

        {/* จำนวนเงิน (บาท) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            จำนวนเงินที่ต้องการถอน (บาท) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={MIN_AMOUNT_THB}
              step="1"
              value={amountThb}
              onChange={(e) => { setAmountThb(e.target.value); setErrorMsg(null); }}
              placeholder={`ขั้นต่ำ ${MIN_AMOUNT_THB} บาท`}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">บาท</span>
          </div>
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
            placeholder="เช่น 1234567890"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <p className="text-xs text-gray-400 mt-1">10-12 หลัก</p>
        </div>

        {/* ชื่อบัญชี */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ชื่อบัญชี (ต้องตรงกับบัตรประชาชน)
          </label>
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
          disabled={step === "submitting"}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {step === "submitting" ? "กำลังส่งคำขอ…" : "💸 ยืนยันการถอนเงิน"}
        </button>
      </div>
    </div>
  );
}
