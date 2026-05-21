"use client";

/**
 * /repair/[id]/dispute — C9: Full Dispute Page
 *
 * Entry points (3 paths):
 *  - review/page.tsx  → POST /dispute { reason: "quality_dispute" }  → redirect here
 *  - b1-2/page.tsx    → negotiation breakdown (scrap/refund)
 *  - b2-2/page.tsx    → scrap proposal dispute
 *
 * 4-tier resolution:
 *  Tier 1: เงื่อนไขข้อเสนอ (ตามที่ตกลงใน Offer)
 *  Tier 2: ชั่งหลักฐาน (ฝ่ายใดมีหลักฐานมากกว่า)
 *  Tier 3: default คืนลูกค้าเต็ม (เมื่อหลักฐานทัดเทียม)
 *  Tier 4: บันทึก precedent (Admin ตัดสิน → ระบบเรียนรู้)
 *
 * MAX_ROUNDS = 2 (b1-2 + b2-2) — หลัง 2 รอบขึ้น Admin อัตโนมัติ
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────
type DisputeStatus =
  | "open"
  | "evidence_collection"
  | "negotiating"
  | "escalated_admin"
  | "resolved_customer"
  | "resolved_weeer"
  | "resolved_split"
  | "closed";

type DisputeTier = 1 | 2 | 3 | 4;

type DisputeEvidence = {
  id: string;
  submitted_by: "customer" | "weeer";
  file_url: string;
  file_type: "image" | "video" | "document";
  description: string;
  submitted_at: string;
};

type NegotiationRound = {
  round: number; // 1 or 2
  weeer_proposal: string | null;
  customer_response: "accepted" | "rejected" | "pending" | null;
  proposed_at: string | null;
  responded_at: string | null;
};

type DisputeData = {
  id: string;
  job_id: string;
  appliance_name: string;
  weeer_name: string;
  dispute_reason: string;
  status: DisputeStatus;
  tier: DisputeTier;
  opened_at: string;
  resolved_at: string | null;
  resolution_summary: string | null;
  refund_amount: number | null;
  evidence: DisputeEvidence[];
  negotiation_rounds: NegotiationRound[];
  admin_note: string | null;
};

// ── Labels ────────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<DisputeStatus, string> = {
  open:                   "เปิดข้อพิพาท",
  evidence_collection:    "รวบรวมหลักฐาน",
  negotiating:            "เจรจา",
  escalated_admin:        "อยู่กับ Admin",
  resolved_customer:      "แก้ไขแล้ว — คืนลูกค้า",
  resolved_weeer:         "แก้ไขแล้ว — ร้านซ่อมชนะ",
  resolved_split:         "แก้ไขแล้ว — แบ่งตาม Tier",
  closed:                 "ปิดแล้ว",
};

const STATUS_COLOR: Record<DisputeStatus, string> = {
  open:                "bg-yellow-50 border-yellow-200 text-yellow-800",
  evidence_collection: "bg-amber-50 border-amber-200 text-amber-800",
  negotiating:         "bg-sky-50 border-sky-200 text-sky-700",
  escalated_admin:     "bg-purple-50 border-purple-200 text-purple-800",
  resolved_customer:   "bg-green-50 border-green-200 text-green-800",
  resolved_weeer:      "bg-orange-50 border-orange-200 text-orange-800",
  resolved_split:      "bg-teal-50 border-teal-200 text-teal-800",
  closed:              "bg-gray-50 border-gray-200 text-gray-600",
};

const TIER_LABEL: Record<DisputeTier, string> = {
  1: "Tier 1 — เงื่อนไขข้อเสนอ",
  2: "Tier 2 — ชั่งหลักฐาน",
  3: "Tier 3 — Default คืนลูกค้า",
  4: "Tier 4 — Admin ตัดสิน",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

// ── File type icon ─────────────────────────────────────────────────────────────
function fileIcon(type: DisputeEvidence["file_type"]): string {
  if (type === "image")    return "🖼️";
  if (type === "video")    return "🎥";
  return "📄";
}

// ── Evidence upload panel ──────────────────────────────────────────────────────
function EvidenceUploadPanel({ jobId, onUploaded }: { jobId: string; onUploaded: () => void }) {
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) { setErr("กรุณาเลือกไฟล์"); return; }
    if (!desc.trim()) { setErr("กรุณาอธิบายหลักฐาน"); return; }
    setSubmitting(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("description", desc);
      const res = await apiFetch(`/api/v1/repair/jobs/${jobId}/dispute/evidence`, {
        method: "POST",
        body: form,
        headers: {}, // let browser set Content-Type for FormData
      });
      if (!res.ok) throw new Error(await res.text());
      setDesc("");
      setFile(null);
      onUploaded();
    } catch {
      setErr("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">อัปโหลดหลักฐาน</p>
      <input
        type="file"
        accept="image/*,video/*,.pdf"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-weeeu-surface file:text-weeeu-dark hover:file:bg-weeeu-primary hover:file:text-white file:cursor-pointer file:transition-colors"
      />
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="อธิบายหลักฐาน เช่น 'รูปถ่ายหลังซ่อมที่ยังมีปัญหา'"
        rows={2}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary resize-none"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmit}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-dark text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <><span className="animate-spin">⟳</span> กำลังอัปโหลด...</> : "ส่งหลักฐาน"}
      </button>
    </div>
  );
}

// ── Evidence list ──────────────────────────────────────────────────────────────
function EvidenceList({ items }: { items: DisputeEvidence[] }) {
  if (items.length === 0) return (
    <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีหลักฐาน</p>
  );
  return (
    <div className="space-y-2">
      {items.map(ev => (
        <div key={ev.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
          <span className="text-xl flex-shrink-0">{fileIcon(ev.file_type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{ev.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {ev.submitted_by === "customer" ? "👤 ลูกค้า" : "🔧 ร้านซ่อม"} · {formatDate(ev.submitted_at)}
            </p>
          </div>
          <a
            href={ev.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-weeeu-primary hover:text-weeeu-dark underline flex-shrink-0"
          >
            ดู
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Negotiation rounds ────────────────────────────────────────────────────────
function NegotiationRounds({
  rounds,
  jobId,
  onRefresh,
}: {
  rounds: NegotiationRound[];
  jobId: string;
  onRefresh: () => void;
}) {
  const [responding, setResponding] = useState(false);
  const [respErr, setRespErr] = useState<string | null>(null);

  const latestRound = rounds.find(r => r.customer_response === "pending");

  const respond = async (response: "accepted" | "rejected") => {
    if (!latestRound) return;
    setResponding(true);
    setRespErr(null);
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${jobId}/dispute/negotiate`, {
        method: "POST",
        body: JSON.stringify({ round: latestRound.round, response }),
      });
      if (!res.ok) throw new Error(await res.text());
      onRefresh();
    } catch {
      setRespErr("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setResponding(false);
    }
  };

  if (rounds.length === 0) return (
    <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีการเจรจา</p>
  );

  return (
    <div className="space-y-3">
      {rounds.map(r => (
        <div key={r.round} className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500">รอบที่ {r.round} / 2 (MAX_ROUNDS)</p>
          {r.weeer_proposal && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">ข้อเสนอจากร้านซ่อม</p>
              <p className="text-sm text-gray-700">{r.weeer_proposal}</p>
              {r.proposed_at && <p className="text-xs text-gray-400 mt-1">{formatDate(r.proposed_at)}</p>}
            </div>
          )}
          {r.customer_response === "pending" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-amber-600 font-medium">⏳ รอการตอบสนองจากคุณ</p>
              {respErr && <p className="text-xs text-red-600">{respErr}</p>}
              <div className="flex gap-2">
                <button
                  disabled={responding}
                  onClick={() => respond("accepted")}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                >
                  ยอมรับ
                </button>
                <button
                  disabled={responding}
                  onClick={() => respond("rejected")}
                  className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium py-2 rounded-xl transition-colors"
                >
                  ปฏิเสธ {r.round >= 2 ? "(ส่ง Admin)" : ""}
                </button>
              </div>
            </div>
          )}
          {r.customer_response && r.customer_response !== "pending" && (
            <p className={`text-xs font-medium ${r.customer_response === "accepted" ? "text-green-600" : "text-red-500"}`}>
              {r.customer_response === "accepted" ? "✅ ยอมรับข้อเสนอ" : "❌ ปฏิเสธข้อเสนอ"}
              {r.responded_at ? ` · ${formatDate(r.responded_at)}` : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DisputePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DisputeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDispute = () => {
    setLoading(true);
    apiFetch(`/api/v1/repair/jobs/${id}/dispute`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setError("ไม่สามารถโหลดข้อมูลข้อพิพาทได้"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDispute, [id]);

  const isResolved = data ? ["resolved_customer", "resolved_weeer", "resolved_split", "closed"].includes(data.status) : false;

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ข้อพิพาท</h1>
          {data && <p className="text-sm text-gray-400">{data.appliance_name} · ร้าน {data.weeer_name}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Status banner */}
          <div className={`rounded-2xl border px-5 py-4 ${STATUS_COLOR[data.status]}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{STATUS_LABEL[data.status]}</p>
                <p className="text-xs mt-0.5 opacity-75">{TIER_LABEL[data.tier]}</p>
              </div>
              <div className="text-right text-xs opacity-75">
                <p>เปิด: {formatDate(data.opened_at)}</p>
                {data.resolved_at && <p>ปิด: {formatDate(data.resolved_at)}</p>}
              </div>
            </div>
          </div>

          {/* ── Tier status roadmap ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ขั้นตอนการแก้ไข</p>
            <div className="space-y-2">
              {([1, 2, 3, 4] as DisputeTier[]).map(tier => (
                <div key={tier} className={`flex items-center gap-3 p-2.5 rounded-xl ${data.tier >= tier ? "bg-weeeu-surface" : "bg-gray-50"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${data.tier > tier ? "bg-weeeu-primary text-white" : data.tier === tier ? "bg-weeeu-dark text-white" : "bg-gray-200 text-gray-400"}`}>
                    {data.tier > tier ? "✓" : tier}
                  </span>
                  <p className={`text-xs font-medium ${data.tier >= tier ? "text-weeeu-text" : "text-gray-400"}`}>
                    {TIER_LABEL[tier]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Resolution summary (ถ้ามีผล) ──────────────────────────────── */}
          {isResolved && data.resolution_summary && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">ผลการตัดสิน</p>
              <p className="text-sm text-gray-700">{data.resolution_summary}</p>
              {data.refund_amount != null && (
                <p className="text-sm font-bold text-green-700">
                  คืน {data.refund_amount.toLocaleString()} Point
                </p>
              )}
            </div>
          )}

          {/* ── Admin note ─────────────────────────────────────────────────── */}
          {data.admin_note && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-purple-700 mb-1">📋 บันทึก Admin (Tier 4)</p>
              <p className="text-sm text-gray-700">{data.admin_note}</p>
            </div>
          )}

          {/* ── หลักฐาน ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              หลักฐาน ({data.evidence.length} รายการ)
            </p>
            <EvidenceList items={data.evidence} />
          </div>

          {/* อัปโหลดหลักฐานเพิ่ม (เฉพาะยังไม่ปิด) */}
          {!isResolved && (
            <EvidenceUploadPanel jobId={id} onUploaded={fetchDispute} />
          )}

          {/* ── การเจรจา ────────────────────────────────────────────────────── */}
          {data.negotiation_rounds.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                การเจรจา ({data.negotiation_rounds.length} / 2 รอบ)
              </p>
              <NegotiationRounds
                rounds={data.negotiation_rounds}
                jobId={id}
                onRefresh={fetchDispute}
              />
            </div>
          )}

          {/* ── Admin escalation notice ─────────────────────────────────────── */}
          {data.status === "escalated_admin" && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-purple-800">⚖️ กำลังรอ Admin ตัดสิน</p>
              <p className="text-xs text-gray-500">
                ผ่านการเจรจา 2 รอบแล้ว — Admin จะตรวจสอบหลักฐานและออกคำตัดสินภายใน 3-5 วันทำการ
              </p>
            </div>
          )}

          {/* ── เหตุผลข้อพิพาท ─────────────────────────────────────────────── */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">เหตุผลที่เปิดข้อพิพาท</p>
            <p className="text-sm text-gray-600">{data.dispute_reason}</p>
          </div>

          {/* Back to job */}
          <Link
            href={`/repair/${id}`}
            className="block text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            ← กลับหน้างานซ่อม
          </Link>
        </>
      )}
    </div>
  );
}
