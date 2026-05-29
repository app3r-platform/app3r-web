/**
 * W-Round-1 Wave 2: location master API client (public read-only)
 *
 * Supports GR-9 cascade (จังหวัด→อำเภอ→ตำบล) + GR-10 ใกล้ฉัน (Haversine).
 * Server Component-safe — uses Next.js fetch with revalidate (location master rarely changes).
 */
import type {
  ProvinceDto,
  AmphoeDto,
  TambonListItemDto,
  TambonDetailDto,
  NearbyTambonDto,
} from "@/lib/types/listing-meta";

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.CMS_BACKEND_URL ?? "http://localhost:8787";

const REVALIDATE_MASTER = 86400; // 1 day — locations rarely change

async function safeFetch<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getProvinces(): Promise<ProvinceDto[]> {
  const data = await safeFetch<{ items: ProvinceDto[] }>(
    "/api/v1/locations/provinces",
    REVALIDATE_MASTER,
  );
  return data?.items ?? [];
}

export async function getAmphoesByProvince(provinceId: number): Promise<AmphoeDto[]> {
  const data = await safeFetch<{ items: AmphoeDto[] }>(
    `/api/v1/locations/provinces/${provinceId}/amphoes`,
    REVALIDATE_MASTER,
  );
  return data?.items ?? [];
}

export async function getTambonsByAmphoe(amphoeId: number): Promise<TambonListItemDto[]> {
  const data = await safeFetch<{ items: TambonListItemDto[] }>(
    `/api/v1/locations/amphoes/${amphoeId}/tambons`,
    REVALIDATE_MASTER,
  );
  return data?.items ?? [];
}

export function getTambonDetail(id: number): Promise<TambonDetailDto | null> {
  return safeFetch<TambonDetailDto>(`/api/v1/locations/tambons/${id}`, REVALIDATE_MASTER);
}

/**
 * GR-10 ใกล้ฉัน — Haversine distance lookup.
 * NOT cached — depends on caller's lat/lng query.
 */
export async function getNearbyTambons(args: {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}): Promise<NearbyTambonDto[]> {
  const params = new URLSearchParams({
    lat: String(args.lat),
    lng: String(args.lng),
    radiusKm: String(args.radiusKm ?? 20),
    limit: String(args.limit ?? 50),
  });
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/locations/nearby?${params}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: NearbyTambonDto[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}
