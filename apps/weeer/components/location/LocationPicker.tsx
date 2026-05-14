"use client";
// ── LocationPicker — D-2 Location UI ──────────────────────────────────────────
// เลือกตำแหน่งที่ตั้งร้าน (shop address) + พื้นที่ให้บริการ (service area)
// PATCH /api/v1/profile/location — บันทึก lat/lng + address text

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api-client";

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  serviceAreaKm: number; // รัศมีให้บริการ (กม.)
}

interface LocationPickerProps {
  /** ค่าเริ่มต้น (กรณีมีข้อมูลอยู่แล้ว) */
  initialLocation?: Partial<LocationData>;
  /** callback เมื่อบันทึกสำเร็จ */
  onSave?: (location: LocationData) => void;
}

const SERVICE_AREA_OPTIONS = [5, 10, 20, 30, 50];

export default function LocationPicker({ initialLocation, onSave }: LocationPickerProps) {
  const [location, setLocation] = useState<Partial<LocationData>>(initialLocation ?? {});
  const [addressInput, setAddressInput] = useState(initialLocation?.address ?? "");
  const [serviceArea, setServiceArea] = useState(initialLocation?.serviceAreaKm ?? 20);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // mounted ref — ป้องกัน setState หลัง component unmount (D-3 F4)
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  // ตรวจจับตำแหน่งด้วย browser Geolocation API
  async function detectLocation() {
    if (!("geolocation" in navigator)) {
      setError("เบราว์เซอร์ไม่รองรับ GPS");
      return;
    }

    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation((prev) => ({ ...prev, lat, lng }));

        // Reverse geocode — ใช้ Nominatim (OpenStreetMap) — ไม่ต้อง API key
        // User-Agent บังคับตาม OSM ToS: https://operations.osmfoundation.org/policies/nominatim/
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`,
            { headers: { "User-Agent": "App3R-WeeeR/1.0 (contact@app3r.co)" } },
          );
          if (res.ok) {
            const data = await res.json() as { display_name?: string };
            const addr = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            if (mountedRef.current) {
              setAddressInput(addr);
              setLocation((prev) => ({ ...prev, address: addr }));
            }
          }
        } catch {
          // Geocode ล้มเหลว — ใช้ coordinate แทน
          const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          if (mountedRef.current) {
            setAddressInput(coordStr);
            setLocation((prev) => ({ ...prev, address: coordStr }));
          }
        }

        if (mountedRef.current) setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        setError(
          err.code === 1
            ? "กรุณาอนุญาตการเข้าถึง GPS ในเบราว์เซอร์"
            : "ไม่สามารถระบุตำแหน่งได้ — กรุณาพิมพ์ที่อยู่เอง",
        );
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }

  async function handleSave() {
    if (!addressInput.trim()) {
      setError("กรุณาระบุที่อยู่หรือตรวจจับตำแหน่ง GPS");
      return;
    }

    setSaving(true);
    setError(null);

    // D-3 F3: ป้องกัน null-island (0,0) — ส่ง lat/lng เฉพาะเมื่อ detect GPS แล้วเท่านั้น
    const hasCoords = location.lat != null && location.lng != null;
    const payload: LocationData = {
      lat: hasCoords ? (location.lat as number) : 0,
      lng: hasCoords ? (location.lng as number) : 0,
      address: addressInput.trim(),
      serviceAreaKm: serviceArea,
    };
    // API payload — omit lat/lng ถ้าไม่มีพิกัด GPS (backend ใช้ address geocode เอง)
    const apiPayload = hasCoords
      ? payload
      : { address: payload.address, serviceAreaKm: payload.serviceAreaKm };

    try {
      const res = await apiFetch("/api/v1/profile/location", {
        method: "PATCH",
        body: JSON.stringify(apiPayload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      setSaved(true);
      if (hasCoords) onSave?.(payload);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกล้มเหลว — กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">ที่ตั้งร้านและพื้นที่ให้บริการ</h3>

      {/* GPS detect button */}
      <button
        type="button"
        onClick={detectLocation}
        disabled={detecting}
        className="flex items-center gap-2 text-sm text-green-700 border border-green-200 bg-green-50 rounded-xl px-4 py-2.5 hover:bg-green-100 transition-colors disabled:opacity-60"
      >
        {detecting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            กำลังตรวจจับตำแหน่ง...
          </>
        ) : (
          <>📍 ตรวจจับตำแหน่งอัตโนมัติ</>
        )}
      </button>

      {/* Coordinates display */}
      {location.lat != null && location.lng != null && (
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </div>
      )}

      {/* Address input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          ที่อยู่ร้าน
        </label>
        <textarea
          value={addressInput}
          onChange={(e) => {
            setAddressInput(e.target.value);
            setLocation((prev) => ({ ...prev, address: e.target.value }));
          }}
          rows={3}
          placeholder="เช่น 123/45 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
        />
      </div>

      {/* Service area selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รัศมีให้บริการ
        </label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_AREA_OPTIONS.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setServiceArea(km)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                serviceArea === km
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {km} กม.
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !addressInput.trim()}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          "กำลังบันทึก..."
        ) : saved ? (
          "✅ บันทึกสำเร็จ"
        ) : (
          "💾 บันทึกที่ตั้ง"
        )}
      </button>
    </div>
  );
}
