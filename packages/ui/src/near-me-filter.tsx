"use client";
import * as React from "react";

/**
 * GR-10 NearMeFilter — Shared "near me" geolocation filter component
 *
 * Client Component: uses browser geolocation API + fetches Hono /api/v1/locations/nearby.
 * Each app passes `roleTheme.primary` for brand color.
 *
 * Backend canonical contract returns camelCase per Ruling 36f813ec-7277-81c4-a73f-c46d364a2334.
 * If backend returns snake_case for any field, this component normalizes defensively.
 *
 * Usage:
 *   <NearMeFilter
 *     roleTheme={{ primary: "#1E9E5A" }}
 *     onResults={(items, origin) => setNearby(items)}
 *     backendUrl="http://localhost:8787"
 *     defaultRadiusKm={20}
 *   />
 */
export interface NearbyTambonDto {
  id: number;
  nameTh: string;
  distanceKm: number;
  lat: number;
  lng: number;
}

interface NearbyResponse {
  items?: Array<{
    id: number;
    nameTh?: string;
    name_th?: string;
    distanceKm?: number;
    distance_km?: number;
    lat: number;
    lng: number;
  }>;
}

export interface NearMeFilterProps {
  roleTheme?: { primary: string };
  onResults?: (
    items: NearbyTambonDto[],
    origin: { lat: number; lng: number } | null,
  ) => void;
  backendUrl?: string;
  defaultRadiusKm?: number;
}

type Status = "idle" | "locating" | "fetching" | "done" | "error";

export function NearMeFilter({
  roleTheme = { primary: "#1E9E5A" },
  onResults,
  backendUrl = "http://localhost:8787",
  defaultRadiusKm = 20,
}: NearMeFilterProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [count, setCount] = React.useState<number>(0);

  const handleClick = React.useCallback(() => {
    setErrorMsg(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setErrorMsg("เบราว์เซอร์ไม่รองรับ Geolocation (browser unsupported)");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setStatus("fetching");
        try {
          const url = `${backendUrl}/api/v1/locations/nearby?lat=${latitude}&lng=${longitude}&radiusKm=${defaultRadiusKm}&limit=50`;
          const res = await fetch(url, { method: "GET" });
          if (!res.ok) {
            throw new Error(`Backend ${res.status}`);
          }
          const data: NearbyResponse = await res.json();
          const items: NearbyTambonDto[] = (data.items ?? []).map((it) => ({
            id: it.id,
            nameTh: it.nameTh ?? it.name_th ?? "",
            distanceKm: it.distanceKm ?? it.distance_km ?? 0,
            lat: it.lat,
            lng: it.lng,
          }));
          setCount(items.length);
          setStatus("done");
          onResults?.(items, { lat: latitude, lng: longitude });
        } catch (err) {
          setStatus("error");
          setErrorMsg(
            err instanceof Error
              ? `เชื่อมต่อ Backend ไม่ได้ (${err.message})`
              : "เชื่อมต่อ Backend ไม่ได้ (network error)",
          );
          onResults?.([], null);
        }
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("ไม่ได้รับสิทธิ์เข้าถึงตำแหน่ง (permission denied)");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg("ไม่สามารถระบุตำแหน่งได้ (position unavailable)");
        } else {
          setErrorMsg("เกิดข้อผิดพลาดในการระบุตำแหน่ง");
        }
        onResults?.([], null);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [backendUrl, defaultRadiusKm, onResults]);

  const isBusy = status === "locating" || status === "fetching";
  const label =
    status === "locating"
      ? "กำลังระบุตำแหน่ง..."
      : status === "fetching"
        ? "กำลังค้นหาบริเวณใกล้คุณ..."
        : status === "done"
          ? `ใกล้ฉัน · พบ ${count} ตำบล (${defaultRadiusKm} km)`
          : `ใกล้ฉัน (Near me, ${defaultRadiusKm} km)`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: roleTheme.primary }}
        aria-busy={isBusy}
      >
        <span aria-hidden="true">📍</span>
        <span>{label}</span>
      </button>
      {errorMsg && (
        <p
          className="text-xs font-medium"
          style={{ color: "#B91C1C" }}
          role="alert"
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
