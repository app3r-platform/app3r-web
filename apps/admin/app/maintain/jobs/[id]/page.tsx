"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { MaintainJob } from "@/lib/types";

interface MaintainJobDetail extends MaintainJob {
  customerName: string;
  customerPhone: string;
  technicianName: string | null;
  shopName: string | null;
  timeline: {
    status: MaintainJob["status"];
    actor: string;
    note: string | null;
    lat: number | null;
    lng: number | null;
    timestamp: string;
  }[];
  photos: {
    type: "before" | "after" | "parts" | "other";
    url: string;
    takenAt: string;
  }[];
}

const STATUS_META: Record<MaintainJob["status"], { label: string; color: string }> = {
  pending:     { label: "รอดำเนินการ",  color: "bg-gray-800 text-gray-400" },
  assigned:    { label: "มอบหมายแล้ว", color: "bg-blue-900/50 text-blue-300" },
  departed:    { label: "ออกเดินทาง",  color: "bg-yellow-900/50 text-yellow-400" },
  arrived:     { label: "ถึงที่แล้ว",   color: "bg-cyan-900/50 text-cyan-300" },
  in_progress: { label: "กำลังทำงาน",  color: "bg-indigo-900/50 text-indigo-300" },
  completed:   { label: "เสร็จสิ้น",   color: "bg-green-900/50 text-green-400" },
  cancelled:   { label: "ยกเลิก",       color: "bg-red-900/50 text-red-400" },
};

const PHOTO_LABEL: Record<string, string> = {
  before: "ก่อนล้าง",
  after:  "หลังล้าง",
  parts:  "อะไหล่ที่ใช้",
  other:  "อื่นๆ",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function MaintainJobDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [job, setJob] = useState<MaintainJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cancelReason, setCancelReason] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<MaintainJobDetail>(`/maintain/jobs/${id}/`);
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

  async function handleForceCancel() {
    if (!cancelConfirm || cancelReason.trim().length < 10) return;
    setCancelLoading(true);
    setCancelMsg(null);
    try {
      await api.post(`/maintain/jobs/${id}/force-cancel/`, { reason: cancelReason.trim() });
      setCancelMsg({ type: "success", text: "Force-cancel สำเร็จ" });
      setCancelReason("");
      setCancelConfirm(false);
      fetchJob();
    } catch (e) {
      setCancelMsg({ type: "error", text: (e as Error).message });
    } finally {
      setCancelLoading(false);
    }
  }

  const superAdmin = isSuperAdmin();

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !job) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">{error ?? "ไม่พบข้อมูล"}</div>
        <Link href="/maintain/jobs" className="text-sm text-blue-400 hover:text-blue-300">← Jobs</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[job.status];
  const canCancel = superAdmin && job.status !== "completed" && job.status !== "cancelled";

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">🛁 {job.serviceCode}</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
              {job.recurring?.enabled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300">
                  🔁 {job.recurring.interval.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {job.applianceType === "AC" ? "แอร์" : "เครื่องซักผ้า"} —{" "}
              {job.cleaningType === "general" ? "ล้างทั่วไป" : job.cleaningType === "deep" ? "ล้างลึก" : "ล้าง+ฆ่าเชื้อ"}
            </p>
          </div>
          <Link href="/maintain/jobs"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Jobs
          </Link>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ลูกค้า</h2>
            <InfoRow label="ชื่อ" value={job.customerName} />
            <InfoRow label="โทร" value={job.customerPhone} />
            <InfoRow label="ที่อยู่" value={job.address.address} />
            <InfoRow label="GPS" value={
              <a href={`https://maps.google.com/?q=${job.address.lat},${job.address.lng}`}
                target="_blank" rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs">
                📍 {job.address.lat.toFixed(5)}, {job.address.lng.toFixed(5)}
              </a>
            } />
          </section>

          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">งาน</h2>
            <InfoRow label="ช่าง" value={job.technicianName ?? "—"} />
            <InfoRow label="ร้าน" value={job.shopName ?? "—"} />
            <InfoRow label="นัดหมาย" value={new Date(job.scheduledAt).toLocaleString("th-TH")} />
            <InfoRow label="ระยะเวลาประมาณ" value={`${job.estimatedDuration} ชั่วโมง`} />
            <InfoRow label="ราคา" value={
              <span className="text-green-400 font-mono">{job.totalPrice.toLocaleString()} ฿</span>
            } />
          </section>

          {job.recurring?.enabled && (
            <section className="bg-gray-900 rounded-xl border border-purple-900/40 p-5">
              <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">🔁 Recurring</h2>
              <InfoRow label="Interval" value={job.recurring.interval.replace("_months", " เดือน")} />
              <InfoRow label="นัดถัดไป" value={new Date(job.recurring.nextScheduledAt).toLocaleString("th-TH")} />
            </section>
          )}

          {job.parts_used && job.parts_used.length > 0 && (
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">อะไหล่ที่ใช้</h2>
              <div className="space-y-1.5">
                {job.parts_used.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-200">{p.name}</span>
                    <span className="text-gray-400 font-mono">× {p.qty}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Photos */}
        {job.photos?.length > 0 && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">📷 Photos</h2>
            {(["before", "after", "parts", "other"] as const).map(type => {
              const photos = job.photos.filter(p => p.type === type);
              if (!photos.length) return null;
              return (
                <div key={type} className="mb-4 last:mb-0">
                  <p className="text-xs text-gray-500 mb-2">{PHOTO_LABEL[type]}</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {photos.map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noreferrer"
                        className="aspect-square bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
                        <img src={p.url} alt={`${type}-${i}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Timeline */}
        {job.timeline?.length > 0 && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Timeline</h2>
            <div className="space-y-3">
              {job.timeline.map((t, i) => {
                const tMeta = STATUS_META[t.status];
                return (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      {i < job.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-gray-700 mt-1 min-h-[16px]" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tMeta.color}`}>
                          {tMeta.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(t.timestamp).toLocaleString("th-TH")}
                        </span>
                        <span className="text-xs text-gray-600">— {t.actor}</span>
                        {t.lat != null && t.lng != null && (
                          <a href={`https://maps.google.com/?q=${t.lat},${t.lng}`}
                            target="_blank" rel="noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-400">📍</a>
                        )}
                      </div>
                      {t.note && <p className="text-xs text-gray-400 mt-1">{t.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Force-cancel — super-admin only, non-terminal status */}
        {canCancel && (
          <section className="bg-gray-900 rounded-xl border border-red-900/40 p-5">
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-4">
              🔐 Force-Cancel — Super-Admin
            </h2>
            {cancelMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm border ${
                cancelMsg.type === "success"
                  ? "bg-green-900/30 border-green-800 text-green-300"
                  : "bg-red-900/30 border-red-800 text-red-300"
              }`}>{cancelMsg.text}</div>
            )}
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="เหตุผลยกเลิก (อย่างน้อย 10 ตัวอักษร)..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none mb-3"
            />
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-4 cursor-pointer">
              <input type="checkbox" checked={cancelConfirm}
                onChange={e => setCancelConfirm(e.target.checked)} className="accent-red-500" />
              ยืนยันว่าต้องการยกเลิกงานนี้
            </label>
            <button onClick={handleForceCancel}
              disabled={!cancelConfirm || cancelReason.trim().length < 10 || cancelLoading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
              {cancelLoading ? "กำลังดำเนินการ..." : "Force Cancel"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
