"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { partsApi } from "../_lib/api";
import { scrapApi } from "../../scrap/_lib/api";
import type { ScrapJob } from "../../scrap/_lib/types";

export default function PartsDisassemblePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // D54 swap: ScrapJob picker
  const [scrapJobs, setScrapJobs] = useState<ScrapJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");

  const [partName, setPartName] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    scrapApi.jobList()
      .then(jobs => {
        // Show only jobs that are pending_decision or in_progress (still actionable)
        setScrapJobs(jobs.filter(j => j.status === "pending_decision" || j.status === "in_progress"));
      })
      .catch(() => setScrapJobs([]))
      .finally(() => setJobsLoading(false));
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!partName.trim()) e.partName = "กรุณาระบุชื่ออะไหล่";
    if (!sku.trim()) e.sku = "กรุณาระบุ SKU";
    if (!qty || Number(qty) <= 0) e.qty = "กรุณากรอกจำนวน";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      const selectedJob = scrapJobs.find(j => j.id === selectedJobId);
      const created = await partsApi.create({
        name: partName.trim(),
        sku: sku.trim(),
        category: "อื่นๆ",
        unit: "ชิ้น",
        condition: "used",
        unitPrice: 0,
        source: {
          type: "disassembly",
          refId: selectedJobId || undefined,
        },
      });
      await partsApi.stockIn(created.id, {
        qty: Number(qty),
        reason: "receive_from_disassembly",
        refId: selectedJobId || undefined,
        note: note.trim() || undefined,
      });
      // If a ScrapJob was selected, also submit resell_parts to link the job
      if (selectedJobId && selectedJob) {
        await scrapApi.submitResellParts(selectedJobId, {
          partNames: [partName.trim()],
          quantities: [Number(qty)],
          notes: note.trim() || undefined,
        }).catch(() => {
          // Best-effort — part already created; don't fail the whole flow
        });
      }
      setSuccess(true);
      setTimeout(() => router.push(`/parts/${created.id}`), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <span className="text-4xl mb-3">🔧</span>
      <p className="text-sm font-semibold text-green-700">บันทึกอะไหล่จากซากสำเร็จ</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/parts" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">เพิ่มอะไหล่จากซาก</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">

        {/* D54 swap: ScrapJob picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เลือก ScrapJob (ไม่บังคับ)
          </label>
          {jobsLoading ? (
            <div className="text-xs text-gray-400 py-2">กำลังโหลดรายการซาก…</div>
          ) : (
            <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="">— ไม่ระบุ ScrapJob —</option>
              {scrapJobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.scrapItemDescription ?? `ScrapJob ${j.id.slice(0, 8)}`}
                  {j.conditionGrade ? ` (เกรด ${j.conditionGrade.replace("grade_", "")})` : ""}
                </option>
              ))}
            </select>
          )}
          {scrapJobs.length === 0 && !jobsLoading && (
            <p className="text-xs text-gray-400 mt-1">ไม่มี ScrapJob ที่พร้อม — สามารถเพิ่มอะไหล่โดยไม่ระบุซากได้</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่ออะไหล่ <span className="text-red-500">*</span>
          </label>
          <input type="text" value={partName}
            onChange={e => { setPartName(e.target.value); setFormErrors(f => ({ ...f, partName: "" })); }}
            placeholder="เช่น คอมเพรสเซอร์ Samsung 12000 BTU"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${formErrors.partName ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.partName && <p className="text-xs text-red-500 mt-1">{formErrors.partName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU <span className="text-red-500">*</span>
          </label>
          <input type="text" value={sku}
            onChange={e => { setSku(e.target.value); setFormErrors(f => ({ ...f, sku: "" })); }}
            placeholder="เช่น COMP-SAM-12K-USED"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 ${formErrors.sku ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.sku && <p className="text-xs text-red-500 mt-1">{formErrors.sku}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จำนวน <span className="text-red-500">*</span>
          </label>
          <input type="number" min={1} value={qty}
            onChange={e => { setQty(e.target.value); setFormErrors(f => ({ ...f, qty: "" })); }}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${formErrors.qty ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.qty && <p className="text-xs text-red-500 mt-1">{formErrors.qty}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม สภาพอะไหล่ที่แยกได้ ฯลฯ"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "🔧 บันทึกอะไหล่จากซาก"}
        </button>
      </form>
    </div>
  );
}
