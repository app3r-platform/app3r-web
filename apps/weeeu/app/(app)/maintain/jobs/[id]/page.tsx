"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { MaintainJob } from "@/lib/types";
import { PublicQAThread } from "@/components/listing/PublicQAThread";

const STATUS_LABEL: Record<MaintainJob["status"], string> = {
  awaiting_offer:  "รอข้อเสนอ",
  offer_expired:   "หมดอายุ — ไม่มีร้านรับ",
  pending:         "รอช่าง",
  assigned:        "มอบหมายแล้ว",
  departed:        "ช่างออกเดินทาง",
  arrived:         "ช่างถึงแล้ว",
  in_progress:     "กำลังล้าง",
  terminated:      "ยุติกลางคัน",
  completed:       "เสร็จแล้ว",
  cancelled:       "ยกเลิก",
  weeer_withdrawn: "WeeeR ถอนงาน",
  closed_for_repair: "ปิด→แจ้งซ่อม",
};

const STATUS_COLOR: Record<MaintainJob["status"], string> = {
  awaiting_offer:  "bg-blue-100 text-blue-700",
  offer_expired:   "bg-red-100 text-red-600",
  pending:         "bg-yellow-100 text-yellow-700",
  assigned:        "bg-weeeu-surface text-weeeu-primary",
  departed:        "bg-amber-100 text-amber-700",
  arrived:         "bg-amber-100 text-amber-700",
  in_progress:     "bg-weeeu-surface text-weeeu-dark",
  terminated:      "bg-gray-100 text-gray-600",
  completed:       "bg-green-100 text-green-700",
  cancelled:       "bg-gray-100 text-gray-500",
  weeer_withdrawn: "bg-orange-100 text-orange-700",
  closed_for_repair: "bg-orange-100 text-orange-700",
};

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_MAINTAIN_JOB: MaintainJob = {
  id: "mock-maintain-001",
  serviceCode: "M-2026-001",
  customerId: "current-user",
  shopId: "shop-001",
  technicianId: "weeet-001",
  status: "in_progress",
  applianceType: "AC",
  cleaningType: "deep",
  serviceMethod: "on_site",
  scheduledAt: new Date(Date.now() - 3600000).toISOString(),
  estimatedDuration: 3,
  address: { lat: 13.7563, lng: 100.5018, address: "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพ 10110" },
  recurring: undefined,
  parts_used: [
    { name: "น้ำยาล้างคอยล์", qty: 1 },
    { name: "ผ้ากรองแอร์", qty: 2 },
  ],
  totalPrice: 800,
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
};

const TIMELINE_STEPS: { status: MaintainJob["status"]; label: string; icon: string }[] = [
  { status: "awaiting_offer", label: "รอ WeeeR ส่งข้อเสนอ",  icon: "📬" },
  { status: "pending",        label: "รอมอบหมายช่าง",        icon: "⏳" },
  { status: "assigned",       label: "มอบหมายช่างแล้ว",      icon: "👷" },
  { status: "departed",       label: "ช่างออกเดินทาง",        icon: "🚗" },
  { status: "arrived",        label: "ช่างถึงหน้างาน",         icon: "📍" },
  { status: "in_progress",    label: "กำลังล้างเครื่อง",       icon: "🛁" },
  { status: "completed",      label: "งานเสร็จสมบูรณ์",        icon: "✅" },
];

const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC: "แอร์ 🌡️",
  WashingMachine: "เครื่องซักผ้า 🫧",
};

