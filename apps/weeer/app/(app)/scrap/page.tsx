"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scrapApi } from "./_lib/api";

type Dashboard = {
  availableCount: number;
  soldCount: number;
  activeJobs: number;
  pendingDecisions: number;
};

export default function ScrapPage() {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    scrapApi.dashboard()
      .then(setDash)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบซากกำลังพัฒนา — {error}</div>;

  const cards = [
    { label: "ซากพร้อมขาย", value: dash?.availableCount ?? 0, color: "text-green-700", bg: "bg-green-50" },
    { label: "ขายแล้ว", value: dash?.soldCount ?? 0, color: "text-gray-600", bg: "bg-gray-50" },
    { label: "งานซากที่ดำเนินการ", value: dash?.activeJobs ?? 0, color: "text-blue-700", bg: "bg-blue-50" },
    { label: "รอตัดสินใจ", value: dash?.pendingDecisions ?? 0, color: "text-yellow-700", bg: "bg-yellow-50" },
  ];

  const links = [
    { href: "/scrap/browse", icon: "🔍", label: "เลือกซื้อซาก", sub: "ดูซากที่วางขายจาก WeeeU" },
    { href: "/scrap/jobs",   icon: "🔧", label: "งานซาก",      sub: "จัดการซากที่ซื้อมาแล้ว" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">♻️ Scrap</h1>
        {(dash?.pendingDecisions ?? 0) > 0 && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">
            {dash!.pendingDecisions} รอตัดสินใจ
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:shadow-sm transition-shadow">
            <span className="text-2xl">{l.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">{l.label}</p>
              <p className="text-xs text-gray-400">{l.sub}</p>
            </div>
            <span className="ml-auto text-gray-300">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
