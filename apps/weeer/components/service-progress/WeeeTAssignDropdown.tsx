"use client";

// ── WeeeTAssignDropdown — Phase C-5 ──────────────────────────────────────────

import { AVAILABLE_WEEET } from "../../lib/mock-data/weeet-list";

interface WeeeTAssignDropdownProps {
  value: string;
  onChange: (id: string, name: string) => void;
  disabled?: boolean;
  label?: string;
}

export function WeeeTAssignDropdown({
  value,
  onChange,
  disabled = false,
  label = "มอบหมาย WeeeT",
}: WeeeTAssignDropdownProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const weeet = AVAILABLE_WEEET.find((w) => w.id === id);
    onChange(id, weeet?.name ?? "");
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">— เลือก WeeeT —</option>
        {AVAILABLE_WEEET.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name} ({w.active_jobs} งาน)
          </option>
        ))}
      </select>
    </div>
  );
}
