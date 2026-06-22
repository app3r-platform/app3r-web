"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";
import type { RepairBranch, DiagnosePayload, WeeeTDeclineGroup } from "@/lib/types";
import { WEEET_DECLINE_GROUPS, DECLINE_MAX_PHOTOS } from "@/lib/types";
import { MockAnno } from "@/components/MockAnno";

type Branch = RepairBranch;

const BRANCHES: { key: Branch; title: string; desc: string; color: string }[] = [
  { key: "B1.1", title: "B1.1 — ซ่อมได้ ราคาเดิม", desc: "ซ่อมได้ในราคาที่ประเมินไว้เดิม", color: "border-green-600 bg-green-950/40" },
  { key: "B1.2", title: "B1.2 — ซ่อมได้ ราคาใหม่", desc: "ซ่อมได้ แต่ราคาหรืออะไหล่เปลี่ยน ต้องขออนุมัติ WeeeR", color: "border-blue-600 bg-blue-950/40" },
  { key: "B2.1", title: "B2.1 — ซ่อมไม่ได้ / ยกเลิก", desc: "ไม่สามารถซ่อมได้ หรือลูกค้าขอยกเลิก", color: "border-amber-600 bg-amber-950/40" },
  { key: "B2.2", title: "B2.2 — รับซื้อของเก่า", desc: "ลูกค้าต้องการขายเครื่องให้ App3R", color: "border-gray-500 bg-gray-800/50" },
];

type PartEntry = { name: string; qty: number; price: number };

