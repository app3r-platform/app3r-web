// ── MockFlowAnno — P2 Flow Annotation Components (Parts Module) ───────────────
// ใช้สำหรับ mockup เท่านั้น — แสดง §5 origin / §6 nav / §8 cross-app
// อ้างอิง: HUB Gen 52 CMD ⑤ · Tier-1 lens · R3 canonical IDs

"use client";

import { useState } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// §5 FlowOrigin — "◀ มาจาก: R-XX"
// วางไว้ด้านบนของหน้า แสดงจอก่อนหน้าใน flow
// ──────────────────────────────────────────────────────────────────────────────
interface FlowOriginProps {
  /** รายการต้นทาง เช่น [{ id: "R-30", label: "ตลาดอะไหล่ B2B" }] */
  sources: { id: string; label: string; href?: string }[];
  /** เคสที่เกี่ยวข้อง เช่น "P3, P4, P10, P11" */
  cases?: string;
}

export function FlowOrigin({ sources, cases }: FlowOriginProps) {
  return (
    <div className="mock-anno mock-anno-origin bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-blue-700">§5 มาจาก:</span>
        {sources.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-800 text-xs font-mono px-2 py-0.5 rounded-full"
          >
            ◀ {s.id}
            <span className="font-sans font-normal text-blue-600 ml-0.5">
              {s.label}
            </span>
          </span>
        ))}
      </div>
      {cases && (
        <p className="text-xs text-blue-500">เคส: {cases}</p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// §6 FlowNav — "→ R-XX" label ต่อท้ายปุ่ม/ลิงก์
// ──────────────────────────────────────────────────────────────────────────────
interface FlowNavProps {
  /** รหัสจอปลายทาง */
  targetId: string;
  /** ชื่อจอปลายทาง */
  targetLabel: string;
  /** เงื่อนไขที่ทำให้เกิด nav นี้ (optional) */
  condition?: string;
}

export function FlowNav({ targetId, targetLabel, condition }: FlowNavProps) {
  return (
    <span className="mock-anno mock-anno-nav inline-flex items-center gap-1 ml-1.5">
      <span className="text-xs font-mono bg-orange-100 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5">
        → {targetId}
      </span>
      <span className="text-xs text-orange-600 hidden sm:inline">{targetLabel}</span>
      {condition && (
        <span className="text-xs text-gray-400 italic">({condition})</span>
      )}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// §8 CrossAppPanel — "👁 แอพฯอื่น ณ จังหวะนี้"
// แสดง cross-app view: อีกฝั่ง (seller/buyer WeeeR) เห็นอะไร
// ──────────────────────────────────────────────────────────────────────────────
interface CrossAppEntry {
  /** App name + role */
  app: string;
  /** Screen ID ที่ active */
  screenId: string;
  /** ชื่อจอ */
  screenLabel: string;
  /** คำอธิบายสิ่งที่เห็น */
  description: string;
}

interface CrossAppPanelProps {
  /** สถานการณ์/จุดใน flow */
  moment: string;
  entries: CrossAppEntry[];
  /** เคสที่เกี่ยวข้อง */
  cases?: string;
}

export function CrossAppPanel({ moment, entries, cases }: CrossAppPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mock-anno mock-anno-xapp border border-purple-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 hover:bg-purple-100 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
          <span>👁</span>
          <span>§8 แอพฯอื่น ณ จังหวะนี้</span>
          <span className="font-normal text-purple-500">— {moment}</span>
        </span>
        <span className="text-purple-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white divide-y divide-purple-50">
          {cases && (
            <div className="px-3 py-1.5 bg-purple-50">
              <span className="text-xs text-purple-500">เคส: {cases}</span>
            </div>
          )}
          {entries.map((e, i) => (
            <div key={i} className="px-3 py-2 flex items-start gap-2">
              <div className="shrink-0">
                <span className="text-xs font-semibold text-gray-600">{e.app}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 text-gray-700 rounded px-1.5 py-0.5 mb-0.5">
                  📱 {e.screenId}
                </span>
                <span className="text-xs text-gray-500 ml-1">{e.screenLabel}</span>
                <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// FlowAnnoBlock — wrapper รวม §5 + §8 ไว้ใน block เดียว
// ──────────────────────────────────────────────────────────────────────────────
interface FlowAnnoBlockProps {
  origin?: FlowOriginProps;
  crossApp?: CrossAppPanelProps;
}

export function FlowAnnoBlock({ origin, crossApp }: FlowAnnoBlockProps) {
  if (!origin && !crossApp) return null;
  return (
    <div className="space-y-2">
      {origin && <FlowOrigin {...origin} />}
      {crossApp && <CrossAppPanel {...crossApp} />}
    </div>
  );
}
