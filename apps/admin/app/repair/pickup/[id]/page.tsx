"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface PickupTimeline {
  status: string;
  actor: string;
  note: string | null;
  lat: number | null;
  lng: number | null;
  timestamp: string;
}

interface PickupPhoto {
  type: "pickup_proof" | "delivery_proof" | "damage_report" | "other";
  url: string;
  taken_at: string;
}

interface PickupJobDetail {
  id: string;
  job_number: string;
  repair_job_id: string;

  shop_name: string;
  shop_address: string;

  weeet_id: string | null;
  weeet_name: string | null;
  weeet_phone: string | null;

  customer_name: string;
  customer_phone: string;
  customer_address: string;

  device_model: string;
  device_brand: string;
  device_serial: string | null;

  status: string;
  direction: "shop_to_customer" | "customer_to_shop";

  scheduled_at: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;

  distance_km: number | null;
  travel_cost: number | null;
  travel_duration_min: number | null;

  signature_url: string | null;
  signature_captured_at: string | null;

  photos: PickupPhoto[];
  timeline: PickupTimeline[];
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:             { label: "รอมอบหมาย",    color: "bg-gray-800 text-gray-400" },
  assigned:            { label: "มอบหมายแล้ว",  color: "bg-blue-900/50 text-blue-300" },
  en_route_pickup:     { label: "กำลังไปรับ",   color: "bg-yellow-900/50 text-yellow-400" },
  picked_up:           { label: "รับแล้ว",       color: "bg-cyan-900/50 text-cyan-300" },
  en_route_delivery:   { label: "กำลังส่ง",      color: "bg-indigo-900/50 text-indigo-300" },
  delivered:           { label: "ส่งแล้ว",       color: "bg-teal-900/50 text-teal-300" },
  completed:           { label: "เสร็จสิ้น",     color: "bg-green-900/50 text-green-400" },
  failed:              { label: "ล้มเหลว",       color: "bg-red-900/50 text-red-400" },
  cancelled:           { label: "ยกเลิก",        color: "bg-gray-800 text-gray-500" },
};

const PHOTO_TYPE_LABEL: Record<string, string> = {
  pickup_proof:    "ภาพรับอุปกรณ์",
  delivery_proof:  "ภาพส่งอุปกรณ์",
  damage_report:   "ภาพรายงานความเสียหาย",
  other:           "อื่นๆ",
};

