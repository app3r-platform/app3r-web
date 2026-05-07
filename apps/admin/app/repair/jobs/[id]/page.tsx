"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

const JOB_STATUS: Record<string, { label: string; color: string }> = {
  assigned:          { label: "มอบหมายแล้ว",      color: "bg-gray-800 text-gray-300" },
  traveling:         { label: "เดินทาง",           color: "bg-blue-900/50 text-blue-300" },
  arrived:           { label: "ถึงแล้ว",            color: "bg-blue-900/50 text-blue-400" },
  awaiting_entry:    { label: "รอเข้าบ้าน",        color: "bg-yellow-900/50 text-yellow-400" },
  inspecting:        { label: "ตรวจสภาพ",          color: "bg-purple-900/50 text-purple-400" },
  awaiting_decision: { label: "รอ WeeeR อนุมัติ",  color: "bg-orange-900/50 text-orange-400" },
  awaiting_user:     { label: "รอ WeeeU ตอบ",      color: "bg-yellow-900/50 text-yellow-300" },
  in_progress:       { label: "กำลังซ่อม",         color: "bg-blue-900/50 text-blue-400" },
  completed:         { label: "ซ่อมเสร็จ",         color: "bg-teal-900/50 text-teal-400" },
  awaiting_review:   { label: "รอตรวจรับ",         color: "bg-teal-900/50 text-teal-300" },
  closed:            { label: "ปิดงาน ✓",          color: "bg-green-900/50 text-green-400" },
  cancelled:         { label: "ยกเลิก",             color: "bg-red-900/50 text-red-400" },
  converted_scrap:   { label: "→ ซาก",             color: "bg-gray-700 text-gray-400" },
};

interface EvidenceFile { id: string; url: string; type: "image" | "video"; created_at: string; }
interface StateEvent  { state: string; occurred_at: string; actor: string; }
interface AuditEvent  { id: string; event_type: string; actor_role: string; actor_name: string; occurred_at: string; detail: string | null; }

interface RepairJobDetail {
  id: string;
  weeeu_id: string; weeeu_name: string;
  weeer_id: string; weeer_name: string;
  weeet_id: string; weeet_name: string;
  service_type: string;
  status: string;
  decision_branch: string | null;
  decision_notes: string | null;
  scheduled_at: string;
  departed_at: string | null;
  arrived_at: string | null;
  entry_approved_at: string | null;
  weeer_approval_at: string | null;
  user_approval_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  departure_location: { lat: number; lng: number } | null;
  arrival_location:   { lat: number; lng: number } | null;
  original_price: number | null;
  proposed_price: number | null;
  final_price:    number | null;
  parts_added:  { name: string; qty: number; price: number }[] | null;
  parts_used:   { name: string; qty: number }[] | null;
  scrap_announcement_id: string | null;
  scrap_agreed_price:    number | null;
  deposit_amount:        number | null;
  deposit_action:        string | null;
  inspection_fee_charged: number | null;
  arrival_files:         EvidenceFile[] | null;
  pre_inspection_files:  EvidenceFile[] | null;
  post_repair_files:     EvidenceFile[] | null;
  state_history:         StateEvent[];
  audit_log:             AuditEvent[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-200">{value ?? <span className="text-gray-600">—</span>}</span>
    </div>
  );
}

