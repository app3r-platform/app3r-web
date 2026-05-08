"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { StockMovement } from "@/lib/types";

const TYPE_META: Record<string, { label: string; color: string }> = {
  STOCK_IN:         { label: "รับเข้า",    color: "bg-green-900/50 text-green-400" },
  STOCK_OUT:        { label: "จ่ายออก",    color: "bg-red-900/50 text-red-400" },
  STOCK_ADJUSTMENT: { label: "ปรับสต็อก", color: "bg-yellow-900/50 text-yellow-400" },
};

const REASON_LABEL: Record<string, string> = {
  purchase:               "ซื้อเข้า",
  receive_from_disassembly: "รับจากซาก",
  sell:                   "ขาย",
  use_for_repair:         "ใช้ซ่อม",
  use_for_maintain:       "ใช้ล้าง",
  scrap:                  "ทิ้ง",
  manual:                 "Manual",
};

// refId link routing — best-effort based on reason
function refIdLink(reason: string, refId: string) {
  if (reason === "use_for_repair") return `/repair/jobs/${refId}`;
  if (reason === "use_for_maintain") return `/maintain/jobs/${refId}`;
  return null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function MovementDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [movement, setMovement] = useState<StockMovement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovement = useCallback(async () => {
    try {
      const d = await api.get<StockMovement>(`/admin/parts/movements/${id}/`);
      setMovement(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchMovement();
  }, [router, fetchMovement]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !movement) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          {error ?? "ยังไม่มีข้อมูล movement"}
        </div>
        <Link href="/parts/movements" className="text-sm text-blue-400 hover:text-blue-300">← Movements</Link>
      </main>
    </div>
  );

  const tm = TYPE_META[movement.type] ?? { label: movement.type, color: "bg-gray-800 text-gray-300" };
  const qtySign = movement.type === "STOCK_IN" ? "+" : movement.type === "STOCK_OUT" ? "-" : "±";
  const qtyColor = movement.type === "STOCK_IN" ? "text-green-400" : movement.type === "STOCK_OUT" ? "text-red-400" : "text-yellow-400";
  const jobLink = movement.refId ? refIdLink(movement.reason, movement.refId) : null;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">📦 Movement Detail</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${tm.color}`}>{tm.label}</span>
            </div>
            <p className="text-gray-400 text-sm font-mono">{movement.id}</p>
          </div>
          <Link href="/parts/movements"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Movements
          </Link>
        </div>

        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">รายละเอียด</h2>
          <InfoRow label="ประเภท" value={
            <span className={`text-xs px-2 py-0.5 rounded-full ${tm.color}`}>{tm.label}</span>
          } />
          <InfoRow label="Part ID" value={
            <Link href={`/parts/${movement.partId}`}
              className="font-mono text-xs text-blue-400 hover:text-blue-300">
              {movement.partId}
            </Link>
          } />
          <InfoRow label="จำนวน" value={
            <span className={`font-mono font-bold text-base ${qtyColor}`}>
              {qtySign}{movement.qty}
            </span>
          } />
          <InfoRow label="เหตุผล" value={REASON_LABEL[movement.reason] ?? movement.reason} />
          <InfoRow label="คงเหลือหลังดำเนินการ" value={
            <span className="font-mono">{movement.balanceAfter}</span>
          } />
          <InfoRow label="ผู้ดำเนินการ" value={movement.performedBy} />
          <InfoRow label="วันที่ดำเนินการ" value={new Date(movement.performedAt).toLocaleString("th-TH")} />
          {movement.note && (
            <InfoRow label="หมายเหตุ" value={movement.note} />
          )}
          {movement.refId && (
            <InfoRow label="อ้างอิง (Ref ID)" value={
              jobLink ? (
                <Link href={jobLink}
                  className="font-mono text-xs text-blue-400 hover:text-blue-300">
                  {movement.refId} ↗
                </Link>
              ) : (
                <span className="font-mono text-xs text-gray-400">{movement.refId}</span>
              )
            } />
          )}
        </section>

      </main>
    </div>
  );
}
