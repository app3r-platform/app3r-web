"use client";
// WeeeT — Parts Reserve & Request (B5-WeeeT STEP 1)
// จุดเข้า: /jobs/[id]/parts
// Phase 2 = mockup · ไม่ fetch API จริง · state local
// TODO backend: POST /api/v1/jobs/:id/parts/reserve/ · /parts/purchase-request/
import { use, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────────

type SourceType = "warehouse" | "market";

type PartItem = {
  id: string;
  name: string;
  source_type: SourceType;
  unit: string;
  unit_price: number | null; // null = ฟรี (จากคลัง)
  stock: number;             // 0 = ต้องสั่งซื้อ
};

type RequestLine = {
  part: PartItem;
  qty: number;
  notes: string;
};

type PageState = "selecting" | "submitting" | "submitted_reserve" | "submitted_purchase";

// ─── Mock inventory ──────────────────────────────────────────────────────────

const MOCK_PARTS: PartItem[] = [
  {
    id: "p001",
    name: "คอมเพรสเซอร์ Daikin 12000 BTU",
    source_type: "warehouse",
    unit: "ชิ้น",
    unit_price: 2500,
    stock: 3,
  },
  {
    id: "p002",
    name: "น้ำยาแอร์ R32 (กระป๋อง 500g)",
    source_type: "warehouse",
    unit: "กระป๋อง",
    unit_price: null, // ฟรีจากคลัง
    stock: 10,
  },
  {
    id: "p003",
    name: "แผงวงจรบอร์ด PCB Mitsubishi",
    source_type: "market",
    unit: "ชิ้น",
    unit_price: 1800,
    stock: 0, // ต้องสั่งซื้อ
  },
  {
    id: "p004",
    name: "มอเตอร์พัดลม Carrier",
    source_type: "warehouse",
    unit: "ชิ้น",
    unit_price: 950,
    stock: 2,
  },
  {
    id: "p005",
    name: "สายไฟ (แบ่งขาย/เมตร)",
    source_type: "warehouse",
    unit: "เมตร",
    unit_price: 45,
    stock: 50,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_BADGE: Record<SourceType, { label: string; cls: string }> = {
  warehouse: {
    label: "คลัง WeeeR",
    cls: "bg-weeet-primary/15 text-weeet-primary border border-weeet-dark/40",
  },
  market: {
    label: "สั่งซื้อภายนอก",
    cls: "bg-amber-900/30 text-amber-300 border border-amber-700/40",
  },
};

function canReserve(part: PartItem) {
  return part.source_type === "warehouse" && part.stock > 0;
}

function canPurchase(part: PartItem) {
  return part.source_type === "market" || part.stock === 0;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PartsRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("selecting");
  const [selected, setSelected] = useState<Record<string, number>>({});  // part.id → qty
  const [notes, setNotes] = useState<Record<string, string>>({});        // part.id → notes
  const [globalNotes, setGlobalNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Build selected lines
  const lines: RequestLine[] = MOCK_PARTS.filter(
    (p) => (selected[p.id] ?? 0) > 0
  ).map((p) => ({
    part: p,
    qty: selected[p.id],
    notes: notes[p.id] ?? "",
  }));

  const totalItems = lines.reduce((s, l) => s + l.qty, 0);
  const hasReservable = lines.some((l) => canReserve(l.part));
  const hasPurchasable = lines.some((l) => canPurchase(l.part));

  async function handleSubmit(action: "reserve" | "purchase") {
    if (lines.length === 0) return;
    setSubmitError(null);
    setPageState("submitting");

    // Mock delay — TODO: POST /api/v1/jobs/:id/parts/reserve/ or /purchase-request/
    await new Promise((r) => setTimeout(r, 1200));

    setPageState(action === "reserve" ? "submitted_reserve" : "submitted_purchase");
  }

  // ── Submitted ─────────────────────────────────────────────────────────────
  if (pageState === "submitted_reserve" || pageState === "submitted_purchase") {
    const isReserve = pageState === "submitted_reserve";
    return (
      <div className="pb-20 px-4 pt-6 flex flex-col items-center text-center gap-4">
        <p className="text-5xl">{isReserve ? "📦" : "🛒"}</p>
        <p className="font-bold text-white text-lg">
          {isReserve ? "จองอะไหล่สำเร็จ" : "ส่งคำขอสั่งซื้อแล้ว"}
        </p>
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
          {isReserve
            ? "WeeeR ได้รับคำขอจองอะไหล่จากคลังแล้ว — รอการยืนยัน"
            : "WeeeR ได้รับคำขอสั่งซื้ออะไหล่ภายนอกแล้ว — รอการอนุมัติ"}
        </p>

        <div className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-left space-y-2 mt-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
            รายการที่ขอ
          </p>
          {lines.map((l) => (
            <div key={l.part.id} className="flex justify-between text-sm">
              <span className="text-gray-300">{l.part.name}</span>
              <span className="text-gray-400">×{l.qty}</span>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col gap-2 mt-2">
          <button
            onClick={() => router.push("/parts/requests")}
            className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            📋 ดูประวัติคำขออะไหล่
          </button>
          <button
            onClick={() => router.push(`/jobs/${id}`)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm border border-gray-700"
          >
            ← กลับหน้างาน
          </button>
        </div>
      </div>
    );
  }

  // ── Submitting ────────────────────────────────────────────────────────────
  if (pageState === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-weeet-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">กำลังส่งคำขอ...</p>
      </div>
    );
  }

  // ── Selecting ─────────────────────────────────────────────────────────────
  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-base">🔩 ขออะไหล่</h1>
          <p className="text-xs text-gray-400 font-mono">{id}</p>
        </div>
        {totalItems > 0 && (
          <span className="text-xs bg-weeet-primary text-white px-2 py-0.5 rounded-full">
            {totalItems} ชิ้น
          </span>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Legend */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-weeet-primary/15 text-weeet-primary border border-weeet-dark/40">
            คลัง WeeeR — จองได้ทันที
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-300 border border-amber-700/40">
            สั่งซื้อภายนอก — ต้องรออนุมัติ
          </span>
        </div>

        {/* Parts list */}
        <div className="space-y-3">
          {MOCK_PARTS.map((part) => {
            const qty = selected[part.id] ?? 0;
            const badge = SOURCE_BADGE[part.source_type];
            const outOfStock = part.stock === 0 && part.source_type === "warehouse";

            return (
              <div
                key={part.id}
                className={`bg-gray-800 border rounded-xl p-4 space-y-3 transition-colors ${
                  qty > 0
                    ? "border-weeet-dark/60"
                    : outOfStock
                    ? "border-gray-700/40 opacity-50"
                    : "border-gray-700"
                }`}
              >
                {/* Part info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm leading-snug">{part.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {part.unit_price === null ? (
                        <span className="text-xs text-green-400 font-medium">ฟรี</span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          ฿{part.unit_price.toLocaleString()}/{part.unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {part.source_type === "warehouse" ? (
                      <p className={`text-xs font-semibold ${part.stock > 0 ? "text-green-400" : "text-red-400"}`}>
                        {part.stock > 0 ? `คงเหลือ ${part.stock} ${part.unit}` : "หมดคลัง"}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-400">สั่งซื้อได้</p>
                    )}
                  </div>
                </div>

                {/* Qty stepper */}
                {!outOfStock && (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-500 shrink-0">จำนวน:</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setSelected((s) => ({
                            ...s,
                            [part.id]: Math.max(0, (s[part.id] ?? 0) - 1),
                          }))
                        }
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-30 flex items-center justify-center text-sm transition-colors"
                      >
                        −
                      </button>
                      <span className="text-white font-semibold w-6 text-center text-sm">
                        {qty}
                      </span>
                      <button
                        onClick={() =>
                          setSelected((s) => ({
                            ...s,
                            [part.id]: (s[part.id] ?? 0) + 1,
                          }))
                        }
                        className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">{part.unit}</span>
                  </div>
                )}

                {/* Per-item notes (only if selected) */}
                {qty > 0 && (
                  <input
                    type="text"
                    value={notes[part.id] ?? ""}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [part.id]: e.target.value }))
                    }
                    placeholder="หมายเหตุสำหรับรายการนี้ (ถ้ามี)"
                    className="w-full bg-gray-900/60 border border-gray-700 text-gray-200 text-xs px-3 py-2 rounded-lg placeholder-gray-600 focus:outline-none focus:border-weeet-dark"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Global notes */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">หมายเหตุรวม</label>
          <textarea
            value={globalNotes}
            onChange={(e) => setGlobalNotes(e.target.value)}
            rows={2}
            placeholder="รายละเอียดเพิ่มเติม เช่น ขนาด รุ่น หรือความเร่งด่วน"
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm px-3 py-2.5 rounded-xl placeholder-gray-600 focus:outline-none focus:border-weeet-dark resize-none"
          />
        </div>

        {/* Error */}
        {submitError && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-xl px-3 py-2">
            {submitError}
          </p>
        )}
      </div>

      {/* Sticky action bar */}
      {lines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3 space-y-2 z-20">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{lines.length} รายการ · {totalItems} ชิ้น</span>
            <span>
              {hasReservable && hasPurchasable
                ? "มีทั้งจองและสั่งซื้อ"
                : hasReservable
                ? "จากคลัง WeeeR"
                : "สั่งซื้อภายนอก"}
            </span>
          </div>

          {hasReservable && (
            <button
              onClick={() => handleSubmit("reserve")}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              📦 จองอะไหล่จากคลัง (RESERVE)
            </button>
          )}
          {hasPurchasable && (
            <button
              onClick={() => handleSubmit("purchase")}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              🛒 ขอสั่งซื้ออะไหล่ภายนอก
            </button>
          )}
        </div>
      )}
    </div>
  );
}
