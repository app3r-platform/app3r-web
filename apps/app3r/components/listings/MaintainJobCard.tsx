// ============================================================
// components/listings/MaintainJobCard.tsx — Tier 1 headline-only card
// Phase C-4.1b
// ============================================================
import Link from 'next/link';
import type { PublicJobProjection } from '../../lib/types/listings-customer-jobs';
import { getServiceTypeLabel } from '../../lib/constants/service-types';
import { getMockEngagement, getMockDistrict } from '../../lib/mock/listing-engagement';

interface MaintainJobCardProps {
  job: PublicJobProjection;
}

export default function MaintainJobCard({ job }: MaintainJobCardProps) {
  // MOCKUP-only metadata derive จาก job.id (PublicJobProjection ไม่มี district/counts)
  const district = getMockDistrict(job.id);
  const { viewCount, offerCount } = getMockEngagement(job.id);
  return (
    <Link
      href={`/listings/maintain/${job.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-orange-300 transition group"
    >
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
          บำรุง
        </span>
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          {job.applianceType}
        </span>
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
          {getServiceTypeLabel(job.serviceType)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-orange-700 transition line-clamp-2 mb-2">
        {job.title}
      </h3>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
        <div className="flex items-center gap-1">
          <span>📍</span>
          <span>{`อ.${district}, ${job.area}`}</span>
        </div>
        <span>{job.postedAt}</span>
      </div>

      {/* Engagement metadata — อำเภอ/ผู้ยื่นข้อเสนอ/ผู้เข้าชม (MOCKUP) */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
        <span className="flex items-center gap-1">
          <span aria-hidden>📨</span>
          {offerCount} ข้อเสนอ
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden>👁️</span>
          {viewCount} เข้าชม
        </span>
      </div>

      {/* Lock hint */}
      <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 flex items-center gap-1">
        <span>🔒</span>
        <span>เข้าสู่ระบบ WeeeR เพื่อดูรายละเอียด</span>
      </div>
    </Link>
  );
}
