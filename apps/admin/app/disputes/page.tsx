"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type DisputeStatus = "open" | "in_review" | "escalated" | "resolved";
type ServiceType   = "repair" | "resell" | "scrap" | "maintain";

interface DisputeItem {
  id:             string;
  service_type:   ServiceType;
  job_id?:        string;   // repair job id (if repair)
  listing_id?:    string;
  title:          string;
  poster_name?:   string;
  buyer_name?:    string;
  seller_name?:   string;
  weeeu_name?:    string;
  weeer_name?:    string;
  weeet_name?:    string;
  escrow_amount:  number;
  status:         DisputeStatus;
  opened_at:      string;
  resolved_at?:   string | null;
  // 4-layer fields
  fault_party?:   "weeeu" | "weeer" | "weeet" | "platform" | null;
  layer1_trigger?: string | null;   // L1: เงื่อนไขข้อเสนอ 9 แกน
  layer2_note?:    string | null;   // L2: ใครเป็นต้นเหตุ
  precedent_id?:   string | null;   // L4: precedent ที่บันทึก
}

interface PaginatedDisputes {
  items:  DisputeItem[];
  total:  number;
  page:   number;
  limit:  number;
}

/* ─────────────────────────────────────────────
   4-Layer Logic Constants
───────────────────────────────────────────── */
const NINE_AXES = [
  { key: "price",         label: "ราคา",              icon: "💰" },
  { key: "scope",         label: "ขอบเขตงาน",         icon: "📋" },
  { key: "timeline",      label: "ระยะเวลา",          icon: "⏱️" },
  { key: "parts",         label: "อะไหล่",            icon: "🔩" },
  { key: "quality",       label: "คุณภาพงาน",         icon: "⭐" },
  { key: "deposit",       label: "พอยต์ทองที่ล็อก",   icon: "💳" },
  { key: "cancellation",  label: "การยกเลิก",         icon: "❌" },
  { key: "evidence",      label: "หลักฐาน",           icon: "📸" },
  { key: "conduct",       label: "พฤติกรรม",          icon: "🤝" },
];

const LAYER_GUIDE = [
  {
    layer: "L1",
    label: "เงื่อนไขข้อเสนอ (9 แกน lock)",
    color: "bg-admin-surface border-l-4 border-admin-primary",
    textColor: "text-admin-primary",
    desc: "ตรวจว่าข้อพิพาทอยู่ในกรอบ 9 แกนที่ตกลงไว้ก่อนงาน ถ้าใช่ → ใช้ข้อตกลงเดิมเป็นฐาน",
  },
  {
    layer: "L2",
    label: "ใครเป็นต้นเหตุ (Fault Analysis)",
    color: "bg-orange-50 border-l-4 border-orange-400",
    textColor: "text-orange-700",
    desc: "วิเคราะห์ว่า WeeeU / WeeeR / WeeeT / ระบบ เป็นต้นเหตุของปัญหา",
  },
  {
    layer: "L3",
    label: "Default Rule (คืนลูกค้าเต็ม)",
    color: "bg-green-50 border-l-4 border-brand-success",
    textColor: "text-green-700",
    desc: "หากไม่สามารถระบุต้นเหตุชัด → Default คืนเงินให้ WeeeU เต็มจำนวน escrow",
  },
  {
    layer: "L4",
    label: "บันทึก Precedent",
    color: "bg-admin-surface border-l-4 border-admin-primary",
    textColor: "text-admin-primary",
    desc: "บันทึกผลตัดสินเป็น precedent สำหรับกรณีคล้ายกันในอนาคต",
  },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; dot: string }> = {
  open:       { label: "รับเรื่อง",       color: "bg-blue-50 text-blue-700 border border-blue-200",   dot: "bg-blue-500" },
  in_review:  { label: "กำลังพิจารณา",   color: "bg-yellow-50 text-yellow-700 border border-yellow-200", dot: "bg-yellow-500" },
  escalated:  { label: "Escalate ✋",     color: "bg-red-50 text-red-700 border border-red-200",       dot: "bg-red-500" },
  resolved:   { label: "ตัดสินแล้ว ✓",   color: "bg-green-50 text-green-700 border border-green-200", dot: "bg-green-500" },
};

const SERVICE_BADGE: Record<ServiceType, { label: string; color: string }> = {
  repair:   { label: "🔧 Repair",   color: "bg-admin-surface text-admin-primary border border-admin-primary/30" },
  resell:   { label: "🛍️ Resell",   color: "bg-blue-50 text-blue-700 border border-blue-200" },
  scrap:    { label: "♻️ Scrap",    color: "bg-gray-100 text-gray-600 border border-gray-300" },
  maintain: { label: "🛁 Maintain", color: "bg-teal-50 text-teal-700 border border-teal-200" },
};

