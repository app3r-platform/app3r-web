/**
 * MockAnnoBar — shared mock annotation components for WeeeU (ลบก่อน production)
 * §5 Origin (yellow) · §6 Nav (blue) · §8 Cross-app (purple details)
 * Usage: import { MockAnnoOrigin, MockAnnoNav, MockAnnoXApp } from "@/components/shared/MockAnnoBar"
 */
import type { ReactNode } from "react";

// §5 — Origin bar (yellow) — "มาจากที่ไหน"
export function MockAnnoOrigin({ text }: { text: string }) {
  return (
    <div className="mock-anno mock-anno-origin text-[10px] bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-yellow-700 font-mono">
      {text}
    </div>
  );
}

// §6 — Nav label (blue inline) — "ไปต่อที่ไหน"
export function MockAnnoNav({ text }: { text: string }) {
  return (
    <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-1">{text}</p>
  );
}

// §8 — Cross-app expandable (purple) — "แอพฯอื่นเห็นอะไร"
export function MockAnnoXApp({
  screenLabel,
  children,
}: {
  screenLabel: string;
  children: ReactNode;
}) {
  return (
    <details className="mock-anno mock-anno-xapp">
      <summary className="cursor-pointer text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 font-medium">
        👁 แอพฯอื่น ณ จังหวะนี้ ({screenLabel})
      </summary>
      <div className="mt-1 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 space-y-1">
        {children}
      </div>
    </details>
  );
}
