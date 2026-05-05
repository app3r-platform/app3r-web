"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface KYCDoc {
  id: string;
  document_type: "id_card" | "business_license" | "tax_id" | "bank_account" | "shop_photo" | "other";
  file_url: string;
  file_type: "image" | "pdf";
  status: "pending" | "ok" | "issue";
  reviewed_at: string | null;
}
interface KYCApplication {
  user_id: number;
  user_name: string;
  phone: string;
  overall_status: "pending" | "reviewing" | "approved" | "rejected" | "additional_required";
  documents: KYCDoc[];
  is_registered_business: boolean;
}
interface HistoryEntry {
  id: string;
  created_at: string;
  admin_name: string;
  from_status: string;
  to_status: string;
  reason: string | null;
}

const DOC_LABELS: Record<string, string> = {
  id_card:          "บัตรประชาชน",
  business_license: "หนังสือรับรองบริษัท",
  tax_id:           "ใบทะเบียนภาษี",
  bank_account:     "สมุดบัญชีธนาคาร",
  shop_photo:       "รูปหน้าร้าน",
  other:            "อื่นๆ",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:             { label: "รอตรวจ",        color: "bg-yellow-900/50 text-yellow-400" },
  reviewing:           { label: "กำลังตรวจ",      color: "bg-blue-900/50 text-blue-400" },
  approved:            { label: "อนุมัติแล้ว",    color: "bg-green-900/50 text-green-400" },
  rejected:            { label: "ปฏิเสธ",         color: "bg-red-900/50 text-red-400" },
  additional_required: { label: "ขอเอกสารเพิ่ม",  color: "bg-orange-900/50 text-orange-400" },
};

