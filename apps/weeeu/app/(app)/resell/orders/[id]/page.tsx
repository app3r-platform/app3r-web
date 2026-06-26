"use client";

/**
 * Resell Order Detail — WeeeU (Extended transaction page)
 * Screen ID: U-RES-ORD  ·  Path: /resell/orders/[id]
 * Covers:
 *   R6  — seller timeout → buyer แจ้ง Admin
 *   R7  — §8 cross-app: WeeeR buyer tracking (resell/purchases/[id] :3001)
 *   R8  — buyer ปฏิเสธ inspection → dispute · seller รับ → ยอมรับ / dispute
 *   R10 — happy path: inspection_period → completed → Escrow ปลด → review
 *   R11 — พัสดุเสียหาย → form → Admin
 *   R12 — mutual cancel request
 *
 * วิธีทดสอบ: เปลี่ยน MOCK_ORDER.state + is_buyer
 * mock-anno: ลบ class mock-anno* ก่อน production (grep mock-anno)
 */

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";
import { MockAnnoBar } from "@/components/shared/MockAnnoBar";
import { listingsApi } from "@/lib/api/listings";

// ─── Types ─────────────────────────────────────────────────────────────────────
type OrderState =
  | "offer_selected"
  | "awaiting_payment"
  | "buyer_confirmed"
  | "in_progress"      // seller กำลังจัดส่ง
  | "delivered"        // ส่งถึงผู้ซื้อ
  | "inspection_period"// ช่วงตรวจสอบ (R8 ทดสอบได้)
  | "seller_timeout"   // R6: seller ไม่ส่งในเวลา
  | "inspection_rejected" // R8: buyer ปฏิเสธ
  | "damaged_parcel"   // R11: รายงานแล้ว รอ Admin
  | "mutual_cancel_pending" // R12: รอฝ่ายหนึ่งยืนยัน
  | "mutually_cancelled"    // R12: ยกเลิกร่วมแล้ว
  | "disputed"
  | "completed";

type MockOrder = {
  id: string;
  listing_title: string;
  seller_name: string;
  buyer_name: string;
  agreed_price: number;
  delivery_method: "parcel" | "on_site";
  state: OrderState;
  is_buyer: boolean;
  inspection_deadline?: string;
  ship_deadline?: string;
  mutual_cancel_requestor?: "buyer" | "seller";
};

// ─── Mock — เปลี่ยน state เพื่อทดสอบ ─────────────────────────────────────────
const MOCK_ORDER: MockOrder = {
  id: "ord-001",
  listing_title: "ตู้เย็น Samsung 2 ประตู สีเงิน",
  seller_name: "นิพนธ์ ใจดี",
  buyer_name: "สมชาย พิมพ์ใจ",
  agreed_price: 4300,
  delivery_method: "parcel",
  state: "inspection_period",   // ← เปลี่ยนเพื่อทดสอบ state ต่างๆ
  is_buyer: true,
  inspection_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  ship_deadline: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // ผ่านไปแล้ว (R6)
  mutual_cancel_requestor: "buyer",
};

