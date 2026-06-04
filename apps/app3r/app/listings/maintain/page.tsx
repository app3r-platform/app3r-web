// ============================================================
// app/listings/maintain/page.tsx — Maintain listings (Server Component)
// Phase C-4.1b
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getMaintainJobs } from '../../../lib/api/customer-jobs';
import MaintainJobCard from '../../../components/listings/MaintainJobCard';
import AreaSelect from '../../../components/listings/AreaSelect';
import MyProvincePrefill from '../../../components/listings/MyProvincePrefill';
import NearbyTambonsPanel from '../../../components/listings/NearbyTambonsPanel';
import RoleSplitSections from '../../../components/listings/RoleSplitSections';
import { RoleAwareCTA, TermTooltip } from '@/components/common';
import { crossAppUrls } from '@/lib/config/urls';

const MAINTAIN_AREAS = ['กรุงเทพมหานคร', 'นนทบุรี', 'เชียงใหม่', 'ขอนแก่น', 'สงขลา', 'ชลบุรี'];

// Cross-app URL (resolved via crossAppUrls — no hardcoded localhost)
const WEEEU_URL = crossAppUrls.weeeu.base;

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
        <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ประกาศบำรุงรักษา</span>
      </nav>

      {/* Header Banner — on-brand (เขียว) chrome แทนส้มล้วน (W-09) */}
      <div className="bg-website-brand-50 border border-website-brand-200 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🧹 บำรุงรักษาเครื่องใช้ไฟฟ้า</h1>
            <p className="text-gray-600 mt-1 text-sm">
              ล้างแอร์ ล้างเครื่องซักผ้า และบำรุงรักษาอื่นๆ จากช่างมืออาชีพพร้อมหลักฐานภาพ
            </p>
          </div>
          {/* จองบริการ/ลงประกาศ — role-aware (C1). WeeeU เท่านั้น */}
          <RoleAwareCTA
            label="จองบริการ"
            intent="generic"
            className="whitespace-nowrap"
            overrides={{
              weeeu: { label: 'จองบริการ', target: `${WEEEU_URL}/maintain/new` },
              weeer: { label: 'สำหรับ WeeeU เท่านั้น', target: '#', message: 'สำหรับ WeeeU เท่านั้น' },
              weeet: { message: 'สำหรับ WeeeU เท่านั้น' },
            }}
          />
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

        {/* ค่าลงประกาศ + พักเงินกลาง (W-09 ตาม W-07) — ไม่มีคำว่า "ฟรี"/ตัวเลข escrow */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 text-xs text-gray-600">
            <span className="font-semibold text-gray-900">ค่าลงประกาศ</span> X พอยต์
            (อัตราตามประเภท กำหนดโดยผู้ดูแลระบบ) · เลือกพอยต์เงิน/ทอง
          </div>
          <div className="bg-white rounded-lg p-3 text-xs text-gray-600 flex flex-wrap items-center gap-1">
            <TermTooltip term="escrow" />
            — เงินพักไว้กับระบบกลางจนงานเสร็จและคุณยืนยันรับ หากมีปัญหาได้เงินคืน
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
                <AreaSelect areas={MAINTAIN_AREAS} current={areaParam} accentColor="blue" />
              </Suspense>
              {/* prefill จังหวัดจาก mock profile (ยังดูทุกจังหวัดได้) */}
              <Suspense>
                <MyProvincePrefill paramKey="area" />
              </Suspense>
            </div>

            {/* W-09: ลบตัวกรอง "ประเภทบริการ" — งานบำรุงรักษาเป็น on-site อย่างเดียว */}
            <div className="text-xs text-gray-500 bg-website-brand-50 border border-website-brand-100 rounded-lg p-2">
              งานบำรุงรักษารองรับเฉพาะ<br />
              <strong>ซ่อมนอกสถานที่</strong> (ช่างมาหาลูกค้า) — ไม่ต้องเลือกประเภทบริการ
            </div>

            {/* W2 · GR-10 NearMeFilter — geolocation-based nearby tambons */}
            <div className="border-t pt-4">
              <label className="block text-sm text-gray-700 font-medium mb-2">ใกล้ฉัน (Near me)</label>
              <NearbyTambonsPanel />
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

          {/* Role-split sections (W-09) */}
          <RoleSplitSections
            context="บำรุงรักษา"
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
                <MaintainJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