export default function KYCReviewPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const isSuper = isSuperAdmin();

  const [app, setApp] = useState<KYCApplication | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState<KYCDoc | null>(null);

  // Review form state
  const [newStatus, setNewStatus] = useState<string>("");
  const [reason, setReason] = useState("");
  const [additionalDocs, setAdditionalDocs] = useState<string[]>([]);

  // Checklist
  const [checks, setChecks] = useState({
    id_match: false,
    id_clear: false,
    bank_match: false,
    shop_sign: false,
    biz_cert: false,
  });

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

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

  async function handleApprove() {
    setSubmitting(true);
    try {
      await api.post(`/admin/weeer/${userId}/kyc/approve`, {});
      showToast("✅ อนุมัติ KYC + สร้าง WeeeT สำเร็จ");
      setShowApproveModal(false);
      fetchData();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus() {
    if (!newStatus || (["rejected", "additional_required"].includes(newStatus) && reason.length < 20)) return;
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8">
          <p className="text-red-400">ไม่พบข้อมูล KYC</p>
          <Link href="/kyc" className="text-blue-400 text-sm mt-2 inline-block">← กลับ KYC Queue</Link>
        </main>
      </div>
    );
  }

  const sc = STATUS_CONFIG[app.overall_status];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/kyc" className="hover:text-white transition-colors">KYC Queue</Link>
          <span>›</span>
          <span className="text-white">{app.user_name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{app.user_name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
            <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">WeeeR</span>
          </div>
          <Link href={`/users?id=${userId}`} className="text-xs text-blue-400 hover:text-blue-300">
            ดู User Profile →
          </Link>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-5 gap-6">
          {/* Left Panel (60%) — Document Preview */}
          <div className="col-span-3 space-y-4">
            {/* Doc Tabs */}
            <div className="flex flex-wrap gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
              {app.documents.map((doc) => (
                <button key={doc.id} onClick={() => setActiveDoc(doc)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    activeDoc?.id === doc.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}>
                  {DOC_LABELS[doc.document_type] ?? doc.document_type}
                  {doc.status === "ok" && <span className="ml-1 text-green-400">✓</span>}
                  {doc.status === "issue" && <span className="ml-1 text-red-400">!</span>}
                </button>
              ))}
            </div>

            {/* Preview Area */}
            {activeDoc ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-medium">{DOC_LABELS[activeDoc.document_type]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">TTL: 1 ชม. (D24)</span>
                    <a href={activeDoc.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      📥 ดาวน์โหลด
                    </a>
                  </div>
                </div>
                <div className="relative bg-gray-950 min-h-[400px] flex items-center justify-center">
                  {activeDoc.file_type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeDoc.file_url} alt={activeDoc.document_type}
                      className="max-w-full max-h-[500px] object-contain" />
                  ) : (
                    <iframe src={activeDoc.file_url} className="w-full h-[500px]" title={activeDoc.document_type} />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500">
                ไม่มีเอกสาร
              </div>
            )}
          </div>

          {/* Right Panel (40%) — Review Panel */}
          <div className="col-span-2 space-y-4">
            {/* Section 1: Checklist */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="font-semibold text-sm mb-3">☑️ Checklist</h3>
              <div className="space-y-2.5">
                {[
                  { key: "id_match" as const, label: "บัตรประชาชนตรงกับชื่อ-สกุล" },
                  { key: "id_clear" as const, label: "รูปบัตรชัดเจน ไม่ปลอมแปลง" },
                  { key: "bank_match" as const, label: "เลขบัญชีธนาคารตรงกับชื่อบัญชี" },
                  { key: "shop_sign" as const, label: "รูปหน้าร้านมีป้ายชื่อร้านชัดเจน" },
                  ...(app.is_registered_business ? [{ key: "biz_cert" as const, label: "หนังสือรับรอง ไม่เกิน 6 เดือน" }] : []),
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={checks[item.key]} onChange={(e) => setChecks({ ...checks, [item.key]: e.target.checked })}
                      className="rounded" />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section 2: Status */}
            {app.overall_status !== "approved" && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h3 className="font-semibold text-sm mb-3">📋 เปลี่ยนสถานะ</h3>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white mb-3">
                  <option value="">— เลือกสถานะ —</option>
                  <option value="reviewing">กำลังตรวจ</option>
                  <option value="rejected">ปฏิเสธ</option>
                  <option value="additional_required">ขอเอกสารเพิ่ม</option>
                </select>

                {["rejected", "additional_required"].includes(newStatus) && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-400 mb-1 block">เหตุผล (≥ 20 ตัวอักษร) *</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none text-white resize-none"
                      placeholder="ระบุเหตุผลโดยละเอียด..." />
                    <p className="text-xs text-gray-600 mt-0.5">{reason.length}/20+ ตัวอักษร</p>
                  </div>
                )}

                {newStatus === "additional_required" && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-400 mb-1 block">เอกสารที่ต้องการเพิ่ม</label>
                    <div className="space-y-1.5">
                      {Object.entries(DOC_LABELS).map(([k, v]) => (
                        <label key={k} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={additionalDocs.includes(k)}
                            onChange={(e) => setAdditionalDocs(e.target.checked
                              ? [...additionalDocs, k]
                              : additionalDocs.filter((d) => d !== k)
                            )}
                            className="rounded" />
                          <span className="text-xs text-gray-300">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {newStatus && newStatus !== "reviewing" && (
                  <button onClick={handleUpdateStatus}
                    disabled={submitting || (["rejected", "additional_required"].includes(newStatus) && reason.length < 20)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
                    {submitting ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                )}
                {newStatus === "reviewing" && (
                  <button onClick={handleUpdateStatus} disabled={submitting}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                    เปลี่ยนเป็น "กำลังตรวจ"
                  </button>
                )}
              </div>
            )}

            {/* Section 3: History */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="font-semibold text-sm mb-3">📜 History Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-xs text-gray-500">ยังไม่มีประวัติ</p>
                ) : history.map((h) => (
                  <div key={h.id} className="text-xs border border-gray-800 rounded-lg p-2.5 space-y-1">
                    <div className="flex justify-between text-gray-500">
                      <span>{new Date(h.created_at).toLocaleString("th-TH")}</span>
                      <span>{h.admin_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">{h.from_status}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-white font-medium">{h.to_status}</span>
                    </div>
                    {h.reason && <p className="text-gray-400 truncate">{h.reason}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Action Buttons */}
            <div className="space-y-2">
              {app.overall_status !== "approved" && app.overall_status !== "rejected" && (
                <button onClick={() => setShowApproveModal(true)}
                  className="w-full py-2.5 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-semibold transition-colors">
                  ✅ อนุมัติ + สร้าง WeeeT
                </button>
              )}
              {isSuper && (
                <button onClick={handleRestore} disabled={submitting}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors text-gray-300">
                  🔄 Restore from Archive (Super Admin)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Approve Confirm Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={() => setShowApproveModal(false)}>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4 text-green-400">✅ ยืนยันอนุมัติ KYC</h3>
              <div className="bg-gray-800 rounded-xl p-4 text-sm mb-4 space-y-2">
                <p className="text-gray-300">KYC ของ <strong className="text-white">{app.user_name}</strong> จะถูกอนุมัติ</p>
                <p className="text-gray-300">→ ระบบจะสร้าง default WeeeT account อัตโนมัติ:</p>
                <div className="ml-4 space-y-1 text-gray-400">
                  <p>ชื่อผู้ใช้: <span className="font-mono text-white">{app.phone}</span></p>
                  <p>รหัสผ่าน: <span className="text-gray-300">[เหมือน WeeeR&apos;s password — D15]</span></p>
                </div>
              </div>
              <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-3 text-xs text-orange-300 mb-4">
                ⚠️ WeeeR ต้องแจ้ง credentials ให้ช่างเอง (ไม่มี SMS — D16)
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowApproveModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                  ยกเลิก
                </button>
                <button onClick={handleApprove} disabled={submitting}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                  {submitting ? "กำลังดำเนินการ..." : "ยืนยันอนุมัติ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-sm shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
