// ============================================================
// app/listings/repair/page.tsx — Repair listings (Server Component)
// Phase C-4.1b
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getRepairJobs } from '../../../lib/api/customer-jobs';
import RepairJobCard from '../../../components/listings/RepairJobCard';
import ServiceTypeFilter from '../../../components/listings/ServiceTypeFilter';
import { ALL_SERVICE_TYPES } from '../../../lib/constants/service-types';

export const metadata: Metadata = {
  title: 'ประกาศซ่อมเครื่องใช้ไฟฟ้า — App3R',
  description:
    'หาช่างซ่อมเครื่องใช้ไฟฟ้าคุณภาพดี ราคาโปร่งใส ผ่านระบบ Escrow ที่ปลอดภัยบน App3R',
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function RepairListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const serviceTypeParam = params.serviceType ? Number(params.serviceType) : undefined;
  const areaParam = params.area;

  const jobs = getRepairJobs({
    serviceType: serviceTypeParam,
    area: areaParam,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประกาศซ่อมเครื่องใช้ไฟฟ้า</span>
      </nav>

      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🔧 ซ่อมเครื่องใช้ไฟฟ้า</h1>
            <p className="text-gray-600 mt-1 text-sm">
              ลงประกาศ รับ offer จากร้านซ่อมที่ผ่านการรับรอง ปลอดภัยด้วยระบบ Escrow
            </p>
          </div>
          <Link
            href="http://localhost:3002/register"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
          >
            ลงประกาศซ่อม →
          </Link>
        </div>

        {/* How escrow works */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '📝', label: '1. ลงประกาศฟรี', desc: 'ระบุปัญหา รับ offer' },
            { icon: '💰', label: '2. จ่าย Escrow 30%', desc: 'ล็อคเงินก่อน งานไม่เสร็จ-คืนเงิน' },
            { icon: '✅', label: '3. งานเสร็จ จ่าย 70%', desc: 'ยืนยัน → โอนเงินให้ร้าน' },
          ].map((step) => (
            <div key={step.label} className="bg-white rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <div className="font-semibold text-sm text-gray-900">{step.label}</div>
                <div className="text-xs text-gray-500">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 sticky top-20">
            <h3 className="font-semibold text-gray-900">กรองประกาศ</h3>

            {/* Area filter */}
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">จังหวัด</label>
              <select
                defaultValue={areaParam ?? ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value) url.searchParams.set('area', e.target.value);
                  else url.searchParams.delete('area');
                  window.location.href = url.toString();
                }}
              >
                <option value="">ทุกจังหวัด</option>
                {['กรุงเทพมหานคร', 'นนทบุรี', 'เชียงใหม่', 'ขอนแก่น', 'สงขลา', 'ชลบุรี'].map(
                  (p) => (
                    <option key={p} value={p}>{p}</option>
                  )
                )}
              </select>
            </div>

            {/* Appliance filter */}
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">ประเภทเครื่อง</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>ทุกประเภท</option>
                {['แอร์', 'ทีวี', 'เครื่องซักผ้า', 'ตู้เย็น', 'ไมโครเวฟ', 'พัดลม', 'หม้อหุงข้าว'].map(
                  (t) => <option key={t}>{t}</option>
                )}
              </select>
            </div>

            {/* Service type filter */}
            <Suspense>
              <ServiceTypeFilter allowedTypes={ALL_SERVICE_TYPES} accentColor="blue" />
            </Suspense>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">ประกาศซ่อมทั้งหมด</h2>
            <span className="text-gray-500 text-sm">{jobs.length} รายการ</span>
          </div>

          {/* Auth notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg">ℹ️</span>
            <div className="text-sm text-amber-800">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดและยื่น offer ได้หลังจาก{' '}
              <Link href="/register/weeer" className="underline font-semibold text-amber-900">
                สมัคร WeeeR
              </Link>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p>ไม่พบประกาศที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <RepairJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
