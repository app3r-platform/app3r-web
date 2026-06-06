"use client";
/**
 * mock-anno — Mockup Annotation Components (§5/§6/§8)
 * ลบทีเดียวด้วย: grep -r "mock-anno" apps/weeer --include="*.tsx" -l
 *
 * §5  MockAnnoOrigin  — "◀ มาจาก: <ID>" บนหัวจอ
 * §6  MockAnnoNav     — "→ <ID>" ที่ปุ่ม/ลิงก์
 * §8  MockAnnoXApp    — "👁 แอพฯอื่น ณ จังหวะนี้" panel
 */

import React from "react";

// ────────────────────────────────────────────────────────────
// §5 — Origin banner
// ────────────────────────────────────────────────────────────
interface OriginProps {
  /** รหัสจอต้นทาง ≥1 (ยกเว้นจอแรกของแอพฯ ไม่ต้องใส่) */
  from: string | string[];
}

export function MockAnnoOrigin({ from }: OriginProps) {
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  const ids = Array.isArray(from) ? from : [from];
  return (
    <div
      className="mock-anno mock-anno-origin"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,102,58,0.08)",
        border: "1px dashed #FF663A",
        borderRadius: 6,
        padding: "2px 10px",
        fontSize: 11,
        color: "#D63B12",
        fontFamily: "ui-monospace, monospace",
        marginBottom: 8,
      }}
    >
      ◀ มาจาก: {ids.join(" | ")}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// §6 — Destination label (wrap ปุ่ม/ลิงก์)
// ────────────────────────────────────────────────────────────
interface NavProps {
  /** รหัสจอปลายทาง เช่น "R-09" */
  to: string;
  children: React.ReactNode;
  /** optional label (ignored, สำหรับ docs เท่านั้น) */
  label?: string;
  /** optional wrapper style เช่น { display: "contents" } */
  style?: React.CSSProperties;
}

export function MockAnnoNav({ to, children, style }: NavProps) {
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return <>{children}</>;
  return (
    <span
      className="mock-anno mock-anno-nav"
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      {children}
      <span
        style={{
          position: "absolute",
          top: -16,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontSize: 9,
          color: "#0891b2",
          fontFamily: "ui-monospace, monospace",
          background: "rgba(255,255,255,0.95)",
          border: "1px dashed #0891b2",
          borderRadius: 3,
          padding: "0 4px",
          pointerEvents: "none",
        }}
      >
        → {to}
      </span>
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// §8 — Cross-app view panel
// ────────────────────────────────────────────────────────────
interface XAppEntry {
  /** ชื่อแอพฯ เช่น "WeeeU" */
  app: string;
  /** รหัสจอ+ชื่อ เช่น "U-22 ดูสถานะงาน" */
  screen: string;
  /** URL localhost เปิดดูได้เลย */
  url: string;
}

interface XAppProps {
  /** canonical pattern — array of cross-app entries */
  entries?: XAppEntry[];
  /** PHASE-4-REMOVE shim (Advisor Gen 113 α · backward-compat for scrap-in-weeer 6 จอ) */
  screenLabel?: string;
  /** PHASE-4-REMOVE shim (Advisor Gen 113 α) — legacy JSX children pattern */
  children?: React.ReactNode;
}

export function MockAnnoXApp({ entries, screenLabel, children }: XAppProps) {
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  // PHASE-4-REMOVE: shim path — legacy {screenLabel, children} pattern from scrap-in-weeer
  if (children !== undefined) {
    return (
      <details className="mock-anno mock-anno-xapp">
        <summary className="cursor-pointer text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 font-medium">
          👁 แอพฯอื่น ณ จังหวะนี้{screenLabel ? ` (${screenLabel})` : ""}
        </summary>
        <div className="mt-1 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 space-y-1">
          {children}
        </div>
      </details>
    );
  }
  if (!entries || entries.length === 0) return null;
  return (
    <div
      className="mock-anno mock-anno-xapp"
      style={{
        background: "rgba(255,102,58,0.05)",
        border: "1px dashed #FF663A",
        borderRadius: 8,
        padding: "8px 12px",
        marginTop: 16,
        fontSize: 11,
        fontFamily: "ui-monospace, monospace",
      }}
    >
      <p style={{ fontWeight: 700, color: "#B8300E", marginBottom: 6, fontSize: 11 }}>
        👁 แอพฯอื่น ณ จังหวะนี้
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map((e, i) => (
          <a
            key={i}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#FF663A",
              textDecoration: "none",
              fontSize: 11,
            }}
          >
            <span
              style={{
                background: "#FFE0D6",
                color: "#B8300E",
                borderRadius: 4,
                padding: "0 5px",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {e.app}
            </span>
            <span style={{ color: "#374151" }}>{e.screen}</span>
            <span style={{ color: "#9ca3af", fontSize: 10 }}>
              {e.url}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
