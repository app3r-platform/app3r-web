"use client";
// T-16 — รายละเอียดประกาศบริการ (service listing · listing_meta)
// W-Round-1 Wave 2 · D83 state machine + ระบบพักเงินกลาง (Escrow)
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getListing, transitionListing } from "@/lib/listing-api";
import {
  type ListingMetaDto,
  type ListingState,
  type EscrowStatus,
  LISTING_STATE_LABELS,
  LISTING_TYPE_LABELS,
  WEEET_TRANSITIONS,
  escrowFromState,
} from "@/lib/types/listing-meta";

// ── D83 forward chain (สำหรับ visual stepper) ─────────────────────────────────
const STATE_CHAIN: ListingState[] = [
  "published",
  "has_offer",
  "matched",
  "completed",
];

const STATE_BADGE: Record<ListingState, string> = {
  draft: "bg-gray-800 border-gray-600 text-gray-300",
  published: "bg-blue-900/40 border-blue-700 text-blue-300",
  has_offer: "bg-yellow-900/40 border-yellow-700 text-yellow-300",
  matched: "bg-weeet-surface/20 border-weeet-primary/60 text-weeet-primary",
  completed: "bg-green-900/40 border-green-700 text-green-300",
  cancelled: "bg-red-900/40 border-red-700 text-red-300",
};

const ESCROW_VIEW: Record<EscrowStatus["phase"], { label: string; cls: string; icon: string }> = {
  none: { label: "ยังไม่พักเงิน", cls: "border-gray-700 text-gray-400", icon: "—" },
  held: { label: "พักเงินไว้ (held)", cls: "border-weeet-primary/60 text-weeet-primary", icon: "🔒" },
  released: { label: "ปล่อยเงินแล้ว (released)", cls: "border-green-700 text-green-300", icon: "✅" },
  refunded: { label: "คืนเงินผู้ซื้อ (refunded)", cls: "border-red-700 text-red-300", icon: "💸" },
};

