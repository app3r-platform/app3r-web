"use client";
import { useState } from "react";
import { NearMeFilter, type NearbyTambonDto } from "@app3r/ui";

/**
 * W-Round-1 Wave 2 · W2 — NearMeFilter wired into listing sidebars
 * Renders the shared GR-10 button + a result list of nearby tambons.
 * MVP: just shows the matched tambons; future iteration will filter the listing grid by tambonId.
 */
interface Props {
  roleTheme?: { primary: string };
  defaultRadiusKm?: number;
}

const WEBSITE_BRAND = { primary: "#1E9E5A" };

export default function NearbyTambonsPanel({
  roleTheme = WEBSITE_BRAND,
  defaultRadiusKm = 20,
}: Props) {
  const [results, setResults] = useState<NearbyTambonDto[] | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <div className="space-y-3">
      <NearMeFilter
        roleTheme={roleTheme}
        defaultRadiusKm={defaultRadiusKm}
        onResults={(items, o) => {
          setResults(items);
          setOrigin(o);
        }}
      />

      {results !== null && (
        <div className="text-xs text-gray-600 space-y-1.5">
          {origin && (
            <div className="text-[11px] text-gray-400">
              จากพิกัด {origin.lat.toFixed(3)}, {origin.lng.toFixed(3)}
            </div>
          )}
          {results.length === 0 ? (
            <div className="text-gray-400">ไม่พบตำบลในรัศมีที่กำหนด</div>
          ) : (
            <ul className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {results.slice(0, 20).map((t) => (
                <li
                  key={t.id}
                  className="flex justify-between items-center bg-gray-50 rounded px-2 py-1"
                >
                  <span className="truncate">{t.nameTh}</span>
                  <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">
                    {t.distanceKm.toFixed(1)} km
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
