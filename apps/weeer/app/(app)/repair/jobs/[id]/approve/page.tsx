"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { RepairJob, DecisionBranch } from "../../../_lib/types";
import { BRANCH_LABEL } from "../../../_lib/types";

type ApproveAction = "B1.1" | "B1.2" | "B2.1" | "B2.2";

const BRANCH_CONFIG: Record<ApproveAction, {
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  needsPrice: boolean;
  forwardToUser: boolean;
}> = {
  "B1.1": {
    label: "อนุมัติ — ซ่อมตามเงื่อนไขเดิม",
    description: "ช่างเริ่มซ่อมได้เลย ราคาไม่เปลี่ยน",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "✅",
    needsPrice: false,
    forwardToUser: false,
  },
  "B1.2": {
    label: "อนุมัติ — ต้องเพิ่มอะไหล่",
    description: "ส่งราคาใหม่ให้ WeeeU ยืนยัน ก่อนช่างเริ่มงาน",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "🔩",
    needsPrice: true,
    forwardToUser: true,
  },
  "B2.1": {
    label: "ยืนยัน — ซ่อมไม่ได้ ยกเลิกงาน",
    description: "งานจะถูกยกเลิก นโยบายมัดจำตามที่ตกลงไว้",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "❌",
    needsPrice: false,
    forwardToUser: false,
  },
  "B2.2": {
    label: "ยืนยัน — เสนอรับซื้อซาก",
    description: "ส่งราคาซากให้ WeeeU ตัดสินใจ",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "♻️",
    needsPrice: true,
    forwardToUser: true,
  },
};

