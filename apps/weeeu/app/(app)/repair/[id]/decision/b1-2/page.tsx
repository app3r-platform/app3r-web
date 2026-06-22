"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { WeeeUDeclineGroup } from "@/lib/types";
import { WEEEU_DECLINE_GROUPS, DECLINE_MAX_PHOTOS } from "@/lib/types";

type PartItem = { name: string; qty: number; price: number };

type B12Data = {
  id: string;
  appliance_name: string;
  weeer_name: string;
  original_price: number;
  proposed_price: number;
  parts_added: PartItem[];
  decision_notes: string;
  negotiation_round: number;
  deposit_amount: number | null;
  deposit_policy_when_user_rejects_change: string;
};

// ── Mock fallback ──────────────────────────────────────────────────────────────
const MOCK_B1_DECISION: B12Data = {
  id: "job-001",
  appliance_name: "เครื่องซักผ้า LG",
  weeer_name: "ร้านซ่อมดีเจริญ",
  original_price: 800,
  proposed_price: 1350,
  parts_added: [
    { name: "มอเตอร์ปั่นแห้ง LG WD-14", qty: 1, price: 450 },
    { name: "สายพาน V-belt 60cm", qty: 1, price: 100 },
  ],
  decision_notes: "ตรวจพบมอเตอร์ปั่นแห้งเสื่อมและสายพานหลุด ต้องเปลี่ยนทั้งสองชิ้น",
  negotiation_round: 1,
  deposit_amount: 200,
  deposit_policy_when_user_rejects_change: "refund_partial",
};

const MAX_ROUNDS = 2;

const DEPOSIT_REJECT_LABEL: Record<string, string> = {
  free: "ปฏิเสธได้ฟรี (ไม่มีค่าใช้จ่าย)",
  forfeit: "ยึดพอยต์ทองที่ล็อก",
  refund: "คืนพอยต์ทองที่ล็อก",
  refund_partial: "หักค่าเดินทาง แล้วคืนส่วนที่เหลือ",
};

