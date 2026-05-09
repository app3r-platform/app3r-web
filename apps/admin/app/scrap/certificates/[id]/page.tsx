"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { EWasteCertificate } from "@/lib/types";

const STATUS_META: Record<EWasteCertificate["status"], { label: string; color: string }> = {
  pending:  { label: "รอออกใบรับรอง", color: "bg-yellow-900/50 text-yellow-400" },
  issued:   { label: "ออกแล้ว",       color: "bg-green-900/50 text-green-400" },
  rejected: { label: "ปฏิเสธ",        color: "bg-red-900/50 text-red-400" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-100">{value}</span>
    </div>
  );
}

function generateCertHtml(cert: EWasteCertificate): string {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-Waste Certificate — ${cert.certNumber}</title>
  <style>
    body { font-family: 'Sarabun', sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
    .cert { max-width: 800px; margin: 0 auto; background: white; border: 3px solid #2d7a2d; border-radius: 12px; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 48px; margin-bottom: 8px; }
    h1 { color: #1a5c1a; font-size: 28px; margin: 0 0 4px; }
    .subtitle { color: #555; font-size: 14px; }
    .cert-number { background: #e8f5e9; border: 1px solid #2d7a2d; border-radius: 8px; padding: 12px 24px; display: inline-block; margin: 16px 0; color: #1a5c1a; font-weight: bold; font-size: 18px; letter-spacing: 2px; }
    .section { margin: 24px 0; }
    .section h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; font-size: 15px; }
    .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
    .label { color: #666; width: 180px; flex-shrink: 0; }
    .value { color: #222; font-weight: 500; }
    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
    .seal { font-size: 64px; display: block; margin: 16px auto; }
    .note { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #856404; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <div class="logo">♻️</div>
      <h1>ใบรับรองการกำจัดซากอิเล็กทรอนิกส์</h1>
      <p class="subtitle">E-Waste Disposal Certificate — App3R Platform</p>
      <div class="cert-number">${cert.certNumber}</div>
    </div>

    <div class="section">
      <h3>ข้อมูลใบรับรอง</h3>
      <div class="row"><span class="label">เลขที่ใบรับรอง</span><span class="value">${cert.certNumber}</span></div>
      <div class="row"><span class="label">วันที่ออก</span><span class="value">${issuedDate}</span></div>
      <div class="row"><span class="label">ออกโดย</span><span class="value">${cert.issuedById}</span></div>
      <div class="row"><span class="label">Scrap Job</span><span class="value">${cert.scrapJobId}</span></div>
    </div>

    <div class="section">
      <h3>รายละเอียดสิ่งของ</h3>
      <div class="row"><span class="label">คำอธิบาย</span><span class="value">${cert.itemDescription}</span></div>
    </div>

    <span class="seal">🏅</span>

    <div class="footer">
      <p>ใบรับรองนี้ออกโดยระบบ App3R Platform</p>
      <p>เพื่อรับรองว่าได้ดำเนินการกำจัดซากเครื่องใช้ไฟฟ้าอย่างถูกต้องตามหลักสิ่งแวดล้อม</p>
      <p style="margin-top: 8px; color: #bbb;">⚠️ ใบรับรองนี้เป็น HTML Mock — ระบบ PDF จะพัฒนาใน Phase D</p>
    </div>

    <div class="note">
      ⚠️ นี่คือเอกสารจาก App3R Admin (HTML Preview) — ยังไม่ใช่ PDF อย่างเป็นทางการ การออก PDF จะพัฒนาใน Phase D
    </div>
  </div>
</body>
</html>`;
}

export default function CertificateDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [cert, setCert] = useState<EWasteCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"issue" | "reject" | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchCert = useCallback(async () => {
    try {
      const d = await api.get<EWasteCertificate>(`/admin/scrap/certificates/${id}/`);
      setCert(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchCert();
  }, [router, fetchCert]);

  async function handleIssue() {
    setActionLoading("issue");
    try {
      await api.patch(`/admin/scrap/certificates/${id}/issue/`, {});
      await fetchCert();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    setActionLoading("reject");
    try {
      await api.patch(`/admin/scrap/certificates/${id}/reject/`, { note: rejectNote });
      setShowRejectForm(false);
      setRejectNote("");
      await fetchCert();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  function handleDownload() {
    if (!cert) return;
    const html = generateCertHtml(cert);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cert-${cert.certNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !cert) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          {error ?? "ยังไม่มีข้อมูลใบรับรอง"}
        </div>
        <Link href="/scrap/certificates" className="text-sm text-blue-400 hover:text-blue-300">← Certificates</Link>
      </main>
    </div>
  );

  const sm = STATUS_META[cert.status];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">📜 Certificate</h1>
              <span className={`text-sm px-2.5 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            </div>
            <p className="text-purple-400 text-sm font-mono font-bold">{cert.certNumber}</p>
          </div>
          <Link href="/scrap/certificates"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Certificates
          </Link>
        </div>

        {/* Cert info */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ข้อมูลใบรับรอง</h2>
          <InfoRow label="เลขที่ใบรับรอง" value={<span className="font-mono text-purple-400">{cert.certNumber}</span>} />
          <InfoRow label="Scrap Job" value={
            <Link href={`/scrap/jobs/${cert.scrapJobId}`}
              className="font-mono text-xs text-blue-400 hover:text-blue-300">
              {cert.scrapJobId} ↗
            </Link>
          } />
          <InfoRow label="คำอธิบายสิ่งของ" value={cert.itemDescription} />
          <InfoRow label="ออกโดย" value={<span className="font-mono text-xs">{cert.issuedById}</span>} />
          <InfoRow label="วันที่ออก" value={new Date(cert.issuedAt).toLocaleString("th-TH")} />
          <InfoRow label="สถานะ" value={
            <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
          } />
        </section>

        {/* HTML Preview */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              HTML Preview
            </h2>
            <button onClick={handleDownload}
              className="px-3 py-1.5 text-xs bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700 text-purple-300 rounded-lg transition-colors flex items-center gap-1.5">
              ⬇️ ดาวน์โหลด .html
            </button>
          </div>
          <div className="bg-white rounded-lg overflow-hidden border border-gray-700" style={{ height: "400px" }}>
            <iframe
              srcDoc={generateCertHtml(cert)}
              className="w-full h-full border-0"
              title={`E-Waste Certificate ${cert.certNumber}`}
              sandbox="allow-same-origin"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            ⚠️ HTML Mock — ระบบ PDF จะพัฒนาใน Phase D
          </p>
        </section>

        {/* Actions (pending only) */}
        {cert.status === "pending" && (
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              จัดการใบรับรอง
            </h2>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleIssue} disabled={actionLoading !== null}
                className="px-5 py-2.5 text-sm bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
                {actionLoading === "issue" ? "กำลังออก..." : "✅ ออกใบรับรอง (Issue)"}
              </button>
              <button onClick={() => setShowRejectForm(v => !v)} disabled={actionLoading !== null}
                className="px-5 py-2.5 text-sm bg-red-900/50 hover:bg-red-800/50 border border-red-800 text-red-400 rounded-lg transition-colors">
                ❌ ปฏิเสธ (Reject)
              </button>
            </div>
            {showRejectForm && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="เหตุผลที่ปฏิเสธ..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-600 resize-none"
                />
                <div className="flex gap-3">
                  <button onClick={handleReject} disabled={actionLoading !== null || !rejectNote.trim()}
                    className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg">
                    {actionLoading === "reject" ? "กำลังปฏิเสธ..." : "ยืนยันปฏิเสธ"}
                  </button>
                  <button onClick={() => { setShowRejectForm(false); setRejectNote(""); }}
                    className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg">
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </section>
        )}

        {/* Already issued — download only */}
        {cert.status === "issued" && (
          <div className="flex gap-3">
            <button onClick={handleDownload}
              className="px-4 py-2 text-sm bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700 text-purple-300 rounded-lg transition-colors">
              ⬇️ ดาวน์โหลดใบรับรอง (.html)
            </button>
            <Link href={`/scrap/jobs/${cert.scrapJobId}`}
              className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              🔨 ดู Scrap Job →
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
