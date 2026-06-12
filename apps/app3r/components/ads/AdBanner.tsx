// ============================================================
// components/ads/AdBanner.tsx — C12 ad display (consume Backend public ads)
//
// Server Component + ISR (60s) — fetches GET /api/v1/ads/public?position=...
// Renders the highest-priority active ad for the given position; falls back
// to a placeholder when no active ad exists.
//
// Backend route ref: apps/backend/src/routes/ads.ts (GET /public · B1)
// Contract: API returns camelCase { items: [{ id, adType, listingId, position,
//   bannerImage, targetUrl, startDate, endDate }] } per Ruling
//   36f813ec-7277-81c4-a73f-c46d364a2334.
// ============================================================
import Link from "next/link";

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.CMS_BACKEND_URL ?? "http://localhost:8787";

const REVALIDATE_ADS = 60; // 1 min cache

/** Backend ad enum — must stay in sync with apps/backend/src/db/schema/ads.ts AD_POSITIONS. */
export type AdPosition = "home_first_row" | "module_first_row" | "sidebar";

interface PublicAdDto {
  id: string;
  adType: string;
  listingId: string | null;
  position: AdPosition;
  bannerImage: string | null;
  targetUrl: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface AdBannerProps {
  /** Backend ad position. */
  position: AdPosition;
  /** Layout size hint (visual aspect). Default leaderboard. */
  size?: "leaderboard" | "wide-skyscraper";
  className?: string;
}

async function fetchPublicAd(position: AdPosition): Promise<PublicAdDto | null> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/ads/public?position=${position}`, {
      next: { revalidate: REVALIDATE_ADS },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = (await res.json()) as { items: PublicAdDto[] };
    return data.items?.[0] ?? null;
  } catch {
    clearTimeout(tid);
    return null;
  }
}

export default async function AdBanner({
  position,
  size = "leaderboard",
  className = "",
}: AdBannerProps) {
  const ad = await fetchPublicAd(position);
  const isLeaderboard = size === "leaderboard";
  const sizeClass = isLeaderboard ? "w-full h-20" : "w-full h-60";

  // Live ad — render image + link to target
  if (ad && ad.bannerImage) {
    const inner = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- ad creative URL is dynamic */}
        <img
          src={ad.bannerImage}
          alt="โฆษณา (Advertisement)"
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-black/60 text-white">
          โฆษณา
        </span>
      </>
    );
    const wrapperClass = `relative block overflow-hidden rounded-xl border border-gray-200 ${sizeClass} ${className}`;
    return ad.targetUrl ? (
      <Link href={ad.targetUrl} className={wrapperClass} target="_blank" rel="noopener sponsored">
        {inner}
      </Link>
    ) : (
      <div className={wrapperClass}>{inner}</div>
    );
  }

  // Fallback placeholder (no active ad for this position)
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded-xl ${sizeClass} ${className}`}
    >
      <div className="text-center text-gray-400 select-none">
        <p className="text-xs font-semibold tracking-wide">โฆษณา</p>
      </div>
    </div>
  );
}
