"use client";

import { useState } from "react";

interface PasswordInputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  autoComplete?: string;
}

export default function PasswordInput({
  id,
  name,
  placeholder = "รหัสผ่าน",
  value,
  onChange,
  className = "",
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-12 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none select-none"
        tabIndex={-1}
        aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
