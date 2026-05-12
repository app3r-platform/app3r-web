"use client";
/**
 * components/live-location/LiveLocationShareControl.tsx
 * Phase D-2 — Live Location Share UI (D88+D90)
 * @needs-backend-sync Backend Sub-CMD-P1: WebSocket broadcast location.update
 */
import { useLiveLocation } from "@/lib/utils/live-location";

interface Props { serviceId: string; technicianId: string; isMoving?: boolean; }

export function LiveLocationShareControl({ serviceId, technicianId, isMoving = true }: Props) {
  const { state, lastLat, lastLng, lastUpdated, error, hasConsent, emitCount, startSharing, stopSharing, grantConsent, revokeConsent } = useLiveLocation({ serviceId, technicianId, isMoving });

  if (!hasConsent) {
    return (
      <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-sm font-semibold text-amber-200">ยินยอมแชร์ตำแหน่ง (PDPA)</p>
            <p className="text-xs text-amber-300/70 mt-1 leading-relaxed">ระบบจะส่งตำแหน่งของคุณให้ลูกค้าเห็น real-time ขณะเดินทางรับเครื่อง ข้อมูลจะถูกลบหลังงานเสร็จ คุณสามารถหยุดได้ทุกเมื่อ</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => grantConsent()} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">✅ ยินยอม</button>
          <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors">ปฏิเสธ</button>
        </div>
        <p className="text-xs text-gray-500 text-center">หากปฏิเสธ ลูกค้าจะไม่เห็นตำแหน่งของคุณ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border p-4 space-y-2 transition-colors ${state === "active" ? "bg-green-950/40 border-green-800/60" : state === "error" ? "bg-red-950/40 border-red-800/60" : "bg-gray-800 border-gray-700"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${state === "active" ? "bg-green-400 animate-pulse" : state === "requesting" ? "bg-yellow-400 animate-pulse" : state === "error" ? "bg-red-400" : "bg-gray-500"}`} />
            <span className="text-sm font-medium text-white">
              {state === "active" ? "กำลังแชร์ตำแหน่ง" : state === "requesting" ? "กำลังขอสิทธิ์..." : state === "error" ? "เกิดข้อผิดพลาด" : "หยุดแชร์ตำแหน่ง"}
            </span>
          </div>
          {state === "active" && <span className="text-xs text-green-400 bg-green-950/50 px-2 py-0.5 rounded-full">{isMoving ? "5s" : "30s"}</span>}
        </div>
        {state === "active" && lastLat !== null && lastLng !== null && (
          <div className="text-xs text-gray-400">
            <p>📍 {lastLat.toFixed(5)}, {lastLng.toFixed(5)}</p>
            {lastUpdated && <p>อัปเดต: {lastUpdated.toLocaleTimeString("th-TH")} · ส่งแล้ว {emitCount} ครั้ง</p>}
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      {(state === "idle" || state === "error") && (
        <button onClick={startSharing} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">📡 เริ่มแชร์ตำแหน่ง</button>
      )}
      {state === "active" && (
        <button onClick={stopSharing} className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-medium py-3 rounded-xl text-sm transition-colors">⏹ หยุดแชร์ตำแหน่ง</button>
      )}
      <button onClick={() => revokeConsent()} className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors py-1">เพิกถอนความยินยอม PDPA</button>
    </div>
  );
}
