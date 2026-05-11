// ============================================================
// components/listings/WeeeRLoginGate.tsx — Auth gate for non-WeeeR users
// Phase C-4.1b — Server Component (no "use client")
// ============================================================
import Link from 'next/link';
import type { ApplianceType } from '../../lib/types/listings-customer-jobs';

interface WeeeRLoginGateProps {
  jobId: string;
  type: 'repair' | 'maintain';
  headline: string;
  applianceType: ApplianceType;
  area: string;
}

export default function WeeeRLoginGate({
  type,
  headline,
  applianceType,
  area,
}: WeeeRLoginGateProps) {
  const typeTH = type === 'repair' ? 'ซ่อม' : 'บำรุง';
  const accentColor = type === 'repair' ? 'blue' : 'orange';

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-purple-700">ประกาศ</Link>
        <span>/</span>
        <Link href={`/listings/${type}`} className="hover:text-purple-700">
          ประกาศ{typeTH}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">รายละเอียด</span>
      </nav>

      {/* Job headline (public tier) */}
      <div className={`bg-${accentColor}-50 border border-${accentColor}-200 rounded-2xl p-6 mb-6`}>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-${accentColor}-100 text-${accentColor}-700`}>
            {typeTH}
          </span>
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {applianceType}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{headline}</h1>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>📍</span>
          <span>{area}</span>
        </div>
      </div>

      {/* Login gate card */}
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          ต้องเข้าสู่ระบบ WeeeR เพื่อดูรายละเอียด
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          ข้อมูลรายละเอียดงาน งบประมาณ รูปภาพ และข้อมูลผู้ลงประกาศ
          จะแสดงเฉพาะช่างที่ลงทะเบียนเป็น WeeeR เท่านั้น
        </p>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="http://localhost:3003/login"
            className={`block w-full bg-${accentColor === 'blue' ? 'blue' : 'orange'}-600 text-white py-3 rounded-xl font-semibold hover:bg-${accentColor === 'blue' ? 'blue' : 'orange'}-700 transition`}
          >
            เข้าสู่ระบบ WeeeR
          </Link>
          <Link
            href="/register/weeer"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
          >
            ยังไม่มีบัญชี? สมัคร WeeeR ฟรี
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          WeeeR = แพลตฟอร์มสำหรับช่างซ่อม/บำรุงเครื่องใช้ไฟฟ้ามืออาชีพ
        </p>
      </div>
    </div>
  );
}