export default function ServiceListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [listing, setListing] = useState<ListingMetaDto | null>(null);
  const [pointAmount, setPointAmount] = useState(0);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setNotFound(false);
    getListing(id)
      .then(({ data, pointAmount, source }) => {
        setListing(data);
        setPointAmount(pointAmount);
        setSource(source);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const doTransition = useCallback(
    async (to: ListingState) => {
      if (!listing) return;
      setActing(true);
      setActionError(null);
      try {
        // matched→completed = release escrow ให้เจ้าของ; matched→cancelled = refund ผู้ซื้อ
        await transitionListing(listing.listingId, {
          to,
          pointAmount,
          ...(to === "cancelled" ? { buyerUserId: listing.ownerId } : {}),
        });
        load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : String(e));
      } finally {
        setActing(false);
      }
    },
    [listing, pointAmount, load],
  );

  const escrow: EscrowStatus | null = listing
    ? escrowFromState(listing.state, pointAmount)
    : null;
  const techActions = listing ? WEEET_TRANSITIONS[listing.state] : [];

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">
          ←
        </button>
        <h1 className="font-bold text-white">
          {loading ? "ประกาศบริการ" : listing ? "รายละเอียดประกาศบริการ" : "ไม่พบประกาศ"}
        </h1>
        {!loading && source === "mock" && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-500">
            mock
          </span>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="bg-gray-800 rounded-xl h-28" />
            <div className="bg-gray-800 rounded-xl h-20" />
            <div className="bg-gray-800 rounded-xl h-16" />
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-12 space-y-2">
            <p className="text-3xl">🔧</p>
            <p className="text-gray-400 text-sm">ไม่พบประกาศบริการนี้</p>
            <button onClick={load} className="text-weeet-primary text-xs underline mt-2">
              ลองใหม่
            </button>
          </div>
        )}

        {!loading && listing && escrow && (
          <>
            {/* ── Meta summary ────────────────────────────────────────────── */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">ประเภท</p>
                <span className="text-sm font-medium text-white">
                  {LISTING_TYPE_LABELS[listing.listingType]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">สถานะ (D83)</p>
                <span
                  className={`text-xs px-3 py-1 rounded-full border font-medium ${STATE_BADGE[listing.state]}`}
                >
                  {LISTING_STATE_LABELS[listing.state]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">ผู้เข้าชม</p>
                  <p className="text-white font-bold">{listing.viewCount.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">ผู้ยื่นข้อเสนอ</p>
                  <p className="text-white font-bold">
                    {listing.offerCount === null ? (
                      <span className="text-gray-600 text-sm">ซ่อน (matched)</span>
                    ) : (
                      listing.offerCount.toLocaleString()
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-3 text-xs text-gray-600 space-y-0.5">
                <p>ตำบล (tambon): {listing.tambonId ?? "—"}</p>
                <p>เจ้าของงาน: <span className="font-mono">{listing.ownerId}</span></p>
                <p>อัปเดต: {new Date(listing.updatedAt).toLocaleString("th-TH")}</p>
              </div>
            </div>

            {/* ── Escrow panel (ระบบพักเงินกลาง) ──────────────────────────── */}
            <div className={`bg-gray-800 border rounded-xl p-4 space-y-2 ${ESCROW_VIEW[escrow.phase].cls}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {ESCROW_VIEW[escrow.phase].icon} ระบบพักเงินกลาง (Escrow)
                </p>
                <span className="text-xs font-medium">{ESCROW_VIEW[escrow.phase].label}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ฿{escrow.pointAmount.toLocaleString()}
                <span className="text-xs text-gray-500 font-normal ml-1">Gold Point</span>
              </p>
              <p className="text-xs text-gray-500">
                {escrow.phase === "held" &&
                  "เงินถูกพักไว้กลาง — จะปล่อยให้เจ้าของงานเมื่อช่างยืนยันส่งมอบ"}
                {escrow.phase === "released" && "ปล่อยเงินให้เจ้าของงานเรียบร้อยแล้ว"}
                {escrow.phase === "refunded" && "คืนเงินให้ผู้ซื้อเรียบร้อยแล้ว"}
                {escrow.phase === "none" && "ยังไม่มีการพักเงินสำหรับประกาศนี้"}
              </p>
            </div>

            {/* ── D83 stepper ─────────────────────────────────────────────── */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                ลำดับสถานะ (D83)
              </p>
              {listing.state === "cancelled" ? (
                <p className="text-sm text-red-300">❌ ประกาศถูกยกเลิก</p>
              ) : (
                <div className="flex items-center">
                  {STATE_CHAIN.map((s, i) => {
                    const curIdx = STATE_CHAIN.indexOf(listing.state);
                    const done = curIdx >= 0 && i <= curIdx;
                    const active = s === listing.state;
                    return (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                              active
                                ? "bg-weeet-primary border-weeet-primary text-white"
                                : done
                                  ? "bg-green-800 border-green-600 text-green-200"
                                  : "bg-gray-900 border-gray-700 text-gray-600"
                            }`}
                          >
                            {done && !active ? "✓" : i + 1}
                          </div>
                          <span className="text-[9px] text-gray-500 mt-1 text-center leading-tight w-14">
                            {LISTING_STATE_LABELS[s].split(" (")[0]}
                          </span>
                        </div>
                        {i < STATE_CHAIN.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 mx-1 ${i < curIdx ? "bg-green-600" : "bg-gray-700"}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Technician actions ──────────────────────────────────────── */}
            {actionError && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
                ⚠️ {actionError}
              </p>
            )}

            {techActions.includes("completed") && (
              <button
                onClick={() => doTransition("completed")}
                disabled={acting}
                className="w-full py-3.5 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {acting ? "กำลังดำเนินการ..." : "✅ ยืนยันส่งมอบงาน (ปล่อยเงิน Escrow)"}
              </button>
            )}

            {techActions.includes("cancelled") && (
              <button
                onClick={() => doTransition("cancelled")}
                disabled={acting}
                className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-red-900/50 text-red-300 font-medium text-sm transition-colors disabled:opacity-50"
              >
                ยกเลิกงาน (คืนเงินผู้ซื้อ)
              </button>
            )}

            {techActions.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                ไม่มีการดำเนินการสำหรับช่างในสถานะนี้
              </p>
            )}

            <p className="text-center text-xs text-gray-700 font-mono pt-1">
              Listing ID: {listing.listingId}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
