// ============================================================
// components/listings/RepairJobDetail.tsx — Tier 2 full detail (WeeeR)
// Phase C-4.1b — Server Component (props-based, no client state)
// ============================================================
import Link from 'next/link';
import PhotoGallery from './PhotoGallery';
import TypeBadge from './TypeBadge';
import LocationMapMock from './LocationMapMock';
import QnASection from './QnASection';
import EngagementCounters from './EngagementCounters';
import { AdSlot, CopyShareButton, TermTooltip } from '../common';
import type { AuthenticatedJobProjection } from '../../lib/types/listings-customer-jobs';
import { getServiceTypeLabel } from '../../lib/constants/service-types';
import { getMockEngagement } from '../../lib/mock/listing-engagement';
import { getMockQnA } from '../../lib/mock/listing-qna';

interface RepairJobDetailProps {
  job: AuthenticatedJobProjection;
  /** admin เห็นทุกคำถามใน Q&A (owner-equivalent view) */
  isAdmin?: boolean;
}

export default function RepairJobDetail({ job, isAdmin = false }: RepairJobDetailProps) {
  const engagement = getMockEngagement(job.id);
  const qna = getMockQnA(job.id);
  const locationDetail = [job.subDistrict, job.district].filter(Boolean).join(' · ') || undefined;
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-website-brand-700">ประกาศ</Link>
        <span>/</span>
        <Link href="/listings/repair" className="hover:text-website-brand-700">ประกาศซ่อม</Link>
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
              <TypeBadge type="repair" />
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {job.applianceType}
              </span>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                {getServiceTypeLabel(job.serviceType)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              {/* คัดลอก/แชร์ลิงก์ประกาศ (เลนส์ #4 · W-08) */}
              <CopyShareButton title={job.title} variant="icon" />
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'ประเภทเครื่อง', value: job.applianceType },
                  { label: 'จังหวัด',        value: job.area },
                  // W-2-D (D6): ตำบล / เขต — แสดงเฉพาะเมื่อ mock มีข้อมูล
                  ...(job.district ? [{ label: 'เขต / อำเภอ', value: job.district }] : []),
                  ...(job.subDistrict ? [{ label: 'ตำบล / แขวง', value: job.subDistrict }] : []),
                  { label: 'ประเภทบริการ',   value: getServiceTypeLabel(job.serviceType) },
                  { label: 'โพสต์เมื่อ',     value: job.postedAt },
                  { label: 'งบประมาณ',       value: `${job.estimatedBudget.toLocaleString()} บาท` },
                  // PHASE-4: fee round D75
                  { label: 'ค่าธรรมเนียมประมาณ', value: `${job.feePreview.toLocaleString()} บาท` },
                ].map(({ label, value }) => (
                  <tr key={label} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-500 font-medium w-40">{label}</td>
                    <td className="px-4 py-3 text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Problem description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <h2 className="font-semibold text-gray-900">รายละเอียดปัญหา</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {job.problemDescription}
            </p>
          </div>

          {/* Customer info — ข้อมูลผู้ลงประกาศ + ลิงก์ประวัติ */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">ข้อมูลผู้ลงประกาศ</h2>
              <Link
                href={`/owners/${job.id}`}
                className="text-xs text-website-brand-700 hover:underline font-medium"
              >
                ดูประวัติ/ความน่าเชื่อถือ →
              </Link>
            </div>
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

          {/* Location map (MOCK) */}
          <LocationMapMock area={job.area} detail={locationDetail} />

          {/* Q&A thread — role-based visibility (mock) */}
          <QnASection questions={qna} forceOwnerView={isAdmin} />
        </div>

        {/* Right: Sidebar CTA */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 sticky top-20">
            <div>
              <div className="text-sm text-gray-500 mb-1">งบประมาณ</div>
              <p className="text-2xl font-extrabold text-blue-700">
                {job.estimatedBudget.toLocaleString()} บาท
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ค่าธรรมเนียมประมาณ {job.feePreview.toLocaleString()} บาท
              </p>
            </div>

            {/* Engagement counters: view / offer / remaining days */}
            <EngagementCounters engagement={engagement} />

            {/* Phase D: real offer button */}
            <button
              disabled
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              ยื่นข้อเสนอ (เร็วๆ นี้)
            </button>
            <p className="text-xs text-gray-400 text-center inline-flex flex-wrap items-center justify-center gap-1">
              ระบบยื่น
              <TermTooltip term="offer" />
              และ
              <TermTooltip term="escrow" />
              เปิดใช้งานเร็วๆ นี้
            </p>
          </div>

          {/* Ad slot (mock) */}
          <AdSlot size="sidebar" label="ตำแหน่งข้างประกาศซ่อม" />
        </div>
      </div>
    </div>
  );
}
