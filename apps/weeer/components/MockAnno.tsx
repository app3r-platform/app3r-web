"use client";
/**
 * mock-anno — Mockup Annotation Components (§5/§6/§8)
 * ลบทีเดียวด้วย: grep -r "mock-anno" apps/weeer --include="*.tsx" -l
 *
 * §5  MockAnnoOrigin  — "◀ มาจาก: <ID>" บนหัวจอ + [↔] junction popup (JUNCTION 2.4)
 * §6  MockAnnoNav     — "→ <ID>" ที่ปุ่ม/ลิงก์
 * §8  MockAnnoXApp    — "👁 แอพฯอื่น ณ จังหวะนี้" panel
 */

import React, { useState } from "react";
import { JUNCTION_DATA, type JunctionEntry } from "../lib/junction-data";

// ────────────────────────────────────────────────────────────
// §5 — Origin banner (+ JUNCTION 2.4 [↔] popup)
// ────────────────────────────────────────────────────────────
interface OriginProps {
  /** รหัสจอต้นทาง ≥1 (ยกเว้นจอแรกของแอพฯ ไม่ต้องใส่) */
  from: string | string[];
  /**
   * JUNCTION 2.4 — รหัสจอปัจจุบัน (เช่น "R-11") เพื่อแสดงปุ่ม [↔]
   * ถ้าไม่ระบุ หรือรหัสไม่อยู่ใน JUNCTION_DATA → icon ซ่อน
   */
  screenId?: string;
}

/** แปลง "- line1\n- line2" เป็น list items */
function BulletLines({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{ paddingLeft: 10, marginBottom: 3, fontSize: 12, lineHeight: 1.5 }}
        >
          {line.replace(/^- /, "• ")}
        </div>
      ))}
    </>
  );
}

/** JUNCTION 2.4 — scrollable modal popup แสดง 3 ส่วน (📋/◀/▶) */
function JunctionModal({
  screenId,
  entry,
  onClose,
}: {
  screenId: string;
  entry: JunctionEntry;
  onClose: () => void;
}) {
  const sectionStyle: React.CSSProperties = {
    marginBottom: 14,
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 12,
    color: "#B8300E",
    marginBottom: 4,
    fontFamily: "ui-monospace, monospace",
  };
  const contentStyle: React.CSSProperties = {
    color: "#374151",
    fontSize: 12,
    lineHeight: 1.6,
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 9998,
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          background: "#fff",
          borderRadius: 12,
          padding: "16px 20px 20px",
          width: "calc(100vw - 32px)",
          maxWidth: 480,
          maxHeight: "78vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 8,
          }}
        >
          <div>
            <span
              style={{
                background: "rgba(255,102,58,0.12)",
                border: "1px solid #FF663A",
                borderRadius: 5,
                padding: "1px 7px",
                fontSize: 11,
                color: "#D63B12",
                fontFamily: "ui-monospace, monospace",
                fontWeight: 700,
                marginRight: 8,
              }}
            >
              {screenId}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {entry.title}
            </span>
            <div
              style={{
                fontSize: 10,
                color: "#9ca3af",
                marginTop: 2,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Junction: {entry.sourceJunction}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "#6b7280",
              padding: "0 4px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px dashed #e5e7eb", marginBottom: 14 }} />

        {/* 📋 หน้าที่ */}
        <div style={sectionStyle}>
          <div style={labelStyle}>📋 หน้าที่</div>
          <div style={contentStyle}>{entry.duty}</div>
        </div>

        {/* ◀ มาจาก */}
        <div style={sectionStyle}>
          <div style={labelStyle}>◀ มาจาก</div>
          <div style={contentStyle}>
            <BulletLines text={entry.from} />
          </div>
        </div>

        {/* ▶ ไปต่อ */}
        <div style={{ ...sectionStyle, marginBottom: 0 }}>
          <div style={labelStyle}>▶ ไปต่อ</div>
          <div style={contentStyle}>
            <BulletLines text={entry.next} />
          </div>
        </div>
      </div>
    </>
  );
}

export function MockAnnoOrigin({ from, screenId }: OriginProps) {
  const [showJunction, setShowJunction] = useState(false);
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  const ids = Array.isArray(from) ? from : [from];
  const junctionEntry = screenId ? JUNCTION_DATA[screenId] : undefined;

  return (
    <>
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
        {/* JUNCTION 2.4 — [↔] button: แสดงเฉพาะเมื่อ screenId อยู่ใน JUNCTION_DATA */}
        {junctionEntry && (
          <button
            onClick={() => setShowJunction(true)}
            title={`Junction: ${screenId} — ${junctionEntry.title}`}
            style={{
              background: "rgba(255,102,58,0.15)",
              border: "1px solid #FF663A",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 10,
              color: "#B8300E",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
              padding: "0 5px",
              lineHeight: "16px",
              marginLeft: 2,
            }}
          >
            [↔]
          </button>
        )}
      </div>
      {showJunction && junctionEntry && screenId && (
        <JunctionModal
          screenId={screenId}
          entry={junctionEntry}
          onClose={() => setShowJunction(false)}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────
// §6 — Destination label (wrap ปุ่ม/ลิงก์)
// ────────────────────────────────────────────────────────────
interface NavProps {
  /** รหัสจอปลายทาง เช่น "R-09" — canonical pattern (with children) */
  to?: string;
  children?: React.ReactNode;
  /** optional label (ignored, สำหรับ docs เท่านั้น) */
  label?: string;
  /** optional wrapper style เช่น { display: "contents" } */
  style?: React.CSSProperties;
  /** PHASE-4-REMOVE shim (Advisor Gen 113 α · backward-compat for scrap-in-weeer legacy {text} pattern) */
  text?: string;
}

export function MockAnnoNav({ to, children, style, text }: NavProps) {
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return <>{children}</>;
  // PHASE-4-REMOVE: shim path — legacy {text} pattern from scrap-in-weeer
  if (text !== undefined && to === undefined) {
    return (
      <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-1">{text}</p>
    );
  }
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
