"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapItem } from "@/lib/types";

const STATUS_META: Record<ScrapItem["status"], { label: string; color: string }> = {
  available: { label: "ขายได้",  color: "bg-green-900/50 text-green-400" },
  sold:      { label: "ขายแล้ว", color: "bg-blue-900/50 text-blue-300" },
  removed:   { label: "ลบแล้ว",  color: "bg-gray-800 text-gray-500" },
};

const GRADE_META: Record<ScrapItem["conditionGrade"], { label: string; color: string }> = {
  grade_A: { label: "Grade A", color: "bg-green-900/50 text-green-400" },
  grade_B: { label: "Grade B", color: "bg-yellow-900/50 text-yellow-400" },
  grade_C: { label: "Grade C", color: "bg-red-900/50 text-red-400" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function ScrapListingDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [item, setItem] = useState<ScrapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const superAdmin = isSuperAdmin();

  const fetchItem = useCallback(async () => {
    try {
      const d = await api.get<ScrapItem>(`/admin/scrap/items/${id}/`);
      setItem(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchItem();
  }, [router, fetchItem]);

  async function handleForceRemove() {
    if (!removeConfirm) { setRemoveConfirm(true); return; }
    setRemoving(true);
    try {
      await api.patch(`/admin/scrap/items/${id}/force_remove/`, {});
      await fetchItem();
      setRemoveConfirm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemoving(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !item) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          {error ?? "ยังไม่มีข้อมูลซาก"}
        </div>
        <Link href="/scrap/listings" className="text-sm text-blue-400 hover:text-blue-300">← Listings</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[item.status];
  const gm = GRADE_META[item.conditionGrade];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">♻️ Scrap Detail</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${gm.color}`}>{gm.label}</span>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            </div>
            <p className="text-gray-400 text-sm font-mono">{item.id}</p>
          </div>
          <Link href="/scrap/listings"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Item info */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูลซาก</h2>
            <InfoRow label="Seller ID" value={<span className="font-mono text-xs">{item.sellerId}</span>} />
            <InfoRow label="Seller Type" value={item.sellerType} />
            {item.applianceId && (
              <InfoRow label="Appliance ID" value={<span className="font-mono text-xs">{item.applianceId}</span>} />
            )}
            <InfoRow label="เกรด" value={
              <span className={`text-xs px-2 py-0.5 rounded-full ${gm.color}`}>{gm.label}</span>
            } />
            <InfoRow label="รายละเอียด" value={item.description} />
            <InfoRow label="Part ที่ใช้ได้" value={
              item.workingParts.length > 0
                ? item.workingParts.join(", ")
                : <span className="text-gray-500">ไม่มี</span>
            } />
          </section>

          {/* Price & status */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ราคา & สถานะ</h2>
            <InfoRow label="ราคา" value={
              <span className="font-mono text-green-400 font-bold text-lg">{item.price.toLocaleString()} ฿</span>
            } />
            <InfoRow label="สถานะ" value={
              <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            } />
            <InfoRow label="สร้างเมื่อ" value={new Date(item.createdAt).toLocaleString("th-TH")} />
            <InfoRow label="อัพเดตล่าสุด" value={new Date(item.updatedAt).toLocaleString("th-TH")} />
          </section>

          {/* Photos */}
          {item.photos.length > 0 && (
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 lg:col-span-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                รูปภาพ ({item.photos.length})
              </h2>
              <div className="flex gap-3 flex-wrap">
                {item.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="hover:opacity-80 transition-opacity">
                    <img src={url} alt={`photo-${i + 1}`}
                      className="h-32 w-32 object-cover rounded-lg bg-gray-800" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Quick links */}
        <div className="flex gap-3">
          <Link href={`/scrap/jobs?scrap_item_id=${item.id}`}
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            🔨 ดู Jobs →
          </Link>
        </div>

        {/* Force Remove (super admin only) */}
        {superAdmin && item.status === "available" && (
          <section className="bg-red-950/30 rounded-xl border border-red-900/50 p-5">
            <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">
              ⚠️ Force Remove (Super Admin)
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              บังคับลบรายการซากออกจากระบบ ใช้เฉพาะกรณีพิเศษเท่านั้น
            </p>
            {removeConfirm ? (
              <div className="flex gap-3 items-center">
                <span className="text-sm text-red-400">ยืนยันลบรายการนี้?</span>
                <button onClick={handleForceRemove} disabled={removing}
                  className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 rounded-lg disabled:opacity-50">
                  {removing ? "กำลังลบ..." : "ยืนยัน Force Remove"}
                </button>
                <button onClick={() => setRemoveConfirm(false)}
                  className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg">
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button onClick={handleForceRemove}
                className="px-4 py-2 text-sm bg-red-900/50 hover:bg-red-800/50 border border-red-800 text-red-400 rounded-lg transition-colors">
                🗑️ Force Remove
              </button>
            )}
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </section>
        )}

      </main>
    </div>
  );
}
