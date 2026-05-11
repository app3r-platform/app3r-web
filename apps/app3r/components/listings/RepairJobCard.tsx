// ============================================================
// components/listings/RepairJobCard.tsx — Tier 1 headline-only card
// Phase C-4.1b
// ============================================================
import Link from 'next/link';
import type { PublicJobProjection } from '../../lib/types/listings-customer-jobs';
import { getServiceTypeLabel } from '../../lib/constants/service-types';

interface RepairJobCardProps {
  job: PublicJobProjection;
}

export default function RepairJobCard({ job }: RepairJobCardProps) {
  return (
    <Link
      href={`/listings/repair/${job.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition group"
    >
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          ซ่อม
        </span>
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          {job.applianceType}
        </span>
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
          {getServiceTypeLabel(job.serviceType)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-700 transition line-clamp-2 mb-2">
        {job.title}
      </h3>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
        <div className="flex items-center gap-1">
          <span>📍</span>
          <span>{job.area}</span>
        </div>
        <span>{job.postedAt}</span>
      </div>

      {/* Lock hint */}
      <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 flex items-center gap-1">
        <span>🔒</span>
        <span>เข้าสู่ระบบ WeeeR เพื่อดูรายละเอียด</span>
      </div>
    </Link>
  );
}
