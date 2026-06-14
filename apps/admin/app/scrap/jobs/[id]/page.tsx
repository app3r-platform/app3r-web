"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapJob, ScrapJobOption } from "@/lib/types";

/* S8/S9/S12 — extended fields (mock patch) */
interface PriceRevision {
  revised_at:    string;
  old_price:     number;
  new_price:     number;
  revised_by:    "WeeeR" | "Admin";
  reason:        string;
}

interface ScrapJobExtended extends ScrapJob {
  cancelled_reason?:     "weeer_withdraw" | "weeu_stop" | "force_majeure" | null;
  no_show_flag?:         boolean;
  no_show_settled_at?:   string | null;
  price_revisions?:      PriceRevision[];
  source_repair_job_id?: string | null;
}

const STATUS_META: Record<ScrapJob["status"], { label: string; color: string }> = {
  pending_decision: { label: "รอตัดสินใจ", color: "bg-yellow-50 text-yellow-700" },
  in_progress:      { label: "กำลังดำเนิน", color: "bg-blue-50 text-blue-700" },
  completed:        { label: "เสร็จแล้ว",   color: "bg-green-50 text-green-700" },
  cancelled:        { label: "ยกเลิก",      color: "bg-gray-100 text-gray-500" },
};

const OPTION_META: Record<ScrapJobOption, { label: string; desc: string; color: string; available: boolean }> = {
  resell_parts:    { label: "แยกอะไหล่ขาย",    desc: "แยกชิ้นส่วนที่ใช้ได้มาขายในระบบ Parts",      color: "text-green-600",  available: true },
  repair_and_sell: { label: "ซ่อมแล้วขาย",      desc: "ส่งซ่อม → ลงขาย Resell (C-3.3 — รอพัฒนา)",   color: "text-gray-500",   available: false },
  resell_as_scrap: { label: "ขายเป็นซากใหม่",   desc: "สร้าง Listing ซากใหม่บนระบบ Resell",          color: "text-blue-400",   available: true },
  dispose:         { label: "ทิ้ง/E-Waste",      desc: "กำจัดอย่างถูกต้อง ออก E-Waste Certificate",   color: "text-admin-primary", available: true },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-200/60 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function ScrapJobDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [job, setJob] = useState<ScrapJobExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<ScrapJobExtended>(`/admin/scrap/jobs/${id}/`);
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !job) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          {error ?? "ยังไม่มีข้อมูล Scrap Job"}
        </div>
        <Link href="/scrap/jobs" className="text-sm text-admin-primary hover:text-admin-dark">← Jobs</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[job.status];
  const om = OPTION_META[job.decision];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">🔨 Scrap Job</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
              {/* S9 */}
              {job.no_show_flag && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                  🚫 No-show
                </span>
              )}
              {/* S7/S10 */}
              {job.cancelled_reason && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  job.cancelled_reason === "weeer_withdraw"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : job.cancelled_reason === "weeu_stop"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  ❌ {job.cancelled_reason === "weeer_withdraw" ? "S7: WeeeR ถอน"
                      : job.cancelled_reason === "weeu_stop" ? "S10: WeeeU ยุติ"
                      : "สุดวิสัย"}
                </span>
              )}
              {/* S12 */}
              {job.source_repair_job_id && (
                <Link href={`/repair/jobs/${job.source_repair_job_id}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">
                  🔧 จาก Repair
                </Link>
              )}
            </div>
            <p className="text-gray-500 text-sm font-mono">{job.id}</p>
          </div>
          <Link href="/scrap/jobs"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← Jobs
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Job info */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูล Job</h2>
            <InfoRow label="รายการซาก" value={
              <Link href={`/scrap/listings/${job.scrapItemId}`}
                className="font-mono text-xs text-admin-primary hover:text-admin-dark">
                {job.scrapItemId} ↗
              </Link>
            } />
            <InfoRow label="ผู้ซื้อ" value={<span className="font-mono text-xs">{job.buyerId}</span>} />
            <InfoRow label="ประเภทผู้ซื้อ" value={job.buyerType} />
            <InfoRow label="สร้างเมื่อ" value={new Date(job.createdAt).toLocaleString("th-TH")} />
            <InfoRow label="อัพเดตล่าสุด" value={new Date(job.updatedAt).toLocaleString("th-TH")} />
          </section>

          {/* Decision */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ตัดสินใจ</h2>
            <div className={`mb-3 p-3 rounded-lg bg-gray-100 border ${om.available ? "border-gray-300" : "border-gray-200"}`}>
              <p className={`text-sm font-semibold ${om.color}`}>{om.label}</p>
              <p className="text-xs text-gray-500 mt-1">{om.desc}</p>
              {!om.available && (
                <span className="mt-2 inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
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

          {/* S8 — Price Revision History */}
          {job.price_revisions && job.price_revisions.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                S8 — ประวัติปรับราคา ({job.price_revisions.length} ครั้ง)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-200 text-left">
                      <th className="py-2 pr-4">วันที่</th>
                      <th className="py-2 pr-4">ราคาเดิม</th>
                      <th className="py-2 pr-4">ราคาใหม่</th>
                      <th className="py-2 pr-4">ผู้ปรับ</th>
                      <th className="py-2">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {job.price_revisions.map((rev, i) => (
                      <tr key={i} className="text-sm">
                        <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(rev.revised_at).toLocaleString("th-TH")}
                        </td>
                        <td className="py-2 pr-4 font-mono text-gray-500 line-through text-xs">
                          {rev.old_price.toLocaleString()} ฿
                        </td>
                        <td className="py-2 pr-4 font-mono text-green-600 font-semibold text-xs">
                          {rev.new_price.toLocaleString()} ฿
                          <span className={`ml-1.5 text-xs ${rev.new_price > rev.old_price ? "text-red-500" : "text-green-500"}`}>
                            ({rev.new_price > rev.old_price ? "+" : ""}{(rev.new_price - rev.old_price).toLocaleString()})
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            rev.revised_by === "Admin"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-orange-50 text-orange-700"
                          }`}>
                            {rev.revised_by}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-gray-600">{rev.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Output refs */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Output References</h2>

            {job.partsCreatedIds && job.partsCreatedIds.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Parts ที่สร้าง ({job.partsCreatedIds.length})</p>
                <div className="flex flex-wrap gap-2">
                  {job.partsCreatedIds.map(pid => (
                    <Link key={pid} href={`/parts/${pid}`}
                      className="text-xs font-mono text-admin-primary hover:text-admin-dark bg-blue-50 border border-blue-200 px-2 py-1 rounded">
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
                  className="text-xs font-mono text-admin-primary hover:text-admin-dark">
                  {job.newListingId} ↗
                </Link>
              </div>
            )}

            {job.repairJobId && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Repair Job</p>
                <Link href={`/repair/jobs/${job.repairJobId}`}
                  className="text-xs font-mono text-admin-primary hover:text-admin-dark">
                  {job.repairJobId} ↗
                </Link>
                <span className="ml-2 text-xs text-gray-600">(C-3.3 — ยังไม่สร้าง)</span>
              </div>
            )}

            {job.certificateId && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">E-Waste Certificate</p>
                <Link href={`/scrap/certificates/${job.certificateId}`}
                  className="text-xs font-mono text-admin-primary hover:text-admin-dark">
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
