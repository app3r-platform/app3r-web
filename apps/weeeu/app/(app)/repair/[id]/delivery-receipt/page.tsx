"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type DeliveryReceiptData = {
  id: string;
  appliance_name: string;
  weeer_name: string;
  weeet_name: string;
  delivered_at: string | null;
  final_price: number | null;
  inspection_fee: number;
  post_repair_notes: string;
  post_repair_photos: { url: string }[];
  weeet_signature_at: string | null;
  customer_confirmed: boolean;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DeliveryReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [receipt, setReceipt] = useState<DeliveryReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [satisfied, setSatisfied] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}/delivery-receipt`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูล Delivery Receipt"); return; }
        setReceipt({
          id: d.id,
          appliance_name: d.appliance_name,
          weeer_name: d.weeer_name,
          weeet_name: d.weeet_name ?? "ช่าง",
          delivered_at: d.delivered_at ?? null,
          final_price: d.final_price ?? null,
          inspection_fee: d.inspection_fee ?? 0,
          post_repair_notes: d.post_repair_notes ?? "",
          post_repair_photos: d.post_repair_photos ?? [],
          weeet_signature_at: d.weeet_signature_at ?? null,
          customer_confirmed: d.customer_confirmed ?? false,
        });
        if (d.customer_confirmed) setConfirmed(true);
      })
      .catch(() => setError("ไม่สามารถโหลด Delivery Receipt ได้"))
      .finally(() => setLoading(false));
  }, [id]);

  // Canvas signature
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(...Object.values(getPos(e, canvas)) as [number, number]);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    e.preventDefault();
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = async () => {
    if (!hasSignature) { setError("กรุณาเซ็นชื่อยืนยันรับเครื่อง"); return; }
    if (satisfied === null) { setError("กรุณาระบุความพึงพอใจ"); return; }
    const canvas = canvasRef.current;
    const signatureData = canvas?.toDataURL("image/png") ?? "";
    setConfirming(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/delivery-receipt/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_data: signatureData, satisfied }),
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirmed(true);
      // After confirm, redirect to review page
      setTimeout(() => router.push(`/repair/${id}/review`), 1500);
    } catch {
      setError("เกิดข้อผิดพลาดในการยืนยัน กรุณาลองใหม่");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  if (error && !receipt) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href="/repair" className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">← กลับรายการ</Link>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ใบส่งมอบเครื่อง (Delivery)</h1>
      </div>

      {confirmed ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="text-sm font-semibold text-green-800">ยืนยันรับเครื่องเรียบร้อย!</p>
          <p className="text-xs text-green-600">กำลังไปหน้ารีวิว...</p>
        </div>
      ) : (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-purple-800">🚛 ช่างส่งเครื่องคืนแล้ว — กรุณาตรวจรับ</p>
            <p className="text-xs text-purple-600 mt-1">ตรวจสอบงานซ่อมก่อนเซ็นรับ</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {receipt && (
            <>
              {/* Job summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปงาน</p>
                <InfoRow label="เครื่อง" value={receipt.appliance_name} />
                <InfoRow label="ช่าง" value={`${receipt.weeet_name} — ${receipt.weeer_name}`} />
                {receipt.delivered_at && <InfoRow label="เวลาส่ง" value={formatDate(receipt.delivered_at)} />}
              </div>

              {/* Price */}
              {receipt.final_price !== null && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ยอดที่หัก</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ค่าซ่อม</span>
                    <span className="font-medium text-gray-800">{receipt.final_price.toLocaleString()} Point</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ค่าตรวจ (Pickup)</span>
                    <span className="font-medium text-gray-800">{receipt.inspection_fee.toLocaleString()} Point</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                    <span className="text-gray-700">รวม</span>
                    <span className="text-purple-700">
                      {(receipt.final_price + receipt.inspection_fee).toLocaleString()} Point
                    </span>
                  </div>
                </div>
              )}

              {/* Post-repair notes */}
              {receipt.post_repair_notes && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">บันทึกการซ่อม</p>
                  <p className="text-sm text-gray-600">{receipt.post_repair_notes}</p>
                </div>
              )}

              {/* Post-repair photos */}
              {receipt.post_repair_photos.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    รูปหลังซ่อม ({receipt.post_repair_photos.length} รูป)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {receipt.post_repair_photos.map((f, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={i} src={f.url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}

              {/* WeeeT signed */}
              {receipt.weeet_signature_at && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <p className="text-xs text-gray-600">ช่างเซ็นส่งแล้ว — {formatDate(receipt.weeet_signature_at)}</p>
                </div>
              )}

              {/* Satisfaction */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ความพึงพอใจ</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSatisfied(true)}
                    className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      satisfied === true ? "bg-green-600 border-green-600 text-white" : "border-gray-200 text-gray-600 hover:border-green-300"
                    }`}
                  >
                    <span>😊</span> พึงพอใจ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSatisfied(false)}
                    className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      satisfied === false ? "bg-red-500 border-red-500 text-white" : "border-gray-200 text-gray-600 hover:border-red-300"
                    }`}
                  >
                    <span>😞</span> ไม่พึงพอใจ
                  </button>
                </div>
              </div>

              {/* Customer signature */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ลายเซ็นยืนยันรับเครื่อง</p>
                <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                {hasSignature && (
                  <button type="button" onClick={clearSignature} className="text-xs text-gray-400 hover:text-red-500">
                    ล้างลายเซ็น
                  </button>
                )}
              </div>

              <button
                onClick={handleConfirm}
                disabled={confirming || !hasSignature || satisfied === null}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {confirming ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ยืนยันรับเครื่องคืน"}
              </button>

              <p className="text-xs text-center text-gray-400">
                หลังยืนยัน — ระบบจะหัก Point และเปิดหน้ารีวิว
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
