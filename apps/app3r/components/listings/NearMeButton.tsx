/**
 * W-Round-1 Wave 2: NearMeButton
 *
 * GR-10 "ใกล้ฉัน" — uses browser geolocation API + calls /api/v1/locations/nearby (Haversine).
 * Client Component — needs `navigator.geolocation`.
 */
"use client";

import { useState } from "react";
import type { NearbyTambonDto } from "@/lib/types/listing-meta";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";

interface Props {
  /** Called with results list (sorted by distance). Empty array on permission denied or error. */
  onResults?: (items: NearbyTambonDto[], origin: { lat: number; lng: number } | null) => void;
  /** Default radius in km (server caps at 500). */
  defaultRadiusKm?: number;
}

export function NearMeButton({ onResults, defaultRadiusKm = 20 }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง (Geolocation)");
      onResults?.([], null);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const params = new URLSearchParams({
            lat: String(lat),
            lng: String(lng),
            radiusKm: String(defaultRadiusKm),
          });
          const res = await fetch(`${BACKEND_URL}/api/v1/locations/nearby?${params}`, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            setError("ไม่สามารถค้นหาตำบลใกล้เคียง — ลองอีกครั้ง");
            onResults?.([], { lat, lng });
            return;
          }
          const data = (await res.json()) as { items: NearbyTambonDto[] };
          onResults?.(data.items ?? [], { lat, lng });
        } catch {
          setError("เกิดข้อผิดพลาดเครือข่าย — ลองอีกครั้ง");
          onResults?.([], { lat, lng });
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setLoading(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError("คุณปฏิเสธการระบุตำแหน่ง — โปรดอนุญาตในเบราว์เซอร์");
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          setError("ไม่ทราบตำแหน่งปัจจุบัน — ตรวจสอบสัญญาณ GPS");
        } else {
          setError("เกิดข้อผิดพลาดในการระบุตำแหน่ง");
        }
        onResults?.([], null);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-website-brand-700 border border-website-brand-300 hover:border-website-brand-500 hover:bg-website-brand-50 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        <span aria-hidden>📍</span>
        {loading ? "กำลังค้นหา..." : `ใกล้ฉัน (Near me, ${defaultRadiusKm} กม.)`}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
