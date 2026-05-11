// ============================================================
// components/listings/MaintainJobDetail.tsx — Tier 2 full detail (WeeeR)
// Phase C-4.1b — Server Component (props-based, no client state)
// ============================================================
import Link from 'next/link';
import PhotoGallery from './PhotoGallery';
import TypeBadge from './TypeBadge';
import type { AuthenticatedJobProjection } from '../../lib/types/listings-customer-jobs';
import { getServiceTypeLabel } from '../../lib/constants/service-types';

interface MaintainJobDetailProps {
  job: AuthenticatedJobProjection;
}

export default function MaintainJobDetail({ job }: MaintainJobDetailProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-purple-700">ประกาศ</Link>
        <span>/</span>
        <Link href="/listings/maintain" className="hover:text-purple-700">ประกาศบำรุง</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium line-clamp-1">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Gallery + Detail */}
        <div className="lg:col-span-2 space-y-6">
          <PhotoGallery images={job.photos} alt={job.title} />

          {/* Title & badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <TypeBadge type="maintain" />
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {job.applianceType}
              </span>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
                {getServiceTypeLabel(job.serviceType)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          </div>

          {/* Detail table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'ประเภทเครื่อง', value: job.applianceType },
                  { label: 'พื้นที่',         value: job.area },
                  { label: 'ประเภทบริการ',   value: getServiceTypeLabel(job.serviceType) },
                  { label: 'โพสต์เมื่อ',     value: job.postedAt },
                  { label: 'งบประมาณ',       value: `${job.estimatedBudget.toLocaleString()} บาท` },
                  { label: 'ค่าธรรมเนียมประมาณ', value: `${job.feePreview.toLocaleString()} บาท (D75)` },
                ].map(({ label, value }) => (
                  <tr key={label} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-500 font-medium w-40">{label}</td>
                    <td className="px-4 py-3 text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Problem/Service description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <h2 className="font-semibold text-gray-900">รายละเอียดงาน</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {job.problemDescription}
            </p>
          </div>

          {/* Customer info (Phase D placeholder) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">ข้อมูลผู้ลงประกาศ</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">ชื่อ:</span>
                <span className="text-amber-700 font-medium">{job.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">โทร:</span>
                <span className="text-amber-700 font-medium">{job.customerPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar — maintain has no offer button */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 sticky top-20">
            <div>
              <div className="text-sm text-gray-500 mb-1">งบประมาณ</div>
              <p className="text-2xl font-extrabold text-orange-600">
                {job.estimatedBudget.toLocaleString()} บาท
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ค่าธรรมเนียมประมาณ {job.feePreview.toLocaleString()} บาท
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              <strong>บำรุงรักษา</strong> — ช่างรับงานผ่านระบบ WeeeR<br />
              <span className="text-xs text-orange-600">ระบบจับคู่ช่าง เปิดใช้งาน Phase D</span>
            </div>
            <p className="text-xs text-gray-400 text-center">
              บริการนอกสถานที่เท่านั้น (ช่างมาหาลูกค้า)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
