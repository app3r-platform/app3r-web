"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type ShippingDetailsData = {
  id: string;
  appliance_name: string;
  issue_summary: string;
  weeer_name: string;
  shop_address: string;
  already_confirmed: boolean;
  confirmed_courier: string | null;
  confirmed_cost_split: string | null;
};

const COURIERS = [
  { value: "kerry", label: "Kerry Express", icon: "🟠" },
  { value: "flash", label: "Flash Express", icon: "⚡" },
  { value: "jandt", label: "J&T Express", icon: "🔴" },
];

const COST_SPLITS = [
  { value: "customer", label: "ลูกค้าออกเอง (ขาไป + ขากลับ)" },
  { value: "shop", label: "ร้านออกให้ (ทั้งหมด)" },
  { value: "split", label: "แบ่งกัน — ลูกค้าออกขาไป / ร้านออกขากลับ" },
];

export default function ShippingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ShippingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [courier, setCourier] = useState("");
  const [costSplit, setCostSplit] = useState("");
  const [insured, setInsured] = useState(false);

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}/shipping-details`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูลรายละเอียดการขนส่ง"); return; }
        setData({
          id: d.id,
          appliance_name: d.appliance_name,
          issue_summary: d.issue_summary,
          weeer_name: d.weeer_name,
          shop_address: d.shop_address ?? d.address ?? "",
          already_confirmed: d.already_confirmed ?? false,
          confirmed_courier: d.confirmed_courier ?? null,
          confirmed_cost_split: d.confirmed_cost_split ?? null,
        });
        if (d.already_confirmed) setConfirmed(true);
        if (d.confirmed_courier) setCourier(d.confirmed_courier);
        if (d.confirmed_cost_split) setCostSplit(d.confirmed_cost_split);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลการขนส่งได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async () => {
    if (!courier) { setError("กรุณาเลือกบริษัทขนส่ง"); return; }
    if (!costSplit) { setError("กรุณาเลือกผู้รับผิดชอบค่าขนส่ง"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/shipping-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courier, tracking_cost_split: costSplit, insured }),
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirmed(true);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  if (error && !data) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">📦</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href={`/repair/${id}`} className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">← กลับรายละเอียดงาน</Link>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดการขนส่ง (Parcel)</h1>
      </div>

      {confirmed ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="text-sm font-semibold text-orange-800">ตกลงรายละเอียดการขนส่งแล้ว!</p>
          <p className="text-xs text-orange-600">
            บริษัทขนส่ง: <strong>{COURIERS.find(c => c.value === (data?.confirmed_courier ?? courier))?.label ?? courier}</strong>
          </p>
          <div className="space-y-2 pt-1">
            <Link
              href={`/repair/${id}/ship-out`}
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-2xl text-sm text-center transition-colors"
            >
              📦 ถัดไป — แพ็คพัสดุและส่ง
            </Link>
            <Link
              href={`/repair/${id}`}
              className="block w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl text-sm text-center hover:bg-gray-50 transition-colors"
            >
              ← กลับรายละเอียดงาน
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-orange-800">📦 Parcel — ตกลงรายละเอียดการส่งพัสดุ</p>
            <p className="text-xs text-orange-600 mt-1">เลือกบริษัทขนส่งและผู้รับผิดชอบค่าใช้จ่ายก่อนส่งเครื่อง</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {data && (
            <>
              {/* Job summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปงาน</p>
                <InfoRow label="เครื่อง" value={data.appliance_name} />
                <InfoRow label="อาการ" value={data.issue_summary} />
                <InfoRow label="ร้านซ่อม" value={data.weeer_name} />
              </div>

              {/* Shop shipping address */}
              {data.shop_address && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่อยู่ส่งพัสดุ (ร้านซ่อม)</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{data.shop_address}</p>
                  <p className="text-xs text-gray-400">ระบุที่อยู่นี้เป็นปลายทางเมื่อฝากส่ง</p>
                </div>
              )}

              {/* Courier selection */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">บริษัทขนส่ง <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-3 gap-2">
                  {COURIERS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCourier(c.value)}
                      className={`py-3 rounded-xl border text-sm font-medium flex flex-col items-center gap-1.5 transition-colors ${
                        courier === c.value
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      <span className="text-xl">{c.icon}</span>
                      <span className="text-xs leading-tight text-center">{c.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost split */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้รับผิดชอบค่าขนส่ง <span className="text-red-500">*</span></p>
                <div className="space-y-2">
                  {COST_SPLITS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setCostSplit(s.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                        costSplit === s.value
                          ? "bg-orange-50 border-orange-400 text-orange-800 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-orange-200"
                      }`}
                    >
                      {costSplit === s.value && <span className="mr-2">✅</span>}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Insurance toggle */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">ประกันพัสดุ</p>
                    <p className="text-xs text-gray-400 mt-0.5">ขึ้นอยู่กับนโยบายบริษัทขนส่งที่เลือก</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInsured(v => !v)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${insured ? "bg-orange-500" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${insured ? "translate-x-6" : ""}`} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={submitting || !courier || !costSplit}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ยืนยันรายละเอียดการขนส่ง"}
              </button>

              <p className="text-xs text-center text-gray-400">
                หลังยืนยัน — กรุณาแพ็คพัสดุและส่งเครื่องตามที่ตกลง
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}
