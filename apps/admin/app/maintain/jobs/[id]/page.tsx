"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { MaintainJob } from "@/lib/types";

interface MaintainJobDetail extends MaintainJob {
  customerName:    string;
  customerPhone:   string;
  technicianName:  string | null;
  shopName:        string | null;
  timeline: {
    status:    MaintainJob["status"];
    actor:     string;
    note:      string | null;
    lat:       number | null;
    lng:       number | null;
    timestamp: string;
  }[];
  photos: {
    type:    "before" | "after" | "parts" | "other";
    url:     string;
    takenAt: string;
  }[];
  /* D-Maintain-1: WeeeT risk flag */
  risk_flag?:  boolean;
  risk_note?:  string | null;
  /* D-Maintain-2: cross-module reference to repair job */
  cross_module_ref?: { type: "repair"; job_id: string } | null;
  /* M7: No-show — ลูกค้าไม่อยู่ */
  no_show_flag?:          boolean;
  no_show_evidence_url?:  string | null;
  no_show_settled_at?:    string | null;
  /* Dispute */
  dispute_flag?: boolean;
  dispute?: {
    /* case type: ระบุประเภทเคส */
    case_type?:     "weeer_withdraw" | "weeu_stop_mid" | "no_show" | "general" | null;
    fault_party:    "weeeu" | "weeer" | "weeet" | null;
    resolution:     "refund" | "forfeit" | "split" | "pending" | null;
    split_pct?:     number | null;
    precedent_note?: string | null;
    offer_terms_ref?: string | null;
    /* M6: WeeeR ถอนหลังยืนยัน — นโยบาย 1 */
    weeer_withdraw_reason?: "shop_fault" | "customer_fault" | "force_majeure" | null;
    reroute_granted?:       boolean | null;
    /* M9: WeeeU ยุติกลางล้าง */
    completion_pct?:        number | null;   /* % ที่ล้างเสร็จแล้ว */
    settle_amount?:         number | null;   /* จำนวน Point ที่ WeeeR ได้รับ */
  } | null;
}

const STATUS_META: Record<MaintainJob["status"], { label: string; color: string }> = {
  pending:     { label: "รอดำเนินการ",  color: "bg-gray-100 text-gray-500" },
  assigned:    { label: "มอบหมายแล้ว", color: "bg-blue-50 text-blue-700" },
  departed:    { label: "ออกเดินทาง",  color: "bg-yellow-50 text-yellow-700" },
  arrived:     { label: "ถึงที่แล้ว",   color: "bg-cyan-50 text-cyan-700" },
  in_progress: { label: "กำลังทำงาน",  color: "bg-brand-info/15 text-brand-info" },
  completed:   { label: "เสร็จสิ้น",   color: "bg-green-50 text-green-700" },
  cancelled:   { label: "ยกเลิก",       color: "bg-red-50 text-red-700" },
};

