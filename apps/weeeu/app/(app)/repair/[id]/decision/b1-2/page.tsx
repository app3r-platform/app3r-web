"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

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

const MAX_ROUNDS = 2;

const DEPOSIT_REJECT_LABEL: Record<string, string> = {
  free: "ปฏิเสธได้ฟรี (ไม่มีค่าใช้จ่าย)",
  forfeit: "ยึดมัดจำ",
  refund: "คืนมัดจำ",
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
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (type: "confirm" | "counter" | "decline") => {
    if (type === "counter" && !counterPrice) {
      setError("กรุณาระบุราคาที่ต้องการต่อรอง");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const endpoint = `/api/v1/repair/jobs/${id}/quote/${type}`;
      const body =
        type === "counter"
          ? { counter_price: parseFloat(counterPrice), round: (data?.negotiation_round ?? 1) + 1 }
          : {};

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/repair/${id}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เปรียบเทียบราคา</p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">ราคาเดิม</p>
                <p className="text-lg font-bold text-gray-600">{data.original_price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Point</p>
              </div>
              <span className="text-gray-400">→</span>
              <div className="flex-1 text-center bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-500 mb-1">ราคาใหม่</p>
                <p className="text-xl font-bold text-orange-700">{data.proposed_price.toLocaleString()}</p>
                <p className="text-xs text-orange-500">Point</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                ราคาเพิ่มขึ้น{" "}
                <span className="font-semibold text-orange-600">
                  +{(data.proposed_price - data.original_price).toLocaleString()} Point
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
                  <p className="text-sm font-medium text-gray-800">{p.price.toLocaleString()} Point</p>
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
              {data.deposit_amount && ` (มัดจำ ${data.deposit_amount.toLocaleString()} Point)`}
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
                  className="w-full border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 font-medium py-3 rounded-2xl text-sm transition-colors"
                >
                  💬 ต่อรองราคา
                </button>
              )}
              <button
                onClick={() => setAction("decline")}
                disabled={submitting}
                className="w-full border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 font-medium py-3 rounded-2xl text-sm transition-colors"
              >
                ❌ ปฏิเสธ — ยกเลิกงาน
              </button>
            </div>
          )}

          {/* Counter form */}
          {action === "counter" && (
            <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-4">
              <p className="text-sm font-semibold text-blue-800">ต่อรองราคา (รอบ {data.negotiation_round + 1}/{MAX_ROUNDS})</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาที่คุณต้องการ (Point)</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={e => setCounterPrice(e.target.value)}
                  placeholder="ระบุราคา"
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAction(null)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm">
                  ยกเลิก
                </button>
                <button
                  onClick={() => submit("counter")}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {submitting ? "กำลังส่ง..." : "ส่งข้อเสนอต่อรอง"}
                </button>
              </div>
            </div>
          )}

          {/* Decline confirm */}
          {action === "decline" && (
            <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-4">
              <p className="text-sm font-semibold text-red-700">ยืนยันการปฏิเสธ?</p>
              <p className="text-xs text-red-600">
                งานจะถูกยกเลิก —{" "}
                {DEPOSIT_REJECT_LABEL[data.deposit_policy_when_user_rejects_change]}
                {data.deposit_amount && ` (${data.deposit_amount.toLocaleString()} Point)`}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setAction(null)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm">
                  ยกเลิก
                </button>
                <button
                  onClick={() => submit("decline")}
                  disabled={submitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  {submitting ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