const FAULT_LABEL: Record<string, string> = {
  weeeu:    "👤 WeeeU",
  weeer:    "🏪 WeeeR",
  weeet:    "🔧 WeeeT",
  platform: "⚙️ Platform",
};

/* ─────────────────────────────────────────────
   Resolve Modal
───────────────────────────────────────────── */
interface ResolveModalProps {
  dispute: DisputeItem;
  onClose: () => void;
  onDone:  () => void;
}

function ResolveModal({ dispute, onClose, onDone }: ResolveModalProps) {
  const [activeLayer, setActiveLayer] = useState(0);
  const [layer1Axis,   setLayer1Axis]   = useState<string>("");
  const [faultParty,   setFaultParty]   = useState<string>("");
  const [resolution,   setResolution]   = useState<"to_buyer" | "to_seller" | "split" | "default_refund">("default_refund");
  const [splitPct,     setSplitPct]     = useState(50);
  const [precedentNote, setPrecedentNote] = useState("");
  const [savePrecedent, setSavePrecedent] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const escrow = dispute.escrow_amount;
  const buyerAmt  = resolution === "to_buyer"      ? escrow
                  : resolution === "default_refund" ? escrow
                  : resolution === "split"           ? Math.round(escrow * splitPct / 100)
                  : 0;
  const sellerAmt = resolution === "to_seller"     ? escrow
                  : resolution === "split"          ? escrow - buyerAmt
                  : 0;

  async function submit() {
    if (!resolution) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/admin/disputes/${dispute.id}/resolve`, {
        resolution,
        split_percent: resolution === "split" ? splitPct : undefined,
        fault_party:   faultParty || null,
        layer1_axis:   layer1Axis || null,
        precedent_note: savePrecedent ? precedentNote : null,
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">⚖️ ตัดสินข้อพิพาท</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{dispute.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Escrow summary */}
        <div className="px-6 pt-4 pb-0">
          <div className="bg-admin-surface rounded-xl p-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-admin-primary">{escrow.toLocaleString()} G</p>
              <p className="text-xs text-gray-500">ระบบพักเงินกลาง (Escrow) รวม</p>
            </div>
            <div className="flex-1 text-sm text-gray-600">
              <p><strong>บริการ:</strong> {SERVICE_BADGE[dispute.service_type]?.label}</p>
              {dispute.weeeu_name  && <p><strong>WeeeU:</strong> {dispute.weeeu_name}</p>}
              {dispute.weeer_name  && <p><strong>WeeeR:</strong> {dispute.weeer_name}</p>}
              {dispute.buyer_name  && <p><strong>ผู้ซื้อ:</strong> {dispute.buyer_name}</p>}
              {dispute.seller_name && <p><strong>ผู้ขาย:</strong> {dispute.seller_name}</p>}
            </div>
          </div>
        </div>

        {/* 4-Layer tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
            {LAYER_GUIDE.map((g, i) => (
              <button key={i} onClick={() => setActiveLayer(i)}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                  activeLayer === i ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}>
                {g.layer}
              </button>
            ))}
          </div>

          {/* Layer content */}
          <div className={`rounded-xl p-4 mb-4 ${LAYER_GUIDE[activeLayer].color}`}>
            <p className={`text-sm font-semibold mb-1 ${LAYER_GUIDE[activeLayer].textColor}`}>
              {LAYER_GUIDE[activeLayer].label}
            </p>
            <p className="text-xs text-gray-600">{LAYER_GUIDE[activeLayer].desc}</p>
          </div>

          {/* L1: 9-axes selector */}
          {activeLayer === 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-700">แกนที่เกี่ยวข้อง (เลือกได้ 1 แกนหลัก)</p>
              <div className="grid grid-cols-3 gap-2">
                {NINE_AXES.map(ax => (
                  <button key={ax.key} onClick={() => setLayer1Axis(layer1Axis === ax.key ? "" : ax.key)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                      layer1Axis === ax.key
                        ? "bg-admin-surface border-admin-primary text-admin-primary font-medium"
                        : "bg-white border-gray-200 text-gray-600 hover:border-admin-primary/50"
                    }`}>
                    {ax.icon} {ax.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* L2: Fault party */}
          {activeLayer === 1 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-700">ฝ่ายที่เป็นต้นเหตุ</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FAULT_LABEL).map(([key, label]) => (
                  <button key={key} onClick={() => setFaultParty(faultParty === key ? "" : key)}
                    className={`text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                      faultParty === key
                        ? "bg-orange-50 border-orange-400 text-orange-700 font-medium"
                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* L3: Resolution */}
          {activeLayer === 2 && (
            <div className="space-y-3 mb-4">
              <p className="text-xs font-medium text-gray-700">ผลตัดสิน</p>
              {[
                { value: "default_refund", label: "คืนเงิน WeeeU เต็ม (Default)", sub: "ใช้เมื่อไม่มีข้อมูลชัดเจน", color: "border-green-400 bg-green-50 text-green-700" },
                { value: "to_buyer",       label: "คืนเงินผู้ซื้อ / WeeeU เต็ม", sub: "WeeeR/WeeeT ผิด", color: "border-blue-400 bg-blue-50 text-blue-700" },
                { value: "to_seller",      label: "โอนให้ผู้ขาย / WeeeR เต็ม",  sub: "WeeeU ผิด", color: "border-orange-400 bg-orange-50 text-orange-700" },
                { value: "split",          label: "แบ่งสัดส่วน",                 sub: "กรณีผิดทั้งสองฝ่าย", color: "border-admin-primary bg-admin-surface text-admin-primary" },
              ].map(opt => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="resolution" value={opt.value}
                    checked={resolution === opt.value}
                    onChange={() => setResolution(opt.value as typeof resolution)}
                    className="mt-1" />
                  <div className={`flex-1 px-3 py-2 rounded-lg border ${opt.color}`}>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs opacity-80">{opt.sub}</p>
                  </div>
                </label>
              ))}

              {resolution === "split" && (
                <div className="mt-3 px-4 py-3 bg-admin-surface rounded-xl border border-admin-primary/30">
                  <label className="block text-xs font-medium text-admin-primary mb-2">
                    สัดส่วน WeeeU (ผู้ซื้อ/ลูกค้า): {splitPct}%
                  </label>
                  <input type="range" min={0} max={100} step={5}
                    value={splitPct} onChange={e => setSplitPct(+e.target.value)}
                    className="w-full accent-[#2C5E8C]" />
                  <div className="flex justify-between text-xs text-admin-primary mt-2">
                    <span>WeeeU: {buyerAmt.toLocaleString()} G</span>
                    <span>WeeeR/ผู้ขาย: {sellerAmt.toLocaleString()} G</span>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-3 bg-gray-50 rounded-xl border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1.5">สรุปการจ่าย</p>
                <div className="flex gap-4 text-sm">
                  <div><span className="text-gray-500">WeeeU/ผู้ซื้อ: </span>
                    <span className="font-bold text-green-700">{buyerAmt.toLocaleString()} G</span></div>
                  <div><span className="text-gray-500">WeeeR/ผู้ขาย: </span>
                    <span className="font-bold text-orange-700">{sellerAmt.toLocaleString()} G</span></div>
                </div>
              </div>
            </div>
          )}

          {/* L4: Precedent */}
          {activeLayer === 3 && (
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={savePrecedent} onChange={e => setSavePrecedent(e.target.checked)}
                  className="w-4 h-4 accent-[#2C5E8C]" />
                <span className="text-sm text-gray-700">บันทึกเป็น Precedent สำหรับกรณีนี้</span>
              </label>
              {savePrecedent && (
                <textarea value={precedentNote} onChange={e => setPrecedentNote(e.target.value)}
                  rows={4} placeholder="สรุปสาระสำคัญของกรณีนี้ เพื่อใช้อ้างอิงในอนาคต..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-admin-primary resize-none" />
              )}
              {dispute.precedent_id && (
                <p className="text-xs text-admin-primary">📌 มี Precedent เดิม: #{dispute.precedent_id}</p>
              )}
            </div>
          )}
        </div>

        {/* Repair link */}
        {dispute.service_type === "repair" && dispute.job_id && (
          <div className="px-6 pb-2">
            <Link href={`/repair/jobs/${dispute.job_id}/manual-override`}
              className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg">
              ⚙️ เปิด Manual Override สำหรับงานนี้ →
            </Link>
          </div>
        )}

        {error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
            ยกเลิก
          </button>
          <button onClick={submit} disabled={submitting}
            className="px-5 py-2 text-sm font-medium bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors disabled:opacity-50">
            {submitting ? "กำลังบันทึก..." : "✓ ยืนยันตัดสิน"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function DisputesPage() {
  const router = useRouter();
  const superAdmin = isSuperAdmin();

  const [disputes,  setDisputes]  = useState<DisputeItem[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<ServiceType | "all">("all");
  const [selected,  setSelected]  = useState<DisputeItem | null>(null);
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(statusFilter  !== "all" && { status: statusFilter }),
        ...(serviceFilter !== "all" && { service_type: serviceFilter }),
      });
      const data = await api.get<PaginatedDisputes>(`/admin/disputes?${params}`);
      setDisputes(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, serviceFilter]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / limit);
  const openCount  = disputes.filter(d => d.status === "open").length;
  const escTotal   = disputes.reduce((s, d) => s + d.escrow_amount, 0);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚖️ ข้อพิพาท (Disputes)</h1>
            <p className="text-sm text-gray-500 mt-1">จัดการข้อพิพาทโดยใช้ 4-Layer Decision Framework</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center shadow-sm">
              <p className="text-xl font-bold text-red-600">{openCount}</p>
              <p className="text-xs text-gray-500">รอดำเนินการ</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center shadow-sm">
              <p className="text-xl font-bold text-admin-primary">{escTotal.toLocaleString()}</p>
              <p className="text-xs text-gray-500">G Escrow (หน้านี้)</p>
            </div>
          </div>
        </div>

        {/* 4-Layer guide strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {LAYER_GUIDE.map((g, i) => (
            <div key={i} className={`rounded-xl p-3 ${g.color}`}>
              <p className={`text-xs font-bold mb-0.5 ${g.textColor}`}>{g.layer} — {g.label}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="flex gap-1">
            {(["all", "open", "in_review", "escalated", "resolved"] as const).map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-admin-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {s === "all" ? "ทั้งหมด" : STATUS_CONFIG[s]?.label ?? s}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex gap-1">
            {(["all", "repair", "resell", "scrap", "maintain"] as const).map(s => (
              <button key={s} onClick={() => { setServiceFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  serviceFilter === s
                    ? "bg-admin-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {s === "all" ? "ทุกบริการ" : SERVICE_BADGE[s]?.label ?? s}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-gray-500">{total} รายการ</span>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-400">กำลังโหลด...</div>
          ) : disputes.length === 0 ? (
            <div className="p-12 text-center text-gray-400">ไม่พบข้อพิพาท</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-5 py-3 font-medium">ข้อพิพาท</th>
                  <th className="px-4 py-3 font-medium">บริการ</th>
                  <th className="px-4 py-3 font-medium">คู่กรณี</th>
                  <th className="px-4 py-3 font-medium">เงินพักกลาง (Escrow)</th>
                  <th className="px-4 py-3 font-medium">Layer hint</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">เปิดเมื่อ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disputes.map(d => {
                  const sc = STATUS_CONFIG[d.status];
                  const sv = SERVICE_BADGE[d.service_type];
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{d.title}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{d.id.slice(0, 8)}…</p>
                        {d.precedent_id && (
                          <span className="text-xs text-admin-primary">📌 Precedent</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sv?.color}`}>
                          {sv?.label ?? d.service_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {d.weeeu_name  && <div>👤 {d.weeeu_name}</div>}
                          {d.weeer_name  && <div>🏪 {d.weeer_name}</div>}
                          {d.buyer_name  && <div>👤 {d.buyer_name}</div>}
                          {d.seller_name && <div>🏷️ {d.seller_name}</div>}
                          {d.fault_party && (
                            <div className="text-orange-600 font-medium">⚠ {FAULT_LABEL[d.fault_party]}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-admin-primary">{d.escrow_amount.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 ml-1">G</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {d.layer1_trigger && <div className="text-admin-primary">L1: {d.layer1_trigger}</div>}
                          {d.layer2_note   && <div className="text-orange-600">L2: {d.layer2_note}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc?.color}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sc?.dot} align-middle`} />
                          {sc?.label ?? d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(d.opened_at).toLocaleDateString("th-TH")}
                        {d.resolved_at && (
                          <div className="text-green-600">✓ {new Date(d.resolved_at).toLocaleDateString("th-TH")}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {d.service_type === "repair" && d.job_id && (
                            <Link href={`/repair/jobs/${d.job_id}`}
                              className="text-xs px-2 py-1 bg-admin-surface text-admin-primary rounded-lg hover:bg-admin-primary/20 transition-colors">
                              Job →
                            </Link>
                          )}
                          {d.status !== "resolved" && superAdmin && (
                            <button onClick={() => setSelected(d)}
                              className="text-xs px-3 py-1 bg-admin-primary hover:bg-admin-dark text-white rounded-lg transition-colors">
                              ตัดสิน
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              ← ก่อนหน้า
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
              ถัดไป →
            </button>
          </div>
        )}
      </main>

      {selected && (
        <ResolveModal
          dispute={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); fetchData(); }}
        />
      )}
    </div>
  );
}
