"use client";

// ── JobProgressFilter — Phase C-5 ────────────────────────────────────────────

interface FilterTab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface JobProgressFilterProps<T extends string> {
  tabs: FilterTab<T>[];
  active: T;
  onChange: (value: T) => void;
}

export function JobProgressFilter<T extends string>({
  tabs,
  active,
  onChange,
}: JobProgressFilterProps<T>) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors
            ${active === tab.value
              ? "bg-green-700 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 opacity-70">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
