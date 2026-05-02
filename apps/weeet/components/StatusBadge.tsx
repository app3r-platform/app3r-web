import type { JobStatus } from "@/lib/types";

const STATUS_CONFIG: Record<JobStatus, { label: string; classes: string }> = {
  assigned: { label: "รอดำเนินการ", classes: "bg-blue-900 text-blue-200" },
  in_progress: { label: "กำลังทำ", classes: "bg-orange-900 text-orange-200" },
  completed: { label: "เสร็จสิ้น", classes: "bg-green-900 text-green-200" },
  cancelled: { label: "ยกเลิก", classes: "bg-gray-700 text-gray-300" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
