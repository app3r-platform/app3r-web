"use client";

// ── WeeeR Scrap R-28e — dispose (S4 รีไซเคิล/E-Waste cert) ───────────────────

import { use, useEffect, useState } from "react";
import { MockAnnoOrigin, MockAnnoXApp } from "@/components/MockAnno";
import Link from "next/link";
import { scrapApi } from "../../../_lib/api";
import type { ScrapJob, EWasteCertificate } from "../../../_lib/types";

// ── MOCK_JOB — hardcoded fallback สำหรับ dev (ใช้เมื่อ API ไม่ตอบ) ──────────
const MOCK_JOB: ScrapJob = {
  id: "SJ003",
  scrapItemId: "SC003",
  buyerId: "S1",
  buyerType: "WeeeR",
  decision: "dispose",
  status: "in_progress",
  createdAt: "2026-05-18T10:00:00+07:00",
  updatedAt: "2026-05-24T10:00:00+07:00",
  scrapItemDescription: "ตู้เย็น LG GN-B202SQBB ทิ้งซาก",
  conditionGrade: "grade_C",
};

export default function DisposePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<ScrapJob | null>(null);
  const [cert, setCert] = useState<EWasteCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    scrapApi.getJob(id)
      .then(j => {
        setJob(j);
        setItemDescription(j.scrapItemDescription ?? "");
        // If already has certificate, fetch it
        if (j.certificateId) {
          return scrapApi.getCertificate(id).then(setCert);
        }
      })
      .catch(() => {
        // DEV fallback: API ไม่ตอบ → ใช้ MOCK_JOB แทน (ไม่แสดง error)
        setJob(MOCK_JOB);
        setItemDescription(MOCK_JOB.scrapItemDescription ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!itemDescription.trim()) { setSubmitError("กรุณาระบุรายละเอียดสิ่งของ"); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const newCert = await scrapApi.submitDispose(id, { itemDescription: itemDescription.trim() });
      setCert(newCert);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!cert) return;
    const html = generateCertHtml(cert);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ewaste-cert-${cert.certNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;

  return (
    <div className="space-y-5 max-w-xl">
      {/* §5 Origin + §8 Cross-app annotations */}
      <MockAnnoOrigin from='◀ มาจาก: R-28 · /scrap/jobs/[id] (เลือก "รีไซเคิล")' />
      <MockAnnoXApp screenLabel="R-28e: รีไซเคิล/E-Waste cert">
        <p>• <strong>Admin :3000</strong> [A-11] Admin เห็น cert ใหม่ใน Scrap Certificates list
          <a href="http://localhost:3000/scrap/certificates" className="underline ml-1">/scrap/certificates</a>
        </p>
        <p>• <strong>WeeeU :3002</strong> [U-32] เจ้าของซากเห็น cert จาก WeeeR (E-Waste ที่เคยทิ้ง)
          <a href="http://localhost:3002/scrap/SC003/certificate" className="underline ml-1">/scrap/[id]/certificate</a>
        </p>
        <p>• หลัง submit → cert แสดงในหน้าเดิม (ไม่ navigate ออก) + ปุ่มดาวน์โหลด HTML</p>
      </MockAnnoXApp>

      <div className="flex items-center gap-3">
        <Link href={`/scrap/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">♻️ รีไซเคิล / ทำลาย</h1>
      </div>

      {job && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          ซาก: {job.scrapItemDescription ?? job.scrapItemId}
        </div>
      )}

      {!cert ? (
        <>
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-500 font-medium">ข้อมูลสำหรับออกใบรับรอง e-Waste</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">รายละเอียดสิ่งของ <span className="text-red-400">*</span></label>
              <textarea value={itemDescription} onChange={e => setItemDescription(e.target.value)} rows={3}
                placeholder="เช่น เครื่องปรับอากาศ Mitsubishi 1 ตัน สภาพชำรุด..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ ใบรับรองนี้เป็น mock HTML — ใช้สำหรับบันทึกภายในเท่านั้น (C-3.2)
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm">{submitError}</div>
          )}

          <div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
                ${submitting ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#FF663A] hover:bg-[#F04E20] text-white"}`}>
              {submitting ? "กำลังออกใบรับรอง…" : "✅ ออกใบรับรองการทำลาย"}
            </button>
            {/* §6 Nav annotation */}
            <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-1">→ cert แสดงในหน้าเดิม (ไม่ navigate) + ดาวน์โหลด HTML | Admin A-11 รับ cert</p>
          </div>
        </>
      ) : (
        <>
          {/* Certificate preview */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">✅</span>
              <p className="font-semibold text-green-800">ออกใบรับรองแล้ว</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400">เลขที่ใบรับรอง</p>
                <p className="font-mono font-medium text-gray-800">{cert.certNumber}</p>
              </div>
              <div>
                <p className="text-gray-400">วันที่ออก</p>
                <p className="text-gray-800">
                  {new Date(cert.issuedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="text-xs">
              <p className="text-gray-400">รายละเอียดสิ่งของ</p>
              <p className="text-gray-700">{cert.itemDescription}</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-[#FF663A] hover:bg-[#F04E20] text-white transition-colors">
            ⬇️ ดาวน์โหลดใบรับรอง (HTML)
          </button>
        </>
      )}
    </div>
  );
}

function generateCertHtml(cert: EWasteCertificate): string {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบรับรองการทำลายซากอิเล็กทรอนิกส์</title>
  <style>
    body { font-family: 'Sarabun', sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 2px solid #FF663A; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: bold; color: #FF663A; margin: 8px 0; }
    .sub { font-size: 13px; color: #666; }
    .cert-no { font-size: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 16px; display: inline-block; font-family: monospace; color: #166534; margin: 12px 0; }
    .row { display: flex; gap: 16px; margin: 12px 0; }
    .col { flex: 1; }
    .label { font-size: 11px; color: #888; margin-bottom: 2px; }
    .value { font-size: 14px; font-weight: 500; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #9ca3af; text-align: center; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 999px; padding: 4px 14px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size:32px">♻️</div>
    <div class="title">ใบรับรองการทำลายซากอิเล็กทรอนิกส์</div>
    <div class="sub">App3R Platform — WeeeR e-Waste Certificate</div>
    <div class="cert-no">เลขที่: ${cert.certNumber}</div>
    <div class="badge">✅ ออกแล้ว</div>
  </div>

  <div class="row">
    <div class="col">
      <div class="label">วันที่ออกใบรับรอง</div>
      <div class="value">${issuedDate}</div>
    </div>
    <div class="col">
      <div class="label">ScrapJob ID</div>
      <div class="value" style="font-family:monospace;font-size:12px">${cert.scrapJobId}</div>
    </div>
  </div>

  <div style="margin:16px 0;">
    <div class="label">รายละเอียดสิ่งของที่ทำลาย</div>
    <div class="value" style="margin-top:4px;padding:12px;background:#f9fafb;border-radius:8px;">${cert.itemDescription}</div>
  </div>

  <div class="footer">
    เอกสารนี้ออกโดยระบบ App3R Platform (WeeeR) — เวอร์ชัน C-3.2 Mock Certificate
    <br/>ใช้สำหรับบันทึกภายในเท่านั้น ไม่ใช่เอกสารราชการ
  </div>
</body>
</html>`;
}
