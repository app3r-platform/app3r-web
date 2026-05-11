"use client";

// ── ShopJobsStatsCard — Phase C-5 ────────────────────────────────────────────

interface StatItem {
  label: string;
  value: number | string;
  icon: string;
  colorClass: string;
}

interface ShopJobsStatsCardProps {
  stats: StatItem[];
}

export function ShopJobsStatsCard({ stats }: ShopJobsStatsCardProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-2xl p-3 ${s.colorClass}`}>
          <div className="text-xl mb-0.5">{s.icon}</div>
          <div className="text-lg font-bold">{s.value}</div>
          <div className="text-xs opacity-70">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
