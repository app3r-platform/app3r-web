"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type PostRepairFile = { url: string };

type ReviewData = {
  id: string;
  appliance_name: string;
  weeer_name: string;
  weeer_id: string;
  weeet_name: string;
  weeet_id: string;
  final_price: number;
  post_repair_files: PostRepairFile[];
  post_repair_notes: string;
  parts_used: { name: string; qty: number }[];
  completed_at: string | null;
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"inspect" | "rating" | "done">("inspect");

  // Inspect state
  const [inspectSubmitting, setInspectSubmitting] = useState(false);
  const [inspectError, setInspectError] = useState("");

  // Rating state
  const [weeerRating, setWeeerRating] = useState(0);
  const [weeerReview, setWeeerReview] = useState("");
  const [weeetRating, setWeeetRating] = useState(0);
  const [weeetReview, setWeeetReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`/api/v1/repair/jobs/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setData({
          id: d.id,
          appliance_name: d.appliance_name,
          weeer_name: d.weeer_name,
          weeer_id: d.weeer_id,
          weeet_name: d.weeet_name ?? "",
          weeet_id: d.weeet_id ?? "",
          final_price: d.final_price ?? d.original_price ?? 0,
          post_repair_files: d.post_repair_files ?? [],
          post_repair_notes: d.post_repair_notes ?? "",
          parts_used: d.parts_used ?? [],
          completed_at: d.completed_at,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    setInspectSubmitting(true);
    setInspectError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/v1/repair/jobs/${id}/review/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      setPhase("rating");
    } catch {
      setInspectError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setInspectSubmitting(false);
    }
  };

  const handleDispute = async () => {
    setInspectSubmitting(true);
    setInspectError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/v1/repair/jobs/${id}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: "quality_dispute" }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/repair/${id}`);
    } catch {
      setInspectError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setInspectSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (weeerRating === 0) { setRatingError("กรุณาให้คะแนนร้านซ่อม"); return; }
    setRatingSubmitting(true);
    setRatingError("");
    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await Promise.all([
        fetch(`/api/v1/repair/jobs/${id}/review`, {
          method: "POST", headers,
          body: JSON.stringify({
            target_type: "weeer",
            target_id: data?.weeer_id,
            rating: weeerRating,
            review_text: weeerReview,
          }),
        }),
        weeetRating > 0
          ? fetch(`/api/v1/repair/jobs/${id}/review`, {
              method: "POST", headers,
              body: JSON.stringify({
                target_type: "weeet",
                target_id: data?.weeet_id,
                rating: weeetRating,
                review_text: weeetReview,
              }),
            })
          : Promise.resolve(),
      ]);
      setPhase("done");
    } catch {
      setRatingError("เกิดข้อผิดพลาดในการส่งรีวิว");
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  if (phase === "done") return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/repair" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ตรวจรับงาน</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-gray-900">ตรวจรับงานเสร็จสิ้น</h2>
        <p className="text-sm text-gray-500">ขอบคุณที่ใช้บริการ — Point จะถูกโอนให้ร้านซ่อมในไม่ช้า</p>
        <Link
          href="/repair"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
        >
          กลับรายการงานซ่อม
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">
          {phase === "inspect" ? "ตรวจรับงานซ่อม" : "รีวิวร้านซ่อม"}
        </h1>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-1.5 rounded-full ${phase === "inspect" || phase === "rating" ? "bg-blue-500" : "bg-gray-200"}`} />
        <div className={`flex-1 h-1.5 rounded-full ${phase === "rating" ? "bg-blue-500" : "bg-gray-200"}`} />
      </div>

      {/* Inspect phase */}
      {phase === "inspect" && data && (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-yellow-800">🔍 งานซ่อมเสร็จแล้ว — กรุณาตรวจสอบ</p>
            <p className="text-xs text-yellow-600 mt-1">
              ทดสอบเครื่อง {data.appliance_name} ก่อนกด &ldquo;ผ่าน&rdquo; ถ้าพบปัญหาให้กด &ldquo;เปิดข้อพิพาท&rdquo;
            </p>
          </div>

          {/* Post-repair photos */}
          {data.post_repair_files.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รูปหลังซ่อม ({data.post_repair_files.length} รูป)</p>
              <div className="flex flex-wrap gap-2">
                {data.post_repair_files.map((f, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={f.url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                ))}
              </div>
            </div>
          )}

          {/* Post-repair notes */}
          {data.post_repair_notes && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">บันทึกการซ่อม</p>
              <p className="text-sm text-gray-600">{data.post_repair_notes}</p>
            </div>
          )}

          {/* Parts used */}
          {data.parts_used.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">อะไหล่ที่ใช้</p>
              {data.parts_used.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <p className="text-gray-600">{p.name}</p>
                  <p className="text-gray-500">× {p.qty}</p>
                </div>
              ))}
            </div>
          )}

          {/* Final price */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">ยอดที่จะหัก</p>
            <p className="text-lg font-bold text-blue-700">{data.final_price.toLocaleString()} Point</p>
          </div>

          {inspectError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{inspectError}</p>
            </div>
          )}

          {/* 7-day auto-accept notice */}
          <p className="text-xs text-center text-gray-400">
            ถ้าไม่ตรวจรับภายใน 7 วัน ระบบจะยืนยันรับงานโดยอัตโนมัติ
          </p>

          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={inspectSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {inspectSubmitting ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "✅ ผ่าน — ตรวจรับงาน"}
            </button>
            <button
              onClick={handleDispute}
              disabled={inspectSubmitting}
              className="w-full border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 font-medium py-3 rounded-2xl text-sm transition-colors"
            >
              ⚠️ ไม่ผ่าน — เปิดข้อพิพาท
            </button>
          </div>
        </>
      )}

      {/* Rating phase */}
      {phase === "rating" && data && (
        <>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-green-800">✅ ตรวจรับงานเรียบร้อย!</p>
            <p className="text-xs text-green-600 mt-1">ให้คะแนนเพื่อช่วยผู้ใช้คนอื่น (รีวิว ≥50 ตัวอักษร = +10 แต้ม)</p>
          </div>

          {/* WeeeR rating */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ร้านซ่อม: {data.weeer_name}</p>
            <StarRating value={weeerRating} onChange={setWeeerRating} />
            <textarea
              value={weeerReview}
              onChange={e => setWeeerReview(e.target.value)}
              placeholder="รีวิวร้านซ่อม (ถ้ามี ≥50 ตัวอักษร รับ +10 แต้ม)"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {weeerReview.length > 0 && weeerReview.length < 50 && (
              <p className="text-xs text-amber-500">ยังขาดอีก {50 - weeerReview.length} ตัวอักษรเพื่อรับ +10 แต้ม</p>
            )}
          </div>

          {/* WeeeT rating */}
          {data.weeet_name && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ช่าง: {data.weeet_name}</p>
              <StarRating value={weeetRating} onChange={setWeeetRating} />
              <textarea
                value={weeetReview}
                onChange={e => setWeeetReview(e.target.value)}
                placeholder="รีวิวช่าง (ไม่บังคับ)"
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {ratingError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{ratingError}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleSubmitRating}
              disabled={ratingSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {ratingSubmitting ? <><span className="animate-spin">⟳</span> กำลังส่งรีวิว...</> : "ส่งรีวิว"}
            </button>
            <button
              onClick={() => setPhase("done")}
              disabled={ratingSubmitting}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
            >
              ข้ามการรีวิว
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition-transform hover:scale-110 ${star <= value ? "text-amber-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
