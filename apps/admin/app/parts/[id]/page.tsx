"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { Part } from "@/lib/types";

const CONDITION_META: Record<Part["condition"], { label: string; color: string }> = {
  new:         { label: "ใหม่",      color: "bg-green-900/50 text-green-400" },
  used:        { label: "มือสอง",   color: "bg-yellow-900/50 text-yellow-400" },
  refurbished: { label: "ปรับสภาพ", color: "bg-blue-900/50 text-blue-300" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function PartDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPart = useCallback(async () => {
    try {
      const d = await api.get<Part>(`/admin/parts/${id}/`);
      setPart(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchPart();
  }, [router, fetchPart]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !part) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          {error ?? "ยังไม่มีข้อมูลอะไหล่"}
        </div>
        <Link href="/parts" className="text-sm text-blue-400 hover:text-blue-300">← Inventory</Link>
      </main>
    </div>
  );

  const cm = CONDITION_META[part.condition];
  const available = part.stockQty - part.reservedQty;
  const stockValue = part.stockQty * part.unitPrice;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">🔩 {part.name}</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${cm.color}`}>{cm.label}</span>
            </div>
            <p className="text-gray-400 text-sm font-mono">{part.sku}</p>
          </div>
          <Link href="/parts"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Inventory
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Part info */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูลอะไหล่</h2>
            <InfoRow label="SKU" value={<span className="font-mono">{part.sku}</span>} />
            <InfoRow label="หมวดหมู่" value={part.category} />
            <InfoRow label="หน่วย" value={part.unit} />
            <InfoRow label="สภาพ" value={
              <span className={`text-xs px-2 py-0.5 rounded-full ${cm.color}`}>{cm.label}</span>
            } />
            <InfoRow label="Shop ID" value={<span className="font-mono text-xs">{part.shopId}</span>} />
            {part.source && (
              <InfoRow label="แหล่งที่มา" value={
                <span>
                  {part.source.type === "purchase" ? "ซื้อเข้า" : "แยกจากซาก"}
                  {part.source.refId && (
                    <span className="ml-2 text-xs text-gray-500 font-mono">#{part.source.refId}</span>
                  )}
                </span>
              } />
            )}
          </section>

          {/* Stock info */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">สต็อก</h2>
            <InfoRow label="คงเหลือทั้งหมด" value={
              <span className={`font-mono font-bold ${part.stockQty <= 2 ? "text-red-400" : "text-gray-100"}`}>
                {part.stockQty} {part.unit}
                {part.stockQty <= 2 && <span className="ml-1 text-xs">⚠️ Low stock</span>}
              </span>
            } />
            <InfoRow label="จอง" value={
              <span className="font-mono text-yellow-600">{part.reservedQty} {part.unit}</span>
            } />
            <InfoRow label="พร้อมใช้" value={
              <span className={`font-mono font-semibold ${available <= 0 ? "text-red-500" : "text-green-400"}`}>
                {available} {part.unit}
              </span>
            } />
            <InfoRow label="ราคา/หน่วย" value={
              <span className="font-mono text-green-400">{part.unitPrice.toLocaleString()} ฿</span>
            } />
            <InfoRow label="มูลค่าสต็อก" value={
              <span className="font-mono text-green-400 font-bold">{stockValue.toLocaleString()} ฿</span>
            } />
          </section>

          {/* Image */}
          {part.imageUrl && (
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 lg:col-span-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">รูปภาพ</h2>
              <a href={part.imageUrl} target="_blank" rel="noreferrer"
                className="inline-block hover:opacity-80 transition-opacity">
                <img src={part.imageUrl} alt={part.name}
                  className="h-48 object-contain rounded-lg bg-gray-800" />
              </a>
            </section>
          )}

          {/* Timestamps */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Audit Info</h2>
            <InfoRow label="สร้างเมื่อ" value={new Date(part.createdAt).toLocaleString("th-TH")} />
            <InfoRow label="อัพเดตล่าสุด" value={new Date(part.updatedAt).toLocaleString("th-TH")} />
          </section>

        </div>

        {/* Quick links */}
        <div className="flex gap-3">
          <Link href={`/parts/movements?part_id=${part.id}`}
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            📦 ดู Movement History →
          </Link>
        </div>

      </main>
    </div>
  );
}
