"use client";

import { useState } from "react";

interface HelpTipProps {
  tip: string;
}

export function HelpTip({ tip }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label="ข้อมูลเพิ่มเติม"
        className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-[10px] font-bold leading-none inline-flex items-center justify-center ml-1 shrink-0 cursor-pointer transition-colors"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-5 top-0 z-50 w-52 rounded-xl bg-gray-800 px-3 py-2 text-xs text-white shadow-lg">
          {tip}
        </span>
      )}
    </span>
  );
}
