"use client";
// MockAnno — annotation overlay สำหรับ mockup review (DEV only)
// § spec: §5 origin · §6 nav destinations · §8 cross-app
// Render เฉพาะ NEXT_PUBLIC_DEV_NAV=true (เดียวกับ ScreenBadge)

interface MockAnnoProps {
  /** §5 มาจาก: screen/route ที่นำมา */
  origin?: string;
  /** §6 ไปต่อ: destinations (newline-delimited) */
  nav?: string;
  /** §8 cross-app: app อื่นที่เกี่ยวข้อง */
  xapp?: string;
}

export function MockAnno({ origin, nav, xapp }: MockAnnoProps) {
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  if (!origin && !nav && !xapp) return null;

  return (
    <aside
      className="mock-anno fixed bottom-[52px] right-0 z-40 max-w-[180px] rounded-l-lg bg-black/80 p-1.5 text-[9px] leading-snug text-gray-300 space-y-0.5 pointer-events-none"
      aria-hidden="true"
    >
      {origin && (
        <p className="mock-anno-origin">
          <span className="text-gray-500 font-bold">§5</span> {origin}
        </p>
      )}
      {nav && (
        <p className="mock-anno-nav">
          <span className="text-gray-500 font-bold">§6</span>{" "}
          {nav.split("\n").map((line, i) => (
            <span key={i}>{line}{i < nav.split("\n").length - 1 ? " · " : ""}</span>
          ))}
        </p>
      )}
      {xapp && (
        <p className="mock-anno-xapp">
          <span className="text-gray-500 font-bold">§8</span> {xapp}
        </p>
      )}
    </aside>
  );
}
