"use client";
// WeeeU — B2.5 Package selection (REP-C07) + awaiting_parts binary choice (REP-C08)
// SoT Gen 55/56: WeeeR เสนอ 2 packages (A แท้ 90วัน แนะนำ / B มือสอง 30วัน).
// WeeeU เลือก 1 package หรือ "ไม่ตกลงราคา → ยุติงานซ่อม" (เตือนมัดจำ + ค่าเดินทาง).
// C08: ถ้ามีอะไหล่ต้องสั่ง → ลูกค้าเลือกทางเลือก awaiting_parts (ราคา WeeeR ตั้ง).
// เป็น 2-package choice — NOT bid-list (ต่างจาก /offers). Mock-level — TODO backend.
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SEED_PACKAGE_OFFER,
  PACKAGE_KIND_META,
  AWAITING_PARTS_OPTION_META,
  SEED_AWAITING_PARTS_PRICING,
  type PackageKind,
  type AwaitingPartsOption,
} from "@/lib/mock-data/repair-receipt";

const AWAITING_OPTIONS: AwaitingPartsOption[] = ["take_back", "return_visit"];

export default function RepairPackagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const offer = SEED_PACKAGE_OFFER;

  const [selected, setSelected] = useState<PackageKind | null>(null);
  const [awaiting, setAwaiting] = useState<AwaitingPartsOption | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [done, setDone] = useState<"selected" | "cancelled" | null>(null);

  // C08 ปรากฏเมื่อ package ที่เลือกมีอะไหล่ต้องสั่ง (mock: ทุก package ต้องเลือกทางเลือก)
  const needsAwaitingChoice = selected !== null;
  const canConfirm = selected !== null && (!needsAwaitingChoice || awaiting !== null);

  const selectedPkg = offer.packages.find((p) => p.kind === selected);
  const awaitingFee = awaiting ? SEED_AWAITING_PARTS_PRICING[awaiting].price : 0;
  const grandTotal = (selectedPkg?.total ?? 0) + awaitingFee;

  if (done === "selected" && selectedPkg) {
    const meta = PACKAGE_KIND_META[selectedPkg.kind];
    return (
      <div className="max-w-xl space-y-5">
        <div className="flex flex-col items-center text-center py-6 gap-2">
          <span className="text-5xl">✅</span>
          <p className="text-lg font-bold text-weeeu-dark">เลือก {meta.label} แล้ว</p>
          <p className="text-xs text-gray-500">{meta.partsLabel} · รับประกัน {selectedPkg.warranty_days} วัน</p>
        </div>
        <div className="bg-weeeu-surface border border-weeeu-surface rounded-2xl p-4 space-y-2">
          <Row label="ค่าซ่อม (Package)" value={`${selectedPkg.total.toLocaleString()} พอยต์ทอง`} />
          {awaiting && (
            <Row
              label={`รออะไหล่ · ${AWAITING_PARTS_OPTION_META[awaiting].label}`}
              value={awaitingFee > 0 ? `+${awaitingFee.toLocaleString()} พอยต์ทอง` : "ไม่มีค่าใช้จ่ายเพิ่ม"}
            />
          )}
          <div className="flex items-center justify-between pt-2 border-t border-weeeu-primary/20">
            <span className="text-sm font-semibold text-weeeu-dark">รวมทั้งสิ้น</span>
            <span className="text-sm font-bold text-weeeu-primary">{grandTotal.toLocaleString()} พอยต์ทอง</span>
          </div>
        </div>
        <Link
          href={`/repair/${id}`}
          className="block text-center w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl transition-colors"
        >
          ดูสถานะงานซ่อม
        </Link>
      </div>
    );
  }

  if (done === "cancelled") {
    return (
      <div className="max-w-xl space-y-5">
        <div className="flex flex-col items-center text-center py-6 gap-2">
          <span className="text-5xl">🛑</span>
          <p className="text-lg font-bold text-gray-800">ยุติงานซ่อมแล้ว</p>
          <p className="text-xs text-gray-500">ไม่ตกลงราคา — งานซ่อมถูกยุติ</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
          <p className="text-sm font-semibold text-amber-800">ค่าใช้จ่ายที่ต้องชำระ</p>
          {offer.deposit_amount ? (
            <Row label="มัดจำที่ล็อกไว้" value={`${offer.deposit_amount.toLocaleString()} พอยต์ทอง`} />
          ) : null}
          {offer.travel_fee_on_cancel ? (
            <Row label="ค่าเดินทาง (ตาม offer เดิม)" value={`${offer.travel_fee_on_cancel.toLocaleString()} พอยต์ทอง`} />
          ) : null}
        </div>
        <Link
          href={`/repair/${id}`}
          className="block text-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          กลับไปหน้างานซ่อม
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ข้อเสนอจากร้าน (B2.5)</h1>
          <p className="text-xs text-gray-400">{offer.appliance_name}</p>
        </div>
      </div>

      <div className="bg-weeeu-surface border border-weeeu-surface rounded-2xl p-4 text-xs text-weeeu-text">
        ร้านเสนอ <b>2 ทางเลือก</b> — เลือก 1 Package ที่ต้องการ หรือยุติงานซ่อมหากไม่ตกลงราคา
      </div>

      {/* ── 2 Package choice ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {offer.packages.map((p) => {
          const meta = PACKAGE_KIND_META[p.kind];
          const isSel = selected === p.kind;
          return (
            <button
              key={p.kind}
              onClick={() => { setSelected(p.kind); setAwaiting(null); }}
              className={`w-full text-left bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-colors ${
                isSel ? "border-weeeu-primary" : meta.recommended ? "border-weeeu-primary/30" : "border-gray-100"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{meta.label}</p>
                    {meta.recommended && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-weeeu-surface text-weeeu-dark">
                        แนะนำ
                      </span>
                    )}
                    {isSel && <span className="text-weeeu-primary text-sm">✓</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.partsLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-weeeu-primary">{p.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">พอยต์ทอง</p>
                </div>
              </div>

              <div className="px-5 py-3 space-y-1.5 border-b border-gray-50">
                {p.parts.map((part, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {part.name}
                      {part.genuine_only && <span className="text-amber-600"> *</span>} × {part.qty} {part.unit}
                    </span>
                    <span className="text-gray-700 font-medium">{part.price.toLocaleString()}</span>
                  </div>
                ))}
                {p.parts.some((x) => x.genuine_only) && (
                  <p className="text-[10px] text-amber-600 pt-1">* อะไหล่ไม่มีเวอร์ชั่นมือสอง — ใช้ของแท้</p>
                )}
              </div>

              <div className="px-5 py-3 space-y-2">
                <Row label="ค่าอะไหล่" value={`${p.parts_cost.toLocaleString()} พอยต์ทอง`} small />
                <Row label="ค่าแรง" value={`${p.labor_cost.toLocaleString()} พอยต์ทอง`} small />
                <Row label="ค่าเดินทาง" value={`${p.travel_cost.toLocaleString()} พอยต์ทอง`} small />
                <Row label="เวลาเสร็จ (ประมาณ)" value={`${p.duration_days} วัน`} small />
                <Row label="รับประกัน" value={`${p.warranty_days} วัน`} small />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── REP-C08: awaiting_parts binary choice ───────────────────────── */}
      {needsAwaitingChoice && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">มีอะไหล่ต้องสั่ง — เลือกวิธีดำเนินการ</p>
            <p className="text-xs text-gray-400 mt-0.5">ช่างสอบถามหน้างานแล้ว เลือก 1 ทาง</p>
          </div>
          {AWAITING_OPTIONS.map((o) => {
            const meta = AWAITING_PARTS_OPTION_META[o];
            const price = SEED_AWAITING_PARTS_PRICING[o].price;
            const isSel = awaiting === o;
            return (
              <button
                key={o}
                onClick={() => setAwaiting(o)}
                className={`w-full text-left border-2 rounded-xl p-3 flex items-center gap-3 transition-colors ${
                  isSel ? "border-weeeu-primary bg-weeeu-surface/40" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-xl">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{meta.label}</p>
                  <p className="text-xs text-gray-400">{meta.desc}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${price > 0 ? "text-weeeu-primary" : "text-gray-400"}`}>
                  {price > 0 ? `+${price.toLocaleString()}` : "ฟรี"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {offer.note_to_customer && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          💬 หมายเหตุจากร้าน: {offer.note_to_customer}
        </div>
      )}

      {/* total preview */}
      {selectedPkg && (
        <div className="bg-weeeu-surface border border-weeeu-primary/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-weeeu-dark">รวมที่จะชำระ</span>
          <span className="text-base font-bold text-weeeu-primary">{grandTotal.toLocaleString()} พอยต์ทอง</span>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => setDone("selected")}
          disabled={!canConfirm}
          className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {selected === null
            ? "เลือก Package ก่อน"
            : needsAwaitingChoice && awaiting === null
              ? "เลือกวิธีดำเนินการก่อน"
              : "✅ ยืนยันเลือก Package นี้"}
        </button>

        {!confirmCancel ? (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full border border-gray-200 text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            ไม่ตกลงราคา — ยุติงานซ่อม
          </button>
        ) : (
          <div className="border border-amber-300 bg-amber-50 rounded-xl p-3 space-y-2">
            <p className="text-xs text-amber-800">
              ⚠️ หากยุติงาน คุณจะถูกเรียกเก็บ
              {offer.deposit_amount ? ` มัดจำ ${offer.deposit_amount.toLocaleString()} พอยต์ทอง` : ""}
              {offer.travel_fee_on_cancel ? ` + ค่าเดินทาง ${offer.travel_fee_on_cancel.toLocaleString()} พอยต์ทอง` : ""}{" "}
              ตามข้อเสนอเดิม ยืนยันหรือไม่?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => setDone("cancelled")}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg"
              >
                ยืนยันยุติงาน
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        👁 มาจาก WeeeR: <code>R · /repair/jobs/{id}/packages</code>
      </p>
    </div>
  );
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-gray-400 ${small ? "text-xs" : "text-sm"}`}>{label}</span>
      <span className={`text-gray-700 font-medium ${small ? "text-xs" : "text-sm"}`}>{value}</span>
    </div>
  );
}
