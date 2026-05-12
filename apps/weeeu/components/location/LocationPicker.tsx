"use client";
// ─── LocationPicker (D90) — Places Autocomplete + Geocode + Map Preview ───────

import { useState, useRef, useEffect } from "react";
import { getAdapter } from "@/lib/dal";
import type { GeocodeResult, SavedLocation } from "@app3r/shared/dal/weeeu";

interface Props {
  onSelected?: (location: GeocodeResult) => void;
  onSaved?: (saved: SavedLocation) => void;
  showSave?: boolean;
  placeholder?: string;
}

// Places Autocomplete suggestions (mock สำหรับ Phase C — Phase D-2 ใช้ Google Maps JS API จริง)
const MOCK_SUGGESTIONS = [
  { placeId: "place-001", description: "สยามพารากอน, กรุงเทพมหานคร" },
  { placeId: "place-002", description: "จตุจักร, กรุงเทพมหานคร" },
  { placeId: "place-003", description: "อนุสาวรีย์ชัยสมรภูมิ, กรุงเทพมหานคร" },
  { placeId: "place-004", description: "เซ็นทรัลเวิลด์, กรุงเทพมหานคร" },
  { placeId: "place-005", description: "ท่าอากาศยานสุวรรณภูมิ, สมุทรปราการ" },
];

export function LocationPicker({
  onSelected,
  onSaved,
  showSave = true,
  placeholder = "ค้นหาสถานที่...",
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof MOCK_SUGGESTIONS>([]);
  const [selected, setSelected] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions (Phase C mock — Phase D-2: debounce + Google Places API)
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const filtered = MOCK_SUGGESTIONS.filter(s =>
      s.description.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
    setShowDropdown(true);
  }, [query]);

  const handleSelect = async (placeId: string, description: string) => {
    setQuery(description);
    setShowDropdown(false);
    setLoading(true);
    setError("");
    try {
      const dal = getAdapter();
      const result = await dal.location.geocode(placeId);
      if (!result.ok) throw new Error(result.error);
      setSelected(result.data);
      onSelected?.(result.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Geocode ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const dal = getAdapter();
      const result = await dal.location.save({
        lat: selected.lat,
        lng: selected.lng,
        formattedAddress: selected.formattedAddress,
        label: label.trim() || undefined,
      });
      if (!result.ok) throw new Error(result.error);
      onSaved?.(result.data);
      setLabel("");
      setSelected(null);
      setQuery("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "บันทึกสถานที่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ⏳
          </div>
        )}

        {/* Dropdown suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                onClick={() => handleSelect(s.placeId, s.description)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 text-left transition-colors"
              >
                <span className="text-gray-400">📍</span>
                {s.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected location card + map preview */}
      {selected && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 shrink-0">📍</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-indigo-800">{selected.formattedAddress}</p>
              <p className="text-xs text-indigo-400 mt-0.5">
                {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Map preview (Static map via OpenStreetMap thumbnail — Phase C mock) */}
          <div className="rounded-lg overflow-hidden border border-indigo-200 h-32 bg-indigo-100 flex items-center justify-center">
            {/* Phase D-2: Google Maps embed จริง */}
            <div className="text-center text-indigo-400">
              <p className="text-2xl">🗺️</p>
              <p className="text-xs mt-1">แผนที่ (Phase D-2: Google Maps)</p>
              <p className="text-xs">{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</p>
            </div>
          </div>

          {/* Save label + button */}
          {showSave && (
            <div className="space-y-2">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ชื่อสถานที่ (เช่น บ้าน, ที่ทำงาน) — ไม่บังคับ"
                className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                {saving ? "กำลังบันทึก..." : "💾 บันทึกสถานที่นี้"}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
