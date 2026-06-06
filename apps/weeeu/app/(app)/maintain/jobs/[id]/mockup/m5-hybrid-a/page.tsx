"use client";
/**
 * MOCKUP — M5 Hybrid-A (WeeeU view): ปิดงาน → เปิดงานซ่อมใหม่ (เครื่องคนละตัว/ซ่อมแยก)
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M5 Hybrid-A: WeeeT ตรวจ → พบเสียหายต้องซ่อม → WeeeU ปิดงานล้าง → เปิดงานซ่อมใหม่
 *
 * Key design decision (M5 Hybrid-A):
 *   - เครื่องคนละตัว หรือ ต้องการ Repair case แยกต่างหาก
 *   - escrow ใหม่ / Repair case ใหม่ (ไม่ใช่ convert ใน maintain case เดิม)
 *   - WeeeU กด "เปิดงานซ่อมใหม่" → redirect ไป /repair/new?from=maintain&jobId={id}
 *
 * สิ่งที่เพิ่ม (delta จาก jobs/[id]/page.tsx เดิม):
 *  1. Banner "WeeeT พบความเสียหาย" — งานล้างต้องปิด
 *  2. สถานะ "closed_for_repair" — งานล้างปิด แต่ยังมี action ต่อ
 *  3. ปุ่ม "เปิดงานซ่อมใหม่" → /repair/new?from=maintain&jobId={id} (escrow ใหม่)
 *  4. ปุ่ม "ไม่ซ่อม — จบแค่นี้" → close case (งานจบ ไม่มี repair)
 *
 * mock-anno §5: มาจาก WeeeT /maintain/[id]/inspect (T-08) — ช่างกด "convert to repair"
 *               WeeeU ได้รับ notification → เข้าหน้า job detail (U-16) → เห็น banner M5
 * mock-anno §6: ปุ่ม "เปิดงานซ่อมใหม่" → /repair/new?from=maintain&jobId={id} (R1: REPAIR-NEW)
 *               ปุ่ม "ไม่ซ่อม" → /maintain/jobs (U-12)
 * mock-anno §8: WeeeR (R-14) เห็น job status "closed_for_repair" — งานล้างปิด
 *               WeeeT (T-08) เห็น "D-Maintain-2 ส่งข้อมูลแล้ว รอ WeeeU ดำเนินการ"
 *               Admin (A-07) สามารถดู job ทั้ง 2 ใน maintain + repair
 *
 * Maintain Gen 4 · 2026-06-05 · Mockup เคส M5 Hybrid-A WeeeU
 */

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import { MockAnnoBar } from "@/components/MockAnnoBar";

// ─── Sample data ───────────────────────────────────────────────────────────────
const MOCK_JOB = {
  id: "mock-m5-ha-001",
  serviceCode: "MTN-20260605-0051",
  applianceType: "WashingMachine" as const,
  cleaningType: "general" as const,
  status: "closed_for_repair" as const,
  scheduledAt: "2026-06-05T09:00:00+07:00",
  address: { address: "102 ซ.รามคำแหง 24 หัวหมาก กรุงเทพ 10240" },
  shopName: "ช่างเวิร์กช็อป 24",
  serviceCodeForRepair: "REP-20260605-0012", // จะถูกสร้างหลังกด
};

