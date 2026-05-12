"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { pickupApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LiveLocationShareControl } from "@/components/live-location/LiveLocationShareControl";

export default function PickupEnRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { auth } = useAuth();
  const technicianId = auth.technician?.id ?? "unknown";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDepart() {
    setLoading(true);
    setError(null);
    try {
      // Attempt to get GPS; fall back to zeros if user denies
      const gps = await new Promise<{ lat: number; lng: number }>(
        (resolve) => {
          if (!navigator.geolocation) {
            resolve({ lat: 0, lng: 0 });
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            () => resolve({ lat: 0, lng: 0 }),
            { timeout: 8000 }
          );
        }
      );
      await pickupApi.enRoutePickup(id, { gps_location: gps });
      router.replace(`/jobs/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">ออกเดินทางรับเครื่อง</h1>
          <p className="text-xs text-gray-400">ระบุจุดเริ่มต้น + ออกเดินทาง</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-indigo-950/50 border border-indigo-800/60 rounded-xl p-4 space-y-1">
        <p className="text-indigo-300 text-sm font-semibold">🚛 งาน Pickup</p>
        <p className="text-indigo-200 text-xs">
          กดปุ่มด้านล่างเพื่อบันทึก GPS และเปลี่ยนสถานะเป็น{" "}
          <span className="font-semibold">กำลังไปรับ</span>
        </p>
      </div>

      {/* GPS note */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 space-y-2">
        <p className="font-semibold text-white">📍 ระบบจะบันทึก GPS อัตโนมัติ</p>
        <p className="text-xs text-gray-400">
          กรุณาอนุญาตการเข้าถึงตำแหน่ง เพื่อความแม่นยำในการติดตามงาน
        </p>
      </div>

      {/* Live Location Share (D88+D90) */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-medium">แชร์ตำแหน่ง real-time</p>
        <LiveLocationShareControl serviceId={id} technicianId={technicianId} isMoving={true} />
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleDepart}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-base"
      >
        {loading ? "กำลังบันทึก..." : "🚗 ออกเดินทางรับเครื่อง"}
      </button>
    </div>
  );
}
