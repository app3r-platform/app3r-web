"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapItem } from "@/lib/types";

/* S12 — extended with cross-module repair ref */
interface ScrapItemExtended extends ScrapItem {
  source_repair_job_id?: string | null;
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_SCRAP_ITEM: ScrapItemExtended = {
  id: "SCR-001",
  sellerId: "USR-1001",
  sellerType: "WeeeU",
  applianceId: "APP-5501",
  conditionGrade: "grade_A",
  workingParts: ["คอมเพรสเซอร์", "พัดลม", "บอร์ดควบคุม", "วาล์วขยาย"],
  description: "แอร์ Daikin 12,000 BTU ปี 2021 ใช้งานปกติ ชิ้นส่วนครบ สภาพดีมาก",
  photos: [],
  price: 3500,
  status: "available",
  createdAt: "2026-05-10T08:00:00Z",
  updatedAt: "2026-05-10T08:00:00Z",
  source_repair_job_id: null,
};

const STATUS_META: Record<ScrapItem["status"], { label: string; color: string }> = {
  available: { label: "ขายได้",  color: "bg-green-50 text-green-700" },
  sold:      { label: "ขายแล้ว", color: "bg-blue-50 text-blue-700" },
  removed:   { label: "ลบแล้ว",  color: "bg-gray-100 text-gray-500" },
};

const GRADE_META: Record<ScrapItem["conditionGrade"], { label: string; color: string }> = {
  grade_A: { label: "Grade A", color: "bg-green-50 text-green-700" },
  grade_B: { label: "Grade B", color: "bg-yellow-50 text-yellow-700" },
  grade_C: { label: "Grade C", color: "bg-red-50 text-red-700" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-200/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function ScrapListingDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [item, setItem] = useState<ScrapItemExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const superAdmin = isSuperAdmin();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchItem = useCallback(async () => {
    try {
      const d = await api.get<ScrapItemExtended>(`/admin/scrap/items/${id}/`);
      setItem(d);
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setItem(MOCK_SCRAP_ITEM);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

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
    } catch (e: unknown) {
      showToast("โหมดสาธิต: backend ยังไม่พร้อม");
      setRemoveConfirm(false);
    } finally {
      setRemoving(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (!item) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">ยังไม่มีข้อมูลซาก</div>
        <Link href="/scrap/listings" className="text-sm text-admin-primary hover:text-admin-dark">← รายการซาก</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[item.status];
  const gm = GRADE_META[item.conditionGrade];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">♻️ รายละเอียดซาก</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${gm.color}`}>{gm.label}</span>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">ข้อมูลซากเครื่องใช้ไฟฟ้า — ตรวจสอบสถานะและจัดการรายการ</p>
            <p className="text-gray-400 text-xs font-mono mt-0.5">{item.id}</p>
          </div>
          <Link href="/scrap/listings"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← Listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Item info */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
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
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ราคา & สถานะ</h2>
            <InfoRow label="ราคา" value={
              <span className="font-mono text-green-600 font-bold text-lg">{item.price.toLocaleString()} ฿</span>
            } />
            <InfoRow label="สถานะ" value={
              <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            } />
            <InfoRow label="สร้างเมื่อ" value={new Date(item.createdAt).toLocaleString("th-TH")} />
            <InfoRow label="อัพเดตล่าสุด" value={new Date(item.updatedAt).toLocaleString("th-TH")} />
          </section>

          {/* Photos */}
          {item.photos.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                รูปภาพ ({item.photos.length})
              </h2>
              <div className="flex gap-3 flex-wrap">
                {item.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="hover:opacity-80 transition-opacity">
                    <img src={url} alt={`photo-${i + 1}`}
                      className="h-32 w-32 object-cover rounded-lg bg-gray-100" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* S12 — Source from Repair (cross-module) */}
        {item.source_repair_job_id && (
          <section className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">
              🔧 S12 — ซากจากงานซ่อม (Cross-module Repair C4)
            </p>
            <p className="text-xs text-orange-600 mb-2">
              รายการนี้มาจาก Repair Job — ห้ามสร้าง ScrapItem ทับ ใช้ badge/ลิงก์เท่านั้น
            </p>
            <Link href={`/repair/jobs/${item.source_repair_job_id}`}
              className="text-xs font-mono text-admin-primary hover:text-admin-dark bg-white px-2 py-1 rounded border border-orange-200 inline-block">
              🔧 Repair Job: {item.source_repair_job_id} ↗
            </Link>
          </section>
        )}

        {/* Quick links */}
        <div className="flex gap-3">
          <Link href={`/scrap/jobs?scrap_item_id=${item.id}`}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            🔨 ดู Jobs →
          </Link>
        </div>

        {/* Force Remove (super admin only) */}
        {superAdmin && item.status === "available" && (
          <section className="bg-red-50 rounded-xl border border-red-200 p-5">
            <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">
              ⚠️ Force Remove (Super Admin)
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              บังคับลบรายการซากออกจากระบบ ใช้เฉพาะกรณีพิเศษเท่านั้น
            </p>
            {removeConfirm ? (
              <div className="flex gap-3 items-center">
                <span className="text-sm text-red-600">ยืนยันลบรายการนี้?</span>
                <button onClick={handleForceRemove} disabled={removing}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
                  {removing ? "กำลังลบ..." : "ยืนยัน Force Remove"}
                </button>
                <button onClick={() => setRemoveConfirm(false)}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button onClick={handleForceRemove}
                className="px-4 py-2 text-sm bg-white hover:bg-red-50 border border-red-300 text-red-600 rounded-lg transition-colors">
                🗑️ Force Remove
              </button>
            )}
          </section>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-100 border border-gray-300 rounded-xl px-5 py-3 text-sm shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
