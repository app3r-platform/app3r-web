"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrapApi } from "../../_lib/api";
import type { ScrapJob, ScrapJobOption } from "../../_lib/types";
import { SCRAP_JOB_STATUS_LABEL, SCRAP_JOB_STATUS_COLOR } from "../../_lib/types";

const OPTIONS: {
  value: ScrapJobOption;
  label: string;
  route: string;
  disabled: boolean;
  icon: string;
  desc: string;
}[] = [
  { value: "resell_parts",    label: "แยกอะไหล่",          route: "resell-parts",    disabled: false, icon: "🔩", desc: "สร้างชิ้นส่วนเข้าสต๊อก Parts" },
  { value: "repair_and_sell", label: "ซ่อมขาย",             route: "repair-and-sell", disabled: false, icon: "🛠", desc: "ส่งซ่อมแล้วขายใน Marketplace" },
  { value: "resell_as_scrap", label: "ขายต่อซาก",           route: "resell-as-scrap", disabled: false, icon: "🏷", desc: "ประกาศขายซากต่อใน Marketplace" },
  { value: "dispose",         label: "รีไซเคิล",             route: "dispose",         disabled: false, icon: "♻️", desc: "ออกใบรับรองการทำลาย e-waste" },
];

export default function ScrapJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ScrapJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState<ScrapJobOption | null>(null);

  useEffect(() => {
    scrapApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = async (option: (typeof OPTIONS)[0]) => {
    if (!job || option.disabled) return;
    if (job.status !== "pending_decision") {
      // Already decided — navigate directly to sub-flow
      router.push(`/scrap/jobs/${id}/${option.route}`);
      return;
    }
    setDeciding(option.value);
    try {
      await scrapApi.decideJob(id, option.value);
      router.push(`/scrap/jobs/${id}/${option.route}`);
    } catch (e) {
      setError((e as Error).message);
      setDeciding(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;
  if (!job) return null;

  const isPending = job.status === "pending_decision";

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/scrap/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">งานซาก</h1>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${SCRAP_JOB_STATUS_COLOR[job.status]}`}>
          {SCRAP_JOB_STATUS_LABEL[job.status]}
        </span>
      </div>

      {/* Job info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm space-y-2">
        <div>
          <p className="text-xs text-gray-400">รายละเอียดซาก</p>
          <p className="font-medium text-gray-800">{job.scrapItemDescription ?? "—"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ScrapItem ID</p>
            <p className="text-xs text-gray-600 font-mono truncate">{job.scrapItemId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">วันที่ซื้อ</p>
            <p className="text-xs text-gray-600">
              {new Date(job.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Option selector */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">
          {isPending ? "เลือกวิธีจัดการซาก" : "วิธีจัดการที่เลือก"}
        </p>
        <div className="space-y-2">
          {OPTIONS.map(opt => {
            const isSelected = !isPending && job.decision === opt.value;
            const isDisabled = opt.disabled || (deciding !== null && deciding !== opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                  ${isSelected
                    ? "border-indigo-400 bg-indigo-50"
                    : opt.disabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : isDisabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"}`}>
                <span className="text-xl">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-indigo-700" : opt.disabled ? "text-gray-400" : "text-gray-800"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
                {deciding === opt.value && <span className="text-xs text-indigo-500">กำลังบันทึก…</span>}
                {isSelected && <span className="text-indigo-500 text-sm">✓</span>}
                {!isSelected && !opt.disabled && deciding === null && <span className="text-gray-300 text-sm">→</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Link back to item */}
      <Link href={`/scrap/browse/${job.scrapItemId}`}
        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors">
        ดูรายละเอียดซาก →
      </Link>
    </div>
  );
}
