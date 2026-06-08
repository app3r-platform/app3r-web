"use client";
// ── OTP 6-box input — WeeeT dark theme · ported from WeeeU OtpInput pattern
// Auto-advance, backspace, paste, arrow-key navigation

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string; // 6-char string
  onChange: (val: string) => void;
  disabled?: boolean;
}

export default function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const focus = (i: number) => {
    inputs.current[i]?.focus();
    inputs.current[i]?.select();
  };

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    onChange(next.join("").replace(/ /g, ""));
    if (char && i < 5) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i] && digits[i] !== " ") {
        const next = [...digits];
        next[i] = " ";
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
    onChange(pasted.padEnd(6, " ").slice(0, 6).replace(/ /g, ""));
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
          aria-label={`OTP หลักที่ ${i + 1}`}
          className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-colors focus:outline-none
            ${digit && digit !== " "
              ? "border-weeet-primary bg-weeet-primary/10 text-weeet-primary"
              : "border-gray-600 bg-gray-800 text-white"}
            focus:border-weeet-primary focus:ring-2 focus:ring-weeet-primary/30
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
}
