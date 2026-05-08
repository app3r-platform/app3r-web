"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface WalkInTimeline {
  status: string;
  actor: string;
  note: string | null;
  timestamp: string;
}

interface WalkInJobDetail {
  id: string;
  job_number: string;
  store_id: string;
  store_name: string;
  store_address: string;

  device_model: string;
  device_brand: string;
  device_serial: string | null;
  device_issue: string;
  device_photos: string[];

  customer_name: string;
  customer_phone: string;
  customer_email: string | null;

  technician_id: string | null;
  technician_name: string | null;

  status: string;
  checked_in_at: string;
  inspected_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  estimated_completion: string | null;

  quote_price: number | null;
  final_price: number | null;
  storage_fee: number;
  storage_fee_per_day: number;
  storage_days: number;

  diagnosis: string | null;
  repair_notes: string | null;

  parts_used: { name: string; qty: number; price: number }[];
  timeline: WalkInTimeline[];
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  checked_in:        { label: "เช็คอิน",        color: "bg-blue-900/50 text-blue-300" },
  inspecting:        { label: "ตรวจสภาพ",        color: "bg-purple-900/50 text-purple-300" },
  awaiting_decision: { label: "รอตัดสินใจ",      color: "bg-yellow-900/50 text-yellow-400" },
  awaiting_parts:    { label: "รอชิ้นส่วน",      color: "bg-orange-900/50 text-orange-300" },
  in_progress:       { label: "กำลังซ่อม",       color: "bg-cyan-900/50 text-cyan-300" },
  completed:         { label: "ซ่อมเสร็จ",       color: "bg-teal-900/50 text-teal-300" },
  awaiting_pickup:   { label: "รอรับคืน",        color: "bg-indigo-900/50 text-indigo-300" },
  closed:            { label: "ปิดงาน",          color: "bg-green-900/50 text-green-400" },
  abandoned:         { label: "ทิ้งแล้ว",        color: "bg-red-900/50 text-red-400" },
  cancelled:         { label: "ยกเลิก",          color: "bg-gray-800 text-gray-400" },
};

const OVERRIDE_ACTIONS = [
  { value: "cancel",  label: "Cancel Job",   desc: "ยกเลิกงาน — คืนค่าใช้จ่ายถ้ามี" },
  { value: "refund",  label: "Force Refund", desc: "คืนเงินลูกค้า — bypass ขั้นตอนปกติ" },
  { value: "forfeit", label: "Forfeit",      desc: "ริบเครื่อง / mark abandoned อย่างเป็นทางการ" },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

export default function WalkInDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<WalkInJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Override state
  const [overrideAction, setOverrideAction] = useState("cancel");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideConfirm, setOverrideConfirm] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const d = await api.get<WalkInJobDetail>(`/admin/repair/walk-in/${jobId}`);
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
      await api.post(`/admin/repair/walk-in/${jobId}/override`, {
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
        <main className="flex-1 p-8">
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
            {error ?? "ไม่พบข้อมูล"}
          </div>
          <Link href="/repair/walk-in/queue" className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300">
            ← กลับ Queue
          </Link>
        </main>
      </div>
    );
  }

  const sm = STATUS_META[job.status] ?? { label: job.status, color: "bg-gray-800 text-gray-300" };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">🚶 {job.job_number}</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            </div>
            <p className="text-gray-400 text-sm">{job.store_name} — {job.store_address}</p>
          </div>
          <Link href="/repair/walk-in/queue"
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
            <InfoRow label="อาการ" value={job.device_issue} />
            {job.diagnosis && <InfoRow label="วินิจฉัย" value={job.diagnosis} />}
            {job.repair_notes && <InfoRow label="หมายเหตุซ่อม" value={job.repair_notes} />}
          </section>

          {/* Customer + Technician */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ลูกค้า & ช่าง</h2>
            <InfoRow label="ชื่อลูกค้า" value={job.customer_name} />
            <InfoRow label="โทร" value={job.customer_phone} />
            {job.customer_email && <InfoRow label="อีเมล" value={job.customer_email} />}
            <InfoRow label="ช่างซ่อม" value={job.technician_name ?? "—"} />
          </section>

          {/* Pricing */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ราคา & Storage</h2>
            <InfoRow label="ราคา Quote" value={job.quote_price != null ? `${job.quote_price.toLocaleString()} ฿` : "—"} />
            <InfoRow label="ราคา Final" value={job.final_price != null ? `${job.final_price.toLocaleString()} ฿` : "—"} />
            <InfoRow label="Storage Fee" value={
              <span className="text-yellow-400 font-mono">
                {job.storage_fee.toLocaleString()} ฿
                <span className="text-gray-500 ml-1 font-normal">
                  ({job.storage_days} วัน × {job.storage_fee_per_day.toLocaleString()} ฿/วัน)
                </span>
              </span>
            } />
          </section>

          {/* Timestamps */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timestamps</h2>
            <InfoRow label="เช็คอิน" value={new Date(job.checked_in_at).toLocaleString("th-TH")} />
            <InfoRow label="ตรวจสภาพ" value={job.inspected_at ? new Date(job.inspected_at).toLocaleString("th-TH") : "—"} />
            <InfoRow label="เริ่มซ่อม" value={job.started_at ? new Date(job.started_at).toLocaleString("th-TH") : "—"} />
            <InfoRow label="ซ่อมเสร็จ" value={job.completed_at ? new Date(job.completed_at).toLocaleString("th-TH") : "—"} />
            <InfoRow label="ปิดงาน" value={job.closed_at ? new Date(job.closed_at).toLocaleString("th-TH") : "—"} />
            {job.estimated_completion && (
              <InfoRow label="กำหนดเสร็จ" value={new Date(job.estimated_completion).toLocaleString("th-TH")} />
            )}
          </section>
        </div>

        {/* Parts used */}
        {job.parts_used?.length > 0 && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ชิ้นส่วนที่ใช้</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="pb-2">ชิ้นส่วน</th>
                  <th className="pb-2 text-right">จำนวน</th>
                  <th className="pb-2 text-right">ราคา/ชิ้น</th>
                  <th className="pb-2 text-right">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {job.parts_used.map((p, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-200">{p.name}</td>
                    <td className="py-2 text-right text-gray-400">{p.qty}</td>
                    <td className="py-2 text-right font-mono text-gray-400">{p.price.toLocaleString()} ฿</td>
                    <td className="py-2 text-right font-mono text-green-400">{(p.qty * p.price).toLocaleString()} ฿</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Device photos */}
        {job.device_photos?.length > 0 && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">รูปอุปกรณ์</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {job.device_photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer"
                  className="aspect-square bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
                  <img src={url} alt={`photo-${i}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
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
                      <div className="flex items-center gap-2">
                        {tMeta && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tMeta.color}`}>
                            {tMeta.label}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(t.timestamp).toLocaleString("th-TH")}
                        </span>
                        <span className="text-xs text-gray-600">— {t.actor}</span>
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
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                overrideMsg.type === "success"
                  ? "bg-green-900/30 border border-green-800 text-green-300"
                  : "bg-red-900/30 border border-red-800 text-red-300"
              }`}>
                {overrideMsg.text}
              </div>
            )}

            {/* Action cards */}
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
              <input
                type="checkbox"
                checked={overrideConfirm}
                onChange={e => setOverrideConfirm(e.target.checked)}
                className="accent-red-500"
              />
              ยืนยันว่าต้องการ override job นี้ (ไม่สามารถย้อนกลับได้)
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
