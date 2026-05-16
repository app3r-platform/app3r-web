// ── listings/repair/[id]/page.tsx — WeeeR Repair Job Detail (Sub-1 D4) ────────
// D4: WeeeR เห็น full job ทุก field รวม sensitive fields
// Server Component — session check บน server (Protocol ข้อ 5)
// Source: mock data (Backend endpoint ขาด sensitive fields — Phase D)
// TODO: connect real Backend endpoint when sensitive fields added to DB schema

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getRepairJobById } from "../../../../../lib/mock-data/repair-jobs";
import {
  getMockWeeeRSession,
} from "../../../../../lib/mock-data/weeer-profile";
import {
  SERVICE_TYPE_LABEL,
} from "../../../../../lib/types/listings-jobs";
import AcceptJobButton from "../../_components/AcceptJobButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RepairDetailPage({ params }: Props) {
  const { id } = await params;

  // ── Server-side session check (Protocol ข้อ 5) ───────────────────────────────
  // TODO: connect real Backend endpoint when sensitive fields added to DB schema
  // TODO: replace getMockWeeeRSession() with real session validation (JWT/cookie)
  const session = getMockWeeeRSession();
  if (!session) {
    // Non-WeeeR: friendly redirect (Protocol ข้อ 8)
    redirect("/login?reason=weeer-required&from=/listings/repair/" + id);
  }

  // ── Load job ─────────────────────────────────────────────────────────────────
  const job = getRepairJobById(id);
  if (!job) notFound();

  const serviceLabel = SERVICE_TYPE_LABEL[job.serviceType];
  const postedDate = new Date(job.postedAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Back nav */}
      <Link href="/listings/repair" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
        ← กลับรายการงานซ่อม
      </Link>

      {/* Mock data notice */}
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        ⚙️ ข้อมูลตัวอย่าง (Phase D) — sensitive fields จะเชื่อม Backend เมื่อ DB schema พร้อม
        {/* TODO: connect real Backend endpoint when sensitive fields added to DB schema */}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                🔧 ซ่อม
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {job.applianceType}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                {serviceLabel}
              </span>
              {job.featured && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  ⭐ แนะนำ
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-gray-900">{job.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
              <span>📍 {job.area}</span>
              <span>📅 {postedDate}</span>
              <span className="font-mono text-gray-300">#{job.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      {job.photos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">📷 รูปภาพ</h2>
          <div className="grid grid-cols-2 gap-2">
            {job.photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`รูปที่ ${i + 1}`}
                className="w-full aspect-[4/3] object-cover rounded-xl bg-gray-100"
              />
            ))}
          </div>
        </div>
      )}

      {/* Problem description (sensitive field) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">📝 อาการปัญหา</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{job.problemDescription}</p>
      </div>

      {/* Budget & Fee (sensitive field) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">💰 งบประมาณ & ค่าบริการ</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">งบประมาณลูกค้า</div>
            <div className="text-xl font-bold text-green-700">{job.estimatedBudget.toLocaleString()} ฿</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">ค่าบริการ App3R (5%)</div>
            <div className="text-xl font-bold text-blue-700">{job.feePreview} pts</div>
          </div>
        </div>
      </div>

      {/* Customer info (sensitive field — Phase D placeholder) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">👤 ข้อมูลลูกค้า</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm shrink-0">👤</div>
            <div>
              <div className="text-xs text-gray-400">ชื่อลูกค้า</div>
              <div className="text-sm text-gray-800 font-medium">{job.customerName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm shrink-0">📱</div>
            <div>
              <div className="text-xs text-gray-400">เบอร์โทรศัพท์</div>
              <div className="text-sm text-gray-800 font-medium">{job.customerPhone}</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-3">
          * ชื่อและเบอร์จริงจะแสดงเมื่อ admin อนุมัติ match (Phase D+)
        </p>
      </div>

      {/* Action */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">🎯 รับงานนี้</h2>
        <p className="text-xs text-gray-500 mb-4">
          กดปุ่มด้านล่างเพื่อแสดงความสนใจรับงาน — ระบบจะแจ้งลูกค้าและ admin ดำเนินการ match
        </p>
        <AcceptJobButton jobId={job.id} />
      </div>
    </div>
  );
}
