"use client";

interface PartSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function PartSearchBar({ value, onChange, placeholder = "ค้นหาชื่ออะไหล่ ยี่ห้อ…" }: PartSearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
}