const OVERRIDE_ACTIONS = [
  { value: "cancel",   label: "Cancel Job",    desc: "ยกเลิก pickup job" },
  { value: "reassign", label: "Force Reassign", desc: "มอบหมาย WeeeT ใหม่" },
  { value: "complete", label: "Force Complete", desc: "ปิดงานโดยไม่ต้องรอ signature" },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function PickupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<PickupJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Override
  const [overrideAction, setOverrideAction] = useState("cancel");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideConfirm, setOverrideConfirm] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<PickupJobDetail>(`/admin/repair/pickup/${jobId}`);
      setJob(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchJob();
  }, [router, fetchJob]);

  async function handleOverride() {
    if (!overrideConfirm || overrideReason.trim().length < 10) return;
    setOverrideLoading(true);
    setOverrideMsg(null);
    try {
      await api.post(`/admin/repair/pickup/${jobId}/override`, {
        action: overrideAction,
        reason: overrideReason.trim(),
      });
      setOverrideMsg({ type: "success", text: "Override สำเร็จ" });
      setOverrideReason("");
      setOverrideConfirm(false);
      fetchJob();
    } catch (e) {
      setOverrideMsg({ type: "error", text: (e as Error).message });
    } finally {
      setOverrideLoading(false);
    }
  }

  const superAdmin = isSuperAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8 space-y-4">
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
            {error ?? "ไม่พบข้อมูล"}
          </div>
          <Link href="/repair/pickup/queue" className="text-sm text-blue-400 hover:text-blue-300">← Queue</Link>
        </main>
      </div>
    );
  }

  const sm = STATUS_META[job.status] ?? { label: job.status, color: "bg-gray-800 text-gray-300" };
  const dirLabel = job.direction === "shop_to_customer" ? "ร้าน → ลูกค้า" : "ลูกค้า → ร้าน";

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">🚛 {job.job_number}</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                job.direction === "shop_to_customer"
                  ? "bg-teal-900/40 text-teal-300"
                  : "bg-purple-900/40 text-purple-300"
              }`}>
                {dirLabel}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Repair Job: <Link href={`/repair/jobs/${job.repair_job_id}`}
                className="text-blue-400 hover:text-blue-300 font-mono text-xs">
                {job.repair_job_id.slice(0, 8)}…
              </Link>
            </p>
          </div>
          <Link href="/repair/pickup/queue"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Queue
          </Link>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Device */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">อุปกรณ์</h2>
            <InfoRow label="แบรนด์ / รุ่น" value={`${job.device_brand} ${job.device_model}`} />
            <InfoRow label="Serial" value={job.device_serial ?? "—"} />
          </section>

          {/* WeeeT */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">WeeeT</h2>
            <InfoRow label="ชื่อ" value={job.weeet_name ?? <span className="text-gray-600">ยังไม่มอบหมาย</span>} />
            <InfoRow label="โทร" value={job.weeet_phone ?? "—"} />
          </section>

          {/* Locations */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">จุดรับ-ส่ง</h2>
            <InfoRow label="ร้านซ่อม" value={job.shop_name} />
            <InfoRow label="ที่อยู่ร้าน" value={job.shop_address} />
            <InfoRow label="ลูกค้า" value={job.customer_name} />
            <InfoRow label="โทร" value={job.customer_phone} />
            <InfoRow label="ที่อยู่ลูกค้า" value={job.customer_address} />
          </section>

          {/* Travel */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">เส้นทาง & ค่าใช้จ่าย</h2>
            <InfoRow label="ระยะทาง" value={job.distance_km != null ? `${job.distance_km.toFixed(1)} km` : "—"} />
            <InfoRow label="เวลาเดินทาง" value={job.travel_duration_min != null ? `${job.travel_duration_min} นาที` : "—"} />
            <InfoRow label="ค่าเดินทาง" value={
              job.travel_cost != null
                ? <span className="text-yellow-400 font-mono">{job.travel_cost.toLocaleString()} ฿</span>
                : "—"
            } />
          </section>
        </div>

        {/* Timestamps */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timestamps</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "กำหนดการ", ts: job.scheduled_at },
              { label: "มอบหมาย",  ts: job.assigned_at },
              { label: "รับแล้ว",  ts: job.picked_up_at },
              { label: "ส่งแล้ว",  ts: job.delivered_at },
            ].map(({ label, ts }) => (
              <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-mono text-gray-200">
                  {ts ? new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Signature audit */}
        {job.signature_url && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              ✍️ Signature Audit
            </h2>
            <div className="flex items-start gap-4">
              <img src={job.signature_url} alt="signature" className="bg-white rounded-lg p-2 max-h-24 object-contain" />
              <p className="text-xs text-gray-500">
                บันทึก: {job.signature_captured_at
                  ? new Date(job.signature_captured_at).toLocaleString("th-TH")
                  : "—"}
              </p>
            </div>
          </section>
        )}

        {/* Photos */}
        {job.photos?.length > 0 && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              📷 Photos Timeline
            </h2>
            {(["pickup_proof", "delivery_proof", "damage_report", "other"] as const).map(type => {
              const typePhotos = job.photos.filter(p => p.type === type);
              if (typePhotos.length === 0) return null;
              return (
                <div key={type} className="mb-4 last:mb-0">
                  <p className="text-xs text-gray-500 mb-2">{PHOTO_TYPE_LABEL[type]}</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {typePhotos.map((photo, i) => (
                      <a key={i} href={photo.url} target="_blank" rel="noreferrer"
                        className="aspect-square bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group">
                        <img src={photo.url} alt={`${type}-${i}`} className="w-full h-full object-cover" />
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
                        {tMeta && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tMeta.color}`}>
                            {tMeta.label}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(t.timestamp).toLocaleString("th-TH")}
                        </span>
                        <span className="text-xs text-gray-600">— {t.actor}</span>
                        {t.lat != null && t.lng != null && (
                          <a href={`https://maps.google.com/?q=${t.lat},${t.lng}`}
                            target="_blank" rel="noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-400">
                            📍 แผนที่
                          </a>
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

        {/* Override — super-admin only */}
        {superAdmin && (
          <section className="bg-gray-900 rounded-xl border border-red-900/40 p-5">
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-4">
              🔐 Manual Override — Super-Admin
            </h2>

            {overrideMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm border ${
                overrideMsg.type === "success"
                  ? "bg-green-900/30 border-green-800 text-green-300"
                  : "bg-red-900/30 border-red-800 text-red-300"
              }`}>
                {overrideMsg.text}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-4">
              {OVERRIDE_ACTIONS.map(a => (
                <button key={a.value}
                  onClick={() => setOverrideAction(a.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    overrideAction === a.value
                      ? "border-red-500 bg-red-900/20"
                      : "border-gray-700 hover:border-gray-600"
                  }`}>
                  <p className="text-sm font-semibold text-white">{a.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>

            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="เหตุผล (อย่างน้อย 10 ตัวอักษร)..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none mb-3"
            />

            <label className="flex items-center gap-2 text-sm text-gray-300 mb-4 cursor-pointer">
              <input type="checkbox" checked={overrideConfirm}
                onChange={e => setOverrideConfirm(e.target.checked)} className="accent-red-500" />
              ยืนยันว่าต้องการ override job นี้
            </label>

            <button
              onClick={handleOverride}
              disabled={!overrideConfirm || overrideReason.trim().length < 10 || overrideLoading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {overrideLoading ? "กำลังดำเนินการ..." : "Execute Override"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
