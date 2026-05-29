/**
 * W-Round-1 Wave 2: LocationCascade
 *
 * GR-9 cascade dropdown: จังหวัด → อำเภอ → ตำบล
 * Fetches provinces on mount; amphoes when province selected; tambons when amphoe selected.
 * Calls public location-master APIs (no auth required).
 *
 * Client Component — manages cascade state + side-effects.
 * Used in FilterSidebar (browse page) + standalone (location-aware search).
 */
"use client";

import { useEffect, useState } from "react";
import type {
  ProvinceDto,
  AmphoeDto,
  TambonListItemDto,
} from "@/lib/types/listing-meta";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";

interface Props {
  /** Called when user changes any selection. Pass nulls when cleared. */
  onChange?: (selection: {
    provinceId: number | null;
    amphoeId: number | null;
    tambonId: number | null;
  }) => void;
  /** Initial selection (e.g., from URL query). */
  initial?: {
    provinceId?: number | null;
    amphoeId?: number | null;
    tambonId?: number | null;
  };
  /** Disable all controls (loading / submit). */
  disabled?: boolean;
}

async function safeFetchItems<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: T[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export function LocationCascade({ onChange, initial, disabled }: Props) {
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [amphoes, setAmphoes] = useState<AmphoeDto[]>([]);
  const [tambons, setTambons] = useState<TambonListItemDto[]>([]);
  const [provinceId, setProvinceId] = useState<number | null>(initial?.provinceId ?? null);
  const [amphoeId, setAmphoeId] = useState<number | null>(initial?.amphoeId ?? null);
  const [tambonId, setTambonId] = useState<number | null>(initial?.tambonId ?? null);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingAmphoes, setLoadingAmphoes] = useState(false);
  const [loadingTambons, setLoadingTambons] = useState(false);

  // Fetch provinces once
  useEffect(() => {
    setLoadingProvinces(true);
    safeFetchItems<ProvinceDto>("/api/v1/locations/provinces").then((items) => {
      setProvinces(items);
      setLoadingProvinces(false);
    });
  }, []);

  // Fetch amphoes when province changes
  useEffect(() => {
    if (provinceId === null) {
      setAmphoes([]);
      setAmphoeId(null);
      setTambons([]);
      setTambonId(null);
      return;
    }
    setLoadingAmphoes(true);
    safeFetchItems<AmphoeDto>(`/api/v1/locations/provinces/${provinceId}/amphoes`).then((items) => {
      setAmphoes(items);
      setLoadingAmphoes(false);
    });
  }, [provinceId]);

  // Fetch tambons when amphoe changes
  useEffect(() => {
    if (amphoeId === null) {
      setTambons([]);
      setTambonId(null);
      return;
    }
    setLoadingTambons(true);
    safeFetchItems<TambonListItemDto>(`/api/v1/locations/amphoes/${amphoeId}/tambons`).then(
      (items) => {
        setTambons(items);
        setLoadingTambons(false);
      },
    );
  }, [amphoeId]);

  // Notify parent on any change
  useEffect(() => {
    onChange?.({ provinceId, amphoeId, tambonId });
  }, [provinceId, amphoeId, tambonId, onChange]);

  const labelClass = "block text-xs font-medium text-gray-700 mb-1";
  const selectClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-website-brand-500 disabled:bg-gray-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="cascade-province" className={labelClass}>
          จังหวัด (Province)
        </label>
        <select
          id="cascade-province"
          className={selectClass}
          disabled={disabled || loadingProvinces}
          value={provinceId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setProvinceId(v === "" ? null : Number(v));
            setAmphoeId(null);
            setTambonId(null);
          }}
        >
          <option value="">— เลือกจังหวัด —</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nameTh}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cascade-amphoe" className={labelClass}>
          อำเภอ / เขต (Amphoe)
        </label>
        <select
          id="cascade-amphoe"
          className={selectClass}
          disabled={disabled || loadingAmphoes || provinceId === null}
          value={amphoeId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setAmphoeId(v === "" ? null : Number(v));
            setTambonId(null);
          }}
        >
          <option value="">— เลือกอำเภอ —</option>
          {amphoes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nameTh}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cascade-tambon" className={labelClass}>
          ตำบล / แขวง (Tambon)
        </label>
        <select
          id="cascade-tambon"
          className={selectClass}
          disabled={disabled || loadingTambons || amphoeId === null}
          value={tambonId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setTambonId(v === "" ? null : Number(v));
          }}
        >
          <option value="">— เลือกตำบล —</option>
          {tambons.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameTh}
              {t.zipcode ? ` (${t.zipcode})` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
