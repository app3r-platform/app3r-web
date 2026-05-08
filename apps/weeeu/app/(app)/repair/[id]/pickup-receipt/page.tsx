"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type PickupReceiptData = {
  id: string;
  appliance_name: string;
  issue_summary: string;
  weeer_name: string;
  weeet_name: string;
  pickup_address: string;
  pickup_date: string;
  pickup_time: string;
  picked_up_at: string | null;
  appliance_condition_notes: string;
  weeet_signature_at: string | null;
  photos: { url: string }[];
  customer_signed: boolean;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function PickupReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [receipt, setReceipt] = useState<PickupReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}/pickup-receipt`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { setError("ไม่พบข้อมูล Pickup Receipt"); return; }
        setReceipt({
          id: d.id,
          appliance_name: d.appliance_name,
          issue_summary: d.issue_summary,
          weeer_name: d.weeer_name,
          weeet_name: d.weeet_name ?? "ช่างผู้รับงาน",
          pickup_address: d.pickup_address ?? d.address ?? "",
          pickup_date: d.pickup_date ?? "",
          pickup_time: d.pickup_time ?? "",
          picked_up_at: d.picked_up_at ?? null,
          appliance_condition_notes: d.appliance_condition_notes ?? "",
          weeet_signature_at: d.weeet_signature_at ?? null,
          photos: d.pickup_photos ?? [],
          customer_signed: d.customer_signed ?? false,
        });
        if (d.customer_signed) setSigned(true);
      })
      .catch(() => setError("ไม่สามารถโหลด Pickup Receipt ได้"))
      .finally(() => setLoading(false));
  }, [id]);

  // Canvas signature helpers
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
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
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
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!hasSignature) { setError("กรุณาเซ็นชื่อในช่องลายเซ็น"); return; }
    const canvas = canvasRef.current;
    const signatureData = canvas?.toDataURL("image/png") ?? "";
    setSigning(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/pickup-receipt/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_data: signatureData, customer_notes: customerNotes }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSigned(true);
    } catch {
      setError("เกิดข้อผิดพลาดในการเซ็นรับ กรุณาลองใหม่");
    } finally {
      setSigning(false);
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
        <h1 className="text-xl font-bold text-gray-900">ใบรับเครื่อง (Pickup)</h1>
      </div>

      {signed ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="text-sm font-semibold text-green-800">เซ็นรับเครื่องเรียบร้อยแล้ว</p>
          <p className="text-xs text-green-600">ช่างจะนำเครื่องไปซ่อมที่ร้าน — รอการแจ้งเตือนสถานะ</p>
          <Link
            href={`/repair/${id}`}
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-2xl text-sm text-center transition-colors mt-2"
          >
            ติดตามสถานะงานซ่อม
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-purple-800">🚛 ช่างมารับเครื่องแล้ว — กรุณาตรวจสอบและเซ็นรับ</p>
            <p className="text-xs text-purple-600 mt-1">ตรวจสอบสภาพเครื่องก่อนส่งมอบให้ช่าง</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {receipt && (
            <>
              {/* Job info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
                <InfoRow label="เครื่อง" value={receipt.appliance_name} />
                <InfoRow label="อาการ" value={receipt.issue_summary} />
                <InfoRow label="ช่าง" value={`${receipt.weeet_name} (${receipt.weeer_name})`} />
                <InfoRow label="ที่อยู่รับ" value={receipt.pickup_address} />
                {receipt.picked_up_at && <InfoRow label="เวลารับจริง" value={formatDate(receipt.picked_up_at)} />}
              </div>

              {/* Condition notes from technician */}
              {receipt.appliance_condition_notes && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">บันทึกสภาพเครื่องจากช่าง</p>
                  <p className="text-sm text-gray-600">{receipt.appliance_condition_notes}</p>
                </div>
              )}

              {/* Pickup photos */}
              {receipt.photos.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    รูปสภาพเครื่องตอนรับ ({receipt.photos.length} รูป)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {receipt.photos.map((f, i) => (
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
                  <p className="text-xs text-gray-600">
                    ช่างเซ็นรับแล้ว — {formatDate(receipt.weeet_signature_at)}
                  </p>
                </div>
              )}

              {/* Customer signature canvas */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ลายเซ็นลูกค้า</p>
                <p className="text-xs text-gray-400">เซ็นชื่อด้านล่างเพื่อยืนยันส่งมอบเครื่อง</p>
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
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ล้างลายเซ็น
                  </button>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ไม่บังคับ)</label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    placeholder="ข้อสังเกตเพิ่มเติมเกี่ยวกับสภาพเครื่อง"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSign}
                disabled={signing || !hasSignature}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {signing ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "✅ เซ็นรับมอบเครื่อง"}
              </button>

              <p className="text-xs text-center text-gray-400">
                การเซ็นรับยืนยันว่าคุณส่งมอบเครื่องให้ช่างในสภาพที่บันทึกไว้
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
