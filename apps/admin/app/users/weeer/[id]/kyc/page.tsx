"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface KYCDoc {
  id:            string;
  document_type: "id_card" | "business_license" | "tax_id" | "bank_account" | "shop_photo" | "other";
  file_url:      string;
  file_type:     "image" | "pdf";
  status:        "pending" | "ok" | "issue";
  reviewed_at:   string | null;
}

interface KYCApplication {
  user_id:              number;
  user_name:            string;
  phone:                string;
  overall_status:       "pending" | "reviewing" | "approved" | "rejected" | "additional_required";
  documents:            KYCDoc[];
  is_registered_business: boolean;
  business_type?:       string | null;
  shop_name?:           string | null;
}

interface HistoryEntry {
  id:          string;
  created_at:  string;
  admin_name:  string;
  from_status: string;
  to_status:   string;
  reason:      string | null;
}

/* ─────────────────────────────────────────────
   Config
───────────────────────────────────────────── */
const DOC_LABELS: Record<string, string> = {
  id_card:          "บัตรประชาชน",
  business_license: "หนังสือรับรองบริษัท",
  tax_id:           "ใบทะเบียนภาษี (ภ.พ.20)",
  bank_account:     "สมุดบัญชีธนาคาร",
  shop_photo:       "รูปหน้าร้าน",
  other:            "อื่นๆ",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  pending:             { label: "รอตรวจ",        color: "bg-yellow-50 text-yellow-700",  border: "border-yellow-200" },
  reviewing:           { label: "กำลังตรวจ",      color: "bg-blue-50 text-blue-700",      border: "border-blue-200" },
  approved:            { label: "อนุมัติแล้ว",    color: "bg-green-50 text-green-700",    border: "border-green-200" },
  rejected:            { label: "ปฏิเสธ",         color: "bg-red-50 text-red-700",        border: "border-red-200" },
  additional_required: { label: "ขอเอกสารเพิ่ม",  color: "bg-orange-50 text-orange-700",  border: "border-orange-200" },
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function KYCReviewPage() {
  const params   = useParams();
  const userId   = params.id as string;
  const router   = useRouter();
  const isSuper  = isSuperAdmin();

  const [app,      setApp]      = useState<KYCApplication | null>(null);
  const [history,  setHistory]  = useState<HistoryEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activeDoc,setActiveDoc]= useState<KYCDoc | null>(null);

  /* review form */
  const [newStatus,      setNewStatus]      = useState<string>("");
  const [reason,         setReason]         = useState("");
  const [additionalDocs, setAdditionalDocs] = useState<string[]>([]);

  /* checklist */
  const [checks, setChecks] = useState({
    id_match:  false,
    id_clear:  false,
    bank_match:false,
    shop_sign: false,
    biz_cert:  false,
  });

  /* modals / feedback */
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [toast,            setToast]            = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [appData, histData] = await Promise.all([
        api.get<KYCApplication>(`/admin/weeer/${userId}/kyc`),
        api.get<{ items: HistoryEntry[] }>(`/admin/users/${userId}/kyc/history`),
      ]);
      setApp(appData);
      setHistory(histData.items);
      if (appData.documents.length > 0) setActiveDoc(appData.documents[0]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  /* ── Actions ── */
  async function handleApprove() {
    setSubmitting(true);
    try {
      // POST approve → backend triggers:
      //   1. WeeeR: awaiting-approval → active
      //   2. auto-create WeeeT default account
      await api.post(`/admin/weeer/${userId}/kyc/approve`, {});
      showToast("✅ อนุมัติ KYC สำเร็จ — WeeeR active + WeeeT account สร้างแล้ว");
      setShowApproveModal(false);
      fetchData();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus() {
    if (!newStatus) return;
    if (["rejected", "additional_required"].includes(newStatus) && reason.length < 20) return;
    setSubmitting(true);
    try {
      if (newStatus === "additional_required") {
        await api.post(`/admin/weeer/${userId}/kyc/request-additional`, {
          reason,
          additional_documents: additionalDocs,
        });
      } else {
        await api.patch(`/admin/weeer/${userId}/kyc/status`, {
          status: newStatus,
          reason: reason || undefined,
        });
      }
      showToast("✅ อัพเดตสถานะสำเร็จ");
      setNewStatus(""); setReason(""); setAdditionalDocs([]);
      fetchData();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRestore() {
    if (!isSuper) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/weeer/${userId}/kyc/restore`, {});
      showToast("✅ Restore จาก archive สำเร็จ");
      fetchData();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Render: loading ── */
  if (loading) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (!app) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <p className="text-red-600">ไม่พบข้อมูล KYC</p>
        <Link href="/kyc" className="text-admin-primary hover:text-admin-dark text-sm mt-2 inline-block">
          ← กลับ KYC Queue
        </Link>
      </main>
    </div>
  );

  const sc = STATUS_CONFIG[app.overall_status];
  const allChecked = Object.values(checks).filter(Boolean).length;
  const totalChecks = app.is_registered_business ? 5 : 4;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/kyc" className="hover:text-admin-primary transition-colors">KYC Queue</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 font-medium">{app.user_name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{app.user_name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${sc.color} ${sc.border}`}>
              {sc.label}
            </span>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
              WeeeR
            </span>
            {app.shop_name && (
              <span className="text-xs text-gray-500">🏪 {app.shop_name}</span>
            )}
            {app.is_registered_business && (
              <span className="text-xs bg-admin-surface text-admin-primary border border-admin-primary/30 px-2 py-0.5 rounded-full">
                นิติบุคคล
              </span>
            )}
          </div>
          <Link href={`/users?id=${userId}`}
            className="text-xs text-admin-primary hover:text-admin-dark transition-colors border border-admin-primary/30 px-3 py-1.5 rounded-lg">
            ดู User Profile →
          </Link>
        </div>

        {/* Checklist progress */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 mb-5 shadow-sm flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-admin-primary rounded-full transition-all"
                style={{ width: `${(allChecked / totalChecks) * 100}%` }} />
            </div>
          </div>
          <p className="text-sm text-gray-600 shrink-0">
            Checklist: <strong className="text-admin-primary">{allChecked}/{totalChecks}</strong>
          </p>
          {allChecked === totalChecks && (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg">
              ✓ ครบทุกรายการ
            </span>
          )}
        </div>

        {/* ── R-03 2-Column Layout ── */}
        <div className="grid grid-cols-5 gap-5">

          {/* ══ Left Panel (60%) — Document Preview ══ */}
          <div className="col-span-3 space-y-4">

            {/* 6 Doc Tabs */}
            <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm">
              {app.documents.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-gray-400">ไม่มีเอกสาร</p>
              ) : app.documents.map((doc) => (
                <button key={doc.id} onClick={() => setActiveDoc(doc)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeDoc?.id === doc.id
                      ? "bg-admin-surface text-admin-primary"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}>
                  {DOC_LABELS[doc.document_type] ?? doc.document_type}
                  {doc.status === "ok"    && <span className="text-green-600 ml-0.5">✓</span>}
                  {doc.status === "issue" && <span className="text-red-600 ml-0.5">!</span>}
                  {doc.status === "pending" && <span className="text-gray-400 ml-0.5">○</span>}
                </button>
              ))}
            </div>

            {/* Document Preview (PDF.js / Image — D24 Signed URL TTL 1h) */}
            {activeDoc ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {DOC_LABELS[activeDoc.document_type]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeDoc.status === "ok"    ? "bg-green-50 text-green-700" :
                      activeDoc.status === "issue" ? "bg-red-50 text-red-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {activeDoc.status === "ok" ? "✓ ผ่าน" : activeDoc.status === "issue" ? "มีปัญหา" : "ยังไม่ตรวจ"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      🔒 Signed URL · TTL 1 ชม.
                    </span>
                    <a href={activeDoc.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-admin-primary hover:text-admin-dark transition-colors border border-admin-primary/30 px-2 py-1 rounded-lg">
                      📥 ดาวน์โหลด
                    </a>
                  </div>
                </div>
                <div className="bg-gray-50 min-h-[460px] flex items-center justify-center">
                  {activeDoc.file_type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeDoc.file_url}
                      alt={DOC_LABELS[activeDoc.document_type]}
                      className="max-w-full max-h-[460px] object-contain p-2"
                    />
                  ) : (
                    /* PDF.js via browser iframe */
                    <object
                      data={activeDoc.file_url}
                      type="application/pdf"
                      className="w-full h-[460px]"
                      aria-label={DOC_LABELS[activeDoc.document_type]}
                    >
                      <iframe
                        src={activeDoc.file_url}
                        className="w-full h-[460px] border-0"
                        title={DOC_LABELS[activeDoc.document_type]}
                      />
                    </object>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center text-gray-400">
                ไม่มีเอกสาร
              </div>
            )}
          </div>

          {/* ══ Right Panel (40%) — Review ══ */}
          <div className="col-span-2 space-y-4">

            {/* Section 1: Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">☑️ Checklist ตรวจสอบ</h3>
              <div className="space-y-2.5">
                {[
                  { key: "id_match"  as const, label: "บัตรประชาชนตรงกับชื่อ-สกุลที่ลงทะเบียน" },
                  { key: "id_clear"  as const, label: "รูปบัตรชัดเจน ไม่มีการปลอมแปลง" },
                  { key: "bank_match"as const, label: "เลขบัญชีธนาคารตรงกับชื่อบัญชี" },
                  { key: "shop_sign" as const, label: "รูปหน้าร้านมีป้ายชื่อร้านชัดเจน" },
                  ...(app.is_registered_business
                    ? [{ key: "biz_cert" as const, label: "หนังสือรับรองบริษัท ไม่เกิน 6 เดือน" }]
                    : []),
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checks[item.key]}
                      onChange={(e) => setChecks({ ...checks, [item.key]: e.target.checked })}
                      className="w-4 h-4 rounded accent-admin-primary"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section 2: Change Status */}
            {app.overall_status !== "approved" && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">📋 เปลี่ยนสถานะ</h3>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-admin-primary mb-3"
                >
                  <option value="">— เลือกสถานะ —</option>
                  <option value="reviewing">กำลังตรวจสอบ</option>
                  <option value="rejected">ปฏิเสธ</option>
                  <option value="additional_required">ขอเอกสารเพิ่มเติม</option>
                </select>

                {["rejected", "additional_required"].includes(newStatus) && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">เหตุผล (≥ 20 ตัวอักษร) *</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-admin-primary resize-none"
                      placeholder="ระบุเหตุผลโดยละเอียด..."
                    />
                    <p className="text-xs text-gray-400 mt-0.5">{reason.length}/20+ ตัวอักษร</p>
                  </div>
                )}

                {newStatus === "additional_required" && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1.5 block">เอกสารที่ต้องการเพิ่มเติม</label>
                    <div className="space-y-1.5 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      {Object.entries(DOC_LABELS).map(([k, v]) => (
                        <label key={k} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={additionalDocs.includes(k)}
                            onChange={(e) => setAdditionalDocs(
                              e.target.checked
                                ? [...additionalDocs, k]
                                : additionalDocs.filter((d) => d !== k)
                            )}
                            className="w-3.5 h-3.5 rounded accent-admin-primary"
                          />
                          <span className="text-xs text-gray-700">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {newStatus && newStatus !== "reviewing" && (
                  <button
                    onClick={handleUpdateStatus}
                    disabled={submitting || (["rejected", "additional_required"].includes(newStatus) && reason.length < 20)}
                    className="w-full py-2 bg-admin-primary hover:bg-admin-dark disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    {submitting ? "กำลังบันทึก..." : "บันทึกสถานะ"}
                  </button>
                )}
                {newStatus === "reviewing" && (
                  <button
                    onClick={handleUpdateStatus}
                    disabled={submitting}
                    className="w-full py-2 bg-admin-primary hover:bg-admin-dark disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    {submitting ? "กำลังบันทึก..." : "เปลี่ยนเป็น “กำลังตรวจ”"}
                  </button>
                )}
              </div>
            )}

            {/* Section 3: History Log */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">📜 History Log</h3>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">ยังไม่มีประวัติ</p>
                ) : history.map((h) => (
                  <div key={h.id} className="text-xs border border-gray-100 rounded-lg p-2.5 space-y-1 bg-gray-50">
                    <div className="flex justify-between text-gray-400">
                      <span>{new Date(h.created_at).toLocaleString("th-TH")}</span>
                      <span className="font-medium text-gray-600">{h.admin_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500">{STATUS_CONFIG[h.from_status]?.label ?? h.from_status}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-admin-primary font-semibold">
                        {STATUS_CONFIG[h.to_status]?.label ?? h.to_status}
                      </span>
                    </div>
                    {h.reason && <p className="text-gray-500 truncate">{h.reason}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Action Buttons */}
            <div className="space-y-2">
              {app.overall_status !== "approved" && app.overall_status !== "rejected" && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="w-full py-2.5 bg-brand-success hover:bg-brand-success/90 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm"
                >
                  ✅ อนุมัติ KYC + สร้าง WeeeT Account
                </button>
              )}
              {app.overall_status === "approved" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 text-center">
                  ✅ KYC อนุมัติแล้ว — WeeeR active · WeeeT account พร้อมใช้งาน
                </div>
              )}
              {isSuper && (
                <button
                  onClick={handleRestore}
                  disabled={submitting}
                  className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-sm text-gray-600 transition-colors disabled:opacity-40"
                >
                  🔄 Restore from Archive (Super Admin)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Approve Confirm Modal ── */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowApproveModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}>

              <h3 className="text-lg font-bold mb-1 text-gray-900">✅ ยืนยันอนุมัติ KYC</h3>
              <p className="text-xs text-gray-500 mb-4">ผลลัพธ์ที่จะเกิดขึ้นหลังอนุมัติ</p>

              <div className="space-y-3 mb-5">
                {/* WeeeR activation */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-green-700 mb-1.5">🏪 WeeeR — Status Update</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 text-xs px-2 py-0.5 bg-yellow-50 border border-yellow-200 rounded">awaiting-approval</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-green-50 border border-green-300 text-green-700 rounded">active ✓</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1.5">
                    <strong>{app.user_name}</strong> (#{app.user_id}) · {app.phone}
                  </p>
                </div>

                {/* WeeeT auto-creation */}
                <div className="bg-admin-surface border border-admin-primary/20 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-admin-primary mb-1.5">🔧 WeeeT — สร้างบัญชีอัตโนมัติ</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ชื่อผู้ใช้</span>
                      <span className="font-mono text-admin-primary">{app.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">รหัสผ่านเริ่มต้น</span>
                      <span className="text-gray-500">[เหมือน WeeeR]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mode</span>
                      <span>1 ตัวฟรี (auto)</span>
                    </div>
                  </div>
                </div>

                {/* Note D16 */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                  ⚠️ WeeeR ต้องแจ้ง credentials ให้ช่างเอง (ไม่มีระบบ SMS)
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowApproveModal(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors">
                  ยกเลิก
                </button>
                <button onClick={handleApprove} disabled={submitting}
                  className="flex-1 py-2.5 bg-brand-success hover:bg-brand-success/90 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-colors">
                  {submitting ? "กำลังดำเนินการ..." : "ยืนยันอนุมัติ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm shadow-xl text-gray-900 z-50">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
