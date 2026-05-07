"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";
import type { RepairBranch, DiagnosePayload } from "@/lib/types";

type Branch = RepairBranch;

const BRANCHES: { key: Branch; title: string; desc: string; color: string }[] = [
  { key: "B1.1", title: "B1.1 — ซ่อมได้ ราคาเดิม", desc: "ซ่อมได้ในราคาที่ประเมินไว้เดิม", color: "border-green-600 bg-green-950/40" },
  { key: "B1.2", title: "B1.2 — ซ่อมได้ ราคาใหม่", desc: "ซ่อมได้ แต่ราคาหรืออะไหล่เปลี่ยน ต้องขออนุมัติ WeeeR", color: "border-blue-600 bg-blue-950/40" },
  { key: "B2.1", title: "B2.1 — ซ่อมไม่ได้ / ยกเลิก", desc: "ไม่สามารถซ่อมได้ หรือลูกค้าขอยกเลิก", color: "border-amber-600 bg-amber-950/40" },
  { key: "B2.2", title: "B2.2 — รับซื้อของเก่า", desc: "ลูกค้าต้องการขายเครื่องให้ App3R", color: "border-purple-600 bg-purple-950/40" },
];

type PartEntry = { name: string; qty: number; price: number };

export default function DiagnosePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [notes, setNotes] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [parts, setParts] = useState<PartEntry[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelCategory, setCancelCategory] = useState("");
  const [scrapPrice, setScrapPrice] = useState("");
  const [scrapWeight, setScrapWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPart = () => setParts((p) => [...p, { name: "", qty: 1, price: 0 }]);
  const updatePart = (i: number, field: keyof PartEntry, val: string | number) => {
    setParts((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  };
  const removePart = (i: number) => setParts((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit = () => {
    if (!branch || !notes.trim()) return false;
    if (branch === "B1.2" && (!proposedPrice || parts.length === 0)) return false;
    if (branch === "B2.1" && !cancelReason.trim()) return false;
    if (branch === "B2.2" && !scrapPrice) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!branch || !canSubmit()) return;
    setSubmitting(true);
    setError(null);

    const payload: DiagnosePayload = { branch, notes: notes.trim() };
    if (branch === "B1.2") {
      payload.parts_added = parts;
      payload.proposed_price = parseFloat(proposedPrice);
    } else if (branch === "B2.1") {
      payload.cancel_reason = cancelReason.trim();
      payload.cancel_category = cancelCategory.trim() || undefined;
    } else if (branch === "B2.2") {
      payload.scrap_price = parseFloat(scrapPrice);
      payload.scrap_weight_kg = scrapWeight ? parseFloat(scrapWeight) : undefined;
    }

    try {
      await repairApi.diagnose(id, payload);
      router.replace(`/jobs/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-6">
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <h1 className="font-bold text-white">T4 — วินิจฉัย / เลือกสาขา</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Branch selector */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">เลือกสาขาการซ่อม</p>
          {BRANCHES.map((b) => (
            <button
              key={b.key}
              onClick={() => setBranch(b.key)}
              className={`w-full text-left border-2 rounded-xl p-4 transition-colors space-y-0.5 ${
                branch === b.key ? b.color : "border-gray-700 bg-gray-800 hover:border-gray-500"
              }`}
            >
              <p className="font-semibold text-white text-sm">{b.title}</p>
              <p className="text-xs text-gray-400">{b.desc}</p>
            </button>
          ))}
        </div>

        {/* Notes (always) */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">📝 บันทึกวินิจฉัย <span className="text-red-400">*</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="อธิบายปัญหาและแนวทางการซ่อม..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        {/* B1.2 fields */}
        {branch === "B1.2" && (
          <div className="space-y-4 bg-blue-950/30 border border-blue-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-300">B1.2 — อะไหล่และราคาใหม่</p>
            <div className="space-y-2">
              <label className="text-xs text-gray-300">ราคาเสนอใหม่ (บาท) <span className="text-red-400">*</span></label>
              <input
                type="number" min="0" value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-300">อะไหล่ที่ใช้ <span className="text-red-400">*</span></label>
                <button onClick={addPart} className="text-xs text-blue-400 hover:text-blue-300">+ เพิ่ม</button>
              </div>
              {parts.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={p.name} onChange={(e) => updatePart(i, "name", e.target.value)}
                    placeholder="ชื่ออะไหล่" className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                  <input type="number" value={p.qty} min="1" onChange={(e) => updatePart(i, "qty", parseInt(e.target.value))}
                    className="w-12 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none text-center" />
                  <input type="number" value={p.price} min="0" onChange={(e) => updatePart(i, "price", parseFloat(e.target.value))}
                    placeholder="฿" className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                  <button onClick={() => removePart(i)} className="text-red-400 text-xs">✕</button>
                </div>
              ))}
              {parts.length === 0 && <p className="text-xs text-amber-400">⚠️ ต้องเพิ่มอะไหล่อย่างน้อย 1 รายการ</p>}
            </div>
          </div>
        )}

        {/* B2.1 fields */}
        {branch === "B2.1" && (
          <div className="space-y-4 bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-300">B2.1 — เหตุผลยกเลิก</p>
            <div className="space-y-2">
              <label className="text-xs text-gray-300">หมวดหมู่</label>
              <select value={cancelCategory} onChange={(e) => setCancelCategory(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
                <option value="">เลือก (ถ้ามี)</option>
                <option value="beyond_repair">เกินการซ่อม</option>
                <option value="parts_unavailable">ไม่มีอะไหล่</option>
                <option value="customer_cancelled">ลูกค้ายกเลิก</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-300">เหตุผลละเอียด <span className="text-red-400">*</span></label>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                placeholder="อธิบายเหตุผลที่ยกเลิก..." rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none" />
            </div>
          </div>
        )}

        {/* B2.2 fields */}
        {branch === "B2.2" && (
          <div className="space-y-4 bg-purple-950/30 border border-purple-800/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-purple-300">B2.2 — รับซื้อของเก่า</p>
            <div className="space-y-2">
              <label className="text-xs text-gray-300">ราคารับซื้อ (บาท) <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={scrapPrice} onChange={(e) => setScrapPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-300">น้ำหนัก (กก.) ถ้ามี</label>
              <input type="number" min="0" step="0.1" value={scrapWeight} onChange={(e) => setScrapWeight(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || submitting}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "🛠️ ยืนยันวินิจฉัย"}
        </button>
      </div>
    </div>
  );
}
