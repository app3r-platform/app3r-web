// ============================================================
// components/ads/AdBanner.tsx — Placeholder ad banner
// ============================================================

interface AdBannerProps {
  size?: "leaderboard" | "wide-skyscraper";
  className?: string;
}

export default function AdBanner({ size = "leaderboard", className = "" }: AdBannerProps) {
  const isLeaderboard = size === "leaderboard";

  return (
    <div
      className={`flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded-xl ${
        isLeaderboard ? "w-full h-20" : "w-full h-60"
      } ${className}`}
    >
      <div className="text-center text-gray-400 select-none">
        <p className="text-xs font-semibold uppercase tracking-wide">โฆษณา</p>
        <p className="text-[10px] mt-0.5">
          {isLeaderboard ? "728×90" : "300×600"}
        </p>
      </div>
    </div>
  );
}
