"use client";
import * as React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// HelpTip — Shared inline help icon with dismissible popup
// PT-Audit prerequisite (Advisor Gen 114 CMD 378813ec-7277-817c-89d4-c44af1bea631)
//
// Usage:
//   <HelpTip content="ค่านี้ใช้คำนวณ..." />
//   <HelpTip label="ค่าธรรมเนียม" content={<>เป็น <b>5%</b> ของงบประมาณ</>} />
//
// A11y guarantees:
//   • trigger = <button aria-expanded aria-controls>
//   • popup   = role="region" aria-label
//   • keyboard: Enter/Space (native) toggle · Esc close + refocus trigger
//   • pointer: click-outside closes
// ─────────────────────────────────────────────────────────────────────────────

export interface HelpTipProps {
  /** Content to show in the popup — string or any ReactNode */
  content: string | React.ReactNode;
  /** Optional visible label rendered before the trigger icon */
  label?: string;
  /** aria-label for trigger button and popup region. Default: "ข้อมูลเพิ่มเติม" */
  ariaLabel?: string;
}

export function HelpTip({
  content,
  label,
  ariaLabel = "ข้อมูลเพิ่มเติม",
}: HelpTipProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  // React 19 useId — stable across server/client for aria-controls wiring
  const uid = React.useId();
  const popupId = `helptip-${uid}`;

  // ── Esc: close + return focus to trigger ─────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // ── Click / touch outside → close ────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (
        !triggerRef.current?.contains(t) &&
        !popupRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <span className="relative inline-flex items-center gap-1">
      {/* Optional visible label */}
      {label && (
        <span className="text-sm text-gray-700">{label}</span>
      )}

      {/* Trigger: small "?" button */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={popupId}
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center justify-center",
          "w-4 h-4 rounded-full",
          "bg-gray-200 text-gray-600",
          "hover:bg-gray-300",
          "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400",
          "text-[10px] font-bold leading-none",
          "cursor-pointer select-none flex-shrink-0",
        ].join(" ")}
      >
        ?
      </button>

      {/* Popup */}
      {open && (
        <div
          id={popupId}
          ref={popupRef}
          role="region"
          aria-label={ariaLabel}
          className={[
            "absolute left-0 top-full mt-1 z-50",
            "min-w-[180px] w-64 max-w-xs",
            "rounded-lg bg-white border border-gray-200 shadow-md",
            "p-3 text-sm text-gray-700 leading-relaxed",
          ].join(" ")}
        >
          {content}
        </div>
      )}
    </span>
  );
}
