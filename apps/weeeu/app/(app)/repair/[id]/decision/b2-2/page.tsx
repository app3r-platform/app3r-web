"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type B22Data = {
  id: string;
  appliance_name: string;
  weeer_name: string;
  scrap_proposed_price: number;
  scrap_baseline_price: number | null;
  scrap_estimated_weight_kg: number | null;
  scrap_condition: string | null;
  decision_notes: string;
  negotiation_round: number;
  deposit_amount: number | null;
  inspection_fee: number;
  scrap_files: { url: string }[];
};

const MAX_ROUNDS = 2;
const CONDITION_LABEL: Record<string, string> = {
  near_new: "เกือบใหม่",
  partial: "ยังดีบางส่วน",
  broken: "เสียสมบูรณ์",
};

export default function DecisionB22Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<B22Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"confirm" | "counter" | "decline" | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`/api/v1/repair/jobs/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูล"); return; }
        setData({
          id: d.id,
          appliance_name: d.appliance_name,
          weeer_name: d.weeer_name,
          scrap_proposed_price: d.scrap_proposed_price ?? 0,
          scrap_baseline_price: d.scrap_baseline_price ?? null,
          scrap_estimated_weight_kg: d.scrap_estimated_weight_kg ?? null,
          scrap_condition: d.scrap_condition ?? null,
          decision_notes: d.decision_notes ?? "",
          negotiation_round: d.negotiation_round ?? 1,
          deposit_amount: d.deposit_amount ?? null,
          inspection_fee: d.inspection_fee ?? 100,
          scrap_files: d.pre_inspection_files ?? [],
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
      const token = localStorage.getItem("access_token");
      const endpoint = `/api/v1/repair/jobs/${id}/quote/${type}`;
      const body =
        type === "counter"
          ? { counter_price: parseFloat(counterPrice), round: (data?.negotiation_round ?? 1) + 1 }
          : {};

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
        <h1 className="text-xl font-bold text-gray-900">ข้อเสนอรับซื้อซาก (B2.2)</h1>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-teal-800">♻️ ช่างประเมินว่าซ่อมไม่ได้ — เสนอรับซื้อเป็นซาก</p>
        <p className="text-xs text-teal-600 mt-1">
          หากตกลง ระบบจะสร้างงาน Scrap อัตโนมัติ — ช่างรับซากในทริปเดียวกัน
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Scrap offer details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียดเครื่อง</p>
            <div className="text-center bg-teal-50 rounded-xl p-4">
              <p className="text-xs text-teal-500 mb-1">ราคารับซื้อซาก</p>
              <p className="text-3xl font-bold text-teal-700">{data.scrap_proposed_price.toLocaleString()}</p>
              <p className="text-sm text-teal-500">Point</p>
              {data.scrap_baseline_price && (
                <p className="text-xs text-teal-400 mt-1">
                  ราคาอ้างอิง: {data.scrap_baseline_price.toLocaleString()} Point
                </p>
              )}
            </div>

            {data.scrap_condition && (
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-500">สภาพเครื่อง</p>
                <p className="text-sm font-medium text-gray-800">{CONDITION_LABEL[data.scrap_condition] ?? data.scrap_condition}</p>
              </div>
            )}
            {data.scrap_estimated_weight_kg && (
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-500">น้ำหนักประมาณ</p>
                <p className="text-sm font-medium text-gray-800">{data.scrap_estimated_weight_kg} กก.</p>
              </div>
            )}
            {data.decision_notes && (
              <div>
                <p className="text-xs text-gray-400 mb-1">หมายเหตุจากช่าง</p>
                <p className="text-sm text-gray-600">{data.decision_notes}</p>
              </div>
            )}
          </div>

          {/* Evidence photos */}
          {data.scrap_files.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รูปสภาพเครื่อง</p>
              <div className="flex flex-wrap gap-2">
                {data.scrap_files.map((f, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={f.url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                ))}
              </div>
            </div>
          )}

          {/* Settlement summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปยอดที่คุณจะได้รับ</p>
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">ราคาซาก</p>
              <p className="font-medium text-gray-800">+{data.scrap_proposed_price.toLocaleString()} Point</p>
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">ค่าตรวจ (On-site)</p>
              <p className="font-medium text-red-600">-{data.inspection_fee.toLocaleString()} Point</p>
            </div>
            {data.deposit_amount && (
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">มัดจำ (หักลบ)</p>
                <p className="font-medium text-red-600">-{data.deposit_amount.toLocaleString()} Point</p>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
              <p className="text-gray-700">รวมสุทธิ</p>
              <p className="text-teal-700">
                {(data.scrap_proposed_price - data.inspection_fee - (data.deposit_amount ?? 0)).toLocaleString()} Point
              </p>
            </div>
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
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ตกลงขายซาก"}
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
              <p className="text-sm font-semibold text-blue-800">ต่อรองราคาซาก (รอบ {data.negotiation_round + 1}/{MAX_ROUNDS})</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคาซากที่คุณต้องการ (Point)</label>
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
                งานจะถูกยกเลิก — ค่าตรวจ {data.inspection_fee.toLocaleString()} Point จะถูกยึด
                {data.deposit_amount && ` + มัดจำตามเงื่อนไขข้อเสนอเดิม`}
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
