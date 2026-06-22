"use client";
// WeeeR — B2.5 PackageOffer compose (REP-C07) + awaiting_parts per-option price (REP-C08)
// SoT Gen 55/56: WeeeR จัด 2 packages (A แท้ 90วัน แนะนำ / B มือสอง 30วัน) → ส่ง WeeeU เลือก 1.
// แต่ละ package: ค่าอะไหล่ + ค่าแรง + ค่าเดินทาง + เวลาเสร็จ + รับประกัน. ปุ่มแก้ราคาต่อ package.
// C08: WeeeR ตั้งราคาต่อทางเลือก awaiting_parts (ยกกลับร้าน / ช่างกลับมาใหม่).
// จุดเข้า: /repair/jobs/[id]/packages (หลังช่างส่ง B3.5). Mock-level — TODO backend.
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PACKAGE_KIND_META,
  AWAITING_PARTS_OPTION_META,
  type RepairPackage,
  type PackageKind,
  type AwaitingPartsOption,
} from "../../../_lib/types";
import { MOCK_PACKAGE_OFFER, MOCK_AWAITING_PARTS_PRICING } from "../../../_lib/mock";

const AWAITING_OPTIONS: AwaitingPartsOption[] = ["take_back", "return_visit"];

export default function PackageComposePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [packages, setPackages] = useState<RepairPackage[]>(
    MOCK_PACKAGE_OFFER.packages.map((p) => ({ ...p, parts: p.parts.map((x) => ({ ...x })) })),
  );
  const [note, setNote] = useState("");
  const [awaitingPrice, setAwaitingPrice] = useState<Record<AwaitingPartsOption, string>>({
    take_back: String(MOCK_AWAITING_PARTS_PRICING.options.take_back.price),
    return_visit: String(MOCK_AWAITING_PARTS_PRICING.options.return_visit.price),
  });
  const [editingKind, setEditingKind] = useState<PackageKind | null>(null);
  const [sent, setSent] = useState(false);

  // recompute total เมื่อแก้ค่าแรง/เดินทาง/อะไหล่
  const recompute = (p: RepairPackage): RepairPackage => ({
    ...p,
    total: p.parts_cost + p.labor_cost + p.travel_cost,
  });

  const patchPackage = (kind: PackageKind, patch: Partial<RepairPackage>) =>
    setPackages((prev) => prev.map((p) => (p.kind === kind ? recompute({ ...p, ...patch }) : p)));

  const deposit = MOCK_PACKAGE_OFFER.deposit_amount ?? 0;

  const valid = useMemo(
    () =>
      packages.every((p) => p.total > 0 && p.warranty_days > 0) &&
      AWAITING_OPTIONS.every((o) => awaitingPrice[o] !== "" && Number(awaitingPrice[o]) >= 0),
    [packages, awaitingPrice],
  );

  const handleSend = () => {
    if (!valid) return;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-5 max-w-xl">
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <span className="text-4xl mb-3">📤</span>
          <p className="text-sm font-semibold text-green-700">ส่งข้อเสนอ 2 Package ให้ลูกค้าแล้ว</p>
          <p className="text-xs text-gray-400 mt-1">WeeeU จะเลือก Package หรือยุติงานซ่อม</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
          {packages.map((p) => {
            const meta = PACKAGE_KIND_META[p.kind];
            return (
              <div key={p.kind} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {meta.label} · {meta.partsLabel} · รับประกัน {p.warranty_days} วัน
                </span>
                <span className="font-semibold text-[#D63B12]">{p.total.toLocaleString()} pts</span>
              </div>
            );
          })}
        </div>
        <Link
          href={`/repair/jobs/${id}`}
          className="block text-center w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          กลับไปหน้างาน
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">B2.5 — เสนอ 2 Package</h1>
          <p className="text-xs text-gray-400">{MOCK_PACKAGE_OFFER.appliance_name} · งาน #{id}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
        ℹ️ จัด 2 ทางเลือกให้ลูกค้าเลือก — <b>Package A อะไหล่แท้</b> (รับประกัน 90 วัน · แนะนำ) และ{" "}
        <b>Package B อะไหล่มือสอง</b> (รับประกัน 30 วัน). ลูกค้าเลือก 1 หรือยุติงาน.
      </div>

      {/* ── 2 Package cards ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {packages.map((p) => {
          const meta = PACKAGE_KIND_META[p.kind];
          const editing = editingKind === p.kind;
          return (
            <div
              key={p.kind}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                meta.recommended ? "border-[#FFB199]" : "border-gray-100"
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{meta.label}</p>
                    {meta.recommended && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFE0D6] text-[#D63B12]">
                        แนะนำ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.partsLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#D63B12]">{p.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">พอยต์ทอง</p>
                </div>
              </div>

              {/* parts breakdown */}
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
                  <p className="text-[10px] text-amber-600 pt-1">* อะไหล่ไม่มีเวอร์ชั่นมือสอง — ใช้ของแท้ทั้ง 2 package</p>
                )}
              </div>

              {/* cost rows */}
              <div className="px-5 py-3 space-y-2">
                <CostRow label="ค่าอะไหล่" value={p.parts_cost} />
                {editing ? (
                  <>
                    <EditRow
                      label="ค่าแรง"
                      value={p.labor_cost}
                      onChange={(v) => patchPackage(p.kind, { labor_cost: v })}
                    />
                    <EditRow
                      label="ค่าเดินทาง"
                      value={p.travel_cost}
                      onChange={(v) => patchPackage(p.kind, { travel_cost: v })}
                    />
                    <EditRow
                      label="เวลาเสร็จ (วัน)"
                      value={p.duration_days}
                      onChange={(v) => patchPackage(p.kind, { duration_days: v })}
                    />
                    <EditRow
                      label="รับประกัน (วัน)"
                      value={p.warranty_days}
                      onChange={(v) => patchPackage(p.kind, { warranty_days: v })}
                    />
                  </>
                ) : (
                  <>
                    <CostRow label="ค่าแรง" value={p.labor_cost} />
                    <CostRow label="ค่าเดินทาง" value={p.travel_cost} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">เวลาเสร็จ</span>
                      <span className="text-gray-700 font-medium">{p.duration_days} วัน</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">รับประกัน</span>
                      <span className="text-gray-700 font-medium">{p.warranty_days} วัน</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">รวมทั้งสิ้น</span>
                  <span className="text-sm font-bold text-[#D63B12]">{p.total.toLocaleString()} pts</span>
                </div>
              </div>

              <div className="px-5 pb-4">
                <button
                  onClick={() => setEditingKind(editing ? null : p.kind)}
                  className="text-xs font-medium text-[#F04E20] hover:underline"
                >
                  {editing ? "✓ เสร็จสิ้นการแก้ราคา" : "✏️ แก้ราคา Package นี้"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── REP-C08: awaiting_parts per-option price ────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">ค่าใช้จ่ายกรณีรออะไหล่ (awaiting_parts)</p>
          <p className="text-xs text-gray-400 mt-0.5">
            ช่างถามลูกค้าหน้างานแล้ว — ตั้งราคาต่อทางเลือกให้ลูกค้าตัดสินใจ
          </p>
        </div>
        {AWAITING_OPTIONS.map((o) => {
          const meta = AWAITING_PARTS_OPTION_META[o];
          return (
            <div key={o} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">{meta.label}</p>
                <p className="text-xs text-gray-400">{meta.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  value={awaitingPrice[o]}
                  onChange={(e) => setAwaitingPrice((prev) => ({ ...prev, [o]: e.target.value }))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
                />
                <span className="text-xs text-gray-400">pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* note to customer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุถึงลูกค้า</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="เช่น แนะนำ Package A เพราะอะไหล่แท้ทนกว่า รับประกันนานกว่า"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none"
        />
      </div>

      {deposit > 0 && (
        <p className="text-xs text-gray-400 text-center">
          🔒 พอยต์ทองที่ล็อก: {deposit.toLocaleString()} pts — หากลูกค้ายุติงาน ระบบจะเตือนเรื่องพอยต์ทองที่ล็อก + ค่าเดินทางตาม offer เดิม
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          บันทึก draft
        </button>
        <button
          onClick={handleSend}
          disabled={!valid}
          className="flex-1 bg-[#FF663A] hover:bg-[#F04E20] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          ส่งข้อเสนอให้ลูกค้า
        </button>
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        👁 WeeeU เห็น: <code>U · /repair/{id}/packages</code> (เลือก Package / ยุติงาน)
      </p>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium">{value.toLocaleString()} pts</span>
    </div>
  );
}

function EditRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
        />
      </div>
    </div>
  );
}