const CLEANING_LABEL: Record<MaintainJob["cleaningType"], string> = {
  general: "ล้างทั่วไป 🧼",
  deep: "ล้างลึก 🔬",
  sanitize: "ล้าง+ฆ่าเชื้อ 🦠",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// M9 — เหตุผลยุติงาน
const TERMINATE_REASONS = [
  { value: "changed_mind",   label: "เปลี่ยนใจ ไม่ต้องการล้างแล้ว" },
  { value: "quality_issue",  label: "ไม่พอใจคุณภาพการล้างระหว่างงาน" },
  { value: "emergency",      label: "เหตุฉุกเฉิน ต้องหยุดทันที" },
  { value: "other",          label: "อื่นๆ" },
];

export default function MaintainJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<MaintainJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // M9 — ยุติงาน modal state
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState("changed_mind");
  const [terminateNote, setTerminateNote] = useState("");
  const [terminateSubmitting, setTerminateSubmitting] = useState(false);
  const [terminateError, setTerminateError] = useState("");

  // M6 — WeeeR ถอนงาน action state
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState<"reroute" | "dispute" | null>(null);

  useEffect(() => {
    apiFetch(`/api/v1/maintain/jobs/${id}/`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!d) setError("ไม่พบงานนี้"); else setJob(d); })
      .catch(() => {
        setJob(prev => prev ?? MOCK_MAINTAIN_JOB);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("ยืนยันยกเลิกงานนี้?")) return;
    setCancelling(true);
    try {
      const res = await apiFetch(`/api/v1/maintain/jobs/${id}/cancel/`, { method: "POST" });
      if (!res.ok) throw new Error();
      setJob(j => j ? { ...j, status: "cancelled" } : j);
    } catch {
      setError("ไม่สามารถยกเลิกได้ กรุณาลองใหม่");
    } finally {
      setCancelling(false);
    }
  };

  // M9 — ยุติงานระหว่าง in_progress
  const handleTerminate = async () => {
    setTerminateSubmitting(true);
    setTerminateError("");
    try {
      // Production: POST /api/v1/maintain/jobs/${id}/terminate
      const res = await apiFetch(`/api/v1/maintain/jobs/${id}/terminate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: terminateReason, note: terminateNote.trim() }),
      });
      if (!res.ok) throw new Error();
      setJob(j => j ? { ...j, status: "terminated" } : j);
      setShowTerminateModal(false);
    } catch {
      setTerminateError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setTerminateSubmitting(false);
    }
  };

  // M6 — WeeeR ถอน: WeeeU ตัดสินใจ reroute หรือ dispute
  const handleWithdrawal = async (action: "reroute" | "dispute") => {
    setWithdrawalSubmitting(action);
    try {
      if (action === "reroute") {
        // Production: POST /api/v1/maintain/jobs/${id}/accept-withdrawal → status = awaiting_offer (หาร้านใหม่ฟรี)
        await apiFetch(`/api/v1/maintain/jobs/${id}/accept-withdrawal/`, { method: "POST" });
        setJob(j => j ? { ...j, status: "awaiting_offer" } : j);
      } else {
        // Production: POST /api/v1/maintain/jobs/${id}/dispute-withdrawal → status = pending_admin
        await apiFetch(`/api/v1/maintain/jobs/${id}/dispute-withdrawal/`, { method: "POST" });
        setError("ส่งเรื่องโต้แย้งถึง Admin แล้ว — Admin จะติดต่อกลับภายใน 24 ชม.");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setWithdrawalSubmitting(null);
    }
  };

  const currentStepIdx = job ? TIMELINE_STEPS.findIndex(s => s.status === job.status) : -1;

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  if (error || !job) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🛁</p>
      <p className="text-gray-600 font-medium">{error || "ไม่พบข้อมูล"}</p>
      <Link href="/maintain/jobs" className="mt-3 inline-block text-weeeu-primary text-sm font-medium hover:underline">← กลับรายการ</Link>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานล้าง</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action banner — awaiting_offer: ดูข้อเสนอ */}
      {job.status === "awaiting_offer" && (
        <Link
          href={`/maintain/jobs/${id}/offers`}
          className="block bg-blue-50 border border-blue-200 rounded-2xl p-4 hover:bg-blue-100 transition-colors"
        >
          <p className="text-sm font-semibold text-blue-800">📬 มีข้อเสนอจาก WeeeR — กดดูและพิจารณา</p>
          <p className="text-xs text-blue-600 mt-1 font-medium">รับทราบเงื่อนไขก่อนยืนยัน →</p>
        </Link>
      )}

      {/* Action banner — closed_for_repair: D-M-2 cross-module */}
      {job.status === "closed_for_repair" && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-orange-800">🔧 WeeeR พบความเสียหาย — จำเป็นต้องซ่อม</p>
            <p className="text-xs text-orange-600 mt-1">
              ช่างล้างพบว่าเครื่องใช้ไฟฟ้าชำรุดเกินกว่าจะล้างได้ตามปกติ
              งานล้างนี้จึงถูกปิด และ WeeeR ถูกล็อคให้รอการยืนยันซ่อมจากคุณ
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="text-xs text-amber-700">
              ⚠️ <strong>auto-lock</strong> — WeeeR รายนี้ถูกล็อคชั่วคราวไว้สำหรับงานซ่อมนี้
              หากคุณไม่ต้องการซ่อม ระบบจะปลดล็อค WeeeR โดยอัตโนมัติ
            </p>
          </div>
          <Link
            href={`/repair/book?from_maintain=${id}`}
            className="block w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm text-center transition-colors"
          >
            🔧 ประกาศซ่อม — สร้างงานซ่อมใหม่
          </Link>
          <button
            type="button"
            className="w-full border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
            onClick={async () => {
              if (!confirm("ยืนยันไม่ต้องการซ่อม? WeeeR จะถูกปลดล็อค")) return;
              // Production: POST /api/v1/maintain/jobs/${id}/decline-repair
              window.location.reload();
            }}
          >
            ไม่ต้องการซ่อม — ปลดล็อค WeeeR
          </button>
        </div>
      )}

      {/* Action banner — M2: offer_expired → จองใหม่ */}
      {job.status === "offer_expired" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-red-800">⏰ หมดเวลา — ไม่มี WeeeR รับงานนี้</p>
            <p className="text-xs text-red-600 mt-1">
              ไม่มีร้านในพื้นที่ส่งข้อเสนอภายในเวลาที่กำหนด งานนี้จึงปิดโดยอัตโนมัติ
            </p>
          </div>
          <Link
            href="/maintain/book"
            className="block w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm text-center transition-colors"
          >
            + จองใหม่อีกครั้ง
          </Link>
        </div>
      )}

      {/* Action banner — M6: weeer_withdrawn → WeeeU เลือก reroute / dispute */}
      {job.status === "weeer_withdrawn" && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-orange-800">⚠️ WeeeR ขอถอนงานหลังยืนยัน</p>
            <p className="text-xs text-orange-600 mt-1">
              ร้านแจ้งว่าไม่สามารถรับงานนี้ได้ — กรุณาเลือกการดำเนินการ
            </p>
          </div>
          <div className="bg-white border border-orange-100 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-500">
              📋 นโยบาย: หากร้านผิด → ระบบ reroute (จัดสรรร้านใหม่) ฟรี · หากโต้แย้ง → Admin วินิจฉัย
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={withdrawalSubmitting !== null}
              onClick={() => handleWithdrawal("reroute")}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-primary/40 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-1"
            >
              {withdrawalSubmitting === "reroute"
                ? <><span className="animate-spin">⟳</span> กำลังดำเนินการ...</>
                : "✅ ยอมรับ — หาร้านใหม่ฟรี"}
            </button>
            <button
              type="button"
              disabled={withdrawalSubmitting !== null}
              onClick={() => handleWithdrawal("dispute")}
              className="flex-1 border border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-1"
            >
              {withdrawalSubmitting === "dispute"
                ? <><span className="animate-spin">⟳</span> กำลังส่ง...</>
                : "⚖️ โต้แย้ง → Admin"}
            </button>
          </div>
        </div>
      )}

      {/* Action banner — rate */}
      {job.status === "completed" && (
        <Link
          href={`/maintain/jobs/${id}/rate`}
          className="block bg-weeeu-surface border border-weeeu-primary/30 rounded-2xl p-4 hover:bg-weeeu-surface/70 transition-colors"
        >
          <p className="text-sm font-semibold text-weeeu-text">⭐ งานเสร็จแล้ว — ให้คะแนนช่าง</p>
          <p className="text-xs text-weeeu-primary mt-1 font-medium">กดที่นี่เพื่อให้คะแนน →</p>
        </Link>
      )}

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">{APPLIANCE_LABEL[job.applianceType]}</p>
            <p className="text-sm text-gray-500 mt-0.5">{CLEANING_LABEL[job.cleaningType]}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">{job.serviceCode}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
        </div>
      </div>

      {/* M9 — terminated banner */}
      {job.status === "terminated" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1">
          <p className="text-sm font-semibold text-gray-700">🛑 งานถูกยุติกลางคัน</p>
          <p className="text-xs text-gray-500">
            WeeeR ได้รับแจ้งและกำลังประสานงานการ settle ค่าใช้จ่ายตามข้อเสนอที่ตกลงไว้
          </p>
        </div>
      )}

      {/* Status timeline */}
      {(job.status !== "cancelled" && job.status !== "offer_expired" && job.status !== "terminated") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ขั้นตอน</p>
          <div className="space-y-3">
            {TIMELINE_STEPS.map((step, i) => {
              const done = currentStepIdx >= i;
              const active = currentStepIdx === i;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    done ? "bg-weeeu-surface text-weeeu-primary" : "bg-gray-100 text-gray-300"
                  } ${active ? "ring-2 ring-weeeu-primary ring-offset-1" : ""}`}>
                    {step.icon}
                  </div>
                  <p className={`text-sm ${done ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  {active && <span className="ml-auto text-xs text-weeeu-primary font-medium">● ตอนนี้</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
        </div>
        <div className="p-5 space-y-3">
          <Row label="วันนัด" value={formatDate(job.scheduledAt)} />
          <Row label="ที่อยู่" value={job.address.address} />
          <Row label="ระยะเวลาโดยประมาณ" value={`${job.estimatedDuration} ชั่วโมง`} />
          {job.recurring?.enabled && (
            <Row label="นัดซ้ำ" value={
              job.recurring.interval === "3_months" ? "ทุก 3 เดือน 🔄"
              : job.recurring.interval === "6_months" ? "ทุก 6 เดือน 🔄"
              : "ทุกปี 🔄"
            } />
          )}
          {job.recurring?.nextScheduledAt && (
            <Row label="นัดถัดไป" value={formatDate(job.recurring.nextScheduledAt)} />
          )}
          {job.totalPrice > 0 && (
            <Row label="ราคา" value={`${job.totalPrice.toLocaleString()} พอยต์ทอง`} />
          )}
        </div>
      </div>

      {/* Technician info */}
      {job.technicianId && (
        <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-weeeu-text">👷 ช่างที่รับงาน</p>
          <p className="text-xs text-weeeu-primary mt-1">ID: {job.technicianId}</p>
        </div>
      )}

      {/* Parts used */}
      {job.parts_used && job.parts_used.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">อะไหล่/สารเคมีที่ใช้</p>
          {job.parts_used.map((p, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{p.name}</span>
              <span className="text-gray-800 font-medium">x{p.qty}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cancel button */}
      {(job.status === "awaiting_offer" || job.status === "pending" || job.status === "assigned") && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium py-3 rounded-2xl transition-colors text-sm"
        >
          {cancelling ? <><span className="animate-spin">⟳</span> กำลังยกเลิก...</> : "❌ ยกเลิกงานนี้"}
        </button>
      )}

      {/* M9 — ยุติงาน button (in_progress เท่านั้น) */}
      {job.status === "in_progress" && (
        <button
          type="button"
          onClick={() => setShowTerminateModal(true)}
          className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-2xl transition-colors text-sm"
        >
          🛑 ยุติงานกลางคัน
        </button>
      )}

      {/* M9 — Terminate modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">🛑 ยุติงานกลางคัน</p>
              <button
                type="button"
                onClick={() => { setShowTerminateModal(false); setTerminateError(""); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700">
                  ⚠️ การยุติงานกลางคันจะแจ้ง WeeeR ให้หยุดงานทันที — ค่าใช้จ่ายที่เกิดขึ้นแล้วจะคิดตาม offer ที่ตกลงไว้
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">เหตุผลยุติงาน <span className="text-red-500">*</span></p>
                {TERMINATE_REASONS.map(r => (
                  <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    terminateReason === r.value
                      ? "bg-weeeu-surface border-weeeu-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="terminateReason"
                      value={r.value}
                      checked={terminateReason === r.value}
                      onChange={() => setTerminateReason(r.value)}
                      className="accent-weeeu-primary"
                    />
                    <span className={`text-sm ${terminateReason === r.value ? "text-weeeu-text font-medium" : "text-gray-600"}`}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>

              {terminateReason === "other" && (
                <textarea
                  value={terminateNote}
                  onChange={e => setTerminateNote(e.target.value)}
                  placeholder="ระบุเหตุผลเพิ่มเติม..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary resize-none"
                />
              )}

              {terminateError && (
                <p className="text-xs text-red-600">{terminateError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowTerminateModal(false); setTerminateError(""); }}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={terminateSubmitting}
                  onClick={handleTerminate}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {terminateSubmitting
                    ? <><span className="animate-spin">⟳</span> กำลังยุติ...</>
                    : "ยืนยันยุติงาน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <PublicQAThread />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}
