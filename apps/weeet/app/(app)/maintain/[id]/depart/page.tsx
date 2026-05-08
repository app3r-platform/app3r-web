"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { maintainApi } from "@/lib/api";

export default function MaintainDepartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGps = () => {
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setGpsError(`ไม่สามารถระบุพิกัดได้: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDepart = async () => {
    if (!location) return;
    setSubmitting(true);
    setError(null);
    try {
      await maintainApi.depart(id, { departure_location: location });
      router.replace(`/maintain/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-6">
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <h1 className="font-bold text-white">M1 — ออกเดินทาง</h1>
      </div>

      <div className="px-4 pt-6 space-y-5">
        <div className="bg-teal-950/30 border border-teal-800/50 rounded-xl p-3 text-xs text-teal-300">
          บันทึกพิกัดจุดออกเดินทาง ก่อนไปหาลูกค้าเพื่อบำรุงรักษา
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          {location ? (
            <div className="bg-green-950/50 border border-green-700 rounded-xl p-4 space-y-1">
              <p className="text-green-300 font-semibold text-sm">✅ ระบุพิกัดแล้ว</p>
              <p className="text-green-400 text-xs font-mono">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-600 rounded-xl p-4 text-center space-y-2">
              <p className="text-4xl">📍</p>
              <p className="text-gray-400 text-sm">ยังไม่ได้ระบุพิกัด</p>
            </div>
          )}

          {gpsError && (
            <p className="text-red-400 text-xs bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {gpsError}
            </p>
          )}

          <button
            onClick={getGps}
            disabled={locating}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {locating ? (
              <><span className="animate-spin">⏳</span> กำลังระบุพิกัด...</>
            ) : (
              <>📍 {location ? "รีเฟรชพิกัด" : "ระบุพิกัด GPS"}</>
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          onClick={handleDepart}
          disabled={!location || submitting}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><span className="animate-spin">⏳</span> กำลังบันทึก...</>
          ) : (
            "🚗 ยืนยันออกเดินทาง"
          )}
        </button>
      </div>
    </div>
  );
}
