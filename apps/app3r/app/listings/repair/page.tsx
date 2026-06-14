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
import ServiceTypeHelp from '../../../components/listings/ServiceTypeHelp';
import AreaSelect from '../../../components/listings/AreaSelect';
import MyProvincePrefill from '../../../components/listings/MyProvincePrefill';
import NearbyTambonsPanel from '../../../components/listings/NearbyTambonsPanel';
import RoleSplitSections from '../../../components/listings/RoleSplitSections';
import { ALL_SERVICE_TYPES } from '../../../lib/constants/service-types';
import { RoleAwareCTA, TermTooltip, MockAnnoOrigin, MockAnnoXapp } from '@/components/common';
import { crossAppUrls } from '@/lib/config/urls';

const REPAIR_AREAS = ['กรุงเทพมหานคร', 'นนทบุรี', 'เชียงใหม่', 'ขอนแก่น', 'สงขลา', 'ชลบุรี'];

// Cross-app URL (resolved via crossAppUrls — no hardcoded localhost)
const WEEEU_URL = crossAppUrls.weeeu.base;

export const metadata: Metadata = {
  title: 'ประกาศซ่อมเครื่องใช้ไฟฟ้า — App3R',
  description:
    'หาช่างซ่อมเครื่องใช้ไฟฟ้าคุณภาพดี ราคาโปร่งใส ปลอดภัยด้วยระบบพักเงินกลางบน App3R',
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
      {/* §5 mock-anno-origin: มาจาก W-01 HOME hero section หรือ W-06 LISTINGS-HUB */}
      <MockAnnoOrigin from={["W-01", "W-06"]} />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประกาศซ่อมเครื่องใช้ไฟฟ้า</span>
      </nav>

      {/* Header — A4 fix: bg-blue-50→bg-website-brand-50, border-blue-200→border-website-brand-200 */}
      <div className="bg-website-brand-50 border border-website-brand-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🔧 ซ่อมเครื่องใช้ไฟฟ้า</h1>
            <p className="text-gray-600 mt-1 text-sm flex flex-wrap items-center gap-1">
              ลงประกาศ รับ
              <TermTooltip term="offer" />
              จากร้านซ่อมที่ผ่านการรับรอง ปลอดภัยด้วย
              <TermTooltip term="escrow" />
            </p>
          </div>
          {/* ลงประกาศซ่อม — role-aware (C1). WeeeU เท่านั้นที่ลงประกาศซ่อมได้ */}
          <RoleAwareCTA
            label="ลงประกาศซ่อม"
            intent="post-repair"
            className="whitespace-nowrap"
            overrides={{
              weeeu: { label: 'ลงประกาศซ่อม', target: `${WEEEU_URL}/repair/new` },
              weeer: { label: 'สำหรับ WeeeU เท่านั้น', target: '#', message: 'สำหรับ WeeeU เท่านั้น' },
              weeet: { message: 'สำหรับ WeeeU เท่านั้น' },
            }}
          />
        </div>

        {/* ค่าลงประกาศ + วิธีพักเงินกลาง (Escrow) — ไม่มีตัวเลข 30/70, ไม่มีคำว่า "ฟรี" */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">1. ลงประกาศ</div>
              <div className="text-xs text-gray-500">
                ค่าลงประกาศ X พอยต์ (อัตราตามประเภท กำหนดโดยผู้ดูแลระบบ) · เลือกพอยต์เงิน/ทอง
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">2. พักเงินกลาง</div>
              <div className="text-xs text-gray-500">
                เงินพักไว้กับระบบกลางจนงานเสร็จและคุณยืนยันรับ — หากมีปัญหาได้เงินคืน
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold text-sm text-gray-900">3. งานเสร็จ</div>
              <div className="text-xs text-gray-500">ยืนยันรับงาน → ระบบโอนเงินให้ร้าน</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 sticky top-20">
            <h3 className="font-semibold text-gray-900">กรองประกาศ</h3>

            {/* Area filter — QF4: ใช้ AreaSelect (Client Component) แทน inline onChange */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-700 font-medium">จังหวัด</label>
              <Suspense fallback={<div className="h-9 bg-gray-100 animate-pulse rounded-lg" />}>
                <AreaSelect areas={REPAIR_AREAS} current={areaParam} accentColor="blue" />
              </Suspense>
              {/* W-07: prefill จังหวัดจาก mock profile (ยังดูทุกจังหวัดได้) */}
              <Suspense>
                <MyProvincePrefill paramKey="area" />
              </Suspense>
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

            {/* Service type filter + "?" help (W-07) — help icon เสริม ไม่ซ้ำ label */}
            <div className="relative">
              <div className="absolute right-0 top-0 z-10">
                <ServiceTypeHelp />
              </div>
              <Suspense>
                <ServiceTypeFilter allowedTypes={ALL_SERVICE_TYPES} accentColor="blue" />
              </Suspense>
            </div>

            {/* W2 · GR-10 NearMeFilter — geolocation-based nearby tambons */}
            <div className="border-t pt-4">
              <label className="block text-sm text-gray-700 font-medium mb-2">ใกล้ฉัน</label>
              <NearbyTambonsPanel />
            </div>
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
            <div className="text-sm text-amber-800 flex flex-wrap items-center gap-1">
              <strong>ข้อมูลจำกัดสำหรับผู้เยี่ยมชม</strong> — ดูรายละเอียดและยื่น
              <TermTooltip term="offer" />
              ได้หลังจาก{' '}
              <Link href="/register/weeer" className="underline font-semibold text-amber-900">
                สมัคร WeeeR
              </Link>
            </div>
          </div>

          {/* §8 mock-anno-xapp: WeeeU เห็น "ประกาศของฉัน" · WeeeR เห็น "ที่ฉันยื่นข้อเสนอ" */}
          <MockAnnoXapp
            context="WeeeU ลงประกาศซ่อม → WeeeR เห็นประกาศใหม่"
            apps={[
              { app: "WeeeU", screen: "U-repair-list", href: "http://localhost:3002/repairs", label: "ประกาศของฉัน" },
              { app: "WeeeR", screen: "R-repair-market", href: "http://localhost:3001/repairs", label: "ตลาดงานซ่อม" },
            ]}
          />
          {/* Role-split sections (W-07) — WeeeU: ที่ฉันประกาศ · WeeeR: ที่ฉันยื่นข้อเสนอ */}
          <RoleSplitSections
            context="ซ่อม"
            myListings={jobs.slice(0, 2).map((j) => ({
              id: j.id,
              title: j.title,
              meta: `${j.area} · 0 ข้อเสนอ`,
            }))}
            myOffers={jobs.slice(0, 2).map((j) => ({
              id: j.id,
              title: j.title,
              meta: `${j.area} · รอตอบรับ`,
            }))}
          />

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