const PHOTO_LABEL: Record<string, string> = {
  before: "ก่อนล้าง",
  after:  "หลังล้าง",
  parts:  "อะไหล่ที่ใช้",
  other:  "อื่นๆ",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-200/60 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !job) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error ?? "ไม่พบข้อมูล"}</div>
        <Link href="/maintain/jobs" className="text-sm text-admin-primary hover:text-admin-dark">← Jobs</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[job.status];
  const canCancel = superAdmin && job.status !== "completed" && job.status !== "cancelled";

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">🛁 {job.serviceCode}</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
              {job.recurring?.enabled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-admin-primary/15 text-admin-primary">
                  🔁 {job.recurring.interval.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {job.applianceType === "AC" ? "แอร์" : "เครื่องซักผ้า"} —{" "}
              {job.cleaningType === "general" ? "ล้างทั่วไป" : job.cleaningType === "deep" ? "ล้างลึก" : "ล้าง+ฆ่าเชื้อ"}
            </p>
          </div>
          <Link href="/maintain/jobs"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← Jobs
          </Link>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ลูกค้า</h2>
            <InfoRow label="ชื่อ" value={job.customerName} />
            <InfoRow label="โทร" value={job.customerPhone} />
            <InfoRow label="ที่อยู่" value={job.address.address} />
            <InfoRow label="GPS" value={
              <a href={`https://maps.google.com/?q=${job.address.lat},${job.address.lng}`}
                target="_blank" rel="noreferrer"
                className="text-admin-primary hover:text-admin-dark text-xs">
                📍 {job.address.lat.toFixed(5)}, {job.address.lng.toFixed(5)}
              </a>
            } />
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">งาน</h2>
            <InfoRow label="ช่าง" value={job.technicianName ?? "—"} />
            <InfoRow label="ร้าน" value={job.shopName ?? "—"} />
            <InfoRow label="นัดหมาย" value={new Date(job.scheduledAt).toLocaleString("th-TH")} />
            <InfoRow label="ระยะเวลาประมาณ" value={`${job.estimatedDuration} ชั่วโมง`} />
            <InfoRow label="ราคา" value={
              <span className="text-green-600 font-mono">{job.totalPrice.toLocaleString()} ฿</span>
            } />
          </section>

          {job.recurring?.enabled && (
            <section className="bg-white rounded-xl border border-admin-primary/30 p-5">
              <h2 className="text-xs font-semibold text-admin-primary uppercase tracking-wider mb-3">🔁 Recurring</h2>
              <InfoRow label="Interval" value={job.recurring.interval.replace("_months", " เดือน")} />
              <InfoRow label="นัดถัดไป" value={new Date(job.recurring.nextScheduledAt).toLocaleString("th-TH")} />
            </section>
          )}

          {job.parts_used && job.parts_used.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">อะไหล่ที่ใช้</h2>
              <div className="space-y-1.5">
                {job.parts_used.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{p.name}</span>
                    <span className="text-gray-500 font-mono">× {p.qty}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Photos */}
        {job.photos?.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
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
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-admin-primary transition-all">
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
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Timeline</h2>
            <div className="space-y-3">
              {job.timeline.map((t, i) => {
                const tMeta = STATUS_META[t.status];
                return (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-admin-primary mt-1 shrink-0" />
                      {i < job.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[16px]" />
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
                            className="text-xs text-admin-primary hover:text-admin-dark">📍</a>
                        )}
                      </div>
                      {t.note && <p className="text-xs text-gray-500 mt-1">{t.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* D-Maintain-1: Risk Flag — WeeeT แจ้งความเสี่ยง */}
        {job.risk_flag && (
          <section className="bg-orange-50 rounded-xl border border-orange-200 p-5">
            <h2 className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-3">
              ⚠️ Risk Flag — WeeeT แจ้งความเสี่ยง
            </h2>
            <p className="text-sm text-orange-800">
              {job.risk_note ?? "WeeeT ได้แจ้งความเสี่ยงในงานนี้ — โปรดตรวจสอบรายละเอียดเพิ่มเติม"}
            </p>
          </section>
        )}

        {/* D-Maintain-2: Cross-module trace — งานนี้ผูกกับ Repair Job */}
        {job.cross_module_ref?.type === "repair" && (
          <section className="bg-admin-surface rounded-xl border border-admin-primary/30 p-5">
            <h2 className="text-xs font-semibold text-admin-primary uppercase tracking-wider mb-3">
              🔧 Cross-Module — งานนี้ถูกส่งต่อเป็นงานซ่อม
            </h2>
            <p className="text-xs text-admin-primary mb-3">
              งาน Maintain นี้พบปัญหาระหว่างการล้าง และถูกเปิดเป็น Repair Job แยกต่างหาก
            </p>
            <Link
              href={`/repair/jobs/${job.cross_module_ref.job_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-admin-surface hover:bg-admin-surface text-admin-primary text-xs font-medium rounded-lg transition-colors">
              🔧 ดู Repair Job →
            </Link>
          </section>
        )}

        {/* M7: No-show Audit */}
        {job.no_show_flag && (
          <section className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
            <h2 className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-3">
              🚫 No-show — ลูกค้าไม่อยู่ / ไม่รับสาย
            </h2>
            <div className="space-y-2 text-xs text-yellow-800">
              <p>WeeeT (ช่าง) บันทึกว่าถึงสถานที่แล้วแต่ไม่พบลูกค้า</p>
              {job.no_show_settled_at && (
                <p>Settle เมื่อ: <span className="font-medium">{new Date(job.no_show_settled_at).toLocaleString("th-TH")}</span></p>
              )}
              {job.no_show_evidence_url && (
                <div className="mt-2">
                  <a href={job.no_show_evidence_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-xs text-yellow-800 transition-colors">
                    📷 ดูหลักฐานรูปถ่าย →
                  </a>
                </div>
              )}
              <p className="text-yellow-600 mt-2">
                ค่าเสียเที่ยวตามแกน No-show ใน Offer — ดู Audit Log สำหรับรายละเอียดการ Settle
              </p>
            </div>
          </section>
        )}

        {/* Dispute 4-Layer Panel */}
        {job.dispute_flag && (
          <section className="bg-white rounded-xl border border-red-200 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                  ⚖️ Dispute — 4 ชั้น (อ้างอิง Offer Terms)
                </h2>
                {/* Case type badge */}
                {job.dispute?.case_type && job.dispute.case_type !== "general" && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    job.dispute.case_type === "weeer_withdraw" ? "bg-orange-100 text-orange-700" :
                    job.dispute.case_type === "weeu_stop_mid"  ? "bg-blue-100 text-blue-700" :
                    job.dispute.case_type === "no_show"        ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {job.dispute.case_type === "weeer_withdraw" ? "M6 — WeeeR ถอนหลังยืนยัน" :
                     job.dispute.case_type === "weeu_stop_mid"  ? "M9 — WeeeU ยุติกลางล้าง" :
                     job.dispute.case_type === "no_show"        ? "M7 — No-show" : ""}
                  </span>
                )}
              </div>
              <Link
                href={`/disputes?job_id=${job.id}&service=maintain`}
                className="text-xs text-admin-primary hover:text-admin-dark">
                ดูรายการพิพาท →
              </Link>
            </div>

            {/* L1: Offer Terms Lock */}
            {/* PHASE-4: SoT = Source of Truth (Offer terms lock) */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                L1 — เงื่อนไขที่ตกลงใน Offer (ข้อตกลงหลัก)
              </p>
              <p className="text-xs text-gray-500">
                ข้อตกลงที่ WeeeU และ WeeeT ยืนยันก่อนเริ่มงาน ถูกล็อกเป็นข้อตกลงหลัก สำหรับวินิจฉัยข้อพิพาทนี้
              </p>
              {job.dispute?.offer_terms_ref && (
                <p className="text-xs text-admin-primary mt-1">ref: {job.dispute.offer_terms_ref}</p>
              )}
            </div>

            {/* L2: Fault Party + Case-specific details */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600">L2 — ฝ่ายที่เป็นต้นเหตุ</p>
              {job.dispute?.fault_party ? (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  job.dispute.fault_party === "weeeu" ? "bg-orange-100 text-orange-700" :
                  job.dispute.fault_party === "weeer" ? "bg-red-100 text-red-700" :
                  job.dispute.fault_party === "weeet" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {job.dispute.fault_party === "weeeu" ? "WeeeU (ลูกค้า)" :
                   job.dispute.fault_party === "weeer" ? "WeeeR (ช่าง)" :
                   job.dispute.fault_party === "weeet" ? "WeeeT (ร้าน)" : "ไม่ระบุ"}
                </span>
              ) : (
                <span className="text-xs text-gray-500">ยังไม่ระบุ — อยู่ระหว่างพิจารณา</span>
              )}

              {/* M6: WeeeR ถอนหลังยืนยัน — นโยบาย 1 (3 สาเหตุ) */}
              {job.dispute?.case_type === "weeer_withdraw" && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <p className="text-xs font-semibold text-orange-700">นโยบาย 1 — WeeeR ถอนหลังยืนยัน (3 สาเหตุ)</p>
                  <div className="space-y-1.5">
                    <div className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                      job.dispute.weeer_withdraw_reason === "shop_fault"
                        ? "bg-red-100 border border-red-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}>
                      <span className="font-medium text-red-700 shrink-0">ร้านผิด:</span>
                      <span className="text-gray-600">WeeeU ได้ reroute (จับคู่ร้านใหม่) ฟรี + คืนพอยต์ทองที่ล็อกเต็ม</span>
                      {job.dispute.reroute_granted && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✅ Rerouted</span>
                      )}
                    </div>
                    <div className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                      job.dispute.weeer_withdraw_reason === "customer_fault"
                        ? "bg-orange-100 border border-orange-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}>
                      <span className="font-medium text-orange-700 shrink-0">ลูกค้าผิด:</span>
                      <span className="text-gray-600">WeeeR ได้รับค่าเสียเวลาตามข้อเสนอ — WeeeU ไม่ได้คืนพอยต์ทองที่ล็อก</span>
                    </div>
                    <div className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                      job.dispute.weeer_withdraw_reason === "force_majeure"
                        ? "bg-blue-100 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}>
                      <span className="font-medium text-blue-700 shrink-0">สุดวิสัย:</span>
                      <span className="text-gray-600">ไม่มีฝ่ายผิด — คืนพอยต์ทองที่ล็อก WeeeU บางส่วน ตามนโยบายข้อเสนอ</span>
                    </div>
                  </div>
                  {job.dispute.weeer_withdraw_reason && (
                    <p className="text-xs text-gray-500 mt-1">
                      สาเหตุที่ระบุ:{" "}
                      <span className="font-medium text-gray-700">
                        {job.dispute.weeer_withdraw_reason === "shop_fault"     ? "ร้านผิด" :
                         job.dispute.weeer_withdraw_reason === "customer_fault" ? "ลูกค้าผิด" : "สุดวิสัย"}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* M9: WeeeU ยุติกลางล้าง */}
              {job.dispute?.case_type === "weeu_stop_mid" && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <p className="text-xs font-semibold text-blue-700">M9 — WeeeU ยุติระหว่างล้าง</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">% ล้างเสร็จแล้ว</p>
                      <p className="font-mono font-bold text-blue-700">
                        {job.dispute.completion_pct != null ? `${job.dispute.completion_pct}%` : "ยังไม่ระบุ"}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">WeeeR ได้รับ</p>
                      <p className="font-mono font-bold text-blue-700">
                        {job.dispute.settle_amount != null ? `${job.dispute.settle_amount.toLocaleString()} G` : "รอ settle"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    ตาม offer terms — จำนวน Point ที่ WeeeR ได้รับขึ้นกับ % งานที่ทำเสร็จแล้ว
                  </p>
                </div>
              )}
            </div>

            {/* L3: Resolution + Default */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                L3 — ผลวินิจฉัย (Default: คืนเงินลูกค้าเต็ม)
              </p>
              {job.dispute?.resolution ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    job.dispute.resolution === "refund"  ? "bg-blue-100 text-blue-700" :
                    job.dispute.resolution === "forfeit" ? "bg-red-100 text-red-700" :
                    job.dispute.resolution === "split"   ? "bg-admin-surface text-admin-primary" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {job.dispute.resolution === "refund"  ? "คืนเงินลูกค้า (Refund)" :
                     job.dispute.resolution === "forfeit" ? "ยึดให้ WeeeT (Forfeit)" :
                     job.dispute.resolution === "split"   ? `แบ่ง ${job.dispute.split_pct ?? 50}/${100 - (job.dispute.split_pct ?? 50)}` :
                     "รอผลวินิจฉัย"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  รอผลวินิจฉัย — Default คือคืนเงินให้ WeeeU เต็มจำนวน
                </p>
              )}
            </div>

            {/* L4: Precedent */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">L4 — บันทึก Precedent</p>
              {job.dispute?.precedent_note ? (
                <p className="text-xs text-gray-700">{job.dispute.precedent_note}</p>
              ) : (
                <p className="text-xs text-gray-400">ยังไม่มีบันทึก — กรอกได้ในหน้า Dispute Detail</p>
              )}
            </div>
          </section>
        )}

        {/* Force-cancel — super-admin only, non-terminal status */}
        {canCancel && (
          <section className="bg-white rounded-xl border border-red-200 p-5">
            <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-4">
              🔐 Force-Cancel — Super-Admin
            </h2>
            {cancelMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm border ${
                cancelMsg.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>{cancelMsg.text}</div>
            )}
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="เหตุผลยกเลิก (อย่างน้อย 10 ตัวอักษร)..."
              rows={3}
              className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none mb-3"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
              <input type="checkbox" checked={cancelConfirm}
                onChange={e => setCancelConfirm(e.target.checked)} className="accent-red-500" />
              ยืนยันว่าต้องการยกเลิกงานนี้
            </label>
            <button onClick={handleForceCancel}
              disabled={!cancelConfirm || cancelReason.trim().length < 10 || cancelLoading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
              {cancelLoading ? "กำลังดำเนินการ..." : "Force Cancel"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
