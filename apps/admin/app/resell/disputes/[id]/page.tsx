"use client";

/**
 * Admin Dispute Resolution — Resell
 * Covers:
 *   R6  — seller_no_action: seller ไม่ส่ง/หายตัว → Admin ออกคำสั่ง
 *   R8  — inspection_reject: buyer ปฏิเสธสินค้าไม่ตรงปก → Admin ตัดสิน 3 ทาง
 *   R11 — damaged_parcel: พัสดุเสียหายระหว่างส่ง → Admin ตัดสินใครรับผิด
 *
 * Path: /resell/disputes/[id]
 * Admin view — ไม่ใช่ buyer/seller
 */

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────
type DisputeType = "seller_no_action" | "inspection_reject" | "damaged_parcel";
type Resolution = "buyer_wins" | "seller_wins" | "split" | "pending";

type DisputeCase = {
  id: string;
  type: DisputeType;
  order_id: string;
  listing_title: string;
  seller_name: string;
  buyer_name: string;
  agreed_price: number;
  delivery_method: "parcel" | "on_site";
  created_at: string;
  resolution: Resolution;
  evidence_seller: string[];
  evidence_buyer: string[];
  timeline: { time: string; event: string; by: "system" | "seller" | "buyer" | "admin" }[];
};

// ─── Mock data — เปลี่ยน type เพื่อทดสอบ case ต่างๆ ─────────────────────────
const MOCK_CASE: DisputeCase = {
  id: "dis-001",
  type: "inspection_reject",   // ← เปลี่ยน: "seller_no_action" | "inspection_reject" | "damaged_parcel"
  order_id: "ord-001",
  listing_title: "ตู้เย็น Samsung 2 ประตู สีเงิน",
  seller_name: "นิพนธ์ ใจดี",
  buyer_name: "สมชาย พิมพ์ใจ",
  agreed_price: 4300,
  delivery_method: "parcel",
  created_at: "23 พ.ค. 2569 14:30 น.",
  resolution: "pending",
  evidence_seller: ["seller_photo_01.jpg", "seller_video.mp4"],
  evidence_buyer: ["buyer_receipt.jpg", "damage_close.jpg"],
  timeline: [
    { time: "22 พ.ค. 09:00", event: "สร้างคำสั่งซื้อ", by: "system" },
    { time: "22 พ.ค. 14:00", event: "ชำระพักเงินกลาง (Escrow) สำเร็จ", by: "buyer" },
    { time: "23 พ.ค. 10:00", event: "ผู้ขายจัดส่งพัสดุ + แนบรูปส่ง", by: "seller" },
    { time: "23 พ.ค. 14:00", event: "ผู้ซื้อรับพัสดุ — ปฏิเสธ inspection", by: "buyer" },
    { time: "23 พ.ค. 14:30", event: "Dispute เปิด — รอ Admin", by: "system" },
  ],
};