function EvidenceGrid({ files, label }: { files: EvidenceFile[] | null; label: string }) {
  if (!files || files.length === 0) return (
    <div className="text-xs text-gray-600 italic">ไม่มี {label}</div>
  );
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label} ({files.length} ไฟล์)</p>
      <div className="flex flex-wrap gap-2">
        {files.map(f => (
          <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer"
            className="relative group">
            {f.type === "image" ? (
              <img src={f.url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-700 hover:border-blue-500 transition-colors" />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors text-2xl">
                🎬
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function RepairJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<RepairJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const superAdmin = isSuperAdmin();

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<RepairJobDetail>(`/admin/repair/jobs/${jobId}`);
      setJob(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    if (jobId) fetchData();
  }, [router, fetchData, jobId]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 text-gray-500">กำลังโหลด...</main>
    </div>
  );

  if (error || !job) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          {error ?? "ไม่พบงาน"}
        </div>
        <Link href="/repair/jobs" className="mt-4 inline-block text-sm text-blue-400">← กลับ</Link>
      </main>
    </div>
  );

  const sc = JOB_STATUS[job.status] ?? { label: job.status, color: "bg-gray-800 text-gray-300" };
  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("th-TH") : null;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/repair/jobs" className="text-sm text-gray-500 hover:text-gray-300">← Repair Jobs</Link>
            </div>
            <h1 className="text-2xl font-bold">🔧 Job Detail</h1>
            <p className="text-xs font-mono text-gray-500 mt-1">{job.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
            {superAdmin && (
              <Link href={`/repair/jobs/${job.id}/manual-override`}
                className="px-4 py-2 text-sm bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-lg transition-colors">
                ⚙️ Manual Override
              </Link>
            )}
          </div>
        </div>

        {/* Parties */}
        <Section title="ผู้เกี่ยวข้อง">
          <div className="grid grid-cols-3 gap-4">
            {[
              { role: "👤 WeeeU (ลูกค้า)", name: job.weeeu_name, id: job.weeeu_id },
              { role: "🏪 WeeeR (ร้าน)", name: job.weeer_name, id: job.weeer_id },
              { role: "🔧 WeeeT (ช่าง)", name: job.weeet_name, id: job.weeet_id },
            ].map(p => (
              <div key={p.role} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{p.role}</p>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-gray-600 font-mono">{p.id.slice(0, 8)}…</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Job Info */}
        <Section title="รายละเอียดงาน">
          <InfoRow label="Service Type" value={<span className="font-mono text-blue-400">{job.service_type}</span>} />
          <InfoRow label="Decision Branch" value={job.decision_branch
            ? <span className="font-mono font-bold text-purple-400">{job.decision_branch}</span>
            : null} />
          <InfoRow label="Decision Notes" value={job.decision_notes} />
          <InfoRow label="นัดหมาย" value={fmt(job.scheduled_at)} />
          <InfoRow label="Original Price" value={job.original_price != null ? `${job.original_price.toLocaleString()} G` : null} />
          <InfoRow label="Proposed Price" value={job.proposed_price != null ? `${job.proposed_price.toLocaleString()} G` : null} />
          <InfoRow label="Final Price" value={job.final_price != null ? `${job.final_price.toLocaleString()} G` : null} />
          <InfoRow label="Deposit" value={job.deposit_amount != null
            ? `${job.deposit_amount.toLocaleString()} G — action: ${job.deposit_action ?? "—"}`
            : null} />
          <InfoRow label="Inspection Fee" value={job.inspection_fee_charged != null
            ? `${job.inspection_fee_charged.toLocaleString()} G`
            : null} />
          {job.scrap_announcement_id && (
            <InfoRow label="Scrap Job" value={
              <span className="text-gray-400 font-mono text-xs">{job.scrap_announcement_id} — {job.scrap_agreed_price?.toLocaleString()} G</span>
            } />
          )}
        </Section>

        {/* Timeline */}
        <Section title="Timeline (State Machine)">
          <div className="space-y-1">
            {[
              { label: "T0 นัดหมาย",       at: job.scheduled_at },
              { label: "T1 ออกเดินทาง",    at: job.departed_at },
              { label: "T2 ถึงหน้างาน",    at: job.arrived_at },
              { label: "T2 อนุมัติเข้าบ้าน", at: job.entry_approved_at },
              { label: "T4 WeeeR อนุมัติ", at: job.weeer_approval_at },
              { label: "T4/B1.2 WeeeU อนุมัติ", at: job.user_approval_at },
              { label: "T6 ส่งงาน",        at: job.completed_at },
              { label: "T7 ปิดงาน",        at: job.closed_at },
            ].map((ev, i) => (
              <div key={i} className={`flex items-center gap-3 py-1.5 text-sm ${ev.at ? "" : "opacity-30"}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${ev.at ? "bg-green-500" : "bg-gray-700"}`} />
                <span className="text-gray-400 w-44 shrink-0">{ev.label}</span>
                <span className="text-gray-300 text-xs font-mono">{ev.at ? fmt(ev.at) : "—"}</span>
              </div>
            ))}
          </div>
          {job.departure_location && (
            <p className="mt-3 text-xs text-gray-500">
              📍 ออกจาก: {job.departure_location.lat.toFixed(5)}, {job.departure_location.lng.toFixed(5)}
              {job.arrival_location && (
                <> → ถึง: {job.arrival_location.lat.toFixed(5)}, {job.arrival_location.lng.toFixed(5)}</>
              )}
            </p>
          )}
        </Section>

        {/* Evidence */}
        <Section title="Evidence (Photos / Videos)">
          <div className="space-y-5">
            <EvidenceGrid files={job.arrival_files} label="รูปยืนยันถึงหน้างาน (T2)" />
            <EvidenceGrid files={job.pre_inspection_files} label="สภาพก่อนซ่อม (T3)" />
            <EvidenceGrid files={job.post_repair_files} label="ผลหลังซ่อม (T5)" />
          </div>
        </Section>

        {/* Parts */}
        {(job.parts_added?.length || job.parts_used?.length) ? (
          <Section title="อะไหล่">
            {job.parts_added?.length ? (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">อะไหล่เพิ่ม (B1.2)</p>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-600 text-left border-b border-gray-800">
                    <th className="py-1 pr-4">ชื่อ</th><th className="py-1 pr-4">จำนวน</th><th className="py-1">ราคา</th>
                  </tr></thead>
                  <tbody>{job.parts_added.map((p, i) => (
                    <tr key={i} className="border-b border-gray-800/50 text-gray-300">
                      <td className="py-1.5 pr-4">{p.name}</td>
                      <td className="py-1.5 pr-4">{p.qty}</td>
                      <td className="py-1.5">{p.price.toLocaleString()} G</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : null}
            {job.parts_used?.length ? (
              <div>
                <p className="text-xs text-gray-500 mb-2">อะไหล่ที่ใช้จริง (T5)</p>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-600 text-left border-b border-gray-800">
                    <th className="py-1 pr-4">ชื่อ</th><th className="py-1">จำนวน</th>
                  </tr></thead>
                  <tbody>{job.parts_used.map((p, i) => (
                    <tr key={i} className="border-b border-gray-800/50 text-gray-300">
                      <td className="py-1.5 pr-4">{p.name}</td>
                      <td className="py-1.5">{p.qty}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : null}
          </Section>
        ) : null}

        {/* State History */}
        {job.state_history?.length > 0 && (
          <Section title="State History">
            <div className="space-y-1">
              {job.state_history.map((ev, i) => {
                const s = JOB_STATUS[ev.state];
                return (
                  <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-gray-800/40 last:border-0">
                    <span className="text-gray-600 font-mono w-36 shrink-0">{fmt(ev.occurred_at)}</span>
                    <span className={`px-2 py-0.5 rounded-full ${s?.color ?? "bg-gray-800 text-gray-300"}`}>
                      {s?.label ?? ev.state}
                    </span>
                    <span className="text-gray-500">{ev.actor}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Audit Log */}
        {job.audit_log?.length > 0 && (
          <Section title="Audit Log">
            <div className="space-y-1">
              {job.audit_log.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 text-xs py-1.5 border-b border-gray-800/40 last:border-0">
                  <span className="text-gray-600 font-mono w-36 shrink-0">{fmt(ev.occurred_at)}</span>
                  <span className="font-mono text-blue-400 w-40 shrink-0">{ev.event_type}</span>
                  <span className="text-gray-400 w-24 shrink-0">{ev.actor_role} / {ev.actor_name}</span>
                  <span className="text-gray-500">{ev.detail ?? ""}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

      </main>
    </div>
  );
}