// ข้อมูลจาก WeeeT (D-Maintain-2)
const DAMAGE_REPORT = {
  reportedAt: "2026-06-05T09:47:00+07:00",
  technicianName: "ช่างวิชัย ช่างชำนาญ",
  issues: [
    {
      icon: "🔩",
      title: "ลูกปืนถังซักเสื่อม",
      detail: "เครื่องสั่นผิดปกติ — ลูกปืนถังเก่า ต้องถอดถัง + เปลี่ยนลูกปืน",
      needsRepair: true,
    },
    {
      icon: "💧",
      title: "ซีลประตูรั่ว",
      detail: "พบรอยแตกที่ซีลประตูด้านล่าง — ล้างแล้วน้ำจะยังรั่ว",
      needsRepair: true,
    },
  ],
  note: "ล้างได้ตามปกติ แต่ปัญหาซีลและลูกปืนต้องซ่อมแยก ไม่งั้นเครื่องพังเร็ว",
  photoCount: 5,
  estimatedRepairCost: "800–1,200 ฿",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type Stage = "view" | "done_repair" | "done_close";

export default function M5HybridAMockupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const job = MOCK_JOB;
  const [stage, setStage] = useState<Stage>("view");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setStage("done_close"); }, 800);
  };

  // ─── Success: เปิดงานซ่อมใหม่ ──────────────────────────────────────────────
  // หมายเหตุ: ปุ่ม "เปิดงานซ่อมใหม่" ใช้ Link ไป /repair/new (ไม่ใช่ setTimeout)

  // ─── Success: ไม่ซ่อม ──────────────────────────────────────────────────────
  if (stage === "done_close") {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* mock-anno §6 NAV: success → U-12 jobs list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-5xl">🔒</p>
          <h2 className="text-xl font-bold text-gray-900">ปิดงานล้างสำเร็จ</h2>
          <p className="text-sm text-gray-500">
            งาน {job.serviceCode} ปิดแล้ว — ไม่มีงานซ่อมต่อ
          </p>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2 border border-gray-100">
            ความเสียหายที่ WeeeT แจ้งถูกบันทึกไว้เป็นหลักฐาน — คุณสามารถเปิดงานซ่อมใหม่ได้ในภายหลังที่เมนู ซ่อมเครื่อง
          </p>
          <Link
            href="/maintain/jobs"
            className="block w-full text-center bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
          >
            กลับรายการงานบำรุง →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* mock-anno §5 back → U-16 */}
        <Link href={`/maintain/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">พบความเสียหาย — ต้องซ่อม</h1>
        <span className="ml-auto text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded">
          MOCKUP M5-HA
        </span>
      </div>

      {/* Job summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
        <p className="font-semibold text-gray-900">เครื่องซักผ้า 🫧 — ล้างทั่วไป</p>
        <p className="text-sm text-gray-500">{job.shopName}</p>
        <p className="text-xs font-mono text-gray-400">{job.serviceCode}</p>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 mt-1">
          🔒 ปิดงานล้าง — รอดำเนินการซ่อม
        </span>
      </div>

      {/* ─── Damage Report Banner (M5-HA core) ─── */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🔧</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900">ช่างพบความเสียหาย — งานล้างปิดแล้ว</p>
            <p className="text-xs text-red-700 mt-1">
              รายงานโดย {DAMAGE_REPORT.technicianName} · {fmt(DAMAGE_REPORT.reportedAt)}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              📷 หลักฐานรูป {DAMAGE_REPORT.photoCount} ภาพ
            </p>
          </div>
        </div>

        {/* Damage items */}
        <div className="space-y-2">
          {DAMAGE_REPORT.issues.map((issue, i) => (
            <div key={i} className="bg-white rounded-xl border border-red-100 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{issue.icon}</span>
                <p className="text-sm font-semibold text-gray-800">{issue.title}</p>
              </div>
              <p className="text-xs text-gray-600">{issue.detail}</p>
            </div>
          ))}
        </div>

        {/* Tech note + cost estimate */}
        <div className="bg-white/70 rounded-xl p-3 text-xs text-red-800 border border-red-100 space-y-1">
          <p>💬 {DAMAGE_REPORT.note}</p>
          <p className="text-gray-600 font-medium">
            ประมาณการค่าซ่อม: {DAMAGE_REPORT.estimatedRepairCost}
          </p>
        </div>
      </div>

      {/* ─── Cross-app note ─── */}
      {/* mock-anno §8: WeeeR + WeeeT เห็น status "closed_for_repair" */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-600">ข้ามแอพ 🔗</p>
        <p>• WeeeR: เห็นงานนี้ถูกปิด — สถานะ "ปิดงานล้าง"</p>
        <p>• WeeeT: งานล้างจบแล้ว — รออนุมัติจาก WeeeU สำหรับงานซ่อม (ถ้ามี)</p>
        <p>• Admin: เห็นทั้ง Maintain job + Repair job (ถ้าเปิด) ในแดชบอร์ด</p>
      </div>

      {/* ─── Decision: Hybrid-A Actions ─── */}
      <div className="space-y-3">
        {/* ปุ่มหลัก: เปิดงานซ่อมใหม่ */}
        {/* mock-anno §6: → /repair/new?from=maintain&jobId={id} */}
        <Link
          href={`/repair/new?from=maintain&jobId=${id}`}
          className="block w-full text-center bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-4 rounded-2xl text-sm transition-colors space-y-0.5"
        >
          <p>🔧 เปิดงานซ่อมใหม่</p>
          <p className="text-xs text-white/70">escrow ใหม่ · Repair case แยกต่างหาก</p>
        </Link>

        {/* ปุ่มรอง: ไม่ซ่อม จบแค่นี้ */}
        {/* mock-anno §6: → U-12 jobs list (after success) */}
        <button
          onClick={handleClose}
          disabled={submitting}
          className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 font-medium py-3.5 rounded-2xl text-sm transition-colors"
        >
          {submitting ? "⟳ กำลังปิด..." : "❌ ไม่ซ่อม — ปิดแค่นี้"}
        </button>
      </div>

      {/* Footnote */}
      <p className="text-[11px] text-gray-400 text-center pb-2">
        ถ้าเปิดงานซ่อมใหม่ — Repair case ใหม่แยกอิสระ · พอยต์ทองใหม่ · ร้านซ่อมอาจเป็นคนละร้านกับช่างล้าง
      </p>

      <MockAnnoBar
        caseId="M5-HA"
        screenId="U-16/m5"
        origin="T-08 MAINTAIN-INSPECT (WeeeT กด convert to repair, D-Maintain-2)"
        nav={[
          { label: "เปิดงานซ่อมใหม่", dest: "/repair/new?from=maintain&jobId={id}" },
          { label: "ไม่ซ่อม", dest: "U-12 /maintain/jobs" },
        ]}
        crossApp={[
          { app: "WeeeR", desc: "closed_for_repair (R-14)" },
          { app: "WeeeT", desc: "รอ WeeeU ดำเนินการ" },
          { app: "Admin", desc: "maintain+repair jobs (A-07)" },
        ]}
      />
    </div>
  );
}
