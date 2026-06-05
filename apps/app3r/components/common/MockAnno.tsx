// ============================================================
// components/common/MockAnno.tsx — Mockup Annotation Components
// P2 Phase — Mockup Completeness (base da0e3a9)
//
// กฎใช้งาน:
//   §5 MockAnnoOrigin  = ป้ายบนหัวจอ "◀ มาจาก: <ID>" (ทุกจอยกเว้นจอแรกของแอพฯ)
//   §6 MockAnnoNav     = annotation ที่ปุ่ม/ลิงก์ "→ <ID ปลายทาง>"
//   §8 MockAnnoXapp    = ปุ่มเล็ก "👁 แอพฯอื่น ณ จังหวะนี้"
//
// ✅ ใช้ class ร่วม `mock-anno` ทุก element → grep ลบทีเดียวตอนเขียนโค้ด:
//      grep -r "mock-anno" --include="*.tsx" -l   # หาไฟล์ที่มี
// ✅ Server-component friendly — ไม่ import client hooks
// ✅ render เสมอใน mockup base (ไม่ gate ด้วย DEV_NAV เพื่อให้ Advisor ตรวจได้)
// ============================================================

// ─── §5 Origin Badge ─────────────────────────────────────────────────────────
interface MockAnnoOriginProps {
  /** Screen ID(s) ที่ link มาถึงหน้านี้ เช่น "W-07" หรือ ["W-07","W-06"] */
  from: string | string[];
}

/**
 * ป้ายสีเหลืองอ่อนบนหัวจอแสดงว่ามาจากหน้าใด
 * วาง: บรรทัดแรกในส่วน return ของ page component (ก่อน breadcrumb/header)
 */
export function MockAnnoOrigin({ from }: MockAnnoOriginProps) {
  const ids = Array.isArray(from) ? from : [from];
  return (
    <div
      className="mock-anno mock-anno-origin"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        marginBottom: "4px",
        background: "#fef9c3",
        border: "1px solid #fde68a",
        borderRadius: "6px",
        fontSize: "11px",
        color: "#78350f",
        fontFamily: "monospace",
      }}
    >
      <span>◀ มาจาก:</span>
      {ids.map((id) => (
        <span
          key={id}
          style={{
            background: "#fcd34d",
            padding: "1px 6px",
            borderRadius: "4px",
            fontWeight: 600,
          }}
        >
          {id}
        </span>
      ))}
    </div>
  );
}

// ─── §6 Nav Destination Badge ─────────────────────────────────────────────────
interface MockAnnoNavProps {
  /** Screen ID ปลายทาง เช่น "W-08" หรือ "WeeeU-/signup/email" สำหรับ cross-app */
  to: string;
}

/**
 * Inline badge แสดง destination ID — วางถัดจาก Link/button text
 * ใช้ as sibling ใน flex container หรือ wrapping element
 */
export function MockAnnoNav({ to }: MockAnnoNavProps) {
  return (
    <span
      className="mock-anno mock-anno-nav"
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "9px",
        fontFamily: "monospace",
        color: "#6b7280",
        background: "#f3f4f6",
        border: "1px solid #e5e7eb",
        borderRadius: "3px",
        padding: "0 4px",
        marginLeft: "4px",
        verticalAlign: "middle",
        lineHeight: "1.4",
      }}
    >
      →{to}
    </span>
  );
}

// ─── §8 Cross-App View Annotation ─────────────────────────────────────────────
interface MockAnnoXappEntry {
  /** ชื่อแอพ เช่น "WeeeU" "WeeeR" "WeeeT" */
  app: string;
  /** Screen ID ที่แอพนั้นเห็น ณ จังหวะนี้ */
  screen: string;
  /** URL สำหรับดู mockup (localhost:port<route>) */
  href?: string;
  /** คำอธิบายสั้นๆ ว่าแอพนั้นเห็นอะไร */
  label?: string;
}

interface MockAnnoXappProps {
  /** รายการแอพและหน้าจอที่เห็นพร้อมกัน ณ จังหวะนี้ */
  apps: MockAnnoXappEntry[];
  /** Context อธิบาย event ที่ trigger cross-app view นี้ */
  context?: string;
}

/**
 * แสดงว่าแอพอื่น เห็นจออะไรพร้อมกัน ณ จังหวะนี้
 * วาง: ถัดจากปุ่ม/action ที่ cross-app
 */
export function MockAnnoXapp({ apps, context }: MockAnnoXappProps) {
  return (
    <div
      className="mock-anno mock-anno-xapp"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        margin: "4px 0",
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "6px",
        fontSize: "10px",
        color: "#1e40af",
        fontFamily: "monospace",
      }}
    >
      <span style={{ fontWeight: 600 }}>👁 แอพฯอื่น ณ จังหวะนี้</span>
      {context && <span style={{ color: "#6b7280" }}>({context})</span>}
      <span style={{ color: "#9ca3af" }}>→</span>
      {apps.map((entry) => (
        <span
          key={`${entry.app}-${entry.screen}`}
          style={{
            background: "#dbeafe",
            padding: "1px 6px",
            borderRadius: "4px",
            fontWeight: 500,
          }}
        >
          {entry.app}: {entry.screen}
          {entry.label ? ` (${entry.label})` : ""}
        </span>
      ))}
    </div>
  );
}
