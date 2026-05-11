// ============================================================
// app/listings/maintain/page.tsx — Maintain listings (Server Component)
// Phase C-4.1b
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getMaintainJobs } from '../../../lib/api/customer-jobs';
import MaintainJobCard from '../../../components/listings/MaintainJobCard';
import ServiceTypeFilter from '../../../components/listings/ServiceTypeFilter';
import { MAINTAIN_ALLOWED_TYPES } from '../../../lib/constants/service-types';

export const metadata: Metadata = {
  title: 'ประกาศบำรุงรักษาเครื่องใช้ไฟฟ้า — App3R',
  description:
    'จองบริการบำรุงรักษาเครื่องใช้ไฟฟ้า ล้างแอร์ ล้างเครื่องซักผ้า จากช่างมืออาชีพบน App3R',
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const services = [
  { icon: '❄️', name: 'ล้างแอร์', desc: 'ล้างทำความสะอาด + เติมน้ำยา' },
  { icon: '🫧', name: 'ล้างเครื่องซักผ้า', desc: 'ฝาบน / ฝาหน้า + ฆ่าเชื้อ' },
  { icon: '🧊', name: 'บำรุงตู้เย็น', desc: 'ล้าง + เปลี่ยนยาง + ตรวจสอบ' },
  { icon: '💨', name: 'พัดลมและอื่นๆ', desc: 'ล้าง + ตรวจสอบ + น้ำมัน' },
];

export default async function MaintainListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const areaParam = params.area;

  const jobs = getMaintainJobs({ area: areaParam });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประกาศบำรุงรักษา</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🧹 บำรุงรักษาเครื่องใช้ไฟฟ้า</h1>
            <p className="text-gray-600 mt-1 text-sm">
              ล้างแอร์ ล้างเครื่องซักผ้า และบำรุงรักษาอื่นๆ จากช่างมืออาชีพพร้อมหลักฐานภาพ
            </p>
          </div>
          <Link
            href="http://localhost:3002/register"
            className="bg-orange-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition whitespace-nowrap"
          >
            จองบริการ →
          </Link>
        </div>

        {/* Service categories */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {services.map((s) => (
            <div key={s.name} className="bg-white rounded-lg p-3 text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="font-semibold text-sm text-gray-900">{s.name}</div>
              <div className="text-xs text-gray-500">{s.desc}</div>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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

            {/* Service type filter — maintain only allows type 1 */}
            <Suspense>
              <ServiceTypeFilter
                allowedTypes={MAINTAIN_ALLOWED_TYPES}
                accentColor="orange"
              />
            </Suspense>

            <div className="text-xs text-gray-400 bg-orange-50 rounded-lg p-2">
              งานบำรุงรักษารองรับเฉพาะ<br />
              <strong>ซ่อมนอกสถานที่</strong> (ช่างมาหาลูกค้า)
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">ประกาศบำรุงรักษาทั้งหมด</h2>
            <span className="text-gray-500 text-sm">{jobs.length} รายการ</span>
          </div>

          {/* Auth notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-amber-500 text-lg">ℹ️</span>
            <div className="text-sm text-amber-800">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดได้หลังจาก{' '}
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
                <MaintainJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