// ─── Evidence Upload mock ─────────────────────────────────────────────────────
function EvidenceUploader({
  label,
  color = "blue",
  onFilesChange,
}: {
  label: string;
  color?: "red" | "orange" | "blue";
  onFilesChange: (files: string[]) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const colorMap = {
    red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", hover: "hover:border-red-400 hover:text-red-500" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", hover: "hover:border-orange-400 hover:text-orange-500" },
    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", hover: "hover:border-blue-400 hover:text-blue-500" },
  };
  const c = colorMap[color];

  const add = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 600));
    const updated = [...files, `หลักฐาน_${files.length + 1}.jpg`];
    setFiles(updated);
    onFilesChange(updated);
    setUploading(false);
  };

  return (
    <div>
      <MockAnnoBar />
      <p className="text-xs font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {files.map((f) => (
          <span key={f} className={`text-xs px-2 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>
            📎 {f}
          </span>
        ))}
        <button
          onClick={add}
          disabled={uploading}
          className={`text-xs border-2 border-dashed border-gray-300 text-gray-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${c.hover}`}
        >
          {uploading ? "กำลังอัปโหลด..." : "+ เพิ่มรูป/คลิป"}
        </button>
      </div>
      {files.length === 0 && (
        <p className="text-xs text-red-500 mt-1">⚠️ บังคับแนบหลักฐานอย่างน้อย 1 ไฟล์</p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ResellOrderPage() {
  const { id } = useParams<{ id: string }>();
  const order = { ...MOCK_ORDER, id: id ?? MOCK_ORDER.id };

  const [state, setState] = useState<OrderState>(order.state);
  const [notice, setNotice] = useState<{ type: "info" | "success" | "warn"; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // R8 inspection reject form
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFiles, setRejectFiles] = useState<string[]>([]);

  // R11 damaged parcel form
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [damageDesc, setDamageDesc] = useState("");
  const [damageFiles, setDamageFiles] = useState<string[]>([]);

  // R12 mutual cancel
  const [showMutualConfirm, setShowMutualConfirm] = useState(false);

  const doTransition = async (newState: OrderState, noticeMsg: string, noticeType: "info" | "success" | "warn" = "info") => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setState(newState);
    setNotice({ type: noticeType, msg: noticeMsg });
    setSubmitting(false);
    setShowRejectForm(false);
    setShowDamageForm(false);
    setShowMutualConfirm(false);
  };

  // §2 thin: inspectConfirm คืน {listingId,state} → merge state→status (ไม่ทับ entity ทั้งก้อน)
  const handleInspectConfirm = async () => {
    if (!id) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const thin = await listingsApi.inspectConfirm(id);
      setState(thin.state as OrderState);
      setNotice({ type: "success", msg: "✅ ยืนยันรับสินค้าเรียบร้อย — ธุรกรรมเสร็จสมบูรณ์! ระบบพักเงินกลาง (Escrow) โอนให้ผู้ขายแล้ว" });
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 403) setApiError("ไม่มีสิทธิ์ยืนยัน — ตรวจสอบสถานะผู้ซื้อ");
      else if (e?.status === 400) setApiError("ไม่สามารถยืนยันได้ในสถานะนี้ — รีเฟรชหน้า");
      else setApiError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  const noticeColor = {
    info: "bg-blue-50 border-blue-200 text-blue-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warn: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <div className="max-w-xl space-y-4">
      {/* §5 mock-anno-origin — มาจาก U-RES-PAY /resell/awaiting-payment/[id] หลังชำระเงิน */}

      {/* §8 mock-anno-xapp — R7: WeeeR buyer · R6/R8/R11: WeeeR seller · Admin */}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/offers" className="text-gray-500 hover:text-gray-800 text-xl">
          ‹
        </Link>
        <h1 className="text-xl font-bold text-gray-900">สถานะคำสั่งซื้อ</h1>
      </div>

      {/* Notice */}
      {notice && (
        <div className={`border rounded-xl p-3 ${noticeColor[notice.type]}`}>
          <p className="text-sm font-medium">{notice.msg}</p>
        </div>
      )}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายการ</p>
        <p className="font-semibold text-gray-900">{order.listing_title}</p>
        <p className="text-sm text-gray-600">
          {order.is_buyer ? `ผู้ขาย: ${order.seller_name}` : `ผู้ซื้อ: ${order.buyer_name}`}
        </p>
        <p className="text-xl font-bold text-weeeu-primary">
          {order.agreed_price.toLocaleString()} ฿
        </p>
        <p className="text-sm text-gray-500">
          จัดส่ง: {order.delivery_method === "parcel" ? "ส่งพัสดุ (ขนส่ง)" : "ส่งเอง / นัดรับ"}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          R6 — Seller timeout (buyer view)
          ════════════════════════════════════════════════════════════════ */}
      {state === "seller_timeout" && order.is_buyer && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⌛</span>
            <p className="font-semibold text-red-800">ผู้ขายไม่ดำเนินการ</p>
          </div>
          <p className="text-sm text-red-700">
            ผู้ขายไม่ได้จัดส่งสินค้าภายในระยะเวลาที่กำหนด
          </p>
          <div className="bg-white border border-red-200 rounded-xl p-3 space-y-1">
            <p className="text-xs font-medium text-red-600">กำหนดจัดส่ง</p>
            <p className="text-sm text-gray-500 line-through">
              {order.ship_deadline
                ? new Date(order.ship_deadline).toLocaleString("th-TH")
                : "-"}
            </p>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              เกินกำหนด
            </span>
          </div>
          <button
            onClick={() =>
              doTransition(
                "disputed",
                "📢 ส่งเรื่องแจ้ง Admin เรียบร้อย — Admin จะตรวจสอบและดำเนินการภายใน 24 ชั่วโมง",
                "info"
              )
            }
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            {submitting ? "กำลังส่ง..." : "📢 แจ้ง Admin — ผู้ขายไม่ส่งสินค้า"}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          R8 — Inspection period (buyer view)
          ════════════════════════════════════════════════════════════════ */}
      {state === "inspection_period" && order.is_buyer && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              ขั้นตอนตรวจสอบสินค้า
            </p>
            <p className="text-sm text-gray-600">
              คุณได้รับสินค้าแล้ว — กรุณาตรวจสอบแล้วยืนยัน
            </p>
            {order.inspection_deadline && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-xl p-2.5">
                <p className="text-xs text-yellow-700">
                  ⏰ กำหนดตรวจ:{" "}
                  {new Date(order.inspection_deadline).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {!showRejectForm ? (
            <div className="flex gap-2">
              <button
                onClick={handleInspectConfirm}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
              >
                ✅ ยืนยันรับ (ตรงปก)
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 border-2 border-red-300 text-red-700 font-medium py-3.5 rounded-2xl text-sm hover:bg-red-50 transition-colors"
              >
                ⚠️ ปฏิเสธ (ไม่ตรงปก)
              </button>
            </div>
          ) : (
            /* ─── Reject form ─── */
            <div className="space-y-4 pt-1">
              <p className="text-sm font-semibold text-red-700">⚠️ ปฏิเสธสินค้า — เปิด Dispute</p>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  เหตุผล (บังคับ)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="เช่น สินค้าไม่ตรงกับรูปในประกาศ / มีรอยเสียหายที่ไม่ได้แจ้ง..."
                />
              </div>
              <EvidenceUploader
                label="แนบหลักฐาน รูป/คลิปตอนรับสินค้า (บังคับ)"
                color="red"
                onFilesChange={setRejectFiles}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                    setRejectFiles([]);
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() =>
                    doTransition(
                      "inspection_rejected",
                      "⚖️ ส่ง Dispute เรียบร้อย — Admin จะพิจารณาหลักฐานและตัดสินภายใน 48 ชั่วโมง",
                      "info"
                    )
                  }
                  disabled={submitting || !rejectReason.trim() || rejectFiles.length === 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {submitting ? "กำลังส่ง..." : "ยืนยันปฏิเสธ → Dispute"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          R8 — Seller receives inspection_rejected notification
          ════════════════════════════════════════════════════════════════ */}
      {state === "inspection_rejected" && !order.is_buyer && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <p className="font-semibold text-orange-800">ผู้ซื้อปฏิเสธ Inspection</p>
          </div>
          <div className="bg-white border border-orange-200 rounded-xl p-3 space-y-1">
            <p className="text-xs font-medium text-orange-600">เหตุผลจากผู้ซื้อ</p>
            <p className="text-sm text-gray-800">
              "สีตู้เย็นไม่ตรงกับรูปในประกาศ และมีรอยบุบที่ด้านข้างซึ่งไม่ได้แจ้งไว้"
            </p>
          </div>
          <p className="text-xs text-orange-700">
            เลือกวิธีดำเนินการ — ระบบจะแจ้งให้ผู้ซื้อทราบทันที
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                doTransition(
                  "mutually_cancelled",
                  "ยอมรับการคืนสินค้า — ระบบพักเงินกลาง จะคืนให้ผู้ซื้อภายใน 24 ชั่วโมง",
                  "info"
                )
              }
              disabled={submitting}
              className="flex-1 border-2 border-gray-300 text-gray-700 font-medium py-3 rounded-2xl text-sm hover:bg-gray-50 transition-colors"
            >
              ยอมรับ (คืนเงิน)
            </button>
            <button
              onClick={() =>
                doTransition(
                  "disputed",
                  "⚖️ เปิด Dispute แล้ว — Admin จะตัดสินโดยอิงหลักฐานของทั้งสองฝ่าย",
                  "info"
                )
              }
              disabled={submitting}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
            >
              โต้แย้ง → Dispute
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          R11 — Damaged parcel (buyer view, parcel delivery only)
          ════════════════════════════════════════════════════════════════ */}
      {(state === "delivered" || state === "inspection_period") &&
        order.delivery_method === "parcel" &&
        order.is_buyer && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            {!showDamageForm ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  พัสดุ
                </p>
                <p className="text-sm text-gray-500">
                  หากพัสดุมีความเสียหายระหว่างขนส่ง สามารถแจ้งได้ทันที (บังคับถ่ายรูปหลักฐาน)
                </p>
                <button
                  onClick={() => setShowDamageForm(true)}
                  className="w-full border-2 border-orange-200 text-orange-700 text-sm font-medium py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  📦 แจ้งพัสดุเสียหาย
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-orange-800">📦 แจ้งพัสดุเสียหาย</p>
                <p className="text-xs text-gray-500">
                  หลักฐานจะส่งให้ Admin ตรวจสอบร่วมกับผู้ขายเพื่อตัดสินว่าใครรับผิดชอบ
                </p>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    อธิบายความเสียหาย (บังคับ)
                  </label>
                  <textarea
                    value={damageDesc}
                    onChange={(e) => setDamageDesc(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="เช่น กล่องบุบ สินค้าหัก มีรอยน้ำ..."
                  />
                </div>
                <EvidenceUploader
                  label="แนบหลักฐาน รูปพัสดุและความเสียหาย (บังคับ)"
                  color="orange"
                  onFilesChange={setDamageFiles}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDamageForm(false);
                      setDamageDesc("");
                      setDamageFiles([]);
                    }}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() =>
                      doTransition(
                        "damaged_parcel",
                        "📦 แจ้ง Admin เรียบร้อย — รอผลการพิจารณาภายใน 24 ชั่วโมง",
                        "warn"
                      )
                    }
                    disabled={submitting || !damageDesc.trim() || damageFiles.length === 0}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {submitting ? "กำลังส่ง..." : "แจ้ง Admin"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {/* ═══════════════════════════════════════════════════════════════════
          R12 — Mutual cancel request (buyer view)
          ════════════════════════════════════════════════════════════════ */}
      {(state === "buyer_confirmed" || state === "in_progress") && order.is_buyer && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          {!showMutualConfirm ? (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ยกเลิกร่วมกัน
              </p>
              <p className="text-sm text-gray-500">
                หากทั้งสองฝ่ายตกลงยกเลิก ระบบพักเงินกลาง <EscrowInfoIcon /> จะคืนเต็มจำนวน — ไม่มีค่าธรรมเนียม
              </p>
              <button
                onClick={() => setShowMutualConfirm(true)}
                className="w-full border-2 border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                🤝 ขอยกเลิกร่วมกัน
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">ยืนยันขอยกเลิกร่วมกัน?</p>
              <p className="text-sm text-gray-600">
                คำขอจะถูกส่งให้ผู้ขาย — ต้องได้รับการยืนยันจากทั้งสองฝ่ายก่อนจึงจะยกเลิกได้
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMutualConfirm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() =>
                    doTransition(
                      "mutual_cancel_pending",
                      "🤝 ส่งคำขอยกเลิกร่วมกันแล้ว — รอผู้ขายยืนยัน",
                      "info"
                    )
                  }
                  disabled={submitting}
                  className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {submitting ? "กำลังส่ง..." : "ยืนยันส่งคำขอ"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* R12 — Seller receives mutual cancel request */}
      {state === "mutual_cancel_pending" && !order.is_buyer && (
        <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <p className="font-semibold text-weeeu-dark">คำขอยกเลิกร่วมกัน</p>
          </div>
          <p className="text-sm text-weeeu-dark">
            ผู้ซื้อ (<strong>{order.buyer_name}</strong>) ส่งคำขอยกเลิกธุรกรรม
            — ระบบพักเงินกลาง <EscrowInfoIcon /> จะคืนเต็มจำนวน ไม่มีการลงโทษทั้งสองฝ่าย
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                doTransition(
                  "mutually_cancelled",
                  "✅ ยกเลิกร่วมกันเสร็จสมบูรณ์ — ระบบพักเงินกลาง คืนให้ผู้ซื้อแล้ว",
                  "success"
                )
              }
              disabled={submitting}
              className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
            >
              {submitting ? "กำลังดำเนินการ..." : "✅ ยืนยันยกเลิกร่วมกัน"}
            </button>
            <button
              onClick={() =>
                doTransition(
                  order.state,
                  "ปฏิเสธคำขอยกเลิกแล้ว — ธุรกรรมดำเนินต่อตามปกติ",
                  "info"
                )
              }
              disabled={submitting}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-2xl text-sm hover:bg-gray-50 transition-colors"
            >
              ปฏิเสธ
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Terminal states
          ════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════
          R10 — Happy path completed (buyer ยืนยันรับ → Escrow ปลด → review)
          ════════════════════════════════════════════════════════════════ */}
      {state === "completed" && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-5xl">🎉</p>
            <p className="font-bold text-green-800 text-lg">ธุรกรรมเสร็จสมบูรณ์!</p>
            {/* B3: Escrow ตัวเลขชัดเจน */}
            <p className="text-sm text-green-700 font-medium">
              💰 ระบบพักเงินกลาง (Escrow) ปลดล็อก
              <br />
              <span className="text-green-800 font-bold">{order.agreed_price.toLocaleString()} Gold</span> โอนให้ผู้ขายแล้ว
            </p>
            <p className="text-sm text-green-600">ขอบคุณที่ใช้บริการ WeeeU</p>
          </div>
          {/* §8 cross-app: R10 — WeeeR seller เห็น Gold เข้า wallet */}
          {/* A1: หน้า review หลัง completed (F1: รีวิวหลังธุรกรรมเสร็จ) */}
          <Link
            href={`/resell/orders/${order.id}/review`}
            className="block w-full text-center bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            ⭐ รีวิวธุรกรรมนี้
          </Link>
        </div>
      )}

      {state === "mutually_cancelled" && (
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-8 text-center space-y-2">
          <p className="text-5xl">🤝</p>
          <p className="font-bold text-gray-700 text-lg">ยกเลิกร่วมกันเรียบร้อย</p>
          <p className="text-sm text-gray-500">ระบบพักเงินกลาง <EscrowInfoIcon /> คืนเต็มจำนวน — ไม่มีค่าธรรมเนียม</p>
        </div>
      )}

      {state === "disputed" && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center space-y-2">
          <p className="text-5xl">⚖️</p>
          <p className="font-bold text-orange-800 text-lg">อยู่ระหว่างพิจารณา Dispute</p>
          <p className="text-sm text-orange-600">Admin กำลังพิจารณาหลักฐาน — รอผลภายใน 48 ชั่วโมง</p>
        </div>
      )}

      {state === "damaged_parcel" && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center space-y-2">
          <p className="text-5xl">📦</p>
          <p className="font-bold text-orange-800 text-lg">แจ้งพัสดุเสียหายแล้ว</p>
          <p className="text-sm text-orange-600">Admin กำลังพิจารณา — รอผลภายใน 24 ชั่วโมง</p>
        </div>
      )}

      {state === "mutual_cancel_pending" && order.is_buyer && (
        <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-5 text-center space-y-2">
          <p className="text-3xl">⏳</p>
          <p className="font-semibold text-weeeu-dark">รอผู้ขายยืนยัน</p>
          <p className="text-sm text-weeeu-primary">คำขอยกเลิกร่วมกันถูกส่งแล้ว — ผู้ขายจะได้รับแจ้งทันที</p>
        </div>
      )}

      {/* Navigation */}
      <Link
        href="/offers"
        className="block text-center border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
      >
        ← กลับไปข้อเสนอ
      </Link>
    </div>
  );
}