export default function ApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState<ApproveAction | null>(null);
  const [adjustedPrice, setAdjustedPrice] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    repairApi.getJob(id)
      .then((j) => {
        setJob(j);
        if (j.decision_branch) {
          setSelectedBranch(j.decision_branch as ApproveAction);
        }
        if (j.proposed_price) setAdjustedPrice(String(j.proposed_price));
        else if (j.scrap_agreed_price) setAdjustedPrice(String(j.scrap_agreed_price));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!selectedBranch) return;
    const cfg = BRANCH_CONFIG[selectedBranch];
    if (cfg.needsPrice && (!adjustedPrice || Number(adjustedPrice) <= 0)) {
      setError("กรุณาระบุราคา");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const actionMap: Record<ApproveAction, "approve" | "reject"> = {
        "B1.1": "approve",
        "B1.2": "approve",
        "B2.1": "reject",
        "B2.2": "approve",
      };
      await repairApi.approveProposal(id, {
        action: actionMap[selectedBranch],
        branch: selectedBranch,
        adjusted_price: cfg.needsPrice ? Number(adjustedPrice) : undefined,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/jobs/${id}`), 1800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !job) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (success) return (
    <div className="flex flex-col items-center justify-center h-56 text-center">
      <span className="text-4xl mb-3">✅</span>
      <p className="text-sm font-semibold text-green-700">ส่งคำตัดสินใจสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">กำลังพากลับหน้างาน…</p>
    </div>
  );
  if (!job) return null;

  const selectedCfg = selectedBranch ? BRANCH_CONFIG[selectedBranch] : null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/repair/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">อนุมัติผลตรวจ WeeeT</h1>
      </div>

      {/* Job summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold text-blue-800">{job.appliance_name}</p>
        <p className="text-xs text-blue-600">ลูกค้า: {job.customer_name}</p>
        <p className="text-xs text-blue-500">WeeeT: {job.weeet_name}</p>
        {job.original_price > 0 && (
          <p className="text-xs text-blue-500 font-medium">ราคาเสนอเดิม: {job.original_price.toLocaleString()} pts</p>
        )}
      </div>

      {/* WeeeT diagnosis */}
      {job.decision_branch && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ผลตรวจจาก WeeeT</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">{job.decision_branch}</span>
            <span className="text-sm text-gray-600">{BRANCH_LABEL[job.decision_branch as DecisionBranch]}</span>
          </div>
          {job.decision_notes && (
            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{job.decision_notes}</p>
          )}
          {job.parts_added && job.parts_added.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-600">อะไหล่เพิ่มเติม:</p>
              {job.parts_added.map((p, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <span>{p.name} × {p.qty}</span>
                  <span className="font-medium">{p.price.toLocaleString()} pts</span>
                </div>
              ))}
              {job.proposed_price && (
                <div className="flex justify-between text-xs font-bold text-green-700 pt-2 border-t border-gray-100 px-1">
                  <span>ราคารวมที่ WeeeT เสนอ</span>
                  <span>{job.proposed_price.toLocaleString()} pts</span>
                </div>
              )}
            </div>
          )}
          {job.scrap_agreed_price && (
            <p className="text-xs font-medium text-purple-700">ราคาซากที่ WeeeT เสนอ: {job.scrap_agreed_price.toLocaleString()} pts</p>
          )}
        </div>
      )}

      {/* Branch selection */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">เลือกการตัดสินใจ</p>
        {(Object.keys(BRANCH_CONFIG) as ApproveAction[]).map((branch) => {
          const cfg = BRANCH_CONFIG[branch];
          const isSelected = selectedBranch === branch;
          return (
            <button
              key={branch}
              onClick={() => { setSelectedBranch(branch); setError(""); }}
              className={`w-full text-left border-2 rounded-xl p-4 transition-all
                ${isSelected ? `${cfg.border} ${cfg.bg}` : "border-gray-100 bg-white hover:border-gray-200"}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{cfg.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">{branch}</span>
                    <p className={`text-sm font-semibold ${isSelected ? cfg.color : "text-gray-800"}`}>{cfg.label}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{cfg.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isSelected ? `${cfg.border} ${cfg.bg}` : "border-gray-300"}`}>
                  {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${cfg.color.replace("text-", "bg-")}`} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Price adjustment for B1.2 / B2.2 */}
      {selectedCfg?.needsPrice && (
        <div className={`border rounded-xl p-4 space-y-3 ${selectedCfg.bg} ${selectedCfg.border}`}>
          <p className={`text-sm font-semibold ${selectedCfg.color}`}>
            {selectedBranch === "B1.2" ? "ยืนยัน / ปรับราคารวมใหม่" : "ระบุราคารับซื้อซาก"}
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {selectedBranch === "B1.2" ? "ราคารวม (Point)" : "ราคาซาก (Point)"}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={adjustedPrice}
              onChange={(e) => setAdjustedPrice(e.target.value)}
              placeholder="เช่น 1200"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            />
          </div>
          {selectedCfg.forwardToUser && (
            <div className="flex items-center gap-2 bg-white rounded-lg p-3">
              <span className="text-sm">📨</span>
              <p className="text-xs text-gray-600">ระบบจะส่งราคานี้ให้ WeeeU ยืนยันก่อนดำเนินการต่อ</p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุถึง WeeeT / WeeeU</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="เงื่อนไขพิเศษ หรือข้อความเพิ่มเติม (ถ้ามี)"
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
        />
      </div>

      {/* Deposit notice for B2.1 */}
      {selectedBranch === "B2.1" && job.deposit_amount && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-700 mb-1">นโยบายมัดจำ</p>
          <p className="text-sm text-orange-800">มัดจำ {job.deposit_amount.toLocaleString()} pts —{" "}
            {job.deposit_policy_unrepairable === "forfeit" ? "ยึดมัดจำ (ตามเงื่อนไขที่ตกลง)" :
             job.deposit_policy_unrepairable === "refund" ? "คืนมัดจำให้ WeeeU" : "ฟรี (ไม่มีค่าใช้จ่าย)"}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!selectedBranch || submitting}
        className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {submitting ? "กำลังส่ง…" : selectedBranch ? `ยืนยัน ${selectedBranch}` : "เลือกการตัดสินใจก่อน"}
      </button>
    </div>
  );
}
