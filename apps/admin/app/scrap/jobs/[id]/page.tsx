"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapJob, ScrapJobOption } from "@/lib/types";

const STATUS_META: Record<ScrapJob["status"], { label: string; color: string }> = {
  pending_decision: { label: "รอตัดสินใจ", color: "bg-yellow-900/50 text-yellow-400" },
  in_progress:      { label: "กำลังดำเนิน", color: "bg-blue-900/50 text-blue-400" },
  completed:        { label: "เสร็จแล้ว",   color: "bg-green-900/50 text-green-400" },
  cancelled:        { label: "ยกเลิก",      color: "bg-gray-800 text-gray-500" },
};

const OPTION_META: Record<ScrapJobOption, { label: string; desc: string; color: string; available: boolean }> = {
  resell_parts:    { label: "แยกอะไหล่ขาย",    desc: "แยกชิ้นส่วนที่ใช้ได้มาขายในระบบ Parts",      color: "text-green-400",  available: true },
  repair_and_sell: { label: "ซ่อมแล้วขาย",      desc: "ส่งซ่อม → ลงขาย Resell (C-3.3 — รอพัฒนา)",   color: "text-gray-500",   available: false },
  resell_as_scrap: { label: "ขายเป็นซากใหม่",   desc: "สร้าง Listing ซากใหม่บนระบบ Resell",          color: "text-blue-400",   available: true },
  dispose:         { label: "ทิ้ง/E-Waste",      desc: "กำจัดอย่างถูกต้อง ออก E-Waste Certificate",   color: "text-purple-400", available: true },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function ScrapJobDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [job, setJob] = useState<ScrapJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<ScrapJob>(`/admin/scrap/jobs/${id}/`);
      setJob(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchJob();
  }, [router, fetchJob]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !job) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          {error ?? "ยังไม่มีข้อมูล Scrap Job"}
        </div>
        <Link href="/scrap/jobs" className="text-sm text-blue-400 hover:text-blue-300">← Jobs</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[job.status];
  const om = OPTION_META[job.decision];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">🔨 Scrap Job</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            </div>
            <p className="text-gray-400 text-sm font-mono">{job.id}</p>
          </div>
          <Link href="/scrap/jobs"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Jobs
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Job info */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูล Job</h2>
            <InfoRow label="Scrap Item" value={
              <Link href={`/scrap/listings/${job.scrapItemId}`}
                className="font-mono text-xs text-blue-400 hover:text-blue-300">
                {job.scrapItemId} ↗
              </Link>
            } />
            <InfoRow label="Buyer" value={<span className="font-mono text-xs">{job.buyerId}</span>} />
            <InfoRow label="Buyer Type" value={job.buyerType} />
            <InfoRow label="สร้างเมื่อ" value={new Date(job.createdAt).toLocaleString("th-TH")} />
            <InfoRow label="อัพเดตล่าสุด" value={new Date(job.updatedAt).toLocaleString("th-TH")} />
          </section>

          {/* Decision */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ตัดสินใจ</h2>
            <div className={`mb-3 p-3 rounded-lg bg-gray-800 border ${om.available ? "border-gray-700" : "border-gray-800"}`}>
              <p className={`text-sm font-semibold ${om.color}`}>{om.label}</p>
              <p className="text-xs text-gray-500 mt-1">{om.desc}</p>
              {!om.available && (
                <span className="mt-2 inline-block text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                  🔒 รอ C-3.3
                </span>
              )}
            </div>
            <InfoRow label="ตัดสินใจเมื่อ" value={
              job.decisionAt
                ? new Date(job.decisionAt).toLocaleString("th-TH")
                : <span className="text-gray-500">ยังไม่ตัดสินใจ</span>
            } />
          </section>

          {/* Output refs */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5 lg:col-span-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Output References</h2>

            {job.partsCreatedIds && job.partsCreatedIds.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Parts ที่สร้าง ({job.partsCreatedIds.length})</p>
                <div className="flex flex-wrap gap-2">
                  {job.partsCreatedIds.map(pid => (
                    <Link key={pid} href={`/parts/${pid}`}
                      className="text-xs font-mono text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-1 rounded">
                      {pid.slice(0, 12)}… ↗
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {job.newListingId && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Listing ใหม่</p>
                <Link href={`/resell/listings/${job.newListingId}`}
                  className="text-xs font-mono text-blue-400 hover:text-blue-300">
                  {job.newListingId} ↗
                </Link>
              </div>
            )}

            {job.repairJobId && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Repair Job</p>
                <Link href={`/repair/jobs/${job.repairJobId}`}
                  className="text-xs font-mono text-blue-400 hover:text-blue-300">
                  {job.repairJobId} ↗
                </Link>
                <span className="ml-2 text-xs text-gray-600">(C-3.3 — ยังไม่สร้าง)</span>
              </div>
            )}

            {job.certificateId && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">E-Waste Certificate</p>
                <Link href={`/scrap/certificates/${job.certificateId}`}
                  className="text-xs font-mono text-blue-400 hover:text-blue-300">
                  {job.certificateId} ↗
                </Link>
              </div>
            )}

            {!job.partsCreatedIds?.length && !job.newListingId && !job.repairJobId && !job.certificateId && (
              <p className="text-sm text-gray-500">ยังไม่มี Output</p>
            )}
          </section>
        </div>

      </main>
    </div>
  );
}
