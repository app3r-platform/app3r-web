/**
 * apps/weeet/lib/utils/live-location.ts
 * Phase D-2 — useLiveLocation hook (D88+D90)
 * D90: active=5s interval, idle=30s interval
 * @needs-backend-sync Backend Sub-CMD-P1: POST /api/v1/location/live + WS broadcast
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAdapter } from "@/lib/dal";

const ACTIVE_INTERVAL_MS = 5_000;
const IDLE_INTERVAL_MS = 30_000;
const GEO_TIMEOUT_MS = 8_000;
const GEO_MAX_AGE_MS = 10_000;

export type LocationShareState = "idle" | "requesting" | "active" | "paused" | "error";

export interface UseLiveLocationOptions {
  serviceId: string;
  technicianId: string;
  isMoving?: boolean;
  enabled?: boolean;
}

export interface UseLiveLocationResult {
  state: LocationShareState;
  lastLat: number | null;
  lastLng: number | null;
  lastUpdated: Date | null;
  error: string | null;
  hasConsent: boolean;
  emitCount: number;
  startSharing: () => void;
  stopSharing: () => void;
  grantConsent: () => Promise<void>;
  revokeConsent: () => Promise<void>;
}

export function useLiveLocation({ serviceId, technicianId, isMoving = true, enabled = true }: UseLiveLocationOptions): UseLiveLocationResult {
  const [state, setState] = useState<LocationShareState>("idle");
  const [lastLat, setLastLat] = useState<number | null>(null);
  const [lastLng, setLastLng] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [emitCount, setEmitCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);
  const dal = getAdapter();

  useEffect(() => {
    dal.liveLocation.getConsentStatus(technicianId).then((r) => { if (r.ok) setHasConsent(r.data); });
  }, [technicianId]); // eslint-disable-line react-hooks/exhaustive-deps

  // stopInterval ต้อง declare ก่อน emitCurrentLocation เพราะ emitCurrentLocation ขึ้นอยู่กับ stopInterval (F3 fix)
  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const emitCurrentLocation = useCallback(async () => {
    if (!activeRef.current) return;
    if (!navigator.geolocation) { setState("error"); setError("เบราว์เซอร์ไม่รองรับ Geolocation API"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLastLat(latitude); setLastLng(longitude); setLastUpdated(new Date());
        const result = await dal.liveLocation.emitLocation({ serviceId, lat: latitude, lng: longitude, timestamp: new Date().toISOString(), accuracy });
        if (result.ok) { setEmitCount((c) => c + 1); setError(null); } else { setError(result.error); }
      },
      (geoErr) => {
        // F3 fix: ใช้ activeRef + stopInterval โดยตรง แทน stopSharing() เพื่อหลีกเลี่ยง stale closure
        setError(`Geolocation error: ${geoErr.message}`);
        setState("error");
        activeRef.current = false;
        stopInterval();
      },
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS }
    );
  }, [serviceId, dal.liveLocation, stopInterval]);

  const startInterval = useCallback(() => {
    stopInterval();
    const ms = isMoving ? ACTIVE_INTERVAL_MS : IDLE_INTERVAL_MS;
    emitCurrentLocation();
    intervalRef.current = setInterval(emitCurrentLocation, ms);
  }, [isMoving, emitCurrentLocation, stopInterval]);

  useEffect(() => { if (state === "active") startInterval(); return stopInterval; }, [isMoving]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { return () => { activeRef.current = false; stopInterval(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopSharing = useCallback(() => { activeRef.current = false; stopInterval(); setState("idle"); }, [stopInterval]);

  const startSharing = useCallback(() => {
    if (!hasConsent) { setError("ต้องยินยอม PDPA ก่อนเปิดแชร์ตำแหน่ง"); return; }
    if (!enabled) return;
    if (!navigator.geolocation) { setState("error"); setError("เบราว์เซอร์ไม่รองรับ Geolocation API"); return; }
    activeRef.current = true;
    setState("requesting");
    navigator.geolocation.getCurrentPosition(
      () => { setState("active"); startInterval(); },
      (e) => { setState("error"); setError(`ไม่ได้รับสิทธิ์ตำแหน่ง: ${e.message}`); activeRef.current = false; },
      { timeout: GEO_TIMEOUT_MS }
    );
  }, [hasConsent, enabled, startInterval]);

  const grantConsent = useCallback(async () => {
    const r = await dal.liveLocation.saveConsentStatus(technicianId, true);
    if (r.ok) setHasConsent(true);
  }, [technicianId, dal.liveLocation]);

  const revokeConsent = useCallback(async () => {
    stopSharing();
    const r = await dal.liveLocation.saveConsentStatus(technicianId, false);
    if (r.ok) setHasConsent(false);
  }, [technicianId, dal.liveLocation, stopSharing]);

  return { state, lastLat, lastLng, lastUpdated, error, hasConsent, emitCount, startSharing, stopSharing, grantConsent, revokeConsent };
}