export default function DecisionB12Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<B12Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"confirm" | "counter" | "decline" | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // REP-C11 — WeeeU ปฏิเสธให้ซ่อม: modal เหตุผล 3 กลุ่ม + textarea + รูป ≤3 (SoT Gen 55, mirror WeeeT)
  const [declineGroup, setDeclineGroup] = useState<WeeeUDeclineGroup | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declinePhotos, setDeclinePhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const declinePhotoRef = useRef<HTMLInputElement>(null);

  const addDeclinePhotos = (files: FileList | null) => {
    if (!files) return;
    const toAdd: { file: File; previewUrl: string }[] = [];
    for (const file of Array.from(files)) {
      if (declinePhotos.length + toAdd.length >= DECLINE_MAX_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setDeclinePhotos((prev) => [...prev, ...toAdd]);
  };
  const removeDeclinePhoto = (i: number) =>
    setDeclinePhotos((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });

  // ครบเมื่อ: เลือกกลุ่ม + textarea มีข้อความ (รูป optional)
  const declineComplete = declineGroup !== null && declineReason.trim().length > 0;

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูล"); return; }
        setData({
          id: d.id,
          appliance_name: d.appliance_name,
          weeer_name: d.weeer_name,
          original_price: d.original_price ?? 0,
          proposed_price: d.proposed_price ?? 0,
          parts_added: d.parts_added ?? [],
          decision_notes: d.decision_notes ?? "",
          negotiation_round: d.negotiation_round ?? 1,
          deposit_amount: d.deposit_amount,
          deposit_policy_when_user_rejects_change: d.deposit_policy_when_user_rejects_change ?? "free",
        });
      })
      .catch(() => {
        setData(prev => prev ?? MOCK_B1_DECISION);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (type: "confirm" | "counter" | "decline") => {
    if (type === "counter" && !counterPrice) {
      setError("กรุณาระบุราคาที่ต้องการต่อรอง");
      return;
    }
    // REP-C11: decline ต้องเลือกกลุ่มเหตุผล + กรอกรายละเอียดก่อน
    if (type === "decline" && !declineComplete) {
      setError("กรุณาเลือก 1 กลุ่มเหตุผล และกรอกรายละเอียด");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const endpoint = `/api/v1/repair/jobs/${id}/quote/${type}`;
      const body =
        type === "counter"
          ? { counter_price: parseFloat(counterPrice), round: (data?.negotiation_round ?? 1) + 1 }
          : type === "decline"
            ? {
                // REP-C11 mirror modal — บันทึก audit log (mock-level: นับไฟล์รูปเท่านั้น)
                decline_group: declineGroup,
                decline_reason: declineReason.trim(),
                decline_photo_count: declinePhotos.length,
              }
            : {};

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      // decline → ไปหน้า Fee Settle (เตือนมัดจำ + ค่าเดินทางตาม offer · C11/C5) | อื่นๆ → repair detail
      router.push(type === "decline" ? `/repair/${id}/fee-settle` : `/repair/${id}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      {/* ── mock-anno §5 origin (U-52a REPAIR-B1-DECISION) ──────────────────── */}
      <div className="mock-anno mock-anno-origin">
        ◀ §5 มาจาก: <code>U-04</code> REPAIR-DETAIL (state: awaiting_user, decision_branch=B1.2)
      </div>
      {/* ── mock-anno §8 cross-app ───────────────────────────────────────────── */}
      <div className="mock-anno mock-anno-xapp">
        §8 👁 ณ จังหวะนี้:{" "}
        <a href="http://localhost:3001/repair/jobs" target="_blank" rel="noopener noreferrer">
          <code>R-11</code> WeeeR: REPAIR-JOB-DETAIL (awaiting_user · B1.2 pending)
        </a>
        {" · "}
        <a href="http://localhost:3003/jobs" target="_blank" rel="noopener noreferrer">
          <code>T-03</code> WeeeT: repair paused (รอผลตัดสิน)
        </a>
      </div>
      {/* ── mock-anno §6 nav ─────────────────────────────────────────────────── */}
      {/* §6: ✅ อนุมัติ → U-04 REPAIR-DETAIL (in_progress) */}
      {/* §6: ❌ ปฏิเสธ → U-04 REPAIR-DETAIL (cancelled) */}
      {/* §6: 💬 ต่อรอง → counter form (same page) */}
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ข้อเสนอราคาเพิ่ม (B1.2)</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-800">⚠️ ร้านซ่อมพบว่าต้องเพิ่มอะไหล่</p>
        <p className="text-xs text-amber-600 mt-1">
          ช่างตรวจพบว่าต้องเปลี่ยนอะไหล่เพิ่มเติม — กรุณาตอบรับหรือต่อรองราคา
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Price comparison */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เปรียบเทียบราคา (พอยต์ทอง / Gold Point)</p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">ราคาเดิม</p>
                <p className="text-lg font-bold text-gray-600">{data.original_price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">พอยต์ทอง</p>
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex-1 text-center bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-500 mb-1">ราคาใหม่</p>
                <p className="text-xl font-bold text-orange-700">{data.proposed_price.toLocaleString()}</p>
                <p className="text-xs text-orange-500">พอยต์ทอง</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                ราคาเพิ่มขึ้น{" "}
                <span className="font-semibold text-orange-600">
                  +{(data.proposed_price - data.original_price).toLocaleString()} พอยต์ทอง
                </span>
              </p>
            </div>
          </div>

          {/* Parts list */}
          {data.parts_added.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">อะไหล่ที่ต้องเพิ่ม</p>
              {data.parts_added.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-700">{p.name} × {p.qty}</p>
                  <p className="text-sm font-medium text-gray-800">{p.price.toLocaleString()} พอยต์ทอง</p>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {data.decision_notes && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">หมายเหตุจากช่าง</p>
              <p className="text-sm text-gray-600">{data.decision_notes}</p>
            </div>
          )}

          {/* Reject policy */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">
              หากปฏิเสธ: <strong>{DEPOSIT_REJECT_LABEL[data.deposit_policy_when_user_rejects_change]}</strong>
              {data.deposit_amount && ` (พอยต์ทองที่ล็อก ${data.deposit_amount.toLocaleString()} พอยต์ทอง)`}
            </p>
          </div>

          {/* Negotiation round info */}
          {data.negotiation_round > 1 && (
            <p className="text-xs text-center text-gray-400">
              รอบต่อรองที่ {data.negotiation_round}/{MAX_ROUNDS}
            </p>
          )}

          {/* Actions */}
          {action === null && (
            <div className="space-y-3">
              <button
                onClick={() => submit("confirm")}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <><span className="animate-spin">⟳</span> กำลังอนุมัติ...</> : "✅ อนุมัติราคาใหม่"}
              </button>
              {data.negotiation_round <= MAX_ROUNDS && (
                <button
                  onClick={() => setAction("counter")}
                  disabled={submitting}
                  className="w-full border border-weeeu-dark text-weeeu-primary hover:bg-weeeu-surface disabled:opacity-50 font-medium py-3 rounded-2xl text-sm transition-colors"
                >
                  💬 ต่อรองราคา
                </button>
              )}
              <button
                onClick={() => setAction("decline")}
                disabled={submitting}
                className="w-full border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 font-medium py-3 rounded-2xl text-sm transition-colors"
              >
                ❌ ปฏิเสธให้ซ่อม — ยุติงาน
              </button>
            </div>
          )}

          {/* Counter form */}
          {action === "counter" && (
            <div className="bg-white rounded-2xl border border-weeeu-dark p-5 space-y-4">
              <p className="text-sm font-semibold text-weeeu-dark">ต่อรองราคา (รอบ {data.negotiation_round + 1}/{MAX_ROUNDS})</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาที่คุณต้องการ (พอยต์ทอง)</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={e => setCounterPrice(e.target.value)}
                  placeholder="ระบุราคา"
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAction(null)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm">
                  ยกเลิก
                </button>
                <button
                  onClick={() => submit("counter")}
                  disabled={submitting}
                  className="flex-1 bg-weeeu-primary hover:bg-weeeu-primary disabled:bg-weeeu-dark text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {submitting ? "กำลังส่ง..." : "ส่งข้อเสนอต่อรอง"}
                </button>
              </div>
            </div>
          )}

          {/* REP-C11 — Decline modal: ปฏิเสธให้ซ่อม → เหตุผล 3 กลุ่ม + textarea + รูป ≤3 → fee-settle (SoT Gen 55, mirror WeeeT) */}
          {action === "decline" && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
              <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 text-sm">🚫 ปฏิเสธให้ซ่อม — เลือกเหตุผล</h2>
                  <button onClick={() => setAction(null)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
                </div>

                <div className="px-4 py-4 space-y-4">
                  {/* 3 reason groups (radio — เลือก 1) */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600">กลุ่มเหตุผล <span className="text-red-500">*</span></p>
                    {WEEEU_DECLINE_GROUPS.map((g, idx) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setDeclineGroup(g.key)}
                        className={`w-full text-left border-2 rounded-xl p-3 transition-colors ${
                          declineGroup === g.key ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            declineGroup === g.key ? "border-red-500" : "border-gray-300"
                          }`}>
                            {declineGroup === g.key && <span className="w-2 h-2 rounded-full bg-red-500" />}
                          </span>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-gray-900">{idx + 1}. {g.title}</p>
                            <p className="text-xs text-gray-500">{g.examples}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* required textarea */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600">รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></label>
                    <textarea
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      placeholder="อธิบายเหตุผลที่ปฏิเสธให้ซ่อม (ใช้เป็นหลักฐาน audit สำหรับข้อพิพาท)..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    />
                  </div>

                  {/* optional photos ≤3 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-600">รูปประกอบ (ไม่บังคับ)</label>
                      <span className="text-xs text-gray-400">{declinePhotos.length}/{DECLINE_MAX_PHOTOS}</span>
                    </div>
                    <input
                      ref={declinePhotoRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => addDeclinePhotos(e.target.files)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {declinePhotos.map((p, i) => (
                        <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeDeclinePhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
                        </div>
                      ))}
                      {declinePhotos.length < DECLINE_MAX_PHOTOS && (
                        <button
                          onClick={() => declinePhotoRef.current?.click()}
                          className="aspect-square bg-gray-50 border border-dashed border-gray-300 hover:border-red-400 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <span className="text-2xl">📷</span><span className="text-xs">เพิ่มรูป</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Deposit / travel-fee settle disclosure (เดิม — เตือนมัดจำ + ค่าเดินทางตาม offer · C11) */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-semibold text-amber-800">⚠️ ก่อนยุติงาน — จะมีการชำระตามข้อเสนอเดิม</p>
                    <p className="text-xs text-amber-700">
                      {DEPOSIT_REJECT_LABEL[data.deposit_policy_when_user_rejects_change]}
                      {data.deposit_amount ? ` (พอยต์ทองที่ล็อก ${data.deposit_amount.toLocaleString()} พอยต์ทอง)` : ""}
                    </p>
                    <p className="text-xs text-amber-600">รวมค่ามัดจำและค่าเดินทางตามข้อเสนอเดิม — ดูยอดสุทธิที่หน้าชำระค่าตรวจ/ค่าเดินทาง</p>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-2">
                  <button onClick={() => setAction(null)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm">
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => submit("decline")}
                    disabled={submitting || !declineComplete}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {submitting ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ → ชำระค่าธรรมเนียม"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
