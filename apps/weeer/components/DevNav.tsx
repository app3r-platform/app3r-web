"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
export type DevNavLink = {
  label: string;
  href: string;
  type: "cross-app" | "branch" | "next-step";
  /** ถ้าระบุ → แสดงเฉพาะหน้าที่ pathname ตรงกัน */
  forPath?: string;
};

interface DevNavProps {
  links: DevNavLink[];
}

function linkColor(type: DevNavLink["type"]): string {
  if (type === "cross-app") return "#FF663A";
  if (type === "branch")    return "#d97706";
  return "#0891b2";
}

function linkPrefix(type: DevNavLink["type"]): string {
  if (type === "cross-app") return "🔗";
  if (type === "branch")    return "⑂";
  return "▶";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DevNav({ links }: DevNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // กรองลิงก์ตาม path ปัจจุบัน (forPath ไม่ระบุ = แสดงทุกหน้า)
  const visibleLinks = links.filter(
    (l) => !l.forPath || l.forPath === pathname
  );

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: 9999,
    fontFamily: "ui-monospace, 'Cascadia Code', monospace",
    fontSize: "11px",
    color: "#6b7280",
    userSelect: "none",
  };

  const panelStyle: React.CSSProperties = {
    border: "2px dashed #9ca3af",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "6px",
    minWidth: "200px",
    maxWidth: "280px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
  };

  const btnStyle: React.CSSProperties = {
    border: "2px dashed #9ca3af",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "8px",
    padding: "4px 10px",
    cursor: "pointer",
    color: "#6b7280",
    fontSize: "11px",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    width: "100%",
  };

  const linkItemStyle = (type: DevNavLink["type"]): React.CSSProperties => ({
    display: "block",
    padding: "3px 6px",
    borderRadius: "4px",
    background: "#f3f4f6",
    textDecoration: "none",
    color: linkColor(type),
    fontSize: "11px",
    fontFamily: "inherit",
  });

  return (
    <div style={containerStyle}>
      {open && (
        <div style={panelStyle}>
          {/* Header */}
          <p
            style={{
              fontWeight: 700,
              color: "#374151",
              marginBottom: "6px",
              borderBottom: "1px dashed #e5e7eb",
              paddingBottom: "4px",
            }}
          >
            🔧 DEV NAV
          </p>

          {/* Links */}
          {visibleLinks.length === 0 ? (
            <p style={{ color: "#9ca3af", fontStyle: "italic" }}>
              (ไม่มีลิงก์สำหรับหน้านี้)
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {visibleLinks.map((link, i) =>
                link.type === "cross-app" ? (
                  <a
                    key={i}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkItemStyle(link.type)}
                  >
                    {linkPrefix(link.type)} {link.label}
                  </a>
                ) : (
                  <Link
                    key={i}
                    href={link.href}
                    style={linkItemStyle(link.type)}
                  >
                    {linkPrefix(link.type)} {link.label}
                  </Link>
                )
              )}
            </div>
          )}

          {/* Footer: current path */}
          <p
            style={{
              marginTop: "6px",
              paddingTop: "4px",
              borderTop: "1px dashed #e5e7eb",
              color: "#9ca3af",
              fontSize: "10px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            📍 {pathname}
          </p>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={btnStyle}
        title="Dev Navigator (dev only)"
      >
        🔧 <span>DEV NAV</span>
        <span style={{ fontSize: "9px", marginLeft: "2px" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
    </div>
  );
}
