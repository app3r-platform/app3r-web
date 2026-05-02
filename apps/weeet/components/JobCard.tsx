import Link from "next/link";
import type { Job } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-600 transition-colors active:scale-[0.98]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-xs text-gray-400">{job.jobNo}</p>
            <p className="font-semibold text-white">{job.serviceType}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <div className="space-y-1 text-sm text-gray-300">
          <div className="flex items-center gap-1.5">
            <span>👤</span>
            <span>{job.customer.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span className="line-clamp-1 text-xs text-gray-400">{job.customer.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🕐</span>
            <span>{formatTime(job.scheduledAt)} น.</span>
            <span className="ml-auto text-xs text-gray-500">{job.module}</span>
          </div>
        </div>
        {job.status === "in_progress" && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>ความคืบหน้า</span>
              <span>{job.steps.filter((s) => s.done).length}/{job.steps.length} ขั้นตอน</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(job.steps.filter((s) => s.done).length / job.steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