// ─── Labels / Colors ──────────────────────────────────────────────────────────
const DISPUTE_TYPE_LABEL: Record<DisputeType, { label: string; icon: string; color: string }> = {
  seller_no_action: { label: "ผู้ขายไม่ดำเนินการ", icon: "⌛", color: "bg-red-100 text-red-700 border-red-200" },
  inspection_reject: { label: "ปฏิเสธ Inspection", icon: "⚠️", color: "bg-orange-100 text-orange-700 border-orange-200" },
  damaged_parcel: { label: "พัสดุเสียหาย", icon: "📦", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

const RESOLUTION_LABEL: Record<Resolution, { label: string; color: string }> = {
  pending: { label: "รอพิจารณา", color: "bg-gray-100 text-gray-600" },
  buyer_wins: { label: "ผู้ซื้อชนะ — คืนเงินพักกลาง (Escrow) ทั้งหมด", color: "bg-blue-100 text-blue-700" },
  seller_wins: { label: "ผู้ขายชนะ — โอนเงินพักกลาง (Escrow) ให้ผู้ขาย", color: "bg-green-100 text-green-700" },
  split: { label: "แบ่งเงินพักกลาง (Escrow) ตามสัดส่วน", color: "bg-admin-surface text-admin-primary" },
};

function TimelineDot({ by }: { by: "system" | "seller" | "buyer" | "admin" }) {
  const colors = {
    system: "bg-gray-400",
    seller: "bg-blue-500",
    buyer: "bg-green-500",
    admin: "bg-admin-primary",
  };
  return <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${colors[by]}`} />;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const c = MOCK_CASE;

  const [resolution, setResolution] = useState<Resolution>(c.resolution);
  const [splitBuyer, setSplitBuyer] = useState(50);
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [settled, setSettled] = useState(false);

  const dt = DISPUTE_TYPE_LABEL[c.type];
  const buyerAmount = Math.round((c.agreed_price * splitBuyer) / 100);
  const sellerAmount = c.agreed_price - buyerAmount;

  const handleSettle = async () => {
    if (resolution === "pending" || !adminNote.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSettled(true);
  };

  if (settled) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/resell/disputes" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
          <h1 className="text-xl font-bold text-gray-900">ข้อพิพาทปิดแล้ว</h1>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-5xl">✅</p>
          <p className="font-bold text-green-800 text-lg">ตัดสินเรียบร้อย</p>
          <p className="text-sm text-green-600">
            {RESOLUTION_LABEL[resolution].label}
            <br />ทั้งสองฝ่ายได้รับแจ้งแล้ว
          </p>
          <Link
            href="/resell/disputes"
            className="inline-block mt-2 border border-green-300 text-green-700 font-medium px-5 py-2 rounded-xl text-sm hover:bg-green-100 transition-colors"
          >
            ← กลับรายการ Dispute
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resell/disputes" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ข้อพิพาท #{c.id}</h1>
          <p className="text-xs text-gray-400">เปิดเมื่อ {c.created_at}</p>
        </div>
      </div>

      {/* Dispute type badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${dt.color}`}>
        <span>{dt.icon}</span>
        <span>{dt.label}</span>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">สินค้า</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{c.listing_title}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">มูลค่าเงินพักกลาง (Escrow)</p>
          <p className="text-sm font-bold text-admin-primary mt-0.5">{c.agreed_price.toLocaleString()} ฿</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">ผู้ขาย</p>
          <p className="text-sm text-gray-800 mt-0.5">{c.seller_name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">ผู้ซื้อ</p>
          <p className="text-sm text-gray-800 mt-0.5">{c.buyer_name}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide">วิธีจัดส่ง</p>
          <p className="text-sm text-gray-700 mt-0.5">
            {c.delivery_method === "parcel" ? "📦 ส่งพัสดุ (ขนส่ง)" : "🤝 ส่งเอง / นัดรับ"}
          </p>
        </div>
      </div>

      {/* ─── R6 specific info ─── */}
      {c.type === "seller_no_action" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-red-800">⌛ ผู้ขายไม่จัดส่งสินค้า</p>
          <p className="text-sm text-red-700">
            เกินกำหนดส่ง 24 ชั่วโมง — ผู้ซื้อส่งเรื่องร้องเรียน
          </p>
          <p className="text-xs text-red-600">
            กำหนดส่ง: 22 พ.ค. 2569 18:00 น. (เกินกำหนด)
          </p>
        </div>
      )}

      {/* ─── R8 specific info ─── */}
      {c.type === "inspection_reject" && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-orange-800">⚠️ ผู้ซื้อปฏิเสธ Inspection</p>
          <div className="bg-white border border-orange-200 rounded-xl p-3">
            <p className="text-xs font-medium text-orange-600 mb-1">เหตุผลจากผู้ซื้อ</p>
            <p className="text-sm text-gray-800">
              &quot;สีตู้เย็นไม่ตรงกับรูปในประกาศ และมีรอยบุบที่ด้านข้างซึ่งไม่ได้แจ้งไว้&quot;
            </p>
          </div>
        </div>
      )}

      {/* ─── R11 specific info ─── */}
      {c.type === "damaged_parcel" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-yellow-800">📦 พัสดุเสียหายระหว่างขนส่ง</p>
          <div className="bg-white border border-yellow-200 rounded-xl p-3">
            <p className="text-xs font-medium text-yellow-600 mb-1">รายงานจากผู้ซื้อ</p>
            <p className="text-sm text-gray-800">&quot;กล่องบุบ ด้านในสินค้ามีรอยแตก ถ่ายรูปไว้แล้ว&quot;</p>
          </div>
          <p className="text-xs text-yellow-700">
            พิจารณา: ผู้ขายแพ็คดีหรือไม่? บริษัทขนส่งรับผิดชอบ?
          </p>
        </div>
      )}

      {/* Evidence */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          หลักฐาน (Evidence)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 mb-2">📤 ผู้ขาย ({c.evidence_seller.length} ไฟล์)</p>
            <div className="space-y-1">
              {c.evidence_seller.map((f) => (
                <div key={f} className="flex items-center gap-2 bg-blue-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs">📎</span>
                  <span className="text-xs text-blue-700 truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-green-700 mb-2">📥 ผู้ซื้อ ({c.evidence_buyer.length} ไฟล์)</p>
            <div className="space-y-1">
              {c.evidence_buyer.map((f) => (
                <div key={f} className="flex items-center gap-2 bg-green-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs">📎</span>
                  <span className="text-xs text-green-700 truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          ประวัติเหตุการณ์
        </p>
        <div className="space-y-3">
          {c.timeline.map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <TimelineDot by={t.by} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{t.event}</p>
                <p className="text-xs text-gray-400">{t.time}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 capitalize">{t.by}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Resolution panel ─── */}
      <div className="bg-white rounded-2xl border-2 border-admin-primary/20 shadow-sm p-5 space-y-5">
        <p className="text-sm font-bold text-admin-dark">⚖️ ตัดสิน Dispute (Admin)</p>
        {/* PHASE-4: SoT = Source of Truth (Offer terms reference) */}
        <p className="text-xs text-gray-500">
          Offer = ข้อตกลงหลัก — พิจารณา: terms ที่ตกลง + หลักฐาน seller + buyer + precedent
        </p>

        {/* 3-way resolution */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            การตัดสิน (3 ทาง)
          </p>
          {(["buyer_wins", "seller_wins", "split"] as Resolution[]).map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                resolution === r
                  ? "border-admin-primary bg-admin-surface"
                  : "border-gray-100 hover:border-gray-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="resolution"
                value={r}
                checked={resolution === r}
                onChange={() => setResolution(r)}
                className="accent-[#2C5E8C]"
              />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${RESOLUTION_LABEL[r].color.includes("blue") ? "text-blue-700" : RESOLUTION_LABEL[r].color.includes("green") ? "text-green-700" : "text-admin-primary"}`}>
                  {RESOLUTION_LABEL[r].label}
                </p>
                {r === "buyer_wins" && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    พักเงินกลาง {c.agreed_price.toLocaleString()} ฿ → คืนผู้ซื้อทั้งหมด
                  </p>
                )}
                {r === "seller_wins" && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    พักเงินกลาง {c.agreed_price.toLocaleString()} ฿ → โอนผู้ขายทั้งหมด
                  </p>
                )}
                {r === "split" && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    กำหนดสัดส่วนเอง
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Split slider */}
        {resolution === "split" && (
          <div className="space-y-3 bg-admin-surface border border-admin-primary/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-admin-primary">สัดส่วนการคืนเงินพักกลาง (Escrow)</p>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>ผู้ซื้อ: <strong className="text-blue-600">{splitBuyer}%</strong> ({buyerAmount.toLocaleString()} ฿)</span>
              <span>ผู้ขาย: <strong className="text-green-600">{100 - splitBuyer}%</strong> ({sellerAmount.toLocaleString()} ฿)</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={splitBuyer}
              onChange={(e) => setSplitBuyer(Number(e.target.value))}
              className="w-full accent-[#2C5E8C]"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>ผู้ซื้อ 100%</span>
              <span>50/50</span>
              <span>ผู้ขาย 100%</span>
            </div>
          </div>
        )}

        {/* Admin note */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
            เหตุผลการตัดสิน (บังคับ — บันทึกใน audit log)
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#2C5E8C]/30"
            placeholder="อธิบายเหตุผลการตัดสิน อ้างอิง Offer terms / หลักฐาน / precedent..."
          />
          {!adminNote.trim() && (
            <p className="text-xs text-red-500 mt-1">⚠️ บังคับระบุเหตุผล</p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSettle}
          disabled={submitting || resolution === "pending" || !adminNote.trim()}
          className="w-full bg-admin-primary hover:bg-admin-dark disabled:opacity-40 text-white font-semibold py-4 rounded-2xl text-sm transition-colors"
        >
          {submitting ? "กำลังดำเนินการ..." : "⚖️ ยืนยันการตัดสิน — ปิด Dispute"}
        </button>
        <p className="text-xs text-gray-400 text-center">
          การตัดสินจะถูกบันทึกใน Audit Log และแจ้งทั้งสองฝ่ายทันที
        </p>
      </div>
    </div>
  );
}
