"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type ArrivalData = {
  id: string;
  weeet_name: string;
  weeet_id: string;
  arrived_at: string;
  arrival_files: { url: string; type: string }[];
  appliance_name: string;
  weeer_name: string;
};

export default function ApproveEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ArrivalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
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
          weeet_name: d.weeet_name ?? "ไม่ระบุ",
          weeet_id: d.weeet_id,
          arrived_at: d.arrived_at,
          arrival_files: d.arrival_files ?? [],
          appliance_name: d.appliance_name,
          weeer_name: d.weeer_name,
        });
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setSubmitting("approve");
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/v1/repair/jobs/${id}/onsite/approve-entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ approved: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/repair/${id}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    setSubmitting("reject");
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/v1/repair/jobs/${id}/onsite/approve-entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ approved: false, reason: "reject_identity" }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/repair/${id}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">อนุมัติเข้าหน้างาน</h1>
      </div>

      {/* Info banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-orange-800">⚠️ ช่างถึงหน้างานแล้ว — กรุณาตรวจสอบตัวตน</p>
        <p className="text-xs text-orange-600 mt-1">
          ตรวจสอบว่าช่างที่มาตรงกับข้อมูลด้านล่าง ก่อนอนุมัติเข้าหน้างาน
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Technician info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลช่าง</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                🧑‍🔧
              </div>
              <div>
                <p className="font-semibold text-gray-900">{data.weeet_name}</p>
                <p className="text-xs text-gray-400">จากร้าน {data.weeer_name}</p>
              </div>
            </div>
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-500">เครื่องที่แจ้งซ่อม</p>
              <p className="text-sm font-medium text-gray-800">{data.appliance_name}</p>
            </div>
            {data.arrived_at && (
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-500">เวลาถึง</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(data.arrived_at).toLocaleString("th-TH", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Arrival photos */}
          {data.arrival_files.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                รูปยืนยันถึงหน้างาน ({data.arrival_files.length} รูป)
              </p>
              <div className="flex flex-wrap gap-2">
                {data.arrival_files.map((f, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={f.url}
                    alt={`arrival-${i}`}
                    className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                รูปจุดสังเกตหน้าบ้าน + รูปร่วมกับช่าง — ใช้ยืนยันตัวตน
              </p>
            </div>
          )}

          {/* No photos fallback */}
          {data.arrival_files.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-gray-400 text-sm">ยังไม่มีรูปยืนยันจากช่าง</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <button
              disabled={!!submitting}
              onClick={handleApprove}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting === "approve" ? (
                <><span className="animate-spin">⟳</span> กำลังอนุมัติ...</>
              ) : (
                "✅ อนุมัติเข้าหน้างาน"
              )}
            </button>
            <button
              disabled={!!submitting}
              onClick={handleReject}
              className="w-full border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 font-medium py-3 rounded-2xl transition-colors text-sm"
            >
              {submitting === "reject" ? "กำลังปฏิเสธ..." : "❌ ปฏิเสธ — ไม่ใช่ช่างที่ถูกต้อง"}
            </button>
          </div>

          <p className="text-xs text-center text-gray-400">
            การปฏิเสธจะ escalate ไปยัง Admin โดยอัตโนมัติ
          </p>
        </>
      )}
    </div>
  );
}