export default function DiagnosePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [notes, setNotes] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [parts, setParts] = useState<PartEntry[]>([]);
  const [scrapPrice, setScrapPrice] = useState("");
  const [scrapWeight, setScrapWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // REP-C10 — ปฏิเสธรับซ่อม (B2.1): modal เหตุผล 3 กลุ่ม + textarea + รูป ≤3 (SoT Gen 55)
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineGroup, setDeclineGroup] = useState<WeeeTDeclineGroup | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [declinePhotos, setDeclinePhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const declinePhotoRef = useRef<HTMLInputElement>(null);

  const addPart = () => setParts((p) => [...p, { name: "", qty: 1, price: 0 }]);
  const updatePart = (i: number, field: keyof PartEntry, val: string | number) => {
    setParts((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  };
  const removePart = (i: number) => setParts((prev) => prev.filter((_, idx) => idx !== i));

  const addDeclinePhotos = (files: FileList | null) => {
    if (!files) return;
    const toAdd: { file: File; previewUrl: string }[] = [];
    for (const file of Array.from(files)) {
      if (declinePhotos.length + toAdd.length >= DECLINE_MAX_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setDeclinePhotos((prev) => [...prev, ...toAdd]);
  };
  const removeDeclinePhoto = (i: number) =>
    setDeclinePhotos((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });

  // B2.1 ผ่าน modal: ถือว่าครบเมื่อเลือกกลุ่ม + textarea มีข้อความ (รูป optional)
  const declineComplete = declineGroup !== null && cancelReason.trim().length > 0;

  const canSubmit = () => {
    if (!branch || !notes.trim()) return false;
    if (branch === "B1.2" && (!proposedPrice || parts.length === 0)) return false;
    if (branch === "B2.1" && !declineComplete) return false;
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
      payload.decline_group = declineGroup ?? undefined;
      payload.decline_photo_count = declinePhotos.length;
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
      <MockAnno
        origin="T-11 รายละเอียดงาน /jobs/[id]"
        nav="T-11 /jobs/[id] (ยืนยันวินิจฉัยสำเร็จ)"
        xapp="→ WeeeR (อนุมัติ B1.2 ราคาใหม่) · → WeeeU (รับทราบสาขา)"
      />
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <h1 className="font-bold text-white">T-02 — วินิจฉัย / เลือกสาขา</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Branch selector */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">เลือกสาขาการซ่อม</p>
          {BRANCHES.map((b) => (
            <button
              key={b.key}
              onClick={() => {
                setBranch(b.key);
                if (b.key === "B2.1") setDeclineModalOpen(true);
              }}
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
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
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

        {/* B2.1 — ปฏิเสธรับซ่อม: สรุปจาก modal 3 กลุ่ม (REP-C10) */}
        {branch === "B2.1" && (
          <div className="space-y-3 bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-300">B2.1 — เหตุผลปฏิเสธรับซ่อม</p>
              <button onClick={() => setDeclineModalOpen(true)} className="text-xs text-amber-400 hover:text-amber-300 underline">
                {declineComplete ? "แก้ไข" : "เลือกเหตุผล"}
              </button>
            </div>
            {declineComplete ? (
              <div className="space-y-2 text-xs">
                <p className="text-amber-200 font-medium">
                  {WEEET_DECLINE_GROUPS.find((g) => g.key === declineGroup)?.title}
                </p>
                <p className="text-gray-300 whitespace-pre-wrap">{cancelReason}</p>
                {declinePhotos.length > 0 && (
                  <p className="text-gray-400">📷 แนบรูป {declinePhotos.length}/{DECLINE_MAX_PHOTOS}</p>
                )}
                <p className="text-gray-500">บันทึก audit log สำหรับการระงับข้อพิพาท</p>
              </div>
            ) : (
              <p className="text-xs text-amber-400">⚠️ กรุณาเลือก 1 กลุ่มเหตุผล + กรอกรายละเอียด</p>
            )}
          </div>
        )}

        {/* B2.2 fields */}
        {branch === "B2.2" && (
          <div className="space-y-4 bg-gray-800/40 border border-gray-600/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-300">B2.2 — รับซื้อของเก่า</p>
            <div className="space-y-2">
              <label className="text-xs text-gray-300">ราคารับซื้อ (บาท) <span className="text-red-400">*</span></label>
              <input type="number" min="0" value={scrapPrice} onChange={(e) => setScrapPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-300">น้ำหนัก (กก.) ถ้ามี</label>
              <input type="number" min="0" step="0.1" value={scrapWeight} onChange={(e) => setScrapWeight(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || submitting}
          className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "🛠️ ยืนยันวินิจฉัย"}
        </button>
      </div>

      {/* REP-C10 — Modal ปฏิเสธรับซ่อม: เหตุผล 3 กลุ่ม + textarea + รูป ≤3 (SoT Gen 55) */}
      {declineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-white text-sm">🚫 ปฏิเสธรับซ่อม — เลือกเหตุผล</h2>
              <button onClick={() => setDeclineModalOpen(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* 3 reason groups (radio — เลือก 1) */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-300">กลุ่มเหตุผล <span className="text-red-400">*</span></p>
                {WEEET_DECLINE_GROUPS.map((g, idx) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setDeclineGroup(g.key)}
                    className={`w-full text-left border-2 rounded-xl p-3 transition-colors ${
                      declineGroup === g.key ? "border-amber-500 bg-amber-950/40" : "border-gray-700 bg-gray-800 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        declineGroup === g.key ? "border-amber-400" : "border-gray-500"
                      }`}>
                        {declineGroup === g.key && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-white">{idx + 1}. {g.title}</p>
                        <p className="text-xs text-gray-400">{g.examples}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* required textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">รายละเอียดเพิ่มเติม <span className="text-red-400">*</span></label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="อธิบายเหตุผลที่ปฏิเสธรับซ่อม (ใช้เป็นหลักฐาน audit สำหรับข้อพิพาท)..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* optional photos ≤3 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">รูปประกอบ (ไม่บังคับ)</label>
                  <span className="text-xs text-gray-400">{declinePhotos.length}/{DECLINE_MAX_PHOTOS}</span>
                </div>
                <input
                  ref={declinePhotoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addDeclinePhotos(e.target.files)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {declinePhotos.map((p, i) => (
                    <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeDeclinePhoto(i)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  {declinePhotos.length < DECLINE_MAX_PHOTOS && (
                    <button
                      onClick={() => declinePhotoRef.current?.click()}
                      className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-amber-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-amber-400 transition-colors"
                    >
                      <span className="text-2xl">📷</span><span className="text-xs">เพิ่มรูป</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
              <button
                onClick={() => setDeclineModalOpen(false)}
                disabled={!declineComplete}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                บันทึกเหตุผล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
