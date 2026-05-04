"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string; // 6-char string
  onChange: (val: string) => void;
  disabled?: boolean;
}

export default function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const focus = (i: number) => {
    inputs.current[i]?.focus();
    inputs.current[i]?.select();
  };

  const handleChange = (i: number, raw: string) => {
    // Accept only digits
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    onChange(next.join("").replace(/ /g, ""));
    if (char && i < 5) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        onChange(next.join("").replace(/ /g, ""));
      } else if (i > 0) {
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focus(i - 1);
    } else if (e.key === "ArrowRight" && i < 5) {
      focus(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6).replace(/ /g, ""));
    // Focus last filled or end
    const lastFilled = Math.min(pasted.length, 5);
    focus(lastFilled);
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit === " " ? "" : digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => inputs.current[i]?.select()}
          disabled={disabled}
          className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-colors focus:outline-none
            ${digit && digit !== " " ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-900"}
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={`OTP หลักที่ ${i + 1}`}
        />
      ))}
    </div>
  );
}
